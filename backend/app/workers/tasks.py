"""Background jobs. Each task opens its own unit of work and is safe to retry."""

import logging
from typing import Any

import httpx
from sqlalchemy.exc import IntegrityError, OperationalError

from app.core.database import session_scope
from app.integrations.storage import get_storage
from app.models import Channel, Platform, Shop
from app.services import inbox
from app.services.idempotency import prune_events
from app.workers.celery_app import celery_app

log = logging.getLogger(__name__)
RETRYABLE = (OperationalError, IntegrityError, httpx.TransportError)


def _fetch_image(channel: Channel | None, image: dict[str, Any] | None) -> tuple[bytes, str, str] | None:
    """Download an inbound attachment and keep a copy in our storage (provider URLs expire)."""
    if not image:
        return None
    if image["type"] == "telegram" and channel and channel.access_token:
        base = f"https://api.telegram.org/bot{channel.access_token}"
        path = httpx.get(f"{base}/getFile", params={"file_id": image["file_id"]}, timeout=10).json()["result"]["file_path"]
        data = httpx.get(f"https://api.telegram.org/file/bot{channel.access_token}/{path}", timeout=20).content
    elif image["type"] == "url":
        data = httpx.get(image["url"], timeout=20).content
    else:
        return None
    return data, "image/jpeg", get_storage().save(data, "image/jpeg", "jpg")


@celery_app.task(autoretry_for=RETRYABLE, retry_backoff=True, retry_backoff_max=60, max_retries=6)
def process_inbound(shop_id: int, channel_id: int | None, platform: str, user_id: str, chat_id: str, name: str,
                    text: str, image: dict[str, Any] | None = None) -> int:
    """One customer message → AI reply / hand-off / invoice / slip check. Returns the conversation id."""
    with session_scope() as db:
        shop = db.get(Shop, shop_id)
        channel = db.get(Channel, channel_id) if channel_id else None
        c = inbox.receive(db, shop, Platform(platform), user_id, chat_id, name, text,
                          image=_fetch_image(channel, image), channel=channel)
        return c.id


@celery_app.task(autoretry_for=(OperationalError,), retry_backoff=True, max_retries=3)
def deliver_broadcast(broadcast_id: int) -> int:
    from app.services.marketing import deliver

    return deliver(broadcast_id)


@celery_app.task
def prune_webhook_events() -> int:
    with session_scope() as db:
        return prune_events(db)


@celery_app.task(autoretry_for=(OperationalError,), retry_backoff=True, max_retries=2)
def send_admin_telegram_alert_task(text_content: str, chat_id: str | None = None) -> bool:
    from app.services.admin_bot import send_admin_bot_message_sync

    return send_admin_bot_message_sync(text_content, chat_id=chat_id)


@celery_app.task(bind=True, max_retries=2)
def extract_knowledge_task(self, kb_id: int, shop_id: int, file_path_or_url: str,
                           content_type: str, filename: str) -> dict[str, Any]:
    """Background task to extract structured knowledge from uploaded image/document/csv."""
    from pathlib import Path
    from app.models import KnowledgeBase
    from app.services.knowledge_extraction import (
        extract_and_structure_knowledge,
        sync_extracted_knowledge_to_shop,
    )

    log.info("Starting extract_knowledge_task for kb_id=%s, shop_id=%s, file=%s", kb_id, shop_id, filename)

    # 1. Load file bytes
    file_bytes: bytes | None = None
    try:
        from app.core.config import get_settings
        settings = get_settings()

        local_path = Path(file_path_or_url)
        if not local_path.is_file() and "/uploads/" in file_path_or_url:
            rel = file_path_or_url.split("/uploads/")[-1]
            candidate_dirs = [
                Path(settings.upload_dir),
                Path("uploads"),
                Path("/app/uploads"),
                Path("/tmp/omnichat-test-uploads"),
            ]
            for c_dir in candidate_dirs:
                cand = c_dir / rel
                if cand.is_file():
                    local_path = cand
                    break

        if local_path.is_file():
            file_bytes = local_path.read_bytes()
        elif file_path_or_url.startswith(("http://", "https://")):
            with httpx.Client(timeout=30.0) as client:
                res = client.get(file_path_or_url)
                res.raise_for_status()
                file_bytes = res.content
        else:
            raise FileNotFoundError(f"Could not locate file at {file_path_or_url}")
    except Exception as e:
        log.error("Failed to load file for knowledge extraction: %s", e)
        with session_scope() as db:
            kb = db.get(KnowledgeBase, kb_id)
            if kb:
                kb.status = "failed"
                kb.error_message = f"Failed to load file: {e}"
                db.commit()
        return {"status": "failed", "error": str(e)}

    # 2. Extract and structure knowledge
    try:
        with session_scope() as db:
            kb = db.get(KnowledgeBase, kb_id)
            if kb:
                kb.status = "processing"
                db.commit()

            result = extract_and_structure_knowledge(file_bytes, content_type, filename, shop_id, db=db)
            
            if kb:
                kb.status = "processed"
                kb.raw_content = result.get("raw_content")
                kb.structured_data = {
                    "products": result.get("products", []),
                    "policies": result.get("policies", []),
                }
                kb.error_message = None
                db.commit()

            # 3. Synchronize into shop products and policies for chatbot zero-friction usage
            sync_stats = sync_extracted_knowledge_to_shop(db, shop_id, kb.structured_data if kb else result)
            
            return {
                "status": "processed",
                "kb_id": kb_id,
                "products_count": len(result.get("products", [])),
                "policies_count": len(result.get("policies", [])),
                "sync": sync_stats,
            }
    except Exception as e:
        log.exception("Knowledge extraction failed for kb_id=%s: %s", kb_id, e)
        with session_scope() as db:
            kb = db.get(KnowledgeBase, kb_id)
            if kb:
                kb.status = "failed"
                kb.error_message = str(e)
                db.commit()
        return {"status": "failed", "error": str(e)}

