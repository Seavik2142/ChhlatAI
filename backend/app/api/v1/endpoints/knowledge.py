"""Knowledge Base Ingestion API Endpoints.

Allows merchants to upload menus, price lists, flyers, product sheets, or CSVs
and automatically extracts structured catalog & policy data in the background.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, UploadFile
from sqlalchemy import select

from app.api.deps import DB, CurrentShop, ShopMember, get_in_shop
from app.integrations.storage import get_storage
from app.models import KnowledgeBase
from app.schemas.catalog import (
    KnowledgeBaseOut,
    KnowledgeStatusResponse,
    KnowledgeUploadResponse,
)
from app.workers.tasks import extract_knowledge_task

log = logging.getLogger(__name__)

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

ALLOWED_IMAGE_MIMES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}
ALLOWED_DOC_MIMES = {
    "application/pdf",
    "text/csv",
    "application/csv",
    "text/plain",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", response_model=KnowledgeUploadResponse, status_code=202)
async def upload_knowledge_file(
    file: UploadFile,
    shop: CurrentShop,
    _: ShopMember,
    db: DB,
) -> dict[str, Any]:
    """Upload a product menu, price list, flyer (image/PDF) or CSV and extract knowledge asynchronously."""
    raw_content_type = file.content_type or "application/octet-stream"
    filename = file.filename or "upload.bin"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    # Normalize mime detection by extension if generic
    content_type = raw_content_type
    if content_type in ("application/octet-stream", "binary/octet-stream"):
        if ext in ("jpg", "jpeg"):
            content_type = "image/jpeg"
        elif ext == "png":
            content_type = "image/png"
        elif ext == "webp":
            content_type = "image/webp"
        elif ext == "pdf":
            content_type = "application/pdf"
        elif ext == "csv":
            content_type = "text/csv"

    # Validate allowed MIME types
    is_image = content_type in ALLOWED_IMAGE_MIMES or content_type.startswith("image/")
    is_doc = content_type in ALLOWED_DOC_MIMES or ext in ("pdf", "csv")
    if not (is_image or is_doc):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{content_type}'. Allowed types: Images (JPG, PNG, WebP), PDF, and CSV.",
        )

    # Validate file size (max 10MB)
    data = await file.read(MAX_FILE_SIZE + 1)
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds maximum allowed limit of 10 MB.")

    source_type = "image" if is_image else "document"

    # Save to storage (local disk or S3)
    save_ext = ext if ext else ("jpg" if is_image else "pdf")
    file_url = get_storage().save(data, content_type, save_ext)

    import uuid
    task_id = str(uuid.uuid4())

    # Create pending KnowledgeBase record and commit before dispatching
    kb = KnowledgeBase(
        shop_id=shop.id,
        source_type=source_type,
        status="pending",
        task_id=task_id,
        file_name=filename,
        file_url=file_url,
    )
    db.add(kb)
    db.commit()

    # Dispatch Celery background task
    extract_knowledge_task.apply_async(
        args=[kb.id, shop.id, file_url, content_type, filename],
        task_id=task_id,
    )

    log.info("Knowledge extraction task %s queued for kb_id=%s, shop_id=%s", task_id, kb.id, shop.id)

    return {
        "task_id": task_id,
        "kb_id": kb.id,
        "status": "processing",
        "message": "File uploaded and extraction task queued successfully.",
    }


@router.get("/status/{task_id}", response_model=KnowledgeStatusResponse)
def get_extraction_status(
    task_id: str,
    shop: CurrentShop,
    _: ShopMember,
    db: DB,
) -> dict[str, Any]:
    """Check knowledge extraction status and return structured preview."""
    kb = db.scalars(
        select(KnowledgeBase).where(KnowledgeBase.task_id == task_id, KnowledgeBase.shop_id == shop.id)
    ).first()

    if kb is None:
        raise HTTPException(status_code=404, detail=f"Extraction task '{task_id}' not found.")

    return {
        "task_id": kb.task_id or task_id,
        "kb_id": kb.id,
        "store_id": kb.shop_id,
        "source_type": kb.source_type,
        "file_name": kb.file_name,
        "status": kb.status,
        "preview": kb.structured_data,
        "error": kb.error_message,
        "created_at": kb.created_at,
    }


@router.get("/records", response_model=list[KnowledgeBaseOut])
def list_knowledge_records(
    shop: CurrentShop,
    _: ShopMember,
    db: DB,
) -> list[KnowledgeBase]:
    """List all ingested knowledge bases for the current shop."""
    return list(
        db.scalars(
            select(KnowledgeBase)
            .where(KnowledgeBase.shop_id == shop.id)
            .order_by(KnowledgeBase.created_at.desc())
        ).all()
    )


@router.get("/{kb_id}", response_model=KnowledgeBaseOut)
def get_knowledge_record(
    kb_id: int,
    shop: CurrentShop,
    _: ShopMember,
    db: DB,
) -> KnowledgeBase:
    """Retrieve details of a specific ingested knowledge base."""
    return get_in_shop(db, KnowledgeBase, kb_id, shop.id)


@router.delete("/{kb_id}", status_code=204)
def delete_knowledge_record(
    kb_id: int,
    shop: CurrentShop,
    _: ShopMember,
    db: DB,
) -> None:
    """Delete an ingested knowledge base record."""
    kb = get_in_shop(db, KnowledgeBase, kb_id, shop.id)
    db.delete(kb)
    db.commit()
