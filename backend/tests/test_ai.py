"""Claude path with a fake SDK client: request shape and structured-output parsing."""

import json
from decimal import Decimal
from types import SimpleNamespace

from app.models import Message, Product, Sender, Shop
from app.services import ai


class FakeMessages:
    def __init__(self, payload: dict):
        self.payload, self.calls = payload, []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        return SimpleNamespace(stop_reason="end_turn", _request_id="req_test",
                               content=[SimpleNamespace(type="text", text=json.dumps(self.payload))])


def fake_client(monkeypatch, payload):
    messages = FakeMessages(payload)
    monkeypatch.setattr(ai, "_client", lambda: SimpleNamespace(beta=SimpleNamespace(messages=messages)))
    return messages


def test_decide_reply_uses_claude(monkeypatch):
    shop = Shop(id=1, name="Glow", category="Skincare", delivery_fees={"phnom_penh": 1.5}, ai_instructions="")
    serum = Product(id=7, name="Acne Clear Serum", price=Decimal(14), stock=5, description="")
    messages = fake_client(monkeypatch, {
        "sentiment": "interested", "needs_human": False, "handoff_reason": "", "reply": "បាន 🙏",
        "recommended_product_ids": [7, 999], "create_order": True,
        "order_items": [{"product_id": 7, "quantity": 2}, {"product_id": 999, "quantity": 1}],
        "delivery_zone": "unknown", "customer_phone": "012", "customer_address": "",
        "facts": [{"label": "Skin type", "value": "Oily"}], "confidence": 1.4,
    })
    history = [Message(sender=Sender.customer, body="យក Serum 2 ដប")]
    d = ai.decide_reply(shop, history, [serum], [], {"model": "claude-opus-5-5", "global_instructions": "No PINs."})

    call = messages.calls[0]
    assert call["model"] == "claude-opus-5-5" and call["fallbacks"] == "default"
    assert call["output_config"]["format"]["type"] == "json_schema"
    assert "No PINs." in call["system"][0]["text"] and call["system"][1]["cache_control"]["type"] == "ephemeral"
    assert "temperature" not in call
    # Unknown product ids are dropped; zone falls back; confidence is clamped.
    assert d.source == "claude" and d.recommended_product_ids == [7]
    assert d.order.items == [(7, 2)] and d.order.delivery_zone == "phnom_penh" and d.order.phone == "012"
    assert d.facts == {"Skin type": "Oily"} and d.confidence == 1.0


def test_refusal_falls_back_to_rules(monkeypatch):
    messages = fake_client(monkeypatch, {})
    messages.create = lambda **kw: SimpleNamespace(stop_reason="refusal", _request_id="r", content=[])
    shop = Shop(id=1, name="Glow", category="x", delivery_fees={}, ai_instructions="")
    d = ai.decide_reply(shop, [Message(sender=Sender.customer, body="refund now!! 😡")], [], [])
    assert d.source == "rules" and d.needs_human


def test_slip_reading(monkeypatch):
    fake_client(monkeypatch, {"is_payment_slip": True, "bank": "ABA", "amount": -15.5, "currency": "USD",
                              "receiver": "GLOW SKIN CAMBODIA", "reference": "100FT1", "paid_time": "10:09",
                              "confidence": 0.95})
    r = ai.read_payment_slip(b"img", "image/jpeg")
    assert r.amount == Decimal("15.5") and r.receiver == "GLOW SKIN CAMBODIA" and r.confidence == 0.95
