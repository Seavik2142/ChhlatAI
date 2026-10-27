"""Telegram MTProto User Client Service.

Allows connecting normal Telegram user/personal/business accounts via MTProto
(using api_id, api_hash, and phone number + SMS/Telegram app login code)
using Telethon StringSession.
"""

from __future__ import annotations

import asyncio
import io
import json
import logging
import re
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session
from telethon import TelegramClient, events
from telethon.errors import (
    PasswordHashInvalidError,
    PhoneCodeExpiredError,
    PhoneCodeInvalidError,
    SessionPasswordNeededError,
)
from telethon.sessions import StringSession

from app.core.config import get_settings
from app.core.database import session_scope
from app.core.redis import get_redis
from app.integrations.storage import get_storage
from app.models import Channel, Platform

log = logging.getLogger(__name__)

REDIS_LOGIN_PREFIX = "tg_user_auth:"
REDIS_OUTBOUND_CHANNEL = "chhlatai:tg_user:outbound"


def normalize_phone(phone: str) -> str:
    """Normalize phone number to international E.164 format (defaults to Cambodia +855)."""
    clean = re.sub(r"[\s\-\(\)]", "", phone.strip())
    if clean.startswith("0"):
        return "+855" + clean[1:]
    if not clean.startswith("+"):
        return "+" + clean
    return clean


def resolve_credentials(
    custom_api_id: str | None = None,
    custom_api_hash: str | None = None,
) -> tuple[int, str]:
    """Resolve Telegram App api_id and api_hash from input or server environment."""
    settings = get_settings()
    api_id_val = (custom_api_id or "").strip() or settings.telegram_api_id.strip()
    api_hash_val = (custom_api_hash or "").strip() or settings.telegram_api_hash.strip()

    if not api_id_val or not api_hash_val:
        raise ValueError(
            "Telegram App api_id and api_hash are required. "
            "Please provide them or configure TELEGRAM_API_ID and TELEGRAM_API_HASH in your backend settings."
        )

    try:
        api_id_int = int(api_id_val)
    except ValueError:
        raise ValueError("Invalid Telegram api_id: must be an integer.")

    return api_id_int, api_hash_val


async def send_user_code(
    shop_id: int,
    phone: str,
    custom_api_id: str | None = None,
    custom_api_hash: str | None = None,
) -> dict[str, Any]:
    """Initiate login by sending a Telegram authentication code to the user's phone."""
    api_id, api_hash = resolve_credentials(custom_api_id, custom_api_hash)
    clean_phone = normalize_phone(phone)

    client = TelegramClient(StringSession(), api_id, api_hash)
    try:
        await client.connect()
        send_res = await client.send_code_request(clean_phone)
        session_str = client.session.save()

        # Cache session & phone_code_hash in Redis (TTL: 15 mins)
        payload = {
            "phone": clean_phone,
            "phone_code_hash": send_res.phone_code_hash,
            "session": session_str,
            "api_id": str(api_id),
            "api_hash": api_hash,
        }
        r = get_redis()
        if r is not None:
            r.set(f"{REDIS_LOGIN_PREFIX}{shop_id}:{clean_phone}", json.dumps(payload), ex=900)

        return {
            "ok": True,
            "phone": clean_phone,
            "phone_code_hash": send_res.phone_code_hash,
            "message": f"Verification code sent to {clean_phone} via Telegram app or SMS.",
        }
    finally:
        await client.disconnect()


