from html import escape
import time

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import HTMLResponse, Response
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, CurrentShop, ShopMember, get_in_shop
from app.models import Conversation, Delivery, Order, OrderStatus, PaymentProvider, PaymentSlip, SlipStatus
from app.api.v1.endpoints.conversations import ALLOWED_IMAGE_TYPES, save_upload
from app.schemas import DeliveryIn, DeliveryOut, OrderIn, OrderOut, OrderUpdate
from app.services import ai
from app.services import orders as svc
from app.services.orders import COURIER

router = APIRouter(tags=["orders"])


def _load(db: DB, order_id: int, shop_id: int) -> Order:
    return get_in_shop(db, Order, order_id, shop_id)


@router.get("/orders", response_model=list[OrderOut])
def list_orders(shop: CurrentShop, user: ShopMember, db: DB, status: OrderStatus | None = None,
                mine: bool = False, limit: int = 100):
    stmt = (select(Order).where(Order.shop_id == shop.id)
            .options(selectinload(Order.items), selectinload(Order.slips), selectinload(Order.delivery)))
    if status:
        stmt = stmt.where(Order.status == status)
    if mine:
        stmt = stmt.where(Order.staff_id == user.id)
    return db.scalars(stmt.order_by(Order.created_at.desc()).limit(min(limit, 500))).all()


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, shop: CurrentShop, _: ShopMember, db: DB):
    return _load(db, order_id, shop.id)


@router.post("/orders", response_model=OrderOut, status_code=201)
def create_order(body: OrderIn, shop: CurrentShop, user: ShopMember, db: DB):
    """Staff create an invoice from the chat (Quick products & prices)."""
    c = get_in_shop(db, Conversation, body.conversation_id, shop.id)
    order = svc.create_order(db, shop, c, [(i.product_id, i.quantity) for i in body.items], body.delivery_zone,
                             body.delivery_address, by_ai=False, staff=user)
    svc.post_invoice(db, shop, c, order, khmer=ai.is_khmer(c.last_message_preview))
    db.commit()
    return order


@router.patch("/orders/{order_id}", response_model=OrderOut)
def update_order(order_id: int, body: OrderUpdate, shop: CurrentShop, _: ShopMember, db: DB):
    order = _load(db, order_id, shop.id)
    if body.status == OrderStatus.cancelled:
        if order.status in (OrderStatus.shipped, OrderStatus.delivered):
            raise HTTPException(409, "Shipped orders cannot be cancelled")
        order.status = OrderStatus.cancelled
    else:
        items = [(i.product_id, i.quantity) for i in body.items] if body.items is not None else None
        svc.update_order(db, shop, order, items, body.delivery_zone, body.delivery_address)
    db.commit()
    return order


@router.post("/orders/{order_id}/slip", response_model=OrderOut)
async def upload_slip(order_id: int, file: UploadFile, shop: CurrentShop, _: ShopMember, db: DB):
    """Staff attach a slip the customer sent elsewhere; AI reads and checks it."""
    order = _load(db, order_id, shop.id)
    data, media_type, url = await save_upload(file, ALLOWED_IMAGE_TYPES)
    svc.apply_slip(db, shop, order, ai.read_payment_slip(data, media_type), url)
    db.commit()
    return order


@router.post("/orders/{order_id}/review", response_model=OrderOut)
def review_payment(order_id: int, approve: bool, shop: CurrentShop, _: ShopMember, db: DB):
    """Human review in Orders & Invoices for low-confidence or mismatched slips."""
    order = _load(db, order_id, shop.id)
    if order.status not in (OrderStatus.needs_review, OrderStatus.checking_slip):
        raise HTTPException(409, "This order is not waiting for payment review")
    latest: PaymentSlip | None = order.slips[-1] if order.slips else None
    if approve:
        if latest:
            latest.status = SlipStatus.verified
        svc.mark_paid(db, shop, order, provider=order.payment_provider, bank_ref=latest.reference if latest else None)
    else:
        if latest:
            latest.status = SlipStatus.mismatch
        order.status = OrderStatus.awaiting_payment
    db.commit()
    return order


@router.post("/orders/{order_id}/simulate-bank-confirmation", response_model=OrderOut, tags=["dev"])
def simulate_bank(order_id: int, shop: CurrentShop, _: ShopMember, db: DB):
    """Sandbox only: act as the bank's payment callback."""
    order = _load(db, order_id, shop.id)
    provider = db.scalars(select(PaymentProvider).where(
        PaymentProvider.shop_id == shop.id, PaymentProvider.provider == (order.payment_provider or "bakong"))).first()
    if provider and provider.environment == "production":
        raise HTTPException(409, "Production payments are confirmed by the bank, not manually")
    svc.mark_paid(db, shop, order, provider=order.payment_provider or "bakong", bank_ref="SANDBOX")
    db.commit()
    return order


@router.post("/orders/{order_id}/confirm", response_model=OrderOut)
def confirm_and_print(order_id: int, shop: CurrentShop, user: ShopMember, db: DB):
    order = _load(db, order_id, shop.id)
    svc.confirm_and_print(db, shop, order, user)
    db.commit()
    return order


@router.post("/orders/{order_id}/delivery", response_model=DeliveryOut, status_code=201)
def send_to_delivery(order_id: int, body: DeliveryIn, shop: CurrentShop, user: ShopMember, db: DB):
    order = _load(db, order_id, shop.id)
    if order.delivery:
        raise HTTPException(409, "This order was already sent to a courier")
    delivery = svc.send_to_delivery(db, shop, order, body.courier, body.cash_on_delivery, user)
    db.commit()
    return delivery


