"""Unit tests for Connected Messaging Inboxes OAuth 2.0 flows."""

from tests.conftest import auth


def test_oauth_authorize_url_endpoints(client):
    r_reg = client.post("/api/v1/auth/register", json={
        "shop_name": "OAuth Test Shop", "full_name": "Owner", "email": "oauth_owner@test.kh", "password": "Password1!"})
    assert r_reg.status_code == 201
    token = r_reg.json()["access_token"]
    h = auth(token)

    # 1. Facebook OAuth authorize URL
    r_fb = client.get("/api/v1/shop/oauth/authorize-url?platform=facebook", headers=h)
    assert r_fb.status_code == 200, r_fb.text
    data_fb = r_fb.json()
    assert data_fb["platform"] == "facebook"
    assert "authorization_url" in data_fb
    assert "pages_messaging" in data_fb["scopes"]

    # 2. Instagram OAuth authorize URL
    r_ig = client.get("/api/v1/shop/oauth/authorize-url?platform=instagram", headers=h)
    assert r_ig.status_code == 200
    data_ig = r_ig.json()
    assert data_ig["platform"] == "instagram"
    assert "instagram_manage_messages" in data_ig["scopes"]

    # 3. TikTok OAuth authorize URL
    r_tt = client.get("/api/v1/shop/oauth/authorize-url?platform=tiktok", headers=h)
    assert r_tt.status_code == 200
    data_tt = r_tt.json()
    assert data_tt["platform"] == "tiktok"
    assert "im.direct_message" in data_tt["scopes"]

    # 4. Telegram OAuth authorize URL
    r_tg = client.get("/api/v1/shop/oauth/authorize-url?platform=telegram", headers=h)
    assert r_tg.status_code == 200
    data_tg = r_tg.json()
    assert data_tg["platform"] == "telegram"
    assert "authorization_url" in data_tg
    assert "bot.messages" in data_tg["scopes"]


def test_oauth_exchange_and_link_flow(client):
    r_reg = client.post("/api/v1/auth/register", json={
        "shop_name": "Meta Shop", "full_name": "Owner", "email": "meta_owner@test.kh", "password": "Password1!"})
    assert r_reg.status_code == 201
    token = r_reg.json()["access_token"]
    h = auth(token)

    # 1. Exchange code
    r_ex = client.post(
        "/api/v1/shop/oauth/exchange",
        json={"platform": "facebook", "code": "sandbox_auth_123"},
        headers=h,
    )
    assert r_ex.status_code == 200, r_ex.text
    exchange_data = r_ex.json()
    assert len(exchange_data["pages"]) > 0
    target_page = exchange_data["pages"][0]
    assert target_page["name"]
    assert target_page["id"]

    # 2. Link account directly with 1 click
    r_link = client.post(
        "/api/v1/shop/oauth/link-account",
        json={
            "platform": "facebook",
            "external_id": target_page["id"],
            "name": target_page["name"],
            "access_token": target_page["access_token"],
            "meta_info": {"category": target_page["category"], "oauth_connected": True},
        },
        headers=h,
    )
    assert r_link.status_code == 200, r_link.text
    channel_data = r_link.json()
    assert channel_data["is_connected"] is True
    assert channel_data["name"] == target_page["name"]
    assert channel_data["has_token"] is True
    channel_id = channel_data["id"]

    # 3. Test channel connection
    r_test = client.post(
        f"/api/v1/shop/channels/{channel_id}/test-connection",
        headers=h,
    )
    assert r_test.status_code == 200
    test_res = r_test.json()
    assert test_res["ok"] is True
    assert test_res["status"] == "healthy"


def test_telegram_verify_flow(client):
    r_reg = client.post("/api/v1/auth/register", json={
        "shop_name": "Telegram Shop", "full_name": "Owner", "email": "tg_owner@test.kh", "password": "Password1!"})
    assert r_reg.status_code == 201
    token = r_reg.json()["access_token"]
    h = auth(token)

    # Invalid format
    r_bad = client.post(
        "/api/v1/shop/oauth/telegram-verify",
        json={"bot_token": "not_a_valid_token"},
        headers=h,
    )
    assert r_bad.status_code == 200
    assert r_bad.json()["ok"] is False


