from app.core.database import SessionLocal
from app.models import AIUsage, Shop
from app.services import usage
from app.services.usage import current_period


def get_admin_token(client):
    r = client.post("/api/v1/auth/login", json={"email": "admin@test.kh", "password": "Admin@12345"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_ai_real_token_tracking_and_playground(client):
    token = get_admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Test get_ai_stats returns real token breakdown
    r = client.get("/api/v1/admin/ai-stats", headers=headers)
    assert r.status_code == 200
    stats = r.json()
    assert "total_tokens" in stats
    assert "codecraft_tokens" in stats
    assert "gemini_tokens" in stats
    assert "prompt_tokens" in stats
    assert "completion_tokens" in stats
    assert stats["is_real_telemetry"] is True

    # 2. Test AI playground execution & token capture
    playground_payload = {
        "message": "តើឡេការពារកម្តៅថ្ងៃនេះមានតម្លៃប៉ុន្មានដែរ?",
        "model": "gemini-3.8-flash",
        "system_prompt": "You are Chhlat AI sales assistant.",
        "temperature": 0.3,
    }
    r = client.post("/api/v1/admin/ai-test-playground", json=playground_payload, headers=headers)
    assert r.status_code == 200
    res = r.json()
    assert res["ok"] is True
    assert res["total_tokens"] > 0
    assert res["tokens_prompt"] > 0
    assert res["tokens_completion"] > 0
    assert res["model_used"] == "gemini-3.8-flash"
    assert "latency_ms" in res

    # 3. Test recording real tokens in usage service for a shop
    from app.models import ShopStatus
    with SessionLocal() as db:
        shop = db.query(Shop).first()
        if not shop:
            shop = Shop(name="AI Test Shop", slug="ai-test-shop", status=ShopStatus.active)
            db.add(shop)
            db.commit()
            db.refresh(shop)

        initial_usage = db.query(AIUsage).filter(AIUsage.shop_id == shop.id, AIUsage.period == current_period()).first()
        initial_tot = initial_usage.total_tokens if initial_usage else 0

        # Record real token reply via Gemini
        usage.record_reply(
            db,
            shop.id,
            tokens={"prompt_tokens": 120, "completion_tokens": 45, "total_tokens": 165},
            provider="gemini",
        )
        db.commit()

        updated_usage = db.query(AIUsage).filter(AIUsage.shop_id == shop.id, AIUsage.period == current_period()).first()
        assert updated_usage is not None
        assert updated_usage.total_tokens == initial_tot + 165
        assert updated_usage.gemini_tokens >= 165

    # 4. Verify admin stats reflects the updated real token count
    r2 = client.get("/api/v1/admin/ai-stats", headers=headers)
    assert r2.status_code == 200
    stats2 = r2.json()
    assert stats2["total_tokens_num"] >= 165
