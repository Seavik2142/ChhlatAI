from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

from app.models import (
    Role,
    ShopStatus,
)
from app.schemas.base import ORM


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RegisterIn(BaseModel):
    shop_name: str = Field(min_length=2, max_length=120)
    category: str = Field(default="General", max_length=64)
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = Field(default=None, max_length=32)
    plan_code: str = Field(default="free", max_length=32)


class UserOut(ORM):
    id: int
    email: str
    full_name: str
    role: Role
    shop_id: int | None
    is_active: bool
    is_online: bool
    commission_rate: float


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class StaffIn(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)
    commission_rate: float = 0


class StaffUpdate(BaseModel):
    full_name: str | None = None
    commission_rate: float | None = None
    is_active: bool | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    is_online: bool | None = None
    current_password: str | None = None
    password: str | None = Field(default=None, min_length=6)


class AdminUserOut(ORM):
    id: int
    email: str
    full_name: str
    role: Role
    shop_id: int | None
    shop_name: str | None = None
    shop_status: str | None = None
    plan_id: int | None = None
    plan_name: str | None = None
    plan_code: str | None = None
    is_active: bool
    is_online: bool
    commission_rate: float
    created_at: datetime | None = None


class AdminUserCreateIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6)
    role: Role = Role.staff
    shop_id: int | None = None
    is_active: bool = True
    commission_rate: float = 0


class AdminUserUpdateIn(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    role: Role | None = None
    shop_id: int | None = None
    plan_id: int | None = None
    shop_status: ShopStatus | None = None
    is_active: bool | None = None
    commission_rate: float | None = None


class AdminGrantSubscriptionIn(BaseModel):
    plan_id: int
    status: ShopStatus = ShopStatus.active
    notes: str | None = None


class AdminResetPasswordIn(BaseModel):
    new_password: str = Field(min_length=6)


