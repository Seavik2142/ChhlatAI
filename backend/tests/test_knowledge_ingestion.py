"""Tests for Zero-Friction Knowledge Base Ingestion."""

import io
import uuid
from unittest.mock import patch

from app.workers.celery_app import celery_app
from tests.conftest import auth

# Execute Celery tasks synchronously in test environment
celery_app.conf.task_always_eager = True
celery_app.conf.task_eager_propagates = True



def get_seller_token_and_shop(client) -> str:
    # Register a new merchant
    uid = uuid.uuid4().hex[:6]
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Sokha Coffee Owner",
        "email": f"sokha_{uid}@example.kh",
        "password": "Password1!",
        "shop_name": f"Sokha Artisan Coffee {uid}",
        "category": "Cafe & Beverages",
    })
    assert reg.status_code == 201, reg.text
    return reg.json()["access_token"]



def test_upload_csv_knowledge_ingestion(client):
    token = get_seller_token_and_shop(client)
    h = auth(token)

    # 1. Prepare sample menu/pricing CSV
    csv_content = (
        "name,price,details\n"
        "Iced Americano,2.50,Double shot espresso with cold water and ice\n"
        "Caramel Macchiato,3.50,Espresso with steamed milk and vanilla syrup topped with caramel\n"
        "Green Tea Latte,3.00,Japanese matcha powder whisked with fresh milk\n"
        ",,\n"
        "topic,content,\n"
        "shipping,Free delivery in Phnom Penh for orders over $10. Province delivery $2 flat.\n"
        "payment,We accept Bakong KHQR, ABA PayWay, and Cash on Delivery.\n"
    )

    # 2. Upload CSV
    files = {
        "file": ("menu_price_list.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")
    }
    r = client.post("/api/v1/knowledge/upload", headers=h, files=files)
    assert r.status_code == 202, r.text
    data = r.json()
    assert "task_id" in data
    assert "kb_id" in data
    task_id = data["task_id"]
    kb_id = data["kb_id"]

    # 3. Check status
    sr = client.get(f"/api/v1/knowledge/status/{task_id}", headers=h)
    assert sr.status_code == 200, sr.text
    status_data = sr.json()
    assert status_data["task_id"] == task_id
    assert status_data["kb_id"] == kb_id
    assert status_data["source_type"] == "document"
    assert status_data["file_name"] == "menu_price_list.csv"
    assert status_data["status"] == "processed"
    assert "preview" in status_data
    preview = status_data["preview"]
    assert len(preview["products"]) >= 3
    assert len(preview["policies"]) >= 2
    assert preview["products"][0]["name"] == "Iced Americano"

    # 4. Verify products were synced directly into store products
    pr = client.get("/api/v1/products", headers=h)
    assert pr.status_code == 200
    products = pr.json()
    product_names = [p["name"] for p in products]
    assert "Iced Americano" in product_names
    assert "Caramel Macchiato" in product_names

    # 5. Verify records list
    lr = client.get("/api/v1/knowledge/records", headers=h)
    assert lr.status_code == 200
    records = lr.json()
    assert any(rec["id"] == kb_id for rec in records)


def test_upload_file_validation(client):
    token = get_seller_token_and_shop(client)
    h = auth(token)

    # 1. Unsupported MIME type
    bad_file = {"file": ("malware.exe", io.BytesIO(b"binary"), "application/x-msdownload")}
    r = client.post("/api/v1/knowledge/upload", headers=h, files=bad_file)
    assert r.status_code == 415

    # 2. File size limit (>10MB)
    large_data = b"0" * (10 * 1024 * 1024 + 50)
    oversized = {"file": ("big_flyer.jpg", io.BytesIO(large_data), "image/jpeg")}
    r = client.post("/api/v1/knowledge/upload", headers=h, files=oversized)
    assert r.status_code == 413


def test_multimodal_extraction_mock(client):
    token = get_seller_token_and_shop(client)
    h = auth(token)

    mock_ai_response = {
        "products": [
            {"name": "Hydra Glow Serum", "price": 19.99, "details": "Niacinamide 10% + Zinc 1%"},
            {"name": "UV Barrier Sunscreen", "price": 14.50, "details": "Broad spectrum SPF50+ PA++++"},
        ],
        "policies": [
            {"topic": "warranty", "content": "100% money back guarantee if unsealed within 7 days."},
            {"topic": "shipping", "content": "Grab delivery within 1 hour in Phnom Penh for $2.80."},
        ],
    }

    dummy_image = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100
    files = {"file": ("skincare_flyer.jpg", io.BytesIO(dummy_image), "image/jpeg")}

    with patch("app.services.knowledge_extraction.call_gemini_multimodal", return_value=mock_ai_response), \
         patch("app.services.knowledge_extraction._resolve_gemini_key", return_value="fake-test-key"):
        r = client.post("/api/v1/knowledge/upload", headers=h, files=files)
        assert r.status_code == 202
        task_id = r.json()["task_id"]

        sr = client.get(f"/api/v1/knowledge/status/{task_id}", headers=h)
        assert sr.status_code == 200
        data = sr.json()
        assert data["status"] == "processed"
        assert len(data["preview"]["products"]) == 2
        assert data["preview"]["products"][0]["name"] == "Hydra Glow Serum"
        assert len(data["preview"]["policies"]) == 2


def test_codecraft_multimodal_extraction(client):
    token = get_seller_token_and_shop(client)
    h = auth(token)

    mock_ai_response = {
        "products": [
            {"name": "CodeCraft Espresso", "price": 2.50, "details": "Arabica beans"},
        ],
        "policies": [
            {"topic": "delivery", "content": "Free delivery over $10"},
        ],
    }

    dummy_image = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100
    files = {"file": ("cafe_menu.jpg", io.BytesIO(dummy_image), "image/jpeg")}

    with patch("app.services.knowledge_extraction.call_codecraft_multimodal", return_value=mock_ai_response), \
         patch("app.services.knowledge_extraction._resolve_ai_credentials", return_value={"codecraft_key": "cc_test_key", "codecraft_base_url": "https://codecraftapi.com/v1", "codecraft_model": "gemini-3.8-flash", "gemini_key": ""}):
        r = client.post("/api/v1/knowledge/upload", headers=h, files=files)
        assert r.status_code == 202
        task_id = r.json()["task_id"]

        sr = client.get(f"/api/v1/knowledge/status/{task_id}", headers=h)
        assert sr.status_code == 200
        data = sr.json()
        assert data["status"] == "processed"
        assert len(data["preview"]["products"]) == 1
        assert data["preview"]["products"][0]["name"] == "CodeCraft Espresso"
