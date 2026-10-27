"""Tests for Dynamic Subscription Tiers & Owner Plan Switch lifecycle."""

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import Plan, Role, Shop, ShopStatus, User
from tests.conftest import auth


def get_tokens(client):
    with SessionLocal() as db:
        free_plan = db.query(Plan).filter_by(code="free").first()
        shop = db.query(Shop).filter_by(slug="test-shop-tiers").first()
        if not shop:
            shop = Shop(
                name="Tier Test Boutique",
                slug="test-shop-tiers",
                status=ShopStatus.active,
                plan_id=free_plan.id if free_plan else None,
            )
            db.add(shop)
            db.commit()
            db.refresh(shop)

        owner = db.query(User).filter_by(email="owner.tier@test.kh").first()
        if not owner:
            owner = User(
                email="owner.tier@test.kh",
                password_hash=hash_password("Owner@12345"),
                full_name="Boutique Owner",
                role=Role.owner,
                shop_id=shop.id,
            )
            db.add(owner)
            db.commit()

    admin_res = client.post("/api/v1/auth/login", json={"email": "admin@test.kh", "password": "Admin@12345"})
    assert admin_res.status_code == 200, admin_res.text
    admin_token = admin_res.json()["access_token"]

    owner_res = client.post("/api/v1/auth/login", json={"email": "owner.tier@test.kh", "password": "Owner@12345"})
    assert owner_res.status_code == 200, owner_res.text
    owner_token = owner_res.json()["access_token"]

    return admin_token, owner_token


def test_subscription_tier_control_and_owner_switch(client):
    admin_token, owner_token = get_tokens(client)
    h_admin = auth(admin_token)
    h_owner = auth(owner_token)

    # 1. Super Admin adds a NEW pricing tier "growth"
    new_tier_data = {
        "code": "growth",
        "name": "Growth Pro Plus",
        "price_monthly": 49.0,
        "ai_replies_limit": 25000,
        "staff_seats": 10,
        "channels_limit": 8,
        "features": ["All 4 Channels", "25,000 AI replies", "10 staff seats", "VIP Support"],
    }
    r = client.post("/api/v1/admin/plans", headers=h_admin, json=new_tier_data)
    assert r.status_code == 201, r.text
    growth_plan = r.json()
    assert growth_plan["code"] == "growth"
    assert growth_plan["name"] == "Growth Pro Plus"
    growth_id = growth_plan["id"]

    # 2. Shop Owner views ALL available plans
    r = client.get("/api/v1/shop/plans", headers=h_owner)
    assert r.status_code == 200, r.text
    plans = r.json()
    tier_codes = [p["code"] for p in plans]
    assert "growth" in tier_codes
    assert "free" in tier_codes
    assert "pro" in tier_codes

    growth_in_list = next(p for p in plans if p["code"] == "growth")
    assert growth_in_list["price_monthly"] == 49.0
    assert growth_in_list["ai_replies_limit"] == 25000

    # 3. Shop Owner upgrades to the newly added "growth" tier with coupon
    change_payload = {
        "plan_id": growth_id,
        "payment_method": "ABA KHQR",
        "coupon_code": "WELCOME50",
        "reference": "KHQR-TEST-GROWTH-001",
    }
    r = client.post("/api/v1/shop/change-plan", headers=h_owner, json=change_payload)
    assert r.status_code == 200, r.text
    updated_shop = r.json()
    assert updated_shop["plan"]["id"] == growth_id
    assert updated_shop["plan"]["code"] == "growth"

    # 4. Check that the invoice appears in the owner's billing history
    r = client.get("/api/v1/shop/subscription/invoices", headers=h_owner)
    assert r.status_code == 200, r.text
    invoices = r.json()
    assert len(invoices) > 0
    latest_inv = invoices[0]
    assert latest_inv["plan"] == "Growth Pro Plus"
    assert latest_inv["status"] == "Paid"
    # WELCOME50 applies 50% discount on $49.00 -> $24.50
    assert latest_inv["amount"] == "$24.50"
    assert latest_inv["coupon_code"] == "WELCOME50"

    # 5. Shop Owner switches to Free tier
    free_plan = next(p for p in plans if p["code"] == "free")
    free_change_payload = {
        "plan_id": free_plan["id"],
        "payment_method": "Free / Instant",
    }
    r = client.post("/api/v1/shop/change-plan", headers=h_owner, json=free_change_payload)
    assert r.status_code == 200, r.text
    downgraded_shop = r.json()
    assert downgraded_shop["plan"]["code"] == "free"
