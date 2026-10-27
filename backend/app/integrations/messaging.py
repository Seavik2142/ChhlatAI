"""Omnichannel routing: send replies back through the customer's original app."""

import logging

import httpx
from sqlalchemy.orm import Session

from app.models import Channel, Conversation, ErrorLog, Platform

log = logging.getLogger(__name__)

GRAPH_URL = "https://graph.facebook.com/v21.0/me/messages"


def send_text(db: Session, conversation: Conversation, text: str) -> bool:
    """Deliver a message to the customer. Returns False when it could not be delivered.

    Channels without an access token (demo data, local development) are logged and skipped
    so the inbox keeps working without real Telegram/Meta credentials.
    """
    channel: Channel | None = conversation.channel
    if channel is None or not channel.access_token:
        log.info("[dev] %s → %s: %s", conversation.platform.value, conversation.external_chat_id, text[:80])
        return True
    try:
        if channel.platform == Platform.telegram:
            meta = channel.meta_info or {}
            if meta.get("type") == "user":
                return _dispatch_tg_user_text(channel, conversation.external_chat_id, text)
            r = httpx.post(
                f"https://api.telegram.org/bot{channel.access_token}/sendMessage",
                json={"chat_id": conversation.external_chat_id, "text": text},
                timeout=10,
            )
        elif channel.platform in (Platform.facebook, Platform.instagram):
            r = httpx.post(
                GRAPH_URL,
                params={"access_token": channel.access_token},
                json={"recipient": {"id": conversation.external_chat_id}, "messaging_type": "RESPONSE",
                      "message": {"text": text}},
                timeout=10,
            )
        else:
            # TikTok's messaging API is partner-gated; replies are queued for staff to send manually.
            log.info("TikTok outbound not available; message kept in inbox only")
            return False
        r.raise_for_status()
        return True
    except httpx.HTTPError as e:
        db.add(ErrorLog(source=f"channel.{channel.platform.value}", message=str(e), shop_id=conversation.shop_id,
                        context={"conversation_id": conversation.id}))
        log.error("Failed to send via %s: %s", channel.platform.value, e)
        return False


def _resolve_image_bytes(db: Session, image_url: str) -> bytes | None:
    """Extract or generate binary image bytes in-process for direct multipart delivery."""
    import os
    import re
    # 1. KHQR order card
    m = re.search(r"/orders/(\d+)/khqr-image", image_url)
    if m:
        try:
            from app.models import Order, Shop
            from app.services import payments
            order = db.get(Order, int(m.group(1)))
            if order:
                shop = db.get(Shop, order.shop_id)
                if shop:
                    khqr = order.khqr
                    if not khqr:
                        khqr, provider = payments.khqr_for_order(db, shop, order)
                        order.khqr = khqr
                        if not order.payment_provider:
                            order.payment_provider = provider
                        db.commit()
                    return payments.generate_khqr_image_bytes(
                        shop_name=shop.name,
                        merchant_name=order.payment_provider or shop.name,
                        provider_type=order.payment_provider or "bakong",
                        amount=order.total,
                        bill_number=order.invoice_no,
                        khqr_string=khqr,
                        currency="USD",
                    )
        except Exception as e:
            log.warning("Failed in-process KHQR bytes generation: %s", e)

    # 2. Uploaded file on local disk
    if "/uploads/" in image_url:
        try:
            from app.core.config import get_settings
            filename = image_url.split("/uploads/")[-1].split("?")[0]
            filepath = os.path.join(get_settings().upload_dir, filename)
            if os.path.exists(filepath):
                with open(filepath, "rb") as f:
                    return f.read()
        except Exception as e:
            log.warning("Failed local file read for %s: %s", image_url, e)

    # 3. Fetch from local backend if relative path
    if image_url.startswith("/"):
        try:
            r = httpx.get(f"http://127.0.0.1:8000{image_url}", timeout=10)
            if r.status_code == 200:
                return r.content
        except Exception:
            pass

    return None


