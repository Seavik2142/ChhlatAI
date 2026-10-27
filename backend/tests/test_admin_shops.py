"""Tests for Admin Shop Management endpoints (list, create, update, delete)."""

from tests.conftest import auth


def get_admin_token(client) -> str:
    r = client.post("/api/v1/auth/login", json={"email": "admin@test.kh", "password": "Admin@12345"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_admin_shop_lifecycle(client):
    admin_token = get_admin_token(client)
    h = auth(admin_token)

    # 1. List shops
    r = client.get("/api/v1/admin/shops", headers=h)
    assert r.status_code == 200
    shops = r.json()
    assert isinstance(shops, list)
    initial_count = len(shops)

    # 2. Create a new shop with an owner
    create_payload = {
        "name": "Angkor Artisans Silk",
        "category": "Fashion & Apparel",
        "phone": "+855 12 888 999",
        "address": "Street 08, Siem Reap",
        "status": "active",
        "ai_enabled": True,
        "ai_instructions": "Be polite and helpful in Khmer and English.",
        "owner_name": "Sophea Chan",
        "owner_email": "sophea.artisans@gmail.com",
        "owner_password": "SilkPassword123!",
    }
    r = client.post("/api/v1/admin/shops", headers=h, json=create_payload)
    assert r.status_code == 201, r.text
    new_shop = r.json()
    assert new_shop["name"] == "Angkor Artisans Silk"
    assert new_shop["category"] == "Fashion & Apparel"
    shop_id = new_shop["id"]

    # 3. Update shop details
    update_payload = {
        "name": "Angkor Artisans & Heritage Silk",
        "category": "Handicrafts & Gifts",
        "phone": "+855 12 999 000",
        "status": "trial",
        "owner_name": "Sophea C. Chan",
    }
    r = client.patch(f"/api/v1/admin/shops/{shop_id}", headers=h, json=update_payload)
    assert r.status_code == 200, r.text
    updated_shop = r.json()
    assert updated_shop["name"] == "Angkor Artisans & Heritage Silk"
    assert updated_shop["category"] == "Handicrafts & Gifts"
    assert updated_shop["status"] == "trial"

    # 4. Verify in list
    r = client.get("/api/v1/admin/shops", headers=h)
    assert r.status_code == 200
    all_shops = r.json()
    matched = next((s for s in all_shops if s["id"] == shop_id), None)
    assert matched is not None
    assert matched["name"] == "Angkor Artisans & Heritage Silk"
    assert matched["owner_name"] == "Sophea C. Chan"

    # 5. Delete shop
    r = client.delete(f"/api/v1/admin/shops/{shop_id}", headers=h)
    assert r.status_code == 204

    # Verify deleted
    r = client.patch(f"/api/v1/admin/shops/{shop_id}", headers=h, json={"name": "Ghost Shop"})
    assert r.status_code == 404