async def verify_user_code(
    shop_id: int,
    phone: str,
    code: str,
    password: str | None = None,
    custom_api_id: str | None = None,
    custom_api_hash: str | None = None,
    db: Session | None = None,
) -> dict[str, Any]:
    """Complete Telegram user sign-in and save/link the Channel."""
    clean_phone = normalize_phone(phone)
    r = get_redis()
    cache_key = f"{REDIS_LOGIN_PREFIX}{shop_id}:{clean_phone}"

    saved_session = ""
    phone_code_hash = ""
    api_id_val = None
    api_hash_val = None

    if r is not None:
        cached = r.get(cache_key)
        if cached:
            try:
                data = json.loads(cached)
                saved_session = data.get("session", "")
                phone_code_hash = data.get("phone_code_hash", "")
                api_id_val = data.get("api_id")
                api_hash_val = data.get("api_hash")
            except Exception:
                pass

    api_id, api_hash = resolve_credentials(custom_api_id or api_id_val, custom_api_hash or api_hash_val)

    client = TelegramClient(StringSession(saved_session), api_id, api_hash)
    try:
        await client.connect()

        # Step 1: Sign in with code
        try:
            await client.sign_in(phone=clean_phone, code=code.strip(), phone_code_hash=phone_code_hash)
        except SessionPasswordNeededError:
            if not password:
                return {
                    "ok": False,
                    "requires_password": True,
                    "phone": clean_phone,
                    "message": "Two-step verification (2FA) cloud password is required for this Telegram account.",
                }
            try:
                await client.sign_in(password=password)
            except PasswordHashInvalidError:
                return {
                    "ok": False,
                    "requires_password": True,
                    "phone": clean_phone,
                    "error": "Incorrect 2FA password. Please try again.",
                }
        except PhoneCodeInvalidError:
            return {"ok": False, "error": "Invalid verification code. Please check your Telegram app."}
        except PhoneCodeExpiredError:
            return {"ok": False, "error": "Verification code has expired. Please request a new code."}

        # Step 2: Retrieve user profile
        me = await client.get_me()
        if not me:
            return {"ok": False, "error": "Failed to retrieve Telegram user profile."}

        final_session = client.session.save()
        user_name = f"{getattr(me, 'first_name', '') or ''} {getattr(me, 'last_name', '') or ''}".strip()
        if not user_name:
            user_name = getattr(me, "username", "") or clean_phone

        username_handle = getattr(me, "username", "")
        if username_handle and not username_handle.startswith("@"):
            username_handle = f"@{username_handle}"

        # Clean up Redis login session
        if r is not None:
            r.delete(cache_key)

        channel_data = {
            "telegram_id": me.id,
            "name": user_name,
            "username": username_handle or None,
            "phone": clean_phone,
            "session": final_session,
            "api_id": str(api_id),
            "api_hash": api_hash,
        }

        # Link to DB if session provided
        if db is not None:
            existing = db.scalars(select(Channel).where(
                Channel.shop_id == shop_id,
                Channel.platform == Platform.telegram,
                Channel.external_id == str(me.id),
            )).first()

            if existing is None:
                existing = Channel(
                    shop_id=shop_id,
                    platform=Platform.telegram,
                    name=user_name,
                    external_id=str(me.id),
                    access_token=final_session,
                    meta_info={
                        "type": "user",
                        "phone": clean_phone,
                        "username": username_handle,
                        "user_id": me.id,
                        "api_id": str(api_id),
                        "api_hash": api_hash,
                        "connected_via": "telegram_user_mtproto",
                        "verified": True,
                    },
                    is_connected=True,
                )
                db.add(existing)
            else:
                existing.name = user_name
                existing.access_token = final_session
                existing.meta_info = {
                    **(existing.meta_info or {}),
                    "type": "user",
                    "phone": clean_phone,
                    "username": username_handle,
                    "user_id": me.id,
                    "api_id": str(api_id),
                    "api_hash": api_hash,
                    "connected_via": "telegram_user_mtproto",
                    "verified": True,
                }
                existing.is_connected = True

            db.commit()
            db.refresh(existing)

            # Start the live listener for this channel in memory
            asyncio.create_task(
                telegram_user_manager.start_client_for_channel(
                    channel_id=existing.id,
                    shop_id=shop_id,
                    session_str=final_session,
                    api_id=api_id,
                    api_hash=api_hash,
                )
            )

            from app.schemas.shop import ChannelOut
            return {
                "ok": True,
                "message": f"Successfully connected Telegram account: {user_name} ({clean_phone})",
                "channel": ChannelOut.model_validate(existing).model_dump(mode="json"),
                "user": channel_data,
            }

        return {"ok": True, "user": channel_data}

    finally:
        await client.disconnect()


