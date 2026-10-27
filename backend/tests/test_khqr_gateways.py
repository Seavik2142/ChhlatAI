"""Unit & integration tests for National KHQR, ABA PayWay, and ACLEDA ToanChet Pay."""

from decimal import Decimal

from app.models import PaymentProviderType
from app.services.payments import (
    _crc16,
    build_deep_links,
    build_khqr,
    generate_khqr_image_bytes,
    parse_khqr_tags,
)
from tests.conftest import auth


def test_bakong_khqr_individual():
    """Verify individual Bakong KHQR EMVCo format (Tag 29, USD, CRC16)."""
    qr = build_khqr(
        account_id="sreypov@aclb",
        merchant_name="GLOW SKIN",
        amount=Decimal("15.50"),
        bill_number="INV-1001",
        currency="USD",
        provider_type="bakong",
    )
    assert qr.startswith("000201010212")
    assert "29" in qr and "sreypov@aclb" in qr
    assert "5303840" in qr  # USD
    assert "540515.50" in qr or "540415.5" in qr
    assert "5802KH" in qr
    assert "5909GLOW SKIN" in qr
    assert "6010Phnom Penh" in qr
    assert "62120108INV-1001" in qr
    assert qr[-8:-4] == "6304"
    assert _crc16(qr[:-4]) == qr[-4:]


def test_bakong_khqr_khr_currency():
    """Verify KHR currency (Tag 53 = 116, amount formatted without decimals)."""
    qr = build_khqr(
        account_id="merchant@aba",
        merchant_name="ANGKOR STORE",
        amount=Decimal("63500"),
        bill_number="INV-2002",
        currency="KHR",
        provider_type="bakong",
    )
    assert "5303116" in qr
    assert "540563500" in qr
    assert _crc16(qr[:-4]) == qr[-4:]


def test_aba_payway_format_and_deeplink():
    """Verify ABA PayWay merchant acquiring format and ABA Mobile deep link."""
    qr = build_khqr(
        account_id="00123456",
        merchant_name="ABA STORE",
        amount=Decimal("25.00"),
        bill_number="INV-3003",
        currency="USD",
        provider_type="aba_payway",
    )
    assert "30" in qr and "aba_payway" in qr and "00123456" in qr
    assert _crc16(qr[:-4]) == qr[-4:]

    deep_links = build_deep_links(qr, provider_type="aba_payway", account_id="00123456", amount=25.0, bill_number="INV-3003")
    assert deep_links["aba_mobile"].startswith("abamobilebank://ababank.com?type=payway")
    assert deep_links["primary"] == deep_links["aba_mobile"]


def test_acleda_toanchet_format_and_deeplink():
    """Verify ACLEDA ToanChet merchant acquiring format and deep links."""
    qr = build_khqr(
        account_id="99887766",
        merchant_name="PHNOM PENH BOUTIQUE",
        amount=Decimal("42.50"),
        bill_number="INV-4004",
        currency="USD",
        provider_type="acleda",
    )
    assert "30" in qr and "acledabank" in qr and "99887766" in qr
    assert _crc16(qr[:-4]) == qr[-4:]

    deep_links = build_deep_links(qr, provider_type="acleda", account_id="99887766", amount=42.5, bill_number="INV-4004")
    assert deep_links["acleda_mobile"].startswith("acledamobile://pay?data=")
    assert deep_links["primary"] == deep_links["acleda_mobile"]


def test_parse_khqr_tags():
    """Verify EMVCo TLV parsing into structured tag tree."""
    qr = build_khqr("shop@aclb", "GLOW SKIN", Decimal("15.50"), "INV-1001")
    tags = parse_khqr_tags(qr)
    tag_dict = {t["tag"]: t for t in tags}
    assert "00" in tag_dict and tag_dict["00"]["value"] == "01"
    assert "29" in tag_dict
    assert tag_dict["29"]["subtags"][0]["value"] == "shop@aclb"
    assert "54" in tag_dict and tag_dict["54"]["value"] in ("15.50", "15.5")
    assert "63" in tag_dict


def test_generate_khqr_image_bytes():
    """Verify generating high-resolution PNG image bytes with valid PNG magic header."""
    qr = build_khqr("shop@aclb", "GLOW SKIN", Decimal("15.50"), "INV-1001")
    png = generate_khqr_image_bytes(
        shop_name="Glow Skin",
        merchant_name="GLOW SKIN CAMBODIA",
        provider_type="bakong",
        amount=Decimal("15.50"),
        bill_number="INV-1001",
        khqr_string=qr,
        currency="USD",
    )
    assert png.startswith(b"\x89PNG\r\n\x1a\n")
    assert len(png) > 10000


def test_khqr_preview_endpoints(client):
    """Verify /api/v1/shop/generate-khqr-preview and image endpoints."""
    # Register a shop
    r = client.post("/api/v1/auth/register", json={
        "shop_name": "KHQR Test Shop", "full_name": "Owner", "email": "khqr_owner@test.kh", "password": "Password1!"})
    assert r.status_code == 201
    token = r.json()["access_token"]
    h = auth(token)

    # 1. Test POST /generate-khqr-preview for Bakong
    r_prev = client.post("/api/v1/shop/generate-khqr-preview", headers=h, json={
        "provider": "bakong",
        "merchant_name": "GLOW STORE",
        "account_id": "glow@aclb",
        "amount": 20.0,
        "currency": "USD",
        "bill_number": "INV-PREVIEW-1",
    })
    assert r_prev.status_code == 200, r_prev.text
    data = r_prev.json()
    assert data["khqr"].startswith("000201010212")
    assert data["image_data_uri"].startswith("data:image/png;base64,")
    assert len(data["tags"]) >= 8

    # 2. Test POST /generate-khqr-preview for ABA PayWay
    r_aba = client.post("/api/v1/shop/generate-khqr-preview", headers=h, json={
        "provider": "aba_payway",
        "merchant_name": "ABA PAYWAY STORE",
        "account_id": "00987654",
        "amount": 35.0,
        "currency": "USD",
        "bill_number": "INV-ABA-99",
    })
    assert r_aba.status_code == 200
    aba_data = r_aba.json()
    assert "aba_mobile" in aba_data["deep_links"]
    assert aba_data["deep_links"]["aba_mobile"].startswith("abamobilebank://")

    # 3. Test direct image endpoint GET /khqr-preview-image
    r_img = client.get("/api/v1/shop/khqr-preview-image?provider=acleda&amount=12.50&currency=USD", headers=h)
    assert r_img.status_code == 200
    assert r_img.headers["content-type"] == "image/png"
    assert r_img.content.startswith(b"\x89PNG\r\n\x1a\n")
