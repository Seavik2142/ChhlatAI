"""Tests for the Super Admin Telegram Control Bot service (@chhlatAI_bot)."""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.services import admin_bot
from tests.conftest import auth


def get_admin_token(client: TestClient) -> str:
    r = client.post("/api/v1/auth/login", json={"email": "admin@test.kh", "password": "Admin@12345"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_admin_bot_config_and_subscribers():
    """Test linking, updating preferences, and unlinking Super Admin Telegram chat IDs."""
    with SessionLocal() as db_session:
        cfg = admin_bot.get_admin_bot_config(db_session)
        assert "chat_ids" in cfg
        assert cfg["notify_new_users"] is True

        # Link an admin chat
        cfg2 = admin_bot.link_admin_chat_id(db_session, "987654321", "TestAdmin")
        assert "987654321" in cfg2["chat_ids"]

        # Save preferences
        cfg2["notify_audit_trail"] = False
        saved = admin_bot.save_admin_bot_config(db_session, cfg2)
        assert saved["notify_audit_trail"] is False

        # Unlink
        cfg3 = admin_bot.unlink_admin_chat_id(db_session, "987654321")
        assert "987654321" not in cfg3["chat_ids"]


@patch("app.services.admin_bot.send_admin_bot_message_sync")
def test_admin_bot_command_handlers(mock_send: MagicMock):
    """Test incoming Telegram commands (/start, /health, /stats, /users, /audit, /shops)."""
    with SessionLocal() as db_session:
        # 1. /start
        update_start = {
            "update_id": 1001,
            "message": {
                "message_id": 1,
                "chat": {"id": 12345678, "type": "private"},
                "from": {"id": 12345678, "first_name": "Boss", "username": "superboss"},
                "text": "/start",
            },
        }
        res = admin_bot.handle_admin_bot_update(update_start, db_session)
        assert res["ok"] is True
        assert res["command"] == "start"
        mock_send.assert_called()
        assert "Connected" in mock_send.call_args[0][0]

        # Verify chat was linked
        cfg = admin_bot.get_admin_bot_config(db_session)
        assert "12345678" in cfg["chat_ids"]

        # 2. /health
        update_health = {
            "update_id": 1002,
            "message": {
                "message_id": 2,
                "chat": {"id": 12345678, "type": "private"},
                "from": {"id": 12345678, "first_name": "Boss"},
                "text": "/health",
            },
        }
        res_health = admin_bot.handle_admin_bot_update(update_health, db_session)
        assert res_health["ok"] is True
        assert res_health["command"] == "health"
        assert "System Health & Diagnostics" in mock_send.call_args[0][0]

        # 3. /stats
        update_stats = {
            "update_id": 1003,
            "message": {
                "message_id": 3,
                "chat": {"id": 12345678, "type": "private"},
                "from": {"id": 12345678, "first_name": "Boss"},
                "text": "/stats",
            },
        }
        res_stats = admin_bot.handle_admin_bot_update(update_stats, db_session)
        assert res_stats["ok"] is True
        assert res_stats["command"] == "stats"
        assert "Platform Overview" in mock_send.call_args[0][0]

        # 4. /users
        update_users = {
            "update_id": 1004,
            "message": {
                "message_id": 4,
                "chat": {"id": 12345678, "type": "private"},
                "from": {"id": 12345678, "first_name": "Boss"},
                "text": "/users",
            },
        }
        res_users = admin_bot.handle_admin_bot_update(update_users, db_session)
        assert res_users["ok"] is True
        assert res_users["command"] == "users"

        # 5. /audit
        update_audit = {
            "update_id": 1005,
            "message": {
                "message_id": 5,
                "chat": {"id": 12345678, "type": "private"},
                "from": {"id": 12345678, "first_name": "Boss"},
                "text": "/audit",
            },
        }
        res_audit = admin_bot.handle_admin_bot_update(update_audit, db_session)
        assert res_audit["ok"] is True
        assert res_audit["command"] == "audit"


def test_admin_telegram_bot_api_endpoints(client: TestClient):
    """Test Super Admin REST API endpoints for configuring and testing the Telegram bot."""
    admin_token = get_admin_token(client)
    headers = auth(admin_token)

    # 1. Get status
    r = client.get("/api/v1/admin/telegram-bot/status", headers=headers)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "configured" in data
    assert "bot_username" in data
    assert "webhook_url" in data
    assert "chat_ids" in data

    # 2. Update config
    r_update = client.post(
        "/api/v1/admin/telegram-bot/config",
        headers=headers,
        json={
            "chat_ids": ["555666777"],
            "notify_new_users": True,
            "notify_audit_trail": True,
            "notify_health_alerts": True,
        },
    )
    assert r_update.status_code == 200, r_update.text
    assert "555666777" in r_update.json()["chat_ids"]

    # 3. Send test alert
    with patch("app.services.admin_bot.send_admin_bot_message_sync", return_value=True):
        r_test = client.post(
            "/api/v1/admin/telegram-bot/send-test",
            headers=headers,
            json={"kind": "new_user"},
        )
        assert r_test.status_code == 200, r_test.text
        assert r_test.json()["ok"] is True
        assert "555666777" in r_test.json()["sent_to_chat_ids"]


def test_telegram_admin_webhook_route(client: TestClient):
    """Test receiving updates on the /api/v1/webhooks/telegram/admin-bot endpoint."""
    with patch("app.services.admin_bot.send_admin_bot_message_sync", return_value=True):
        update = {
            "update_id": 2001,
            "message": {
                "message_id": 42,
                "chat": {"id": 999888777, "type": "private"},
                "from": {"id": 999888777, "first_name": "Admin Tester"},
                "text": "/health",
            },
        }
        r = client.post("/api/v1/webhooks/telegram/admin-bot", json=update)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True
