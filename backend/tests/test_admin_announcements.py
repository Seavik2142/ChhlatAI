"""Tests for Admin Announcements endpoints (list, create, update, toggle-active, broadcast, delete)."""

from tests.conftest import auth


def get_admin_token(client) -> str:
    r = client.post("/api/v1/auth/login", json={"email": "admin@test.kh", "password": "Admin@12345"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_announcements_full_lifecycle(client):
    admin_token = get_admin_token(client)
    h = auth(admin_token)

    # 1. List announcements
    r = client.get("/api/v1/admin/announcements", headers=h)
    assert r.status_code == 200
    initial_announcements = r.json()
    assert isinstance(initial_announcements, list)

    # 2. Create a new announcement
    payload = {
        "title": "Scheduled Server Upgrade & Database Maintenance",
        "body": "System maintenance will occur this Sunday from 02:00 AM to 03:00 AM ICT.",
        "audience": "all",
        "category": "maintenance",
        "channels": "banner,telegram",
        "is_active": True,
        "pinned": True,
    }
    r = client.post("/api/v1/admin/announcements", headers=h, json=payload)
    assert r.status_code == 201, r.text
    created = r.json()
    assert created["title"] == payload["title"]
    assert created["category"] == "maintenance"
    assert created["channels"] == "banner,telegram"
    assert created["pinned"] is True
    assert created["is_active"] is True
    ann_id = created["id"]

    # 3. Update announcement
    update_payload = {
        "title": "Updated: Scheduled Server Upgrade (02:00 - 02:30 AM)",
        "pinned": False,
    }
    r = client.put(f"/api/v1/admin/announcements/{ann_id}", headers=h, json=update_payload)
    assert r.status_code == 200, r.text
    updated = r.json()
    assert updated["title"] == "Updated: Scheduled Server Upgrade (02:00 - 02:30 AM)"
    assert updated["pinned"] is False

    # 4. Toggle active state
    r = client.post(f"/api/v1/admin/announcements/{ann_id}/toggle-active", headers=h)
    assert r.status_code == 200
    assert r.json()["is_active"] is False

    # Toggle back to active
    r = client.post(f"/api/v1/admin/announcements/{ann_id}/toggle-active", headers=h)
    assert r.status_code == 200
    assert r.json()["is_active"] is True

    # 5. Broadcast announcement
    r = client.post(f"/api/v1/admin/announcements/{ann_id}/broadcast", headers=h)
    assert r.status_code == 200, r.text
    broadcast_res = r.json()
    assert broadcast_res["success"] is True
    assert broadcast_res["announcement_id"] == ann_id
    assert "banner" in broadcast_res["channels"]

    # 6. Delete announcement
    r = client.delete(f"/api/v1/admin/announcements/{ann_id}", headers=h)
    assert r.status_code == 204

    # Verify deleted
    r = client.get("/api/v1/admin/announcements", headers=h)
    ids = [item["id"] for item in r.json()]
    assert ann_id not in ids
