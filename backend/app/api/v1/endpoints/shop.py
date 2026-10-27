import logging
import random
from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from sqlalchemy import func, select

from app.core.config import get_settings
from app.api.deps import DB, CurrentShop, Owner, ShopMember, get_in_shop
from app.models import (
    Channel,
    Platform,
    Conversation,
    ConversationMode,
    Message,
    Order,
    OrderItem,
    OrderStatus,
    PaymentProvider,
    PaymentProviderType,
    Plan,
    Product,
    Role,
    Sender,
    Sentiment,
    SystemSetting,
    User,
    utcnow,
)
from app.schemas import (
    ChannelIn,
    ChannelOut,
    ChannelTestResult,
    DiscoveredPageOut,
    KHQRPreviewIn,
    KHQRPreviewOut,
    OAuthAuthorizeOut,
    OAuthCredentialsIn,
    OAuthCredentialsOut,
    OAuthExchangeIn,
    OAuthExchangeOut,
    OAuthLinkIn,
    PaymentProviderIn,
    PaymentProviderOut,
    PlanOut,
    ShopOut,
    ShopPlanChangeIn,
    ShopUpdate,
    StaffIn,
    StaffUpdate,
    TelegramUserConfigOut,
    TelegramUserSendCodeIn,
    TelegramUserSendCodeOut,
    TelegramUserVerifyCodeIn,
    TelegramUserVerifyCodeOut,
    TelegramVerifyIn,
    TelegramVerifyOut,
    UserOut,
)
from app.core.security import hash_password
from app.api.v1.endpoints.webhooks import signed_secret
from app.schemas.mappers import provider_out, shop_out
from app.services import alerts, oauth as oauth_svc, telegram_user as tg_user_svc, usage


log = logging.getLogger(__name__)
router = APIRouter(prefix="/shop", tags=["shop"])

PAID = [OrderStatus.paid, OrderStatus.confirmed, OrderStatus.shipped, OrderStatus.delivered]
PROVIDER_METHODS = {
    PaymentProviderType.bakong: ["KHQR · USD", "KHQR · KHR"],
    PaymentProviderType.aba_payway: ["ABA KHQR", "Cards", "Deeplink"],
    PaymentProviderType.acleda: ["KHQR", "Account / Wallet", "Cards (MPGS)"],
}


@router.get("", response_model=ShopOut)
def get_shop(shop: CurrentShop, _: ShopMember, db: DB):
    return shop_out(db, shop)


@router.patch("", response_model=ShopOut)
def update_shop(body: ShopUpdate, shop: CurrentShop, _: Owner, db: DB):
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(shop, key, value)
    db.commit()
    return shop_out(db, shop)


