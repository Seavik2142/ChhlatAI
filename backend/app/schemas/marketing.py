from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.base import ORM


class BroadcastIn(BaseModel):
    title: str
    message: str
    audience: str = Field(default="all", pattern="^(all|vip|buyers)$")
    personalize: bool = True


class BroadcastOut(ORM):
    id: int
    title: str
    message: str
    audience: str
    personalize: bool
    status: str
    sent_count: int
    sent_at: datetime | None
    created_at: datetime


class NotificationOut(ORM):
    id: int
    kind: str
    title: str
    body: str
    conversation_id: int | None
    is_read: bool
    created_at: datetime


class AdminNotificationOut(BaseModel):
    id: int
    kind: str
    title: str
    body: str
    shop_id: int | None = None
    shop_name: str | None = None
    conversation_id: int | None = None
    is_read: bool = False
    created_at: datetime
    link: str | None = None


class AnnouncementIn(BaseModel):
    title: str
    body: str
    audience: str = Field(default="all", pattern="^(all|owners|staff)$")
    category: str = Field(default="update", pattern="^(feature|maintenance|important|update|security)$")
    channels: str = Field(default="banner,telegram")
    is_active: bool = True
    pinned: bool = False


class AnnouncementUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    audience: str | None = Field(default=None, pattern="^(all|owners|staff)$")
    category: str | None = Field(default=None, pattern="^(feature|maintenance|important|update|security)$")
    channels: str | None = None
    is_active: bool | None = None
    pinned: bool | None = None


class AnnouncementOut(ORM):
    id: int
    title: str
    body: str
    audience: str
    category: str = "update"
    channels: str = "banner,telegram"
    is_active: bool = True
    pinned: bool = False
    created_at: datetime


class ErrorLogOut(ORM):
    id: int
    level: str
    source: str
    message: str
    context: dict[str, Any]
    shop_id: int | None
    created_at: datetime


class AISettings(BaseModel):
    model: str
    global_instructions: str
    handoff_on_discount: bool = True
    max_ai_replies_per_conversation: int = 30


class AuditLogOut(ORM):
    id: int
    actor_id: int | None
    actor_email: str
    action: str
    status: str = "success"
    details: str
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime


class SecuritySettings(BaseModel):
    session_timeout_minutes: int = 120
    enforce_2fa: bool = False
    max_login_attempts: int = 5
    password_min_length: int = 8
    require_special_char: bool = True
    require_number: bool = True
    require_uppercase: bool = True
    ip_allowlist: list[str] = Field(default_factory=list)
    allow_admin_registration: bool = False
    auto_backup_enabled: bool = True
    ssl_enforced: bool = True


class SystemDiagnosticsOut(BaseModel):
    database: dict[str, Any]
    redis: dict[str, Any]
    server: dict[str, Any]
    metrics: dict[str, Any]


class AdminTelegramBotStatusOut(BaseModel):
    configured: bool
    bot_username: str
    bot_token_present: bool
    webhook_url: str
    chat_ids: list[str]
    notify_new_users: bool
    notify_audit_trail: bool
    notify_health_alerts: bool


class AdminTelegramBotConfigIn(BaseModel):
    chat_ids: list[str] | None = None
    notify_new_users: bool = True
    notify_audit_trail: bool = True
    notify_health_alerts: bool = True


class AdminTelegramSendTestIn(BaseModel):
    kind: str = "new_user"  # "new_user" | "audit" | "health"

