from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models import (
    ConversationMode,
    Courier,
    MessageKind,
    OrderStatus,
    Platform,
    Sender,
    Sentiment,
    SlipStatus,
)
from app.schemas.base import ORM
from app.schemas.catalog import ProductOut


class CustomerOut(ORM):
    id: int
    name: str
    platform: Platform
    phone: str | None
    address: str | None
    is_vip: bool
    loyalty_points: int
    total_spent: float
    orders_count: int
    created_at: datetime


class MessageOut(ORM):
    id: int
    sender: Sender
    staff_name: str | None = None
    kind: MessageKind
    body: str
    attachment_url: str | None
    meta: dict[str, Any]
    created_at: datetime


class ConversationSummary(BaseModel):
    id: int
    customer: CustomerOut
    platform: Platform
    mode: ConversationMode
    sentiment: Sentiment
    high_priority: bool
    unread_count: int
    last_message_preview: str
    last_message_at: datetime
    assigned_staff_id: int | None
    assigned_staff_name: str | None


class OrderItemOut(ORM):
    id: int
    product_id: int | None
    name: str
    quantity: int
    unit_price: float


class SlipOut(ORM):
    id: int
    image_url: str | None
    bank: str | None
    amount: float | None
    receiver: str | None
    reference: str | None
    paid_time: str | None
    confidence: float
    status: SlipStatus
    checks: dict[str, Any]
    created_at: datetime


class DeliveryOut(ORM):
    id: int
    courier: Courier
    fee: float
    cod_amount: float
    tracking_no: str
    tracking_url: str
    status: str
    created_at: datetime


class OrderOut(ORM):
    id: int
    invoice_no: str
    status: OrderStatus
    customer: CustomerOut
    conversation_id: int | None
    subtotal: float
    delivery_fee: float
    total: float
    delivery_zone: str | None
    delivery_address: str | None
    created_by_ai: bool
    staff_id: int | None
    payment_provider: str | None
    bank_ref: str | None
    paid_at: datetime | None
    confirmed_at: datetime | None
    invoice_url: str | None = None
    created_at: datetime
    items: list[OrderItemOut]
    slips: list[SlipOut]
    delivery: DeliveryOut | None


class ConversationDetail(ConversationSummary):
    messages: list[MessageOut]
    ai_analysis: dict[str, Any]
    recommended_products: list[ProductOut]
    orders: list[OrderOut]
    reply_route: str


class StaffMessageIn(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class SuggestIn(BaseModel):
    instruction: str = ""


class SimulateInboundIn(BaseModel):
    """Dev helper: pretend a customer messaged the shop from one of the apps."""

    platform: Platform = Platform.telegram
    external_user_id: str
    name: str
    text: str = ""


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)


class OrderIn(BaseModel):
    conversation_id: int
    items: list[OrderItemIn] = Field(min_length=1)
    delivery_zone: str = "phnom_penh"
    delivery_address: str | None = None


class OrderUpdate(BaseModel):
    items: list[OrderItemIn] | None = None
    delivery_zone: str | None = None
    delivery_address: str | None = None
    status: OrderStatus | None = None


class DeliveryIn(BaseModel):
    courier: Courier
    cash_on_delivery: bool = False