def test_direct_oauth_flow_and_callback(client):
    r_reg = client.post("/api/v1/auth/register", json={
        "shop_name": "Direct OAuth Shop", "full_name": "Owner", "email": "direct_oauth@test.kh", "password": "Password1!"})
    assert r_reg.status_code == 201
    token = r_reg.json()["access_token"]
    h = auth(token)

    # 1. Initiate authorization redirect
    r_auth = client.get(f"/api/auth/facebook?token={token}", follow_redirects=False)
    assert r_auth.status_code == 302
    redirect_location = r_auth.headers["location"]
    assert "state=" in redirect_location
    assert ("response_type=code" in redirect_location) or ("code=sandbox_auth_" in redirect_location)

    # Extract state from redirect location
    from urllib.parse import parse_qs, urlparse
    parsed = urlparse(redirect_location)
    params = parse_qs(parsed.query)
    code = "sandbox_direct_oauth_code"
    state = params["state"][0]

    # 2. Test callback with invalid state
    r_bad_cb = client.get("/api/auth/facebook/callback?state=invalid_state&code=test", follow_redirects=False)
    assert r_bad_cb.status_code == 302
    assert "status=error" in r_bad_cb.headers["location"]

    # 3. Test callback with valid state and sandbox code
    r_good_cb = client.get(f"/api/auth/facebook/callback?state={state}&code={code}", follow_redirects=False)
    assert r_good_cb.status_code == 302
    cb_location = r_good_cb.headers["location"]
    assert "status=success" in cb_location
    assert "platform=facebook" in cb_location
    assert "channel_id=" in cb_location

    # 4. Verify channel now exists and is connected in shop channels list
    r_channels = client.get("/api/v1/shop/channels", headers=h)
    assert r_channels.status_code == 200
    channels = r_channels.json()
    fb_channels = [c for c in channels if c["platform"] == "facebook" and c["is_connected"]]
    assert len(fb_channels) == 1
    assert fb_channels[0]["has_token"] is True
    assert fb_channels[0]["token_expires_at"] is not None


def test_telegram_oauth_direct_browser_flow(client):
    r_reg = client.post("/api/v1/auth/register", json={
        "shop_name": "TG Direct Shop", "full_name": "Owner", "email": "tg_direct@test.kh", "password": "Password1!"})
    assert r_reg.status_code == 201
    token = r_reg.json()["access_token"]
    h = auth(token)

    # 1. Initiate Telegram OAuth authorization redirect
    r_auth = client.get(f"/api/auth/telegram?token={token}", follow_redirects=False)
    assert r_auth.status_code == 302
    redirect_location = r_auth.headers["location"]
    assert "state" in redirect_location

    from urllib.parse import parse_qs, urlparse
    parsed = urlparse(redirect_location)
    params = parse_qs(parsed.query)
    code = "sandbox_tg_direct_code"
    if "state" in params:
        state = params["state"][0]
    elif "return_to" in params:
        return_to_parsed = urlparse(params["return_to"][0])
        return_to_params = parse_qs(return_to_parsed.query)
        state = return_to_params["state"][0]
    else:
        state = ""
    assert state

    # 2. Callback with valid state and code
    r_cb = client.get(f"/api/auth/telegram/callback?state={state}&code={code}", follow_redirects=False)
    assert r_cb.status_code == 302
    cb_loc = r_cb.headers["location"]
    assert "status=success" in cb_loc
    assert "platform=telegram" in cb_loc
    assert "channel_id=" in cb_loc

    # 3. Verify channel created in shop
    r_ch = client.get("/api/v1/shop/channels", headers=h)
    assert r_ch.status_code == 200
    ch_list = [c for c in r_ch.json() if c["platform"] == "telegram" and c["is_connected"]]
    assert len(ch_list) == 1
    assert ch_list[0]["has_token"] is True



