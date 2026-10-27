from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, Money, str_enum, utcnow
from app.models.enums import Role, ShopStatus


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    name: Mapped[str] = mapped_column(String(64))
    price_monthly: Mapped[Decimal] = mapped_column(Money, default=0)
    ai_replies_limit: Mapped[int] = mapped_column(Integer, default=500)
    staff_seats: Mapped[int] = mapped_column(Integer, default=1)
    channels_limit: Mapped[int] = mapped_column(Integer, default=1)
    features: Mapped[list[str]] = mapped_column(JSON, default=list)


class Shop(Base):
    __tablename__ = "shops"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(120), unique=True)
    category: Mapped[str] = mapped_column(String(64), default="General")
    status: Mapped[ShopStatus] = mapped_column(str_enum(ShopStatus), default=ShopStatus.trial)
    plan_id: Mapped[int | None] = mapped_column(ForeignKey("plans.id"))
    phone: Mapped[str | None] = mapped_column(String(32))
    address: Mapped[str | None] = mapped_column(String(255))
    ai_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    ai_instructions: Mapped[str] = mapped_column(Text, default="")
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5)
    telegram_alert_chat_id: Mapped[str | None] = mapped_column(String(64))
    delivery_fees: Mapped[dict[str, Any]] = mapped_column(
        JSON, default=lambda: {"phnom_penh": 1.5, "province": 2.0, "grab": 2.8}
    )
    vip_spend_threshold: Mapped[Decimal] = mapped_column(Money, default=150)
    # Last issued invoice number; incremented atomically (UPDATE … RETURNING) so concurrent orders never collide.
    invoice_seq: Mapped[int] = mapped_column(Integer, default=1000, server_default="1000")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    plan: Mapped[Plan | None] = relationship()
    users: Mapped[list[User]] = relationship(back_populates="shop")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(120))
    role: Mapped[Role] = mapped_column(str_enum(Role))
    shop_id: Mapped[int | None] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    commission_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)  # percent of order total
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    shop: Mapped[Shop | None] = relationship(back_populates="users")
