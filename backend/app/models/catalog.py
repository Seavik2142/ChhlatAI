from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, Money, utcnow


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(160))
    sku: Mapped[str | None] = mapped_column(String(64))
    category: Mapped[str | None] = mapped_column(String(64))
    description: Mapped[str] = mapped_column(Text, default="")
    about: Mapped[str] = mapped_column(Text, default="", server_default="")
    positive_impacts: Mapped[str] = mapped_column(Text, default="", server_default="")
    negative_impacts: Mapped[str] = mapped_column(Text, default="", server_default="")
    usage_instructions: Mapped[str] = mapped_column(Text, default="", server_default="")
    price: Mapped[Decimal] = mapped_column(Money)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    low_stock_threshold: Mapped[int | None] = mapped_column(Integer)  # falls back to the shop default
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"

    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class QuickReply(Base):
    __tablename__ = "quick_replies"
    __table_args__ = (UniqueConstraint("shop_id", "command"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)
    command: Mapped[str] = mapped_column(String(32))  # e.g. "/price"
    text: Mapped[str] = mapped_column(Text)


class KnowledgeBase(Base):
    """Zero-friction ingested knowledge (menus, price lists, flyers, PDFs, CSVs) for AI chatbots."""
    __tablename__ = "knowledge_bases"

    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column("shop_id", ForeignKey("shops.id", ondelete="CASCADE"), index=True)
    source_type: Mapped[str] = mapped_column(String(32))  # "image", "document", "manual"
    raw_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    structured_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # JSONB for items/prices/policies
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)  # pending, processed, failed
    task_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # store_id alias for multi-tenant shop compatibility
    @property
    def store_id(self) -> int:
        return self.shop_id

    @store_id.setter
    def store_id(self, value: int) -> None:
        self.shop_id = value


# Alias ProductCatalog to Product for catalog abstraction
ProductCatalog = Product