@router.get("/orders/{order_id}/print", response_class=HTMLResponse)
def print_slip(order_id: int, shop: CurrentShop, _: ShopMember, db: DB) -> str:
    """Printable invoice + delivery slip. The browser renders the QR from the tracking URL."""
    order = _load(db, order_id, shop.id)
    c = order.customer
    rows = "".join(f"<tr><td>{escape(i.name)}</td><td>{i.quantity}</td><td>${i.unit_price * i.quantity:.2f}</td></tr>"
                   for i in order.items)
    tracking = order.delivery.tracking_url if order.delivery else ""
    courier = COURIER[order.delivery.courier][0] if order.delivery else "—"
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{order.invoice_no}</title>
<style>body{{font-family:system-ui,sans-serif;max-width:380px;margin:24px auto;color:#0f172a}}
table{{width:100%;border-collapse:collapse}}td{{padding:4px 0;border-bottom:1px solid #e5e7ef}}
h1{{font-size:18px}}.muted{{color:#475569;font-size:12px}}.total{{font-weight:700;font-size:16px}}</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script></head>
<body onload="window.print()"><h1>{escape(shop.name)} · {order.invoice_no}</h1>
<p><b>{escape(c.name)}</b> · {escape(c.phone or '')}<br><span class="muted">{escape(order.delivery_address or '')}</span></p>
<table>{rows}<tr><td>Delivery</td><td></td><td>${order.delivery_fee:.2f}</td></tr></table>
<p class="total">Total ${order.total:.2f} · {order.status.value.replace('_', ' ')}</p>
<p class="muted">Courier: {escape(courier)} {escape(order.delivery.tracking_no if order.delivery else '')}</p>
<div id="qr"></div><script>if("{tracking}")new QRCode(document.getElementById("qr"),{{text:"{tracking}",width:140,height:140}})</script>
</body></html>"""


@router.get("/orders/{order_id}/invoice-image")
def get_order_invoice_image(order_id: int, shop: CurrentShop, _: ShopMember, db: DB) -> Response:
    """Retrieve or generate the official paid invoice receipt image."""
    order = _load(db, order_id, shop.id)
    from app.services.invoice_image import create_paid_invoice_image, generate_invoice_image_bytes

    if not order.invoice_url:
        order.invoice_url = create_paid_invoice_image(shop, order)
        db.commit()

    png_bytes = generate_invoice_image_bytes(shop, order)
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": f'inline; filename="{order.invoice_no}_invoice.png"'},
    )


@router.get("/orders/{order_id}/khqr-image")
def get_order_khqr_image(order_id: int, db: DB) -> Response:
    """Retrieve or dynamically generate the official National KHQR image for this order."""
    from app.models import Shop
    from app.services import payments

    order = db.scalars(select(Order).where(Order.id == order_id)).first()
    if order is None:
        raise HTTPException(404, "Order not found")
    shop_obj = db.get(Shop, order.shop_id)
    if shop_obj is None:
        raise HTTPException(404, "Shop not found")

    provider_obj = payments.invoice_provider(db, shop_obj)
    provider_name = order.payment_provider or (provider_obj.provider.value if provider_obj else "bakong")
    merchant = (provider_obj.merchant_name if provider_obj else None) or shop_obj.name
    account_id = (provider_obj.account_id if provider_obj else "") or "00123456"

    khqr = order.khqr
    if not khqr or payments.is_khqr_expired(khqr):
        khqr, provider_name = payments.khqr_for_order(db, shop_obj, order)
        order.khqr = khqr
        order.payment_provider = provider_name
        db.commit()

    png_bytes = payments.generate_khqr_image_bytes(
        shop_name=shop_obj.name,
        merchant_name=merchant,
        provider_type=provider_name,
        amount=order.total,
        bill_number=order.invoice_no,
        khqr_string=khqr,
        currency="USD",
    )
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": f'inline; filename="{order.invoice_no}_khqr.png"'},
    )


@router.post("/orders/{order_id}/regenerate-khqr")
def regenerate_order_khqr(order_id: int, db: DB) -> dict:
    """Regenerate a fresh 3-minute National KHQR for an active order."""
    import time
    from app.models import Shop
    from app.services import payments

    order = db.scalars(select(Order).where(Order.id == order_id)).first()
    if order is None:
        raise HTTPException(404, "Order not found")
    shop_obj = db.get(Shop, order.shop_id)
    if shop_obj is None:
        raise HTTPException(404, "Shop not found")

    khqr, provider_name = payments.khqr_for_order(db, shop_obj, order)
    order.khqr = khqr
    order.payment_provider = provider_name
    db.commit()

    exp_ms = payments.get_khqr_expiration_ms(khqr)
    now_ms = int(time.time() * 1000)
    remaining_sec = max(0, int(((exp_ms or (now_ms + 180000)) - now_ms) / 1000))
    deep_links = payments.build_deep_links(
        khqr=khqr,
        provider_type=provider_name,
        amount=order.total,
        bill_number=order.invoice_no,
    )

    return {
        "order_id": order.id,
        "invoice_no": order.invoice_no,
        "khqr": khqr,
        "provider": provider_name,
        "expires_at_ms": exp_ms,
        "remaining_seconds": remaining_sec,
        "deep_links": deep_links,
        "khqr_image_url": f"/api/v1/orders/{order.id}/khqr-image?t={now_ms}",
    }


@router.get("/track/{tracking_no}", tags=["public"])
def track(tracking_no: str, db: DB) -> dict:
    """Public tracking link sent to the customer."""
    d = db.scalars(select(Delivery).where(Delivery.tracking_no == tracking_no)).first()
    if d is None:
        raise HTTPException(404, "Tracking number not found")
    return {"tracking_no": d.tracking_no, "courier": COURIER[d.courier][0], "status": d.status,
            "invoice_no": d.order.invoice_no, "booked_at": d.created_at}
