from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import ORM


class ProductIn(BaseModel):
    name: str
    sku: str | None = None
    category: str | None = None
    description: str = ""
    about: str = ""
    positive_impacts: str = ""
    negative_impacts: str = ""
    usage_instructions: str = ""
    price: float = Field(ge=0)
    stock: int = Field(ge=0)
    low_stock_threshold: int | None = None
    is_active: bool = True
    image_url: str | None = None


class ProductOut(ORM):
    id: int
    name: str
    sku: str | None
    category: str | None
    description: str
    about: str = ""
    positive_impacts: str = ""
    negative_impacts: str = ""
    usage_instructions: str = ""
    price: float
    stock: int
    low_stock_threshold: int | None
    is_active: bool
    image_url: str | None = None


class KnowledgeIn(BaseModel):
    title: str
    content: str


class KnowledgeOut(ORM):
    id: int
    title: str
    content: str
    created_at: datetime


class QuickReplyIn(BaseModel):
    command: str = Field(pattern=r"^/[a-z0-9_-]{1,30}$")
    text: str


class QuickReplyOut(ORM):
    id: int
    command: str
    text: str


class ProductExtractedItem(BaseModel):
    name: str
    price: float | str
    details: str = ""


class PolicyExtractedItem(BaseModel):
    topic: str
    content: str


class KnowledgeStructuredData(BaseModel):
    products: list[ProductExtractedItem] = []
    policies: list[PolicyExtractedItem] = []


class KnowledgeUploadResponse(BaseModel):
    task_id: str
    kb_id: int
    status: str = "processing"
    message: str = "File uploaded and extraction task queued"


class KnowledgeStatusResponse(BaseModel):
    task_id: str
    kb_id: int
    store_id: int
    source_type: str
    file_name: str | None = None
    status: str  # pending, processing, processed, failed
    preview: KnowledgeStructuredData | dict | None = None
    error: str | None = None
    created_at: datetime


class KnowledgeBaseOut(ORM):
    id: int
    store_id: int
    source_type: str
    status: str
    file_name: str | None = None
    file_url: str | None = None
    structured_data: dict | None = None
    raw_content: str | None = None
    error_message: str | None = None
    created_at: datetime

