"""Test that when an order is paid, AI automatically generates and sends the invoice receipt image."""

from app.models import OrderStatus
from tests.conftest import auth
from tests.test_flow import register, simulate


def test_ai_sends_invoice_image_upon_payment(client):
    owner = register(client, "Invoice Image Test Shop", "owner@invimage.kh")
    h = auth(owner)

    # 1. Add product and create conversation with order
    prod = client.post("/api/v1/products", headers=h, json={
        "name": "Luxury Silk Face Cream", "price": 25.0, "stock": 10, "description": "High-end moisturizer"
    }).json()

    c = simulate(client, owner, "I want to buy 1 Luxury Silk Face Cream to BKK1", user="tg-inv-test", name="Sokha")
    assert len(c["orders"]) == 1
    order = c["orders"][0]
    assert order["status"] == "awaiting_payment"

    # 2. Simulate bank confirmation / customer payment
    r = client.post(f"/api/v1/orders/{order['id']}/simulate-bank-confirmation", headers=h)
    assert r.status_code == 200, r.text
    paid_order = r.json()
    assert paid_order["status"] == "paid"
    assert paid_order["invoice_url"] is not None
    assert "/uploads/" in paid_order["invoice_url"]

    # 3. Verify conversation received AI invoice message with image attachment
    c_updated = client.get(f"/api/v1/conversations/{c['id']}", headers=h).json()
    invoice_msg = next((m for m in reversed(c_updated["messages"]) if m["sender"] == "ai" and m.get("attachment_url")), None)
    assert invoice_msg is not None, "AI should have sent a message with the invoice image attachment"
    assert invoice_msg["kind"] == "invoice"
    assert invoice_msg["attachment_url"] == paid_order["invoice_url"]
    assert invoice_msg["meta"].get("is_paid_invoice") is True
    assert invoice_msg["meta"].get("order_id") == order["id"]
    assert invoice_msg["meta"].get("invoice_no") == order["invoice_no"]
    assert "Paid Invoice Receipt" in invoice_msg["body"] or "វិក្កយបត្របង់ប្រាក់រួច" in invoice_msg["body"]

    # 4. Verify public invoice-image endpoint serves valid PNG bytes
    r_img = client.get(f"/api/v1/orders/{order['id']}/invoice-image", headers=h)
    assert r_img.status_code == 200
    assert r_img.headers["content-type"] == "image/png"
    assert r_img.content.startswith(b"\x89PNG\r\n\x1a\n")
    assert len(r_img.content) > 1000
