from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import mask_secret
from app.models import Conversation, Message, Order, PaymentProvider, Platform, Product, Shop
from app.schemas import (
    ConversationDetail,
    ConversationSummary,
    CustomerOut,
    MessageOut,
    OrderOut,
    PaymentProviderOut,
    ProductOut,
    ShopOut,
)
from app.services import usage

PLATFORM_LABEL = {
    Platform.telegram: "Telegram",
    Platform.facebook: "Facebook Messenger",
    Platform.instagram: "Instagram DM",
    Platform.tiktok: "TikTok",
}
PLATFORM_SHORT = {
    Platform.telegram: "Telegram",
    Platform.facebook: "Messenger",
    Platform.instagram: "Instagram",
    Platform.tiktok: "TikTok",
}


def message_out(m: Message) -> MessageOut:
    out = MessageOut.model_validate(m)
    out.staff_name = m.staff.full_name if m.staff else None
    return out


def conversation_summary(c: Conversation) -> ConversationSummary:
    return ConversationSummary(
        id=c.id,
        customer=CustomerOut.model_validate(c.customer),
        platform=c.platform,
        mode=c.mode,
        sentiment=c.sentiment,
        high_priority=c.high_priority,
        unread_count=c.unread_count,
        last_message_preview=c.last_message_preview,
        last_message_at=c.last_message_at,
        assigned_staff_id=c.assigned_staff_id,
        assigned_staff_name=c.assigned_staff.full_name if c.assigned_staff else None,
    )


def conversation_detail(db: Session, c: Conversation) -> ConversationDetail:
    products = []
    if c.recommended_product_ids:
        products = db.scalars(select(Product).where(Product.id.in_(c.recommended_product_ids))).all()
    orders = db.scalars(
        select(Order).where(Order.conversation_id == c.id).order_by(Order.id.desc()).limit(5)
    ).all()
    return ConversationDetail(
        **conversation_summary(c).model_dump(),
        messages=[message_out(m) for m in c.messages[-200:]],
        ai_analysis=c.ai_analysis or {},
        recommended_products=[ProductOut.model_validate(p) for p in products],
        orders=[OrderOut.model_validate(o) for o in orders],
        reply_route=f"{PLATFORM_LABEL[c.platform]} · replies go back via {PLATFORM_SHORT[c.platform]}",
    )


def shop_out(db: Session, shop: Shop) -> ShopOut:
    out = ShopOut.model_validate(shop)
    out.ai_replies_used = usage.replies_used(db, shop.id)  # this calendar month
    return out


def provider_out(p: PaymentProvider) -> PaymentProviderOut:
    return PaymentProviderOut(
        id=p.id,
        provider=p.provider,
        environment=p.environment,
        is_connected=p.is_connected,
        use_for_invoices=p.use_for_invoices,
        merchant_name=p.merchant_name,
        account_id=p.account_id,
        secret_masked=mask_secret(p.secret),
        methods=p.methods or [],
        token_expires_at=p.token_expires_at,
    )