@router.get("/overview")
def overview(shop: CurrentShop, _: Owner, db: DB) -> dict:
    now = utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=6)

    revenue, paid_orders = db.execute(
        select(func.coalesce(func.sum(Order.total), 0), func.count(Order.id))
        .where(Order.shop_id == shop.id, Order.status.in_(PAID), Order.created_at >= month_start)
    ).one()
    pending = db.scalar(select(func.count(Order.id)).where(
        Order.shop_id == shop.id,
        Order.status.in_([OrderStatus.awaiting_payment, OrderStatus.checking_slip, OrderStatus.needs_review])))
    needs_review = db.scalar(select(func.count(Order.id)).where(
        Order.shop_id == shop.id, Order.status == OrderStatus.needs_review))

    conv_q = select(Conversation).where(Conversation.shop_id == shop.id)
    total_chats = db.scalar(select(func.count()).select_from(conv_q.subquery()))
    waiting = db.scalar(select(func.count(Conversation.id)).where(
        Conversation.shop_id == shop.id, Conversation.mode == ConversationMode.waiting_staff))
    sentiments = dict(db.execute(
        select(Conversation.sentiment, func.count(Conversation.id))
        .where(Conversation.shop_id == shop.id).group_by(Conversation.sentiment)
    ).all())

    replies = dict(db.execute(
        select(Message.sender, func.count(Message.id)).join(Conversation)
        .where(Conversation.shop_id == shop.id, Message.sender.in_([Sender.ai, Sender.staff]),
               Message.created_at >= month_start)
        .group_by(Message.sender)
    ).all())
    ai_replies, staff_replies = replies.get(Sender.ai, 0), replies.get(Sender.staff, 0)

    day = func.date_trunc("day", Order.created_at)
    daily = {row[0].date().isoformat(): float(row[1]) for row in db.execute(
        select(day, func.sum(Order.total)).where(
            Order.shop_id == shop.id, Order.status.in_(PAID), Order.created_at >= week_ago.replace(hour=0, minute=0))
        .group_by(day)
    ).all()}
    series = [{"date": (week_ago + timedelta(days=i)).date().isoformat(),
               "revenue": daily.get((week_ago + timedelta(days=i)).date().isoformat(), 0.0)} for i in range(7)]

    top = db.execute(
        select(OrderItem.name, func.sum(OrderItem.quantity).label("qty"))
        .join(Order).where(Order.shop_id == shop.id, Order.status.in_(PAID))
        .group_by(OrderItem.name).order_by(func.sum(OrderItem.quantity).desc()).limit(5)
    ).all()
    low_stock = db.scalars(select(Product).where(
        Product.shop_id == shop.id, Product.is_active,
        Product.stock < func.coalesce(Product.low_stock_threshold, shop.low_stock_threshold))
    ).all()

    return {
        "revenue_this_month": float(revenue),
        "paid_orders_this_month": paid_orders,
        "pending_payments": pending,
        "needs_review": needs_review,
        "total_chats": total_chats,
        "waiting_staff": waiting,
        "ai_reply_share": round(ai_replies / (ai_replies + staff_replies) * 100) if ai_replies + staff_replies else 0,
        "ai_replies_used": usage.replies_used(db, shop.id),
        "ai_replies_limit": shop.plan.ai_replies_limit if shop.plan else None,
        "sentiment": {s.value: sentiments.get(s, 0) for s in Sentiment},
        "revenue_series": series,
        "top_products": [{"name": n, "quantity": int(q)} for n, q in top],
        "low_stock": [{"id": p.id, "name": p.name, "stock": p.stock} for p in low_stock],
    }


# ------------------------------------------------------------------ staff


@router.get("/staff", response_model=list[UserOut])
def list_staff(shop: CurrentShop, _: Owner, db: DB):
    return db.scalars(select(User).where(User.shop_id == shop.id).order_by(User.role, User.id)).all()


@router.post("/staff", response_model=UserOut, status_code=201)
def add_staff(body: StaffIn, shop: CurrentShop, _: Owner, db: DB):
    seats = shop.plan.staff_seats if shop.plan else 1
    used = db.scalar(select(func.count(User.id)).where(User.shop_id == shop.id, User.role == Role.staff,
                                                       User.is_active))
    if used >= seats:
        raise HTTPException(402, f"Your plan includes {seats} staff seat(s). Upgrade to add more.")
    if db.scalar(select(User.id).where(func.lower(User.email) == body.email.lower())):
        raise HTTPException(409, "An account with this email already exists")
    user = User(email=body.email.lower(), password_hash=hash_password(body.password), full_name=body.full_name,
                role=Role.staff, shop_id=shop.id, commission_rate=body.commission_rate)
    db.add(user)
    db.commit()
    return user


@router.patch("/staff/{user_id}", response_model=UserOut)
def update_staff(user_id: int, body: StaffUpdate, shop: CurrentShop, _: Owner, db: DB):
    user = get_in_shop(db, User, user_id, shop.id)
    if user.role != Role.staff:
        raise HTTPException(400, "Only staff accounts can be edited here")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    return user


# ------------------------------------------------------------------ channels & OAuth 2.0


def _channel_out(c: Channel) -> ChannelOut:
    out = ChannelOut.model_validate(c)
    out.has_token = bool(c.access_token)
    out.meta_info = c.meta_info or {}
    return out


@router.get("/channels", response_model=list[ChannelOut])
def list_channels(shop: CurrentShop, _: Owner, db: DB):
    return [_channel_out(c) for c in db.scalars(select(Channel).where(Channel.shop_id == shop.id))]


@router.post("/channels", response_model=ChannelOut, status_code=201)
def connect_channel(body: ChannelIn, shop: CurrentShop, _: Owner, db: DB):
    limit = shop.plan.channels_limit if shop.plan else 1
    used = db.scalar(select(func.count(Channel.id)).where(Channel.shop_id == shop.id, Channel.is_connected))
    if used >= limit:
        raise HTTPException(402, f"Your plan includes {limit} channel(s). Upgrade to connect more.")
    channel = Channel(shop_id=shop.id, **body.model_dump())
    db.add(channel)
    db.commit()
    if channel.platform == Platform.telegram and channel.access_token:
        oauth_svc.register_telegram_webhook(channel.id, channel.access_token)
    return _channel_out(channel)


