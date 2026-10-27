from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, Money, str_enum, utcnow
from app.models.enums import Courier, OrderStatus, PaymentProviderType, SlipStatus
from app.models.types import EncryptedText

if TYPE_CHECKING:
    from app.models.customer import Customer


class PaymentProvider(Base):
    __tablename__ = "payment_providers"
    __table_args__ = (UniqueConstraint("shop_id", "provider"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)
    provider: Mapped[PaymentProviderType] = mapped_column(str_enum(PaymentProviderType))
    environment: Mapped[str] = mapped_column(String(16), default="sandbox")
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False)
    use_for_invoices: Mapped[bool] = mapped_column(Boolean, default=True)
    merchant_name: Mapped[str | None] = mapped_column(String(120))
    account_id: Mapped[str | None] = mapped_column(String(120))  # Bakong account / merchant id
    secret: Mapped[str | None] = mapped_column(EncryptedText)  # API token / key — owner-only, never returned in full
    methods: Mapped[list[str]] = mapped_column(JSON, default=list)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        UniqueConstraint("shop_id", "invoice_no"),
        Index("ix_orders_shop_status_created", "shop_id", "status", "created_at"),
        Index("ix_orders_shop_created", "shop_id", "created_at"),
        Index("ix_orders_staff_created", "staff_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"), index=True)
    conversation_id: Mapped[int | None] = mapped_column(ForeignKey("conversations.id", ondelete="SET NULL"))
    invoice_no: Mapped[str] = mapped_column(String(32))
    status: Mapped[OrderStatus] = mapped_column(str_enum(OrderStatus), default=OrderStatus.awaiting_payment)
    subtotal: Mapped[Decimal] = mapped_column(Money, default=0)
    delivery_fee: Mapped[Decimal] = mapped_column(Money, default=0)
    total: Mapped[Decimal] = mapped_column(Money, default=0)
    delivery_zone: Mapped[str | None] = mapped_column(String(64))
    delivery_address: Mapped[str | None] = mapped_column(String(255))
    created_by_ai: Mapped[bool] = mapped_column(Boolean, default=True)
    staff_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))  # earns commission
    payment_provider: Mapped[str | None] = mapped_column(String(32))
    khqr: Mapped[str | None] = mapped_column(Text)
    bank_ref: Mapped[str | None] = mapped_column(String(64))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    invoice_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    customer: Mapped[Customer] = relationship()
    items: Mapped[list[OrderItem]] = relationship(back_populates="order", cascade="all, delete-orphan")
    slips: Mapped[list[PaymentSlip]] = relationship(
        back_populates="order", order_by="PaymentSlip.id", cascade="all, delete-orphan"
    )
    delivery: Mapped[Delivery | None] = relationship(back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"))
    name: Mapped[str] = mapped_column(String(160))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[Decimal] = mapped_column(Money)

    order: Mapped[Order] = relationship(back_populates="items")


class PaymentSlip(Base):
    __tablename__ = "payment_slips"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    image_url: Mapped[str | None] = mapped_column(String(500))
    bank: Mapped[str | None] = mapped_column(String(64))
    amount: Mapped[Decimal | None] = mapped_column(Money)
    receiver: Mapped[str | None] = mapped_column(String(160))
    reference: Mapped[str | None] = mapped_column(String(64), index=True)
    paid_time: Mapped[str | None] = mapped_column(String(64))
    confidence: Mapped[float] = mapped_column(default=0.0)
    status: Mapped[SlipStatus] = mapped_column(str_enum(SlipStatus), default=SlipStatus.pending)
    checks: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    order: Mapped[Order] = relationship(back_populates="slips")


class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), unique=True)
    courier: Mapped[Courier] = mapped_column(str_enum(Courier))
    fee: Mapped[Decimal] = mapped_column(Money, default=0)
    cod_amount: Mapped[Decimal] = mapped_column(Money, default=0)
    tracking_no: Mapped[str] = mapped_column(String(64))
    tracking_url: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(32), default="booked")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    order: Mapped[Order] = relationship(back_populates="delivery")
