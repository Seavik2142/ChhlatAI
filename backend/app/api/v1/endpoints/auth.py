import re
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import func, select

from app.api.deps import DB, CurrentUser
from app.core import rate_limit
from app.core.config import get_settings
from app.models import AuditLog, Order, OrderStatus, Plan, Role, Shop, ShopStatus, User
from app.schemas import LoginIn, ProfileUpdate, RegisterIn, TokenOut, UserOut
from app.core.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _slugify(db: DB, name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "shop"
    slug, n = base, 1
    while db.scalar(select(Shop.id).where(Shop.slug == slug)):
        n += 1
        slug = f"{base}-{n}"
    return slug


@router.post("/register", response_model=TokenOut, status_code=201)
def register(body: RegisterIn, request: Request, db: DB) -> TokenOut:
    """Sign up a shop owner on the Free or selected plan."""
    # Enforce rate limiting on registration to protect against automated spam/bot abuse
    limit = get_settings().login_rate_limit_per_minute
    client_ip = rate_limit.client_ip(request)
    rate_limit.enforce(f"register:ip:{client_ip}", limit)

    clean_email = body.email.strip().lower()
    clean_shop_name = body.shop_name.strip()
    clean_full_name = body.full_name.strip()
    clean_category = (body.category or "General").strip()
    clean_phone = body.phone.strip() if body.phone else None
    clean_plan_code = (body.plan_code or "free").strip().lower()

    if db.scalar(select(User.id).where(func.lower(User.email) == clean_email)):
        raise HTTPException(409, "An account with this email already exists")

    target_plan = db.scalars(select(Plan).where(Plan.code == clean_plan_code)).first()
    if not target_plan:
        target_plan = db.scalars(select(Plan).where(Plan.code == "free")).first()

    shop = Shop(
        name=clean_shop_name,
        slug=_slugify(db, clean_shop_name),
        category=clean_category,
        phone=clean_phone,
        plan_id=target_plan.id if target_plan else None,
        status=ShopStatus.trial,
    )
    db.add(shop)
    db.flush()

    user = User(
        email=clean_email,
        password_hash=hash_password(body.password),
        full_name=clean_full_name,
        role=Role.owner,
        shop_id=shop.id,
    )
    db.add(user)
    db.flush()

    db.add(AuditLog(
        actor_id=user.id,
        actor_email=user.email,
        action="REGISTER_SUCCESS",
        status="success",
        details=f"New shop '{shop.name}' and owner registered with plan '{target_plan.code if target_plan else 'free'}'",
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent")[:255] if request.headers.get("user-agent") else None,
    ))

    db.commit()

    from app.services.admin_bot import notify_new_user_registered
    notify_new_user_registered(
        full_name=user.full_name,
        user_email=user.email,
        shop_name=shop.name,
        shop_slug=shop.slug,
        plan_name=target_plan.name if target_plan else "Free",
        phone=shop.phone,
        client_ip=client_ip,
    )

    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, request: Request, db: DB) -> TokenOut:
    # Per IP and per account, so neither password spraying nor targeted guessing scales.
    limit = get_settings().login_rate_limit_per_minute
    client_ip = rate_limit.client_ip(request)
    clean_email = body.email.strip().lower()

    rate_limit.enforce(f"login:ip:{client_ip}", limit * 3)
    rate_limit.enforce(f"login:user:{clean_email}", limit)

    user = db.scalars(select(User).where(func.lower(User.email) == clean_email)).first()
    if not user or not verify_password(body.password, user.password_hash):
        db.add(AuditLog(
            actor_id=user.id if user else None,
            actor_email=clean_email[:255],
            action="LOGIN_FAILED",
            status="failure",
            details="Invalid credentials provided",
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent")[:255] if request.headers.get("user-agent") else None,
        ))
        db.commit()
        raise HTTPException(401, "Wrong email or password")

    if not user.is_active:
        db.add(AuditLog(
            actor_id=user.id,
            actor_email=clean_email[:255],
            action="LOGIN_BLOCKED",
            status="failure",
            details="Account is inactive/disabled",
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent")[:255] if request.headers.get("user-agent") else None,
        ))
        db.commit()
        raise HTTPException(403, "This account has been disabled")

    user.is_online = True
    db.add(AuditLog(
        actor_id=user.id,
        actor_email=user.email,
        action="LOGIN_SUCCESS",
        status="success",
        details=f"User logged in ({user.role.value})",
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent")[:255] if request.headers.get("user-agent") else None,
    ))
    db.commit()
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> User:
    return user


@router.patch("/me", response_model=UserOut)
def update_me(body: ProfileUpdate, user: CurrentUser, db: DB, request: Request) -> User:
    if body.email is not None:
        clean_email = body.email.lower().strip()
        if clean_email != user.email.lower():
            if db.scalar(select(User.id).where(func.lower(User.email) == clean_email, User.id != user.id)):
                raise HTTPException(409, "An account with this email/gmail already exists")
            user.email = clean_email
            # Log email change if super admin
            if user.role.value == "super_admin":
                db.add(AuditLog(
                    actor_id=user.id,
                    actor_email=user.email,
                    action="ADMIN_PROFILE_UPDATED",
                    status="success",
                    details=f"Super admin email updated to {clean_email}",
                    ip_address=rate_limit.client_ip(request) if request else None,
                    user_agent=request.headers.get("user-agent")[:255] if request and request.headers.get("user-agent") else None,
                ))
    if body.full_name is not None:
        user.full_name = body.full_name.strip()
    if body.is_online is not None:
        user.is_online = body.is_online
    if body.password:
        if not body.current_password or not verify_password(body.current_password, user.password_hash):
            raise HTTPException(400, "Current password is incorrect. Please verify your current password to proceed.")
        if len(body.password) < 8:
            raise HTTPException(400, "New password must be at least 8 characters long.")
        user.password_hash = hash_password(body.password)
        db.add(AuditLog(
            actor_id=user.id,
            actor_email=user.email,
            action="PASSWORD_UPDATED",
            status="success",
            details="User password updated with verified current password.",
            ip_address=rate_limit.client_ip(request) if request else None,
            user_agent=request.headers.get("user-agent")[:255] if request and request.headers.get("user-agent") else None,
        ))
    db.commit()
    db.refresh(user)
    return user


@router.get("/me/stats")
def my_stats(user: CurrentUser, db: DB) -> dict:
    """Staff panel: my orders & commission this month."""
    done = [OrderStatus.confirmed, OrderStatus.shipped, OrderStatus.delivered]
    month_start = func.date_trunc("month", func.now())
    count, revenue = db.execute(
        select(func.count(Order.id), func.coalesce(func.sum(Order.total), 0))
        .where(Order.staff_id == user.id, Order.status.in_(done), Order.created_at >= month_start)
    ).one()
    revenue = Decimal(revenue)
    return {
        "orders_this_month": count,
        "revenue_this_month": float(revenue),
        "commission_rate": float(user.commission_rate),
        "commission_this_month": float(revenue * user.commission_rate / 100),
    }