@router.get("/oauth/credentials", response_model=OAuthCredentialsOut)
def get_oauth_credentials(_: Owner, db: DB):
    """Retrieve current OAuth app client credentials (with secrets masked)."""
    creds = oauth_svc.get_oauth_credentials(db)
    return OAuthCredentialsOut(
        meta_app_id=creds.get("meta_app_id") or None,
        has_meta_app_secret=bool(creds.get("meta_app_secret")),
        tiktok_client_key=creds.get("tiktok_client_key") or None,
        has_tiktok_client_secret=bool(creds.get("tiktok_client_secret")),
        meta_redirect_uri=creds.get("meta_redirect_uri") or None,
        tiktok_redirect_uri=creds.get("tiktok_redirect_uri") or None,
        telegram_bot_username=creds.get("telegram_bot_username") or None,
        has_telegram_bot_token=bool(creds.get("telegram_bot_token")),
        telegram_redirect_uri=creds.get("telegram_redirect_uri") or None,
    )


@router.put("/oauth/credentials", response_model=OAuthCredentialsOut)
def update_oauth_credentials(body: OAuthCredentialsIn, _: Owner, db: DB):
    """Configure custom Meta App, TikTok Open Platform, and Telegram credentials."""
    updates: dict[str, Any] = {}
    if body.meta_app_id is not None:
        updates["meta_app_id"] = body.meta_app_id.strip()
    if body.meta_app_secret is not None:
        updates["meta_app_secret"] = body.meta_app_secret.strip()
    if body.tiktok_client_key is not None:
        updates["tiktok_client_key"] = body.tiktok_client_key.strip()
    if body.tiktok_client_secret is not None:
        updates["tiktok_client_secret"] = body.tiktok_client_secret.strip()
    if body.telegram_bot_token is not None:
        updates["telegram_bot_token"] = body.telegram_bot_token.strip()
    if body.telegram_bot_username is not None:
        updates["telegram_bot_username"] = body.telegram_bot_username.strip()
    if body.telegram_redirect_uri is not None:
        updates["telegram_redirect_uri"] = body.telegram_redirect_uri.strip()

    creds = oauth_svc.save_oauth_credentials(db, updates)
    return OAuthCredentialsOut(
        meta_app_id=creds.get("meta_app_id") or None,
        has_meta_app_secret=bool(creds.get("meta_app_secret")),
        tiktok_client_key=creds.get("tiktok_client_key") or None,
        has_tiktok_client_secret=bool(creds.get("tiktok_client_secret")),
        meta_redirect_uri=creds.get("meta_redirect_uri") or None,
        tiktok_redirect_uri=creds.get("tiktok_redirect_uri") or None,
        telegram_bot_username=creds.get("telegram_bot_username") or None,
        has_telegram_bot_token=bool(creds.get("telegram_bot_token")),
        telegram_redirect_uri=creds.get("telegram_redirect_uri") or None,
    )


@router.get("/oauth/authorize-url", response_model=OAuthAuthorizeOut)
def get_oauth_authorize_url(platform: Platform, shop: CurrentShop, _: Owner, db: DB, redirect_uri: str | None = None):
    """Generate official OAuth 2.0 authorization URL or sandbox test URL."""
    return oauth_svc.get_authorization_url(shop.id, platform, redirect_uri, db)