class TelegramUserManager:
    """Manages active Telethon client instances for all connected normal Telegram user accounts."""

    def __init__(self) -> None:
        self.clients: dict[int, TelegramClient] = {}
        self._listener_task: asyncio.Task | None = None
        self._running = False

    async def start_client_for_channel(
        self,
        channel_id: int,
        shop_id: int,
        session_str: str,
        api_id: int,
        api_hash: str,
    ) -> None:
        """Start an active MTProto client for a user channel and bind message listeners."""
        await self.stop_client_for_channel(channel_id)

        try:
            client = TelegramClient(StringSession(session_str), api_id, api_hash)
            await client.connect()

            if not await client.is_user_authorized():
                log.warning("Telegram user client for channel %s is not authorized; skipping", channel_id)
                await client.disconnect()
                return

            @client.on(events.NewMessage(incoming=True, func=lambda e: e.is_private and not e.out))
            async def _on_incoming_message(event: events.NewMessage.Event) -> None:
                try:
                    sender = await event.get_sender()
                    sender_id = str(event.sender_id)
                    chat_id = str(event.chat_id)
                    first_name = getattr(sender, "first_name", "") or ""
                    last_name = getattr(sender, "last_name", "") or ""
                    name = f"{first_name} {last_name}".strip() or getattr(sender, "username", "") or f"User {sender_id}"
                    text = event.raw_text or ""

                    image = None
                    if event.photo:
                        try:
                            photo_data = await event.download_media(file=bytes)
                            if photo_data:
                                filename = get_storage().save(photo_data, "image/jpeg", "jpg")
                                image = {"type": "local", "path": filename}
                        except Exception as dl_err:
                            log.warning("Failed to download Telegram user photo: %s", dl_err)

                    from app.workers.tasks import process_inbound

                    log.info("Telegram user inbound message received for shop %s from %s (%s)", shop_id, name, sender_id)
                    process_inbound.delay(
                        shop_id,
                        channel_id,
                        Platform.telegram.value,
                        sender_id,
                        chat_id,
                        name,
                        text,
                        image,
                    )
                except Exception as ex:
                    log.exception("Error processing incoming Telegram user message: %s", ex)

            self.clients[channel_id] = client
            log.info("Telegram user client running for channel %s (shop %s)", channel_id, shop_id)
        except Exception as e:
            log.exception("Failed to start Telegram user client for channel %s: %s", channel_id, e)

    async def stop_client_for_channel(self, channel_id: int) -> None:
        """Stop and disconnect a specific Telegram user client."""
        client = self.clients.pop(channel_id, None)
        if client:
            try:
                await client.disconnect()
                log.info("Stopped Telegram user client for channel %s", channel_id)
            except Exception as e:
                log.warning("Error disconnecting Telegram user client %s: %s", channel_id, e)

    async def send_text(self, channel_id: int, chat_id: str | int, text: str) -> bool:
        """Send an outbound text message via the active user client."""
        client = self.clients.get(channel_id)
        if client and client.is_connected():
            try:
                target = int(chat_id) if str(chat_id).lstrip("-").isdigit() else chat_id
                await client.send_message(target, text)
                return True
            except Exception as e:
                log.error("Failed to send text via Telegram user client %s: %s", channel_id, e)
                return False
        return False

    async def send_photo(
        self,
        channel_id: int,
        chat_id: str | int,
        photo_bytes: bytes,
        caption: str | None = None,
    ) -> bool:
        """Send an outbound photo/attachment via the active user client."""
        client = self.clients.get(channel_id)
        if client and client.is_connected():
            try:
                target = int(chat_id) if str(chat_id).lstrip("-").isdigit() else chat_id
                bio = io.BytesIO(photo_bytes)
                bio.name = "image.jpg"
                await client.send_file(target, bio, caption=caption or "")
                return True
            except Exception as e:
                log.error("Failed to send photo via Telegram user client %s: %s", channel_id, e)
                return False
        return False

    async def run_outbound_listener(self) -> None:
        """Subscribe to Redis channel for outbound user replies sent from other worker processes."""
        r = get_redis()
        if r is None:
            return

        import redis.asyncio as aioredis
        settings = get_settings()
        if not settings.redis_url:
            return

        while self._running:
            try:
                async_redis = aioredis.Redis.from_url(settings.redis_url, decode_responses=True)
                pubsub = async_redis.pubsub()
                await pubsub.subscribe(REDIS_OUTBOUND_CHANNEL)
                log.info("Telegram User outbound queue listener started on %s", REDIS_OUTBOUND_CHANNEL)

                async for msg in pubsub.listen():
                    if not self._running:
                        break
                    if msg.get("type") != "message":
                        continue
                    try:
                        data = json.loads(msg["data"])
                        channel_id = data.get("channel_id")
                        chat_id = data.get("chat_id")
                        text = data.get("text")
                        photo_bytes_b64 = data.get("photo_bytes_b64")
                        caption = data.get("caption")

                        if photo_bytes_b64:
                            import base64
                            raw_bytes = base64.b64decode(photo_bytes_b64)
                            await self.send_photo(channel_id, chat_id, raw_bytes, caption)
                        elif text:
                            await self.send_text(channel_id, chat_id, text)
                    except Exception as inner_e:
                        log.error("Error processing outbound Telegram user message: %s", inner_e)
            except asyncio.CancelledError:
                break
            except Exception as e:
                log.warning("Telegram user outbound listener lost Redis: %s; retrying in 3s", e)
                await asyncio.sleep(3)

    async def start_all(self) -> None:
        """Load all active user channels from the DB on server startup."""
        self._running = True
        try:
            with session_scope() as db:
                channels = db.scalars(
                    select(Channel).where(
                        Channel.platform == Platform.telegram,
                        Channel.is_connected,
                    )
                ).all()

                for c in channels:
                    meta = c.meta_info or {}
                    if meta.get("type") == "user" and c.access_token:
                        api_id_val = meta.get("api_id")
                        api_hash_val = meta.get("api_hash")
                        if api_id_val and api_hash_val:
                            try:
                                await self.start_client_for_channel(
                                    channel_id=c.id,
                                    shop_id=c.shop_id,
                                    session_str=c.access_token,
                                    api_id=int(api_id_val),
                                    api_hash=api_hash_val,
                                )
                            except Exception as ex:
                                log.warning("Could not auto-start Telegram user channel %s: %s", c.id, ex)

            # Start background Redis outbound listener
            self._listener_task = asyncio.create_task(self.run_outbound_listener())
        except Exception as e:
            log.exception("Error starting Telegram user clients: %s", e)

    async def stop_all(self) -> None:
        """Shutdown all active user clients."""
        self._running = False
        if self._listener_task:
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass

        for channel_id in list(self.clients.keys()):
            await self.stop_client_for_channel(channel_id)


telegram_user_manager = TelegramUserManager()
