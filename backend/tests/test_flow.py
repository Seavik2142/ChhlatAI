"""End-to-end: chat → AI sale → invoice → slip → review → confirm & print → delivery."""

import io

from app.services.payments import _crc16, build_khqr
from tests.conftest import auth


def register(client, shop: str, email: str) -> str:
    r = client.post("/api/v1/auth/register", json={
        "shop_name": shop, "full_name": "Owner", "email": email, "password": "Password1!"})
    assert r.status_code == 201, r.text
    return r.json()["access_token"]


def simulate(client, token: str, text: str, user: str = "tg-100", name: str = "Dara") -> dict:
    r = client.post("/api/v1/conversations/simulate", headers=auth(token),
                    json={"platform": "telegram", "external_user_id": user, "name": name, "text": text})
    assert r.status_code == 200, r.text
    return r.json()


def test_khqr_crc():
    assert _crc16("123456789") == "29B1"  # CRC-16/CCITT-FALSE check value
    qr = build_khqr("shop@aclb", "GLOW SKIN", 15.5, "INV-1001")
    assert qr.startswith("000201") and ("15.50" in qr or "15.5" in qr) and qr[-8:-4] == "6304"


def test_full_sales_flow(client):
    owner = register(client, "Glow Test", "owner@flow.kh")
    h = auth(owner)

    r = client.post("/api/v1/products", headers=h, json={
        "name": "Acne Clear Serum 30ml", "price": 14, "stock": 6, "description": "Night serum for acne"})
    serum = r.json()
    client.put("/api/v1/shop/payment-providers/bakong", headers=h, json={
        "merchant_name": "GLOW TEST", "account_id": "glow@aclb"})

    # 1. Price question → AI answers and recommends the product.
    c = simulate(client, owner, "How much is the acne serum?")
    assert c["sentiment"] == "interested" and c["mode"] == "ai"
    reply, card = c["messages"][-2:]
    assert reply["sender"] == "ai" and "$14.00" in reply["body"]
    assert card["kind"] == "product_card" and card["meta"]["products"][0]["id"] == serum["id"]
    assert c["recommended_products"][0]["id"] == serum["id"]

    # 2. Customer confirms → AI creates the invoice with a KHQR payload.
    c = simulate(client, owner, "OK I'll take 2 acne serum to BKK1")
    order = c["orders"][0]
    assert order["status"] == "awaiting_payment" and order["total"] == 29.5
    invoice = next(m for m in c["messages"] if m["kind"] == "invoice")
    assert invoice["meta"]["khqr"].startswith("000201")

    # 3. Customer sends a slip. Without vision the AI can't read it → human review.
    r = client.post("/api/v1/conversations/simulate/image", headers=h,
                    data={"external_user_id": "tg-100", "name": "Dara", "platform": "telegram"},
                    files={"file": ("slip.jpg", io.BytesIO(b"\xff\xd8fake"), "image/jpeg")})
    assert r.status_code == 200, r.text
    order = r.json()["orders"][0]
    assert order["status"] == "needs_review" and order["slips"][0]["status"] == "mismatch"

    # Confirm & Print stays disabled until the payment is confirmed.
    assert client.post(f"/api/v1/orders/{order['id']}/confirm", headers=h).status_code == 409

    # 4. Staff approve in Orders & Invoices → paid → Confirm & Print deducts stock.
    r = client.post(f"/api/v1/orders/{order['id']}/review?approve=true", headers=h)
    assert r.json()["status"] == "paid"
    r = client.post(f"/api/v1/orders/{order['id']}/confirm", headers=h)
    assert r.json()["status"] == "confirmed"
    products = client.get("/api/v1/products", headers=h).json()
    assert products[0]["stock"] == 4
    notes = client.get("/api/v1/notifications", headers=h).json()
    assert any(n["kind"] == "low_stock" for n in notes)  # 4 < shop threshold of 5

    # 5. Send to J&T → shipped, tracking link sent, customer stats updated.
    r = client.post(f"/api/v1/orders/{order['id']}/delivery", headers=h, json={"courier": "jnt"})
    assert r.status_code == 201, r.text
    tracking = r.json()["tracking_no"]
    assert client.get(f"/api/v1/track/{tracking}").json()["courier"] == "J&T Express"
    c = client.get(f"/api/v1/conversations/{c['id']}", headers=h).json()
    assert c["customer"]["orders_count"] == 1 and c["customer"]["loyalty_points"] == 29
    assert tracking in c["messages"][-1]["body"]