@router.post("/oauth/exchange", response_model=OAuthExchangeOut)
def exchange_oauth_code(body: OAuthExchangeIn, shop: CurrentShop, _: Owner, db: DB):
    """Exchange OAuth code or live token for accounts and discover available pages."""
    try:
        return oauth_svc.exchange_oauth_code(
            db,
            shop,
            body.platform,
            code=body.code,
            access_token=body.access_token,
            state=body.state,
            redirect_uri=body.redirect_uri,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(502, f"Failed to connect to {body.platform.value}: {str(e)}")


@router.post("/oauth/link-account", response_model=ChannelOut)
def link_oauth_account(body: OAuthLinkIn, shop: CurrentShop, _: Owner, db: DB):
    """Link an authorized Facebook page, Instagram profile, or TikTok shop directly with 1 click."""
    limit = shop.plan.channels_limit if shop.plan else 1
    existing = db.scalars(select(Channel).where(
        Channel.shop_id == shop.id,
        Channel.platform == body.platform,
        Channel.external_id == body.external_id
    )).first()

    if existing is None:
        used = db.scalar(select(func.count(Channel.id)).where(Channel.shop_id == shop.id, Channel.is_connected))
        if used >= limit:
            raise HTTPException(402, f"Your plan includes {limit} channel(s). Upgrade to connect more.")
        existing = Channel(
            shop_id=shop.id,
            platform=body.platform,
            name=body.name,
            external_id=body.external_id,
            access_token=body.access_token,
            meta_info=body.meta_info,
            is_connected=True,
        )
        db.add(existing)
    else:
        existing.name = body.name
        existing.access_token = body.access_token
        existing.meta_info = {**(existing.meta_info or {}), **body.meta_info}
        existing.is_connected = True

    db.commit()

    if existing.platform == Platform.telegram and existing.access_token:
        oauth_svc.register_telegram_webhook(existing.id, existing.access_token)
    elif existing.platform == Platform.facebook and existing.access_token:
        oauth_svc.subscribe_facebook_page_webhook(existing.external_id, existing.access_token)

    return _channel_out(existing)


@router.post("/oauth/telegram-verify", response_model=TelegramVerifyOut)
def verify_and_link_telegram_bot(body: TelegramVerifyIn, shop: CurrentShop, _: Owner, db: DB):
    """1-Tap verification of Telegram Bot token, auto-detect username, and auto-register webhook."""
    verify_res = oauth_svc.verify_telegram_bot(body.bot_token)
    if not verify_res.ok or not verify_res.bot_username:
        return verify_res

    limit = shop.plan.channels_limit if shop.plan else 1
    existing = db.scalars(select(Channel).where(
        Channel.shop_id == shop.id,
        Channel.platform == Platform.telegram,
        Channel.external_id == verify_res.bot_username
    )).first()

    if existing is None:
        used = db.scalar(select(func.count(Channel.id)).where(Channel.shop_id == shop.id, Channel.is_connected))
        if used >= limit:
            raise HTTPException(402, f"Your plan includes {limit} channel(s). Upgrade to connect more.")
        existing = Channel(
            shop_id=shop.id,
            platform=Platform.telegram,
            name=verify_res.bot_name or "Telegram Bot",
            external_id=verify_res.bot_username,
            access_token=body.bot_token.strip(),
            meta_info={
                "bot_id": verify_res.bot_id,
                "username": verify_res.bot_username,
                "verified": True,
                "connected_via": "telegram_quick_verify",
            },
            is_connected=True,
        )
        db.add(existing)
    else:
        existing.name = verify_res.bot_name or existing.name
        existing.access_token = body.bot_token.strip()
        existing.meta_info = {
            **(existing.meta_info or {}),
            "bot_id": verify_res.bot_id,
            "username": verify_res.bot_username,
            "verified": True,
        }
        existing.is_connected = True

    db.commit()
    webhook_ok = oauth_svc.register_telegram_webhook(existing.id, existing.access_token)
    verify_res.webhook_registered = webhook_ok
    settings = get_settings()
    verify_res.webhook_url = f"{settings.public_base_url}/api/v1/webhooks/telegram/{existing.id}"
    verify_res.channel = _channel_out(existing)
    return verify_res


@router.get("/oauth/telegram-user/config", response_model=TelegramUserConfigOut)
def get_telegram_user_config(_: CurrentShop, __: Owner):
    """Check if server has default Telegram App API credentials configured."""
    settings = get_settings()
    has_creds = bool(settings.telegram_api_id and settings.telegram_api_hash)
    hint = f"{settings.telegram_api_id[:3]}***" if settings.telegram_api_id else None
    return TelegramUserConfigOut(
        has_app_credentials=has_creds,
        api_id_configured=bool(settings.telegram_api_id),
        api_id_hint=hint,
    )


@router.post("/oauth/telegram-user/send-code", response_model=TelegramUserSendCodeOut)
async def send_telegram_user_login_code(
    body: TelegramUserSendCodeIn,
    shop: CurrentShop,
    _: Owner,
):
    """Send Telegram login verification code to user's phone via MTProto."""
    try:
        res = await tg_user_svc.send_user_code(
            shop_id=shop.id,
            phone=body.phone,
            custom_api_id=body.api_id,
            custom_api_hash=body.api_hash,
        )
        return TelegramUserSendCodeOut(
            ok=True,
            phone=res["phone"],
            phone_code_hash=res.get("phone_code_hash"),
            message=res.get("message"),
        )
    except Exception as e:
        log.error("Telegram user send-code error: %s", e)
        return TelegramUserSendCodeOut(
            ok=False,
            phone=body.phone,
            error=str(e),
        )


@router.post("/oauth/telegram-user/verify-code", response_model=TelegramUserVerifyCodeOut)
async def verify_and_link_telegram_user(
    body: TelegramUserVerifyCodeIn,
    shop: CurrentShop,
    _: Owner,
    db: DB,
):
    """Verify login code, complete MTProto sign in, and link normal user account channel."""
    limit = shop.plan.channels_limit if shop.plan else 1
    used = db.scalar(select(func.count(Channel.id)).where(Channel.shop_id == shop.id, Channel.is_connected))
    if used >= limit:
        clean_phone = tg_user_svc.normalize_phone(body.phone)
        existing_phone = db.scalars(select(Channel).where(
            Channel.shop_id == shop.id,
            Channel.platform == Platform.telegram,
            Channel.is_connected,
        )).all()
        is_existing = any(
            (c.meta_info or {}).get("phone") == clean_phone
            for c in existing_phone
        )
        if not is_existing:
            raise HTTPException(402, f"Your plan includes {limit} channel(s). Upgrade to connect more.")

    try:
        res = await tg_user_svc.verify_user_code(
            shop_id=shop.id,
            phone=body.phone,
            code=body.code,
            password=body.password,
            custom_api_id=body.api_id,
            custom_api_hash=body.api_hash,
            db=db,
        )
        return TelegramUserVerifyCodeOut(**res)
    except Exception as e:
        log.error("Telegram user verify-code error: %s", e)
        return TelegramUserVerifyCodeOut(
            ok=False,
            error=str(e),
        )


@router.post("/channels/{channel_id}/test-connection", response_model=ChannelTestResult)
def test_channel_connection(channel_id: int, shop: CurrentShop, _: Owner, db: DB):
    """Ping provider API or check webhook status."""
    channel = get_in_shop(db, Channel, channel_id, shop.id)
    return oauth_svc.test_channel_connection(channel)


@router.delete("/channels/{channel_id}", status_code=204)
def disconnect_channel(channel_id: int, shop: CurrentShop, _: Owner, db: DB) -> None:
    channel = get_in_shop(db, Channel, channel_id, shop.id)
    channel.is_connected = False
    channel.access_token = None
    if channel.platform == Platform.telegram and (channel.meta_info or {}).get("type") == "user":
        import asyncio
        asyncio.create_task(tg_user_svc.telegram_user_manager.stop_client_for_channel(channel_id))
    db.commit()



# ------------------------------------------------------------------ payment providers (owner-only keys)


@router.get("/payment-providers", response_model=list[PaymentProviderOut])
def list_providers(shop: CurrentShop, _: Owner, db: DB):
    existing = {p.provider: p for p in db.scalars(select(PaymentProvider).where(PaymentProvider.shop_id == shop.id))}
    for kind in PaymentProviderType:
        if kind not in existing:
            existing[kind] = PaymentProvider(shop_id=shop.id, provider=kind, methods=PROVIDER_METHODS[kind])
            db.add(existing[kind])
    db.commit()
    return [provider_out(existing[k]) for k in PaymentProviderType]


@router.get("/payment-callback-url")
def payment_callback_url(shop: CurrentShop, _: Owner) -> dict:
    token = signed_secret(f"payments:{shop.id}")
    return {"url": f"{get_settings().public_base_url}/api/v1/webhooks/payments/{shop.id}?token={token}"}


@router.put("/payment-providers/{provider}", response_model=PaymentProviderOut)
def connect_provider(provider: PaymentProviderType, body: PaymentProviderIn, shop: CurrentShop, _: Owner, db: DB):
    p = db.scalars(select(PaymentProvider).where(PaymentProvider.shop_id == shop.id,
                                                 PaymentProvider.provider == provider)).first()
    if p is None:
        p = PaymentProvider(shop_id=shop.id, provider=provider, methods=PROVIDER_METHODS[provider])
        db.add(p)
    data = body.model_dump(exclude_unset=True)
    if not data.get("secret"):
        data.pop("secret", None)  # keep the stored key when the form leaves it blank
    for key, value in data.items():
        setattr(p, key, value)
    p.is_connected = bool(p.account_id)
    db.commit()
    return provider_out(p)


@router.post("/generate-khqr-preview", response_model=KHQRPreviewOut)
def generate_khqr_preview(body: KHQRPreviewIn, shop: CurrentShop, _: ShopMember, db: DB):
    """Generate dynamic KHQR code, deep links, tag breakdown, and PNG image data URI for test preview."""
    import base64
    from decimal import Decimal
    from app.services import payments

    p = db.scalars(
        select(PaymentProvider).where(PaymentProvider.shop_id == shop.id, PaymentProvider.provider == body.provider)
    ).first()

    account_id = (body.account_id or (p.account_id if p else None) or "shop@aclb").strip()
    merchant_name = (body.merchant_name or (p.merchant_name if p else None) or shop.name).strip()
    amount = body.amount if body.amount and body.amount > 0 else 10.0
    bill_number = (body.bill_number or "INV-TEST").strip()
    currency = body.currency or "USD"

    khqr = payments.build_khqr(
        account_id=account_id,
        merchant_name=merchant_name,
        amount=Decimal(str(amount)),
        bill_number=bill_number,
        currency=currency,
        provider_type=body.provider.value,
    )
    deep_links = payments.build_deep_links(
        khqr=khqr,
        provider_type=body.provider.value,
        account_id=account_id,
        amount=amount,
        bill_number=bill_number,
    )
    tags = payments.parse_khqr_tags(khqr)
    png_bytes = payments.generate_khqr_image_bytes(
        shop_name=shop.name,
        merchant_name=merchant_name,
        provider_type=body.provider.value,
        amount=amount,
        bill_number=bill_number,
        khqr_string=khqr,
        currency=currency,
    )
    data_uri = f"data:image/png;base64,{base64.b64encode(png_bytes).decode('ascii')}"

    return KHQRPreviewOut(
        provider=body.provider.value,
        merchant_name=merchant_name,
        account_id=account_id,
        amount=amount,
        currency=currency,
        bill_number=bill_number,
        khqr=khqr,
        md5=deep_links.get("md5", ""),
        crc16=khqr[-4:],
        deep_links=deep_links,
        image_data_uri=data_uri,
        tags=tags,
    )


@router.get("/khqr-preview-image")
def get_khqr_preview_image(
    shop: CurrentShop,
    _: ShopMember,
    db: DB,
    provider: PaymentProviderType = PaymentProviderType.bakong,
    amount: float = 10.0,
    currency: str = "USD",
    bill_number: str = "INV-TEST",
    merchant_name: str | None = None,
    account_id: str | None = None,
) -> Response:
    """Direct PNG image response of test KHQR preview for download or direct preview."""
    from decimal import Decimal
    from app.services import payments

    p = db.scalars(
        select(PaymentProvider).where(PaymentProvider.shop_id == shop.id, PaymentProvider.provider == provider)
    ).first()

    clean_account = (account_id or (p.account_id if p else None) or "shop@aclb").strip()
    clean_merchant = (merchant_name or (p.merchant_name if p else None) or shop.name).strip()
    clean_bill = (bill_number or "INV-TEST").strip()

    khqr = payments.build_khqr(
        account_id=clean_account,
        merchant_name=clean_merchant,
        amount=Decimal(str(amount)),
        bill_number=clean_bill,
        currency=currency,
        provider_type=provider.value,
    )
    png_bytes = payments.generate_khqr_image_bytes(
        shop_name=shop.name,
        merchant_name=clean_merchant,
        provider_type=provider.value,
        amount=amount,
        bill_number=clean_bill,
        khqr_string=khqr,
        currency=currency,
    )
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": f'inline; filename="{clean_bill}_khqr_preview.png"'},
    )