def send_image(db: Session, conversation: Conversation, image_url: str, caption: str = "") -> bool:
    """Deliver an image/invoice attachment to the customer via Telegram or Meta."""
    import json
    from app.core.config import get_settings

    channel: Channel | None = conversation.channel
    if channel is None or not channel.access_token:
        log.info("[dev] image %s → %s: %s (url: %s)", conversation.platform.value, conversation.external_chat_id, caption[:80], image_url)
        return True

    raw_url = image_url
    if image_url.startswith("/"):
        base = get_settings().public_base_url.rstrip("/")
        image_url = f"{base}{image_url}"

    img_bytes = _resolve_image_bytes(db, raw_url) or _resolve_image_bytes(db, image_url)

    try:
        if channel.platform == Platform.telegram:
            meta = channel.meta_info or {}
            if meta.get("type") == "user":
                if img_bytes:
                    return _dispatch_tg_user_photo(channel, conversation.external_chat_id, img_bytes, caption)
                return _dispatch_tg_user_text(channel, conversation.external_chat_id, f"{caption or ''}\n{image_url}".strip())
            if img_bytes:
                files = {"photo": ("attachment.png", img_bytes, "image/png")}
                data = {"chat_id": conversation.external_chat_id}
                if caption:
                    data["caption"] = caption[:1024]
                r = httpx.post(
                    f"https://api.telegram.org/bot{channel.access_token}/sendPhoto",
                    data=data,
                    files=files,
                    timeout=25,
                )
            else:
                r = httpx.post(
                    f"https://api.telegram.org/bot{channel.access_token}/sendPhoto",
                    json={"chat_id": conversation.external_chat_id, "photo": image_url, "caption": caption[:1024]},
                    timeout=15,
                )
        elif channel.platform in (Platform.facebook, Platform.instagram):
            if caption:
                send_text(db, conversation, caption)
            if img_bytes:
                files = {"filedata": ("khqr.png", img_bytes, "image/png")}
                data = {
                    "recipient": json.dumps({"id": conversation.external_chat_id}),
                    "message": json.dumps({"attachment": {"type": "image", "payload": {"is_reusable": True}}}),
                }
                r = httpx.post(
                    GRAPH_URL,
                    params={"access_token": channel.access_token},
                    data=data,
                    files=files,
                    timeout=25,
                )
            else:
                r = httpx.post(
                    GRAPH_URL,
                    params={"access_token": channel.access_token},
                    json={
                        "recipient": {"id": conversation.external_chat_id},
                        "messaging_type": "RESPONSE",
                        "message": {
                            "attachment": {
                                "type": "image",
                                "payload": {"url": image_url, "is_reusable": True},
                            }
                        },
                    },
                    timeout=15,
                )
        else:
            log.info("TikTok outbound image not available; kept in inbox only")
            return False

        if r.status_code >= 400:
            err_msg = f"{r.status_code}: {r.text}"
            db.add(ErrorLog(source=f"channel.{channel.platform.value}", message=err_msg, shop_id=conversation.shop_id,
                            context={"conversation_id": conversation.id, "image_url": image_url}))
            log.error("Failed to send image via %s: %s", channel.platform.value, err_msg)
            return False

        return True
    except httpx.HTTPError as e:
        db.add(ErrorLog(source=f"channel.{channel.platform.value}", message=str(e), shop_id=conversation.shop_id,
                        context={"conversation_id": conversation.id}))
        log.error("Failed to send image via %s: %s", channel.platform.value, e)
        return False


def send_telegram_alert(bot_token: str, chat_id: str, text: str) -> None:
    try:
        httpx.post(f"https://api.telegram.org/bot{bot_token}/sendMessage",
                   json={"chat_id": chat_id, "text": text}, timeout=10).raise_for_status()
    except httpx.HTTPError as e:
        log.error("Telegram alert failed: %s", e)


def _dispatch_tg_user_text(channel: Channel, chat_id: str, text: str) -> bool:
    """Send text through normal user Telegram account (MTProto)."""
    import asyncio
    import json
    try:
        from app.services.telegram_user import telegram_user_manager
        client = telegram_user_manager.clients.get(channel.id)
        if client and client.is_connected():
            loop = getattr(client, "loop", None)
            if loop and loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    telegram_user_manager.send_text(channel.id, chat_id, text),
                    loop,
                )
                return True
    except Exception as local_ex:
        log.debug("Local user client send skipped: %s", local_ex)

    try:
        from app.core.redis import get_redis
        from app.services.telegram_user import REDIS_OUTBOUND_CHANNEL
        r = get_redis()
        if r is not None:
            r.publish(REDIS_OUTBOUND_CHANNEL, json.dumps({
                "channel_id": channel.id,
                "chat_id": chat_id,
                "text": text,
            }))
            return True
    except Exception as e:
        log.error("Failed to publish outbound Telegram user text: %s", e)

    return False


def _dispatch_tg_user_photo(channel: Channel, chat_id: str, img_bytes: bytes, caption: str | None = None) -> bool:
    """Send photo through normal user Telegram account (MTProto)."""
    import asyncio
    import base64
    import json
    try:
        from app.services.telegram_user import telegram_user_manager
        client = telegram_user_manager.clients.get(channel.id)
        if client and client.is_connected():
            loop = getattr(client, "loop", None)
            if loop and loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    telegram_user_manager.send_photo(channel.id, chat_id, img_bytes, caption),
                    loop,
                )
                return True
    except Exception as local_ex:
        log.debug("Local user client photo send skipped: %s", local_ex)

    try:
        from app.core.redis import get_redis
        from app.services.telegram_user import REDIS_OUTBOUND_CHANNEL
        r = get_redis()
        if r is not None:
            r.publish(REDIS_OUTBOUND_CHANNEL, json.dumps({
                "channel_id": channel.id,
                "chat_id": chat_id,
                "photo_bytes_b64": base64.b64encode(img_bytes).decode("ascii"),
                "caption": caption,
            }))
            return True
    except Exception as e:
        log.error("Failed to publish outbound Telegram user photo: %s", e)

    return False

