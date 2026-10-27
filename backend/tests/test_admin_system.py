"""Tests for System Settings, Security Controls, Diagnostics, and Audit Logs."""

from tests.conftest import auth


def get_admin_token(client) -> str:
    r = client.post("/api/v1/auth/login", json={"email": "admin@test.kh", "password": "Admin@12345"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_security_settings_lifecycle(client):
    admin_token = get_admin_token(client)
    h = auth(admin_token)

    # 1. Fetch initial security settings
    r = client.get("/api/v1/admin/security-settings", headers=h)
    assert r.status_code == 200, r.text
    sec = r.json()
    assert "session_timeout_minutes" in sec
    assert "enforce_2fa" in sec
    assert "max_login_attempts" in sec

    # 2. Update security settings
    update_payload = {
        "session_timeout_minutes": 60,
        "enforce_2fa": True,
        "max_login_attempts": 3,
        "password_min_length": 10,
        "require_special_char": True,
        "require_number": True,
        "require_uppercase": True,
        "ip_allowlist": ["192.168.1.1", "10.0.0.0/24"],
        "allow_admin_registration": False,
        "auto_backup_enabled": True,
        "ssl_enforced": True,
    }
    r = client.put("/api/v1/admin/security-settings", headers=h, json=update_payload)
    assert r.status_code == 200, r.text
    updated = r.json()
    assert updated["session_timeout_minutes"] == 60
    assert updated["enforce_2fa"] is True
    assert updated["max_login_attempts"] == 3
    assert "192.168.1.1" in updated["ip_allowlist"]

    # 3. Verify audit log was recorded for security policy update
    r = client.get("/api/v1/admin/audit-logs", headers=h)
    assert r.status_code == 200, r.text
    audit_logs = r.json()
    assert len(audit_logs) > 0
    assert any(log["action"] == "SECURITY_POLICY_UPDATED" for log in audit_logs)


def test_system_diagnostics(client):
    admin_token = get_admin_token(client)
    h = auth(admin_token)

    r = client.get("/api/v1/admin/system-diagnostics", headers=h)
    assert r.status_code == 200, r.text
    diag = r.json()

    assert "database" in diag
    assert diag["database"]["status"] == "operational"
    assert diag["database"]["latency_ms"] >= 0
    assert diag["database"]["total_tables"] > 0

    assert "server" in diag
    assert "uptime_seconds" in diag["server"]
    assert "python_version" in diag["server"]

    assert "metrics" in diag
    assert "total_users" in diag["metrics"]
    assert "total_shops" in diag["metrics"]


def test_admin_password_change_security(client):
    admin_token = get_admin_token(client)
    h = auth(admin_token)

    # 1. Attempt to change password without current_password -> must fail (400)
    r = client.patch("/api/v1/auth/me", headers=h, json={"password": "NewAdminPass123!"})
    assert r.status_code == 400
    assert "Current password is incorrect" in r.json()["detail"]

    # 2. Attempt to change password with WRONG current_password -> must fail (400)
    r = client.patch("/api/v1/auth/me", headers=h, json={
        "current_password": "WrongPassword123!",
        "password": "NewAdminPass123!",
    })
    assert r.status_code == 400
    assert "Current password is incorrect" in r.json()["detail"]

    # 3. Change password with CORRECT current_password -> succeeds (200)
    r = client.patch("/api/v1/auth/me", headers=h, json={
        "current_password": "Admin@12345",
        "password": "NewSuperAdminSecret123!",
    })
    assert r.status_code == 200

    from app.core import rate_limit

    # 4. Old password fails
    rate_limit._local.clear()
    r_fail = client.post("/api/v1/auth/login", json={"email": "admin@test.kh", "password": "Admin@12345"})
    assert r_fail.status_code == 401

    # 5. New password succeeds
    rate_limit._local.clear()
    r_ok = client.post("/api/v1/auth/login", json={"email": "admin@test.kh", "password": "NewSuperAdminSecret123!"})
    assert r_ok.status_code == 200
    new_token = r_ok.json()["access_token"]

    # 6. Revert password back for other tests
    r_revert = client.patch("/api/v1/auth/me", headers=auth(new_token), json={
        "current_password": "NewSuperAdminSecret123!",
        "password": "Admin@12345",
    })
    assert r_revert.status_code == 200
    rate_limit._local.clear()