def test_angry_customer_handoff_and_takeover(client):
    owner = register(client, "Handoff Shop", "owner@handoff.kh")
    h = auth(owner)
    c = simulate(client, owner, "ខ្ញុំវេរលុយតាំងពីម្សិលមិញ មិនទាន់ឃើញផ្ញើអីវ៉ាន់ទេ! 😡", user="tg-angry")
    assert c["sentiment"] == "angry" and c["high_priority"] and c["mode"] == "waiting_staff"
    assert any(m["kind"] == "event" and "Wait Staff" in m["body"] for m in c["messages"])

    listing = client.get("/api/v1/conversations?tab=staff", headers=h).json()
    assert listing["items"][0]["id"] == c["id"] and listing["counts"]["staff"] == 1
    assert any(n["kind"] == "high_priority" for n in client.get("/api/v1/notifications", headers=h).json())

    # AI stays quiet while waiting for staff.
    c2 = simulate(client, owner, "hello??", user="tg-angry")
    assert c2["messages"][-1]["sender"] == "customer"

    # Locked while AI is replying; take over → reply → resume.
    c3 = simulate(client, owner, "hi", user="tg-calm")
    assert client.post(f"/api/v1/conversations/{c3['id']}/messages", headers=h,
                       json={"body": "hello"}).status_code == 409
    client.post(f"/api/v1/conversations/{c['id']}/takeover", headers=h)
    r = client.post(f"/api/v1/conversations/{c['id']}/messages", headers=h, json={"body": "Sorry, checking now 🙏"})
    assert r.status_code == 201 and r.json()["sender"] == "staff"
    r = client.post(f"/api/v1/conversations/{c['id']}/resume-ai", headers=h).json()
    assert r["mode"] == "ai" and not r["high_priority"]


def test_tenant_isolation_and_roles(client):
    a = register(client, "Shop A", "a@iso.kh")
    b = register(client, "Shop B", "b@iso.kh")
    c = simulate(client, a, "hello", user="tg-iso")
    assert client.get(f"/api/v1/conversations/{c['id']}", headers=auth(b)).status_code == 404
    assert client.get("/api/v1/admin/stats", headers=auth(a)).status_code == 403

    admin = client.post("/api/v1/auth/login", json={"email": "admin@test.kh", "password": "Admin@12345"}).json()
    stats = client.get("/api/v1/admin/stats", headers=auth(admin["access_token"])).json()
    assert stats["shops_total"] >= 2

    # Free plan: 1 staff seat.
    h = auth(a)
    ok = client.post("/api/v1/shop/staff", headers=h, json={"full_name": "S1", "email": "s1@iso.kh",
                                                            "password": "Password1!"})
    assert ok.status_code == 201
    over = client.post("/api/v1/shop/staff", headers=h, json={"full_name": "S2", "email": "s2@iso.kh",
                                                              "password": "Password1!"})
    assert over.status_code == 402
    staff = client.post("/api/v1/auth/login", json={"email": "s1@iso.kh", "password": "Password1!"}).json()
    assert client.post("/api/v1/products", headers=auth(staff["access_token"]),
                       json={"name": "X", "price": 1, "stock": 1}).status_code == 403


def test_websocket_pushes_new_messages(client):
    owner = register(client, "Live Shop", "owner@live.kh")
    with client.websocket_connect(f"/api/v1/ws?token={owner}") as ws:
        simulate(client, owner, "How much?", user="tg-live", name="Live")
        events = [ws.receive_json() for _ in range(2)]
    assert events[0]["event"] == "message"
    assert events[0]["data"]["message"]["sender"] == "customer"
    assert events[0]["data"]["conversation"]["customer"]["name"] == "Live"


def test_invoice_numbers_continue_from_highest(client):
    owner = register(client, "Numbering", "owner@num.kh")
    h = auth(owner)
    p = client.post("/api/v1/products", headers=h, json={"name": "Serum", "price": 10, "stock": 9}).json()
    c = simulate(client, owner, "hi", user="tg-num")
    numbers = [client.post("/api/v1/orders", headers=h, json={"conversation_id": c["id"], "items": [
        {"product_id": p["id"], "quantity": 1}]}).json()["invoice_no"] for _ in range(2)]
    assert numbers == ["INV-1001", "INV-1002"]
