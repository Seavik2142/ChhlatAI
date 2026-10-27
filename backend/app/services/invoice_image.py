"""Paid invoice receipt image generator using Pillow and qrcode."""

import io
import logging
import os
from decimal import Decimal
from typing import TYPE_CHECKING

from PIL import Image, ImageDraw, ImageFont
import qrcode

from app.core.config import get_settings
from app.integrations.storage import get_storage

if TYPE_CHECKING:
    from app.models import Order, Shop

log = logging.getLogger(__name__)


def _load_font(size: int, bold: bool = False) -> ImageFont.ImageFont | ImageFont.FreeTypeFont:
    """Load system font with multiple fallbacks for macOS and Linux."""
    candidates = [
        # macOS Arial
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        # macOS Helvetica
        "/System/Library/Fonts/Helvetica.ttc",
        # Linux DejaVu
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        # Linux Liberation
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        # macOS Khmer font fallback for Khmer characters
        "/System/Library/Fonts/Supplemental/Khmer Sangam MN.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def _format_money(val: Decimal | float | int | None) -> str:
    if val is None:
        return "$0.00"
    return f"${float(val):.2f}"


def generate_invoice_image_bytes(shop: "Shop", order: "Order") -> bytes:
    """Render a crisp, high-resolution PNG receipt invoice image for an order."""
    width = 800
    item_count = len(order.items)
    base_height = 960
    total_height = max(base_height, 780 + item_count * 48)

    # 1. Canvas and Card Base
    img = Image.new("RGB", (width, total_height), color="#F1F5F9")
    draw = ImageDraw.Draw(img)

    margin = 24
    card_w = width - (margin * 2)
    card_h = total_height - (margin * 2)

    # Main Card (White with soft border)
    draw.rounded_rectangle(
        [(margin, margin), (width - margin, total_height - margin)],
        radius=20,
        fill="#FFFFFF",
        outline="#E2E8F0",
        width=2,
    )

    # 2. Header Banner (Dark Navy with blue accent strip)
    header_h = 100
    draw.rounded_rectangle(
        [(margin, margin), (width - margin, margin + header_h)],
        radius=20,
        fill="#0F172A",
    )
    # Fix rounded bottom corners of header
    draw.rectangle(
        [(margin, margin + header_h - 20), (width - margin, margin + header_h)],
        fill="#0F172A",
    )
    # Royal blue accent line
    draw.rectangle(
        [(margin, margin + header_h), (width - margin, margin + header_h + 4)],
        fill="#2563EB",
    )

    font_shop = _load_font(24, bold=True)
    font_sub = _load_font(12, bold=False)
    font_bold_sm = _load_font(13, bold=True)
    font_regular_sm = _load_font(13, bold=False)
    font_title = _load_font(18, bold=True)
    font_badge = _load_font(14, bold=True)
    font_h2 = _load_font(16, bold=True)
    font_total = _load_font(20, bold=True)

    shop_name = getattr(shop, "name", "Chhlat AI Social Commerce")
    draw.text((margin + 28, margin + 26), shop_name, fill="#FFFFFF", font=font_shop)
    draw.text(
        (margin + 28, margin + 62),
        "OFFICIAL PAYMENT RECEIPT & INVOICE",
        fill="#94A3B8",
        font=font_sub,
    )

    # Paid Badge on Top-Right Header
    badge_w, badge_h = 160, 42
    badge_x = width - margin - 28 - badge_w
    badge_y = margin + 28
    draw.rounded_rectangle(
        [(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)],
        radius=10,
        fill="#DCFCE7",
        outline="#16A34A",
        width=2,
    )
    draw.text((badge_x + 22, badge_y + 11), "PAID IN FULL ✓", fill="#15803D", font=font_badge)

    # 3. Two Information Cards (Invoice Info & Customer Info)
    card_top = margin + header_h + 24
    info_card_h = 145
    col_w = (card_w - 64) // 2

    # Left Info Card: Invoice Details
    left_x1 = margin + 24
    left_x2 = left_x1 + col_w
    draw.rounded_rectangle(
        [(left_x1, card_top), (left_x2, card_top + info_card_h)],
        radius=12,
        fill="#F8FAFC",
        outline="#E2E8F0",
        width=1,
    )
    draw.text((left_x1 + 18, card_top + 14), "INVOICE DETAILS", fill="#64748B", font=_load_font(11, bold=True))

    inv_no = getattr(order, "invoice_no", f"INV-{order.id}")
    paid_time_str = order.paid_at.strftime("%Y-%m-%d %H:%M UTC") if order.paid_at else "Just now"
    provider_str = (order.payment_provider or "Bakong KHQR").replace("_", " ").title()
    ref_str = order.bank_ref or "Auto-Matched"

    details_left = [
        ("Invoice Number:", inv_no, "#2563EB", True),
        ("Payment Date:", paid_time_str, "#0F172A", False),
        ("Payment Method:", provider_str, "#0F172A", False),
        ("Transaction Ref:", ref_str, "#475569", False),
    ]

    curr_y = card_top + 38
    for label, val, color, is_bold in details_left:
        draw.text((left_x1 + 18, curr_y), label, fill="#64748B", font=font_regular_sm)
        draw.text((left_x1 + 140, curr_y), val, fill=color, font=_load_font(13, bold=is_bold))
        curr_y += 24

    # Right Info Card: Customer & Delivery Details
    right_x1 = left_x2 + 16
    right_x2 = right_x1 + col_w
    draw.rounded_rectangle(
        [(right_x1, card_top), (right_x2, card_top + info_card_h)],
        radius=12,
        fill="#F8FAFC",
        outline="#E2E8F0",
        width=1,
    )
    draw.text((right_x1 + 18, card_top + 14), "CUSTOMER & DELIVERY", fill="#64748B", font=_load_font(11, bold=True))

    cust_name = getattr(order.customer, "name", "Valued Customer") if hasattr(order, "customer") else "Customer"
    cust_phone = getattr(order.customer, "phone", None) or "—"
    delivery_zone = (order.delivery_zone or "phnom_penh").replace("_", " ").title()
    delivery_addr = order.delivery_address or "Delivery on file"
    if len(delivery_addr) > 28:
        delivery_addr = delivery_addr[:26] + "…"

    details_right = [
        ("Customer Name:", cust_name, "#0F172A", True),
        ("Phone Number:", cust_phone, "#0F172A", False),
        ("Delivery Zone:", delivery_zone, "#0F172A", False),
        ("Shipping To:", delivery_addr, "#475569", False),
    ]

    curr_y = card_top + 38
    for label, val, color, is_bold in details_right:
        draw.text((right_x1 + 18, curr_y), label, fill="#64748B", font=font_regular_sm)
        draw.text((right_x1 + 140, curr_y), val, fill=color, font=_load_font(13, bold=is_bold))
        curr_y += 24

    # 4. Line Items Table
    table_top = card_top + info_card_h + 24
    table_header_h = 36
    draw.rounded_rectangle(
        [(margin + 24, table_top), (width - margin - 24, table_top + table_header_h)],
        radius=8,
        fill="#1E293B",
    )

    # Column x-coordinates
    col_desc_x = margin + 40
    col_qty_x = margin + 460
    col_price_x = margin + 550
    col_total_x = width - margin - 40

    draw.text((col_desc_x, table_top + 9), "ITEM DESCRIPTION", fill="#E2E8F0", font=_load_font(12, bold=True))
    draw.text((col_qty_x, table_top + 9), "QTY", fill="#E2E8F0", font=_load_font(12, bold=True))
    draw.text((col_price_x, table_top + 9), "UNIT PRICE", fill="#E2E8F0", font=_load_font(12, bold=True))

    tot_label = "AMOUNT"
    tot_w = int(draw.textlength(tot_label, font=_load_font(12, bold=True)))
    draw.text((col_total_x - tot_w, table_top + 9), tot_label, fill="#E2E8F0", font=_load_font(12, bold=True))

    curr_y = table_top + table_header_h
    row_h = 44

    for idx, item in enumerate(order.items):
        bg_color = "#FFFFFF" if idx % 2 == 0 else "#F8FAFC"
        draw.rectangle(
            [(margin + 24, curr_y), (width - margin - 24, curr_y + row_h)],
            fill=bg_color,
        )
        draw.line(
            [(margin + 24, curr_y + row_h), (width - margin - 24, curr_y + row_h)],
            fill="#E2E8F0",
            width=1,
        )

        item_name = item.name or f"Item #{idx + 1}"
        if len(item_name) > 38:
            item_name = item_name[:36] + "…"

        item_qty = str(item.quantity)
        item_price = _format_money(item.unit_price)
        line_total = _format_money(item.unit_price * item.quantity)

        draw.text((col_desc_x, curr_y + 12), item_name, fill="#0F172A", font=font_bold_sm)
        draw.text((col_qty_x + 8, curr_y + 12), item_qty, fill="#475569", font=font_regular_sm)
        draw.text((col_price_x + 8, curr_y + 12), item_price, fill="#475569", font=font_regular_sm)

        lt_w = int(draw.textlength(line_total, font=font_bold_sm))
        draw.text((col_total_x - lt_w, curr_y + 12), line_total, fill="#0F172A", font=font_bold_sm)

        curr_y += row_h

    # 5. Financial Summary (Subtotal, Delivery, Grand Total)
    summary_top = curr_y + 16
    summary_w = 320
    summary_x1 = width - margin - 24 - summary_w
    summary_x2 = width - margin - 24

    draw.rounded_rectangle(
        [(summary_x1, summary_top), (summary_x2, summary_top + 130)],
        radius=12,
        fill="#F8FAFC",
        outline="#E2E8F0",
        width=1,
    )

    # Subtotal
    draw.text((summary_x1 + 18, summary_top + 14), "Subtotal:", fill="#64748B", font=font_regular_sm)
    sub_val = _format_money(order.subtotal)
    sub_w = int(draw.textlength(sub_val, font=font_bold_sm))
    draw.text((summary_x2 - 18 - sub_w, summary_top + 14), sub_val, fill="#0F172A", font=font_bold_sm)

    # Delivery Fee
    draw.text((summary_x1 + 18, summary_top + 40), f"Delivery ({delivery_zone}):", fill="#64748B", font=font_regular_sm)
    del_val = _format_money(order.delivery_fee)
    del_w = int(draw.textlength(del_val, font=font_bold_sm))
    draw.text((summary_x2 - 18 - del_w, summary_top + 40), del_val, fill="#0F172A", font=font_bold_sm)

    # Total Box inside Summary
    draw.rounded_rectangle(
        [(summary_x1 + 10, summary_top + 70), (summary_x2 - 10, summary_top + 120)],
        radius=8,
        fill="#059669",
    )
    draw.text((summary_x1 + 24, summary_top + 84), "TOTAL PAID:", fill="#FFFFFF", font=font_total)
    tot_val = _format_money(order.total)
    tot_w = int(draw.textlength(tot_val, font=font_total))
    draw.text((summary_x2 - 24 - tot_w, summary_top + 84), tot_val, fill="#FFFFFF", font=font_total)

    # 6. Verification QR & Seal (Left side opposite of totals)
    qr_box_x = margin + 24
    qr_box_y = summary_top
    settings = get_settings()

    # Generate QR Code
    qr_data = f"https://chhlat.ai/track/order/{order.id}?inv={inv_no}"
    if order.delivery and order.delivery.tracking_no:
        qr_data = f"{settings.public_base_url}/track/{order.delivery.tracking_no}"

    qr = qrcode.QRCode(box_size=3, border=1)
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#0F172A", back_color="#FFFFFF").convert("RGB")
    qr_size = 100
    qr_img = qr_img.resize((qr_size, qr_size))

    # Paste QR code
    img.paste(qr_img, (qr_box_x + 12, qr_box_y + 12))

    # Text next to QR code
    qr_text_x = qr_box_x + qr_size + 24
    draw.text((qr_text_x, qr_box_y + 14), "✓ AUTHENTICATED PAYMENT", fill="#059669", font=_load_font(13, bold=True))
    draw.text(
        (qr_text_x, qr_box_y + 36),
        f"Verified via {provider_str}\nTransaction: {ref_str}\nScan QR to track delivery & order",
        fill="#64748B",
        font=font_sub,
    )

    # 7. Bottom Footer Note
    footer_y = total_height - margin - 44
    draw.line(
        [(margin + 24, footer_y), (width - margin - 24, footer_y)],
        fill="#E2E8F0",
        width=1,
    )
    footer_text = f"Thank you for your order with {shop_name}! Powered by Chhlat AI"
    ft_w = int(draw.textlength(footer_text, font=font_sub))
    draw.text(((width - ft_w) // 2, footer_y + 14), footer_text, fill="#94A3B8", font=font_sub)

    # Output PNG bytes
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def create_paid_invoice_image(shop: "Shop", order: "Order") -> str:
    """Generate the PNG image, store it via storage service, and return public URL."""
    png_bytes = generate_invoice_image_bytes(shop, order)
    storage = get_storage()
    url = storage.save(png_bytes, "image/png", "png")
    log.info("Generated paid invoice image for %s: %s (%d bytes)", order.invoice_no, url, len(png_bytes))
    return url
