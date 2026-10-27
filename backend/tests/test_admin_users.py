"""Tests for Admin User Management endpoints (list, create, update, password reset, delete)."""

from tests.conftest import auth


def get_admin_token(client) -> str:
    r = client.post("/api/v1/auth/login", json={"email": "admin@test.kh", "password": "Admin@12345"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_admin_user_lifecycle(client):
    admin_token = get_admin_token(client)
    h = auth(admin_token)

    # 1. List users
    r = client.get("/api/v1/admin/users", headers=h)
    assert r.status_code == 200
    users = r.json()
    assert any(u["email"] == "admin@test.kh" for u in users)

    # 2. Create a new user with Gmail and password
    create_payload = {
        "full_name": "Test Manager",
        "email": "manager.test@gmail.com",
        "password": "InitialPassword123!",
        "role": "staff",
        "is_active": True,
        "commission_rate": 2.5,
    }
    r = client.post("/api/v1/admin/users", headers=h, json=create_payload)
    assert r.status_code == 201, r.text
    new_user = r.json()
    assert new_user["email"] == "manager.test@gmail.com"
    assert new_user["full_name"] == "Test Manager"
    assert new_user["role"] == "staff"
    assert new_user["commission_rate"] == 2.5
    user_id = new_user["id"]

    # 3. Test logging in with the initial password
    login_res = client.post("/api/v1/auth/login", json={
        "email": "manager.test@gmail.com",
        "password": "InitialPassword123!",
    })
    assert login_res.status_code == 200

    # 4. Reset / Change user password as Admin
    reset_payload = {"new_password": "NewSecretPassword456!"}
    r = client.post(f"/api/v1/admin/users/{user_id}/reset-password", headers=h, json=reset_payload)
    assert r.status_code == 200, r.text
    assert r.json()["ok"] is True

    # Old password should fail now
    fail_res = client.post("/api/v1/auth/login", json={
        "email": "manager.test@gmail.com",
        "password": "InitialPassword123!",
    })
    assert fail_res.status_code == 401

    # New password should succeed
    succ_res = client.post("/api/v1/auth/login", json={
        "email": "manager.test@gmail.com",
        "password": "NewSecretPassword456!",
    })
    assert succ_res.status_code == 200

    # 5. Update user information (full_name, email, role, active status)
    patch_payload = {
        "full_name": "Test Manager Updated",
        "email": "manager.updated@gmail.com",
        "is_active": True,
        "commission_rate": 5.0,
    }
    r = client.patch(f"/api/v1/admin/users/{user_id}", headers=h, json=patch_payload)
    assert r.status_code == 200, r.text
    updated = r.json()
    assert updated["full_name"] == "Test Manager Updated"
    assert updated["email"] == "manager.updated@gmail.com"
    assert updated["commission_rate"] == 5.0

    # 6. Search users by query
    r = client.get("/api/v1/admin/users?q=manager.updated", headers=h)
    assert r.status_code == 200
    search_results = r.json()
    assert len(search_results) == 1
    assert search_results[0]["id"] == user_id

    # 7. Check platform_stats includes user counts
    r = client.get("/api/v1/admin/stats", headers=h)
    assert r.status_code == 200
    stats = r.json()
    assert "total_users" in stats
    assert stats["total_users"] >= 2

    # 8. Delete user
    r = client.delete(f"/api/v1/admin/users/{user_id}", headers=h)
    assert r.status_code == 204

    # Verification: user no longer exists
    r = client.get(f"/api/v1/admin/users/{user_id}", headers=h)
    assert r.status_code == 404


def test_admin_notifications_lifecycle(client):
    from app.core.database import SessionLocal
    from app.models import Notification
    from sqlalchemy import select

    admin_token = get_admin_token(client)
    h = auth(admin_token)

    # Seed notification for testing
    with SessionLocal() as db:
        db.query(Notification).delete()
        db.add(Notification(kind="system", title="Test Alert", body="Backend operational", is_read=False))
        db.commit()

    # 1. Fetch admin notifications
    r = client.get("/api/v1/admin/notifications", headers=h)
    assert r.status_code == 200, r.text
    notes = r.json()
    assert len(notes) > 0
    note_id = notes[0]["id"]

    # 2. Mark single notification as read
    r = client.patch(f"/api/v1/admin/notifications/{note_id}/read", headers=h)
    assert r.status_code == 200, r.text
    assert r.json()["is_read"] is True

    # 3. Mark all as read
    r = client.post("/api/v1/admin/notifications/read-all", headers=h)
    assert r.status_code == 204

    # Verify all are read
    r = client.get("/api/v1/admin/notifications", headers=h)
    assert all(n["is_read"] is True for n in r.json())

    # 4. Clear all notifications and verify it stays empty
    r = client.delete("/api/v1/admin/notifications", headers=h)
    assert r.status_code == 204
    r = client.get("/api/v1/admin/notifications", headers=h)
    assert r.status_code == 200
    assert len(r.json()) == 0


def test_admin_plans_and_payments_lifecycle(client):
    admin_token = get_admin_token(client)
    h = auth(admin_token)

    # 1. Create a custom pricing tier
    plan_data = {
        "code": "starter_plus",
        "name": "Starter Plus",
        "price_monthly": 15.0,
        "ai_replies_limit": 3000,
        "staff_seats": 2,
        "channels_limit": 2,
        "features": ["Telegram & Messenger", "3,000 AI replies", "Bakong KHQR"],
    }
    r = client.post("/api/v1/admin/plans", headers=h, json=plan_data)
    assert r.status_code == 201, r.text
    created_plan = r.json()
    assert created_plan["code"] == "starter_plus"
    plan_id = created_plan["id"]

    # 2. Update the pricing tier
    update_data = {
        "code": "starter_plus",
        "name": "Starter Plus v2",
        "price_monthly": 18.0,
        "ai_replies_limit": 4000,
        "staff_seats": 3,
        "channels_limit": 2,
        "features": ["Telegram & Messenger", "4,000 AI replies", "Bakong KHQR"],
    }
    r = client.put(f"/api/v1/admin/plans/{plan_id}", headers=h, json=update_data)
    assert r.status_code == 200
    assert r.json()["name"] == "Starter Plus v2"
    assert r.json()["price_monthly"] == 18.0

    # 3. Create a payment / invoice
    payment_data = {
        "id": "INV-TEST-9999",
        "shop": "Phnom Penh Mart",
        "plan": "Starter Plus v2",
        "method": "ABA KHQR",
        "amount": "$18.00",
        "status": "Paid",
        "reference": "ABA-TEST-REF-123",
    }
    r = client.post("/api/v1/admin/payments", headers=h, json=payment_data)
    assert r.status_code == 201, r.text
    created_payment = r.json()
    assert created_payment["id"] == "INV-TEST-9999"

    # 4. Update payment status to Overdue
    r = client.patch(f"/api/v1/admin/payments/INV-TEST-9999", headers=h, json={"status": "Overdue"})
    assert r.status_code == 200
    assert r.json()["status"] == "Overdue"

    # 5. Delete payment
    r = client.delete("/api/v1/admin/payments/INV-TEST-9999", headers=h)
    assert r.status_code == 200
    assert r.json()["success"] is True

    # 6. Delete plan
    r = client.delete(f"/api/v1/admin/plans/{plan_id}", headers=h)
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_admin_grant_subscription_tier_to_user(client):
    admin_token = get_admin_token(client)
    h = auth(admin_token)

    # 1. Create a user
    user_payload = {
        "full_name": "Tier Recipient",
        "email": "recipient.tier@test.kh",
        "password": "Password@123",
        "role": "owner",
        "is_active": True,
        "commission_rate": 0,
    }
    r = client.post("/api/v1/admin/users", headers=h, json=user_payload)
    assert r.status_code == 201, r.text
    user = r.json()
    user_id = user["id"]

    # 2. Get available plans
    r = client.get("/api/v1/admin/plans", headers=h)
    assert r.status_code == 200
    plans = r.json()
    pro_plan = next(p for p in plans if p["code"] == "pro")

    # 3. Super Admin directly grants Pro subscription tier to user
    grant_payload = {
        "plan_id": pro_plan["id"],
        "status": "active",
        "notes": "Complimentary VIP tier gifted by Super Admin",
    }
    r = client.post(f"/api/v1/admin/users/{user_id}/grant-subscription", headers=h, json=grant_payload)
    assert r.status_code == 200, r.text
    updated = r.json()
    assert updated["plan_id"] == pro_plan["id"]
    assert updated["plan_name"] == "Pro"
    assert updated["shop_status"] == "active"
    assert updated["shop_name"] is not None

    # 4. Check list_users returns plan details
    r = client.get(f"/api/v1/admin/users?q=recipient.tier", headers=h)
    assert r.status_code == 200
    matched = r.json()
    assert len(matched) == 1
    assert matched[0]["plan_id"] == pro_plan["id"]
    assert matched[0]["plan_code"] == "pro"