# ------------------------------------------------------------------ subscription & plan tiers


@router.get("/plans", response_model=list[PlanOut])
def list_shop_plans(shop: CurrentShop, _: ShopMember, db: DB):
    """List all available pricing tiers for shop owners to view & select."""
    plans = db.scalars(select(Plan).order_by(Plan.price_monthly.asc())).all()
    out = []
    for p in plans:
        item = PlanOut.model_validate(p)
        item.is_current = (p.id == shop.plan_id)
        out.append(item)
    return out


@router.post("/change-plan", response_model=ShopOut)
def change_shop_plan(body: ShopPlanChangeIn, shop: CurrentShop, _: Owner, db: DB):
    """Switch, upgrade, or downgrade the shop's active subscription tier."""
    from app.api.v1.endpoints.admin import _get_or_init_coupons, _validate_coupon_logic

    target_plan = db.get(Plan, body.plan_id)
    if not target_plan:
        raise HTTPException(404, "Subscription plan tier not found")

    is_yearly = (body.billing_cycle or "").lower() == "yearly"
    monthly_price = float(target_plan.price_monthly)
    # Yearly plan offers 2 Months Free (pay for 10 months, get 12 months)
    base_price = round(monthly_price * 10, 2) if is_yearly else monthly_price
    final_price = base_price
    discount_amount = 0.0
    applied_coupon_code = None

    if body.coupon_code and body.coupon_code.strip():
        clean_code = body.coupon_code.strip().upper()
        coupons = _get_or_init_coupons(db)
        coupon_res = _validate_coupon_logic(coupons, clean_code, target_plan.code, base_price)
        final_price = float(coupon_res["final_price"])
        discount_amount = float(coupon_res["discount_amount"])
        applied_coupon_code = clean_code

        # Increment used_count on coupon
        for c in coupons:
            if c.get("code", "").upper() == clean_code:
                c["used_count"] = c.get("used_count", 0) + 1
                break
        cpn_row = db.get(SystemSetting, "subscription_coupons")
        if cpn_row:
            cpn_row.value = coupons
            db.merge(cpn_row)

    # Update shop's active plan
    shop.plan_id = target_plan.id

    # If active payment or paid tier or coupon applied, generate subscription invoice
    inv_row = db.get(SystemSetting, "subscription_invoices")
    invoices = list(inv_row.value) if (inv_row and inv_row.value) else []

    inv_id = f"INV-26-{random.randint(1050, 9999)}"
    inv_date = datetime.now().strftime("%b %d, %Y")
    ref = body.reference.strip() if body.reference else f"KHQR-SUB-{shop.id * 1024 + random.randint(100, 999)}"

    plan_display = f"{target_plan.name} (Annual)" if is_yearly and base_price > 0 else target_plan.name
    new_inv = {
        "id": inv_id,
        "shop": shop.name,
        "shop_id": shop.id,
        "plan": plan_display,
        "method": body.payment_method or "ABA KHQR",
        "date": inv_date,
        "amount": f"${final_price:.2f}",
        "billing_cycle": "yearly" if is_yearly else "monthly",
        "period": "1 Year (12 Months - 2 Months Free)" if is_yearly and base_price > 0 else "1 Month",
        "status": "Paid",
        "reference": ref,
        "coupon_code": applied_coupon_code,
        "discount_amount": f"${discount_amount:.2f}" if discount_amount > 0 else None,
        "original_amount": f"${base_price:.2f}" if discount_amount > 0 else None,
    }
    invoices.insert(0, new_inv)
    if not inv_row:
        inv_row = SystemSetting(key="subscription_invoices", value=invoices)
    else:
        inv_row.value = invoices
    db.merge(inv_row)

    # Notify owner & super admin
    cycle_label = f"${final_price:.2f}/year (Annual)" if is_yearly and final_price > 0 else (f"${final_price:.2f}/mo" if final_price > 0 else "Free")
    alerts.notify(
        db,
        shop,
        kind="payment",
        title=f"Subscription Updated: {target_plan.name}",
        body=f"Your shop has been switched to {target_plan.name} ({cycle_label}). AI replies & team limits updated.",
        telegram=True,
    )

    db.commit()
    db.refresh(shop)
    return shop_out(db, shop)


@router.get("/subscription/invoices")
def list_shop_invoices(shop: CurrentShop, _: ShopMember, db: DB):
    """Retrieve all payment and subscription invoices for this specific shop."""
    row = db.get(SystemSetting, "subscription_invoices")
    if not row or not row.value:
        return []
    invoices = list(row.value)
    return [
        inv for inv in invoices
        if inv.get("shop_id") == shop.id or (inv.get("shop", "").strip().lower() == shop.name.strip().lower())
    ]
