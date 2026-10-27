"""Inbound webhooks from Telegram, Meta (Messenger + Instagram) and payment providers.

Each handler only verifies, de-duplicates and enqueues: the AI work happens in Celery workers,
so providers get a fast 200 and a slow model call can never block the web servers.
"""

import hashlib
import hmac
import logging
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy import select

from app.api.deps import DB
from app.core import rate_limit
from app.core.config import get_settings
from app.models import Channel, Order, Platform, Shop
from app.services import orders as order_svc
from app.services.idempotency import claim_event
from app.workers.tasks import process_inbound

log = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def signed_secret(purpose: str) -> str:
    """Stable per-resource secret, e.g. for Telegram's secret_token or the bank callback URL."""
    return hmac.new(get_settings().jwt_secret.encode(), purpose.encode(), hashlib.sha256).hexdigest()[:32]


def _limit(source: str) -> None:
    rate_limit.enforce(f"webhook:{source}", get_settings().webhook_rate_limit_per_minute)


# ------------------------------------------------------------------ Telegram


@router.post("/telegram/admin-bot")
async def telegram_admin_bot(request: Request, db: DB) -> dict:
    """Webhook receiver for Super Admin Telegram Control Bot (@chhlatAI_bot).

    Handles incoming commands (/start, /health, /stats, /users, /audit, /shops) from Super Admin.
    """
    from app.services.admin_bot import handle_admin_bot_update

    update: dict[str, Any] = await request.json()
    return handle_admin_bot_update(update, db)


@router.post("/telegram/{channel_id}")
async def telegram(channel_id: int, request: Request, db: DB,
                   x_telegram_bot_api_secret_token: str | None = Header(default=None)) -> dict:
    channel = db.get(Channel, channel_id)
    if channel is None or channel.platform != Platform.telegram or not channel.is_connected:
        raise HTTPException(404, "Unknown channel")
    if not hmac.compare_digest(x_telegram_bot_api_secret_token or "", signed_secret(f"telegram:{channel.id}")):
        raise HTTPException(401, "Bad secret token")
    _limit(f"telegram:{channel.id}")
    update: dict[str, Any] = await request.json()
    msg = update.get("message") or update.get("edited_message")
    if not msg or msg.get("chat", {}).get("type") != "private":
        return {"ok": True}
    if not claim_event(db, f"telegram:{channel.id}", str(update.get("update_id"))):
        return {"ok": True, "duplicate": True}
    sender = msg.get("from", {})
    name = " ".join(filter(None, [sender.get("first_name"), sender.get("last_name")])) or "Telegram user"
    image = {"type": "telegram", "file_id": msg["photo"][-1]["file_id"]} if msg.get("photo") else None
    process_inbound.delay(channel.shop_id, channel.id, Platform.telegram.value, str(sender.get("id")),
                          str(msg["chat"]["id"]), name, msg.get("text") or msg.get("caption") or "", image)
    return {"ok": True}


# ------------------------------------------------------------------ Meta: Messenger + Instagram


@router.get("/meta", response_class=PlainTextResponse)
def meta_verify(hub_mode: str = Query(alias="hub.mode"), hub_token: str = Query(alias="hub.verify_token"),
                hub_challenge: str = Query(alias="hub.challenge")) -> str:
    if hub_mode == "subscribe" and hmac.compare_digest(hub_token, get_settings().meta_verify_token):
        return hub_challenge
    raise HTTPException(403, "Verification failed")


@router.post("/meta")
async def meta(request: Request, db: DB, x_hub_signature_256: str | None = Header(default=None)) -> dict:
    raw = await request.body()
    app_secret = get_settings().meta_app_secret or get_settings().fb_client_secret
    if app_secret and x_hub_signature_256:
        expected = "sha256=" + hmac.new(app_secret.encode(), raw, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, x_hub_signature_256):
            log.warning("Meta webhook signature mismatch: expected %s, got %s", expected, x_hub_signature_256)
            raise HTTPException(401, "Bad signature")
    _limit("meta")
    payload = await request.json()
    log.info("Received Meta webhook payload: %s", payload)
    platform = Platform.instagram if payload.get("object") == "instagram" else Platform.facebook
    for entry in payload.get("entry", []):
        for event in entry.get("messaging", []):
            message = event.get("message") or {}
            if not message or message.get("is_echo") or not message.get("mid"):
                continue
            recipient_id = str(event.get("recipient", {}).get("id", ""))
            channel = db.scalars(select(Channel).where(
                Channel.platform == platform,
                Channel.is_connected,
                Channel.external_id == recipient_id
            )).first()

            # Support Meta developer dashboard "Test" button (dummy recipient ID like "PAGE_ID" or "0")
            is_test_event = False
            if channel is None:
                channel = db.scalars(select(Channel).where(
                    Channel.platform == platform,
                    Channel.is_connected
                )).first()
                if channel:
                    is_test_event = True
                    log.info("Mapped test/fallback Meta webhook to connected channel id=%s, shop_id=%s", channel.id, channel.shop_id)

            if channel is None:
                log.warning("No connected channel found for Meta recipient %s on %s", recipient_id, platform.value)
                continue

            event_id = message["mid"]
            if is_test_event or recipient_id in ("PAGE_ID", "0", ""):
                import time
                event_id = f"{event_id}:{int(time.time()*1000)}"

            if not claim_event(db, "meta", event_id):
                log.info("Ignoring already claimed Meta event: %s", event_id)
                continue

            image = next(({"type": "url", "url": a["payload"]["url"]} for a in message.get("attachments", [])
                          if a.get("type") == "image" and a.get("payload", {}).get("url")), None)
            sender_id = str(event.get("sender", {}).get("id", "test_sender"))
            text = message.get("text", "")
            sender_name = f"{platform.value.title()} user {sender_id[-4:]}" if len(sender_id) >= 4 else f"{platform.value.title()} Tester"
            log.info("Enqueuing Meta inbound message: channel=%s shop=%s sender=%s text=%r", channel.id, channel.shop_id, sender_id, text)
            process_inbound.delay(channel.shop_id, channel.id, platform.value, sender_id, sender_id,
                                  sender_name, text, image)
    return {"ok": True}


# ------------------------------------------------------------------ bank confirmation callbacks


@router.post("/payments/{shop_id}")
async def payment_callback(shop_id: int, request: Request, db: DB, token: str = Query()) -> dict:
    """Generic bank/PSP push-back: {"invoice_no": "INV-1187", "status": "success", "reference": "..."}.

    Point your ABA PayWay / ACLEDA return URL here (adapter per provider payload) with
    ?token=<shop callback token> from Settings → Payments.
    """
    if not hmac.compare_digest(token, signed_secret(f"payments:{shop_id}")):
        raise HTTPException(401, "Bad token")
    _limit(f"payments:{shop_id}")
    body = await request.json()
    shop = db.get(Shop, shop_id)
    # Lock the order so a duplicate callback racing this one waits, then sees it already paid.
    order = db.scalars(select(Order).where(Order.shop_id == shop_id, Order.invoice_no == body.get("invoice_no"))
                       .with_for_update()).first()
    if shop is None or order is None:
        raise HTTPException(404, "Order not found")
    if str(body.get("status", "")).lower() in ("success", "paid", "0", "approved"):
        order_svc.mark_paid(db, shop, order, provider=body.get("provider") or order.payment_provider,
                            bank_ref=body.get("reference"))
    db.commit()
    return {"ok": True, "status": order.status.value}
