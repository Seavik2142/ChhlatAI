from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models import (
    PaymentProviderType,
    Platform,
    ShopStatus,
)
from app.schemas.base import ORM


class PlanOut(ORM):
    id: int
    code: str
    name: str
    price_monthly: float
    ai_replies_limit: int
    staff_seats: int
    channels_limit: int
    features: list[str]
    shops_count: int = 0
    is_current: bool = False


class PlanIn(BaseModel):
    code: str
    name: str
    price_monthly: float
    ai_replies_limit: int
    staff_seats: int
    channels_limit: int
    features: list[str] = []


class ShopPlanChangeIn(BaseModel):
    plan_id: int
    payment_method: str = "ABA KHQR"
    coupon_code: str | None = None
    reference: str | None = None
    billing_cycle: str = "monthly"


class ShopOut(ORM):
    id: int
    name: str
    slug: str
    category: str
    status: ShopStatus
    plan: PlanOut | None
    phone: str | None
    address: str | None
    ai_enabled: bool
    ai_instructions: str
    low_stock_threshold: int
    telegram_alert_chat_id: str | None
    delivery_fees: dict[str, Any]
    vip_spend_threshold: float
    ai_replies_used: int = 0  # filled from ai_usage for the current month
    created_at: datetime


class ShopUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    phone: str | None = None
    address: str | None = None
    ai_enabled: bool | None = None
    ai_instructions: str | None = None
    low_stock_threshold: int | None = None
    telegram_alert_chat_id: str | None = None
    delivery_fees: dict[str, float] | None = None
    vip_spend_threshold: float | None = None


class AdminShopOut(ShopOut):
    owner_name: str | None = None
    owner_email: str | None = None
    staff_count: int = 0
    orders_count: int = 0
    revenue: float = 0
    channels: list[str] = []
    messages_count: int = 0
    next_bill: str | None = None
    avatar_bg: str | None = None
    initials: str | None = None


class AdminShopCreate(BaseModel):
    name: str
    category: str = "General"
    slug: str | None = None
    phone: str | None = None
    address: str | None = None
    plan_id: int | None = None
    status: ShopStatus = ShopStatus.active
    ai_enabled: bool = True
    ai_instructions: str = ""
    owner_name: str | None = None
    owner_email: str | None = None
    owner_password: str | None = None


class AdminShopUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    status: ShopStatus | None = None
    plan_id: int | None = None
    phone: str | None = None
    address: str | None = None
    ai_enabled: bool | None = None
    ai_instructions: str | None = None
    owner_name: str | None = None
    owner_email: str | None = None


class ChannelOut(ORM):
    id: int
    platform: Platform
    name: str
    external_id: str | None
    is_connected: bool
    has_token: bool = False
    token_expires_at: datetime | None = None
    meta_info: dict[str, Any] = {}


class ChannelIn(BaseModel):
    platform: Platform
    name: str
    external_id: str | None = None
    access_token: str | None = None
    meta_info: dict[str, Any] = {}


class OAuthAuthorizeOut(BaseModel):
    platform: Platform
    authorization_url: str
    is_sandbox: bool
    scopes: list[str]
    app_id: str | None = None


class OAuthCredentialsOut(BaseModel):
    meta_app_id: str | None = None
    has_meta_app_secret: bool = False
    tiktok_client_key: str | None = None
    has_tiktok_client_secret: bool = False
    meta_redirect_uri: str | None = None
    tiktok_redirect_uri: str | None = None
    telegram_bot_username: str | None = None
    has_telegram_bot_token: bool = False
    telegram_redirect_uri: str | None = None


class OAuthCredentialsIn(BaseModel):
    meta_app_id: str | None = None
    meta_app_secret: str | None = None
    tiktok_client_key: str | None = None
    tiktok_client_secret: str | None = None
    telegram_bot_token: str | None = None
    telegram_bot_username: str | None = None
    telegram_redirect_uri: str | None = None


class OAuthExchangeIn(BaseModel):
    platform: Platform
    code: str | None = None
    access_token: str | None = None
    state: str | None = None
    redirect_uri: str | None = None


class DiscoveredPageOut(BaseModel):
    id: str
    name: str
    category: str | None = None
    avatar_url: str | None = None
    access_token: str
    is_already_connected: bool = False
    connected_channel_id: int | None = None
    scopes: list[str] = []
    meta: dict[str, Any] = {}


class OAuthExchangeOut(BaseModel):
    platform: Platform
    user_name: str | None = None
    user_avatar: str | None = None
    pages: list[DiscoveredPageOut] = []
    is_sandbox: bool = False


class OAuthLinkIn(BaseModel):
    platform: Platform
    external_id: str
    name: str
    access_token: str
    meta_info: dict[str, Any] = {}


class TelegramVerifyIn(BaseModel):
    bot_token: str


class TelegramVerifyOut(BaseModel):
    ok: bool
    bot_id: int | None = None
    bot_name: str | None = None
    bot_username: str | None = None
    can_join_groups: bool | None = None
    can_read_all_group_messages: bool | None = None
    supports_inline_queries: bool | None = None
    webhook_registered: bool = False
    webhook_url: str | None = None
    error: str | None = None
    channel: ChannelOut | None = None


class TelegramUserConfigOut(BaseModel):
    has_app_credentials: bool
    api_id_configured: bool
    api_id_hint: str | None = None


class TelegramUserSendCodeIn(BaseModel):
    phone: str
    api_id: str | None = None
    api_hash: str | None = None


class TelegramUserSendCodeOut(BaseModel):
    ok: bool
    phone: str
    phone_code_hash: str | None = None
    message: str | None = None
    error: str | None = None


class TelegramUserVerifyCodeIn(BaseModel):
    phone: str
    code: str
    password: str | None = None
    api_id: str | None = None
    api_hash: str | None = None


class TelegramUserVerifyCodeOut(BaseModel):
    ok: bool
    requires_password: bool = False
    message: str | None = None
    error: str | None = None
    channel: ChannelOut | None = None
    user: dict[str, Any] | None = None


class ChannelTestResult(BaseModel):
    ok: bool
    platform: Platform
    channel_id: int
    status: str
    latency_ms: int = 0
    details: dict[str, Any] = {}



class PaymentProviderOut(BaseModel):
    id: int
    provider: PaymentProviderType
    environment: str
    is_connected: bool
    use_for_invoices: bool
    merchant_name: str | None
    account_id: str | None
    secret_masked: str
    methods: list[str]
    token_expires_at: datetime | None


class PaymentProviderIn(BaseModel):
    environment: str = "sandbox"
    merchant_name: str | None = None
    account_id: str | None = None
    secret: str | None = None
    use_for_invoices: bool = True


class KHQRPreviewIn(BaseModel):
    provider: PaymentProviderType = PaymentProviderType.bakong
    merchant_name: str | None = None
    account_id: str | None = None
    amount: float = 10.0
    currency: str = "USD"
    bill_number: str = "INV-TEST"


class KHQRPreviewOut(BaseModel):
    provider: str
    merchant_name: str
    account_id: str
    amount: float
    currency: str
    bill_number: str
    khqr: str
    md5: str
    crc16: str
    deep_links: dict[str, str]
    image_data_uri: str
    tags: list[dict[str, Any]]
