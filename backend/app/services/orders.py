"""Order → payment → delivery workflow (see the "Order → payment → delivery" flow in Figma)."""

import logging
import secrets
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import (
    Conversation,
    Courier,
    Delivery,
    MessageKind,
    Order,
    OrderItem,
    OrderStatus,
    PaymentSlip,
    Product,
    Sender,
    Shop,
    SlipStatus,
    User,
    utcnow,
)
from app.services import inbox
from app.services.ai import SlipReading, is_khmer
from app.services.alerts import notify
from app.services.payments import bank_confirms, build_deep_links, check_slip, invoice_provider, khqr_for_order

ZONE_LABEL = {"phnom_penh": "Phnom Penh", "province": "Province", "grab": "Grab · 1 hour"}
COURIER = {
    Courier.jnt: ("J&T Express", "JT", "phnom_penh"),
    Courier.vet: ("Virak Buntham (VET)", "VET", "province"),
    Courier.grab: ("Grab Express", "GRB", "grab"),
}
LOYALTY_POINTS_PER_DOLLAR = 1
VIP_ORDER_COUNT = 5
log = logging.getLogger(__name__)


def next_invoice_no(db: Session, shop: Shop) -> str:
    """Atomic per-shop sequence (UPDATE … RETURNING): concurrent orders can never get the same number."""
    seq = db.execute(update(Shop).where(Shop.id == shop.id).values(invoice_seq=Shop.invoice_seq + 1)
                     .returning(Shop.invoice_seq)).scalar_one()
    return f"INV-{seq}"


def _money(v: Decimal) -> str:
    return f"${v:.2f}"


def create_order(db: Session, shop: Shop, conversation: Conversation, items: list[tuple[int, int]],
                 zone: str = "phnom_penh", address: str | None = None, by_ai: bool = True,
                 staff: User | None = None) -> Order:
    products = {p.id: p for p in db.scalars(
        select(Product).where(Product.shop_id == shop.id, Product.id.in_([pid for pid, _ in items]))
    )}
    if not products:
        raise HTTPException(400, "No valid products in this order")
    zone = zone if zone in ZONE_LABEL else "phnom_penh"
    order = Order(
        shop_id=shop.id,
        customer_id=conversation.customer_id,
        conversation_id=conversation.id,
        invoice_no=next_invoice_no(db, shop),
        delivery_zone=zone,
        delivery_address=address or conversation.customer.address,
        created_by_ai=by_ai,
        staff_id=staff.id if staff else conversation.assigned_staff_id,
    )
    for pid, qty in items:
        if p := products.get(pid):
            order.items.append(OrderItem(product_id=p.id, name=p.name, quantity=qty, unit_price=p.price))
    _recalculate(shop, order)
    db.add(order)
    db.flush()
    return order


def _recalculate(shop: Shop, order: Order) -> None:
    order.subtotal = sum((i.unit_price * i.quantity for i in order.items), Decimal(0))
    order.delivery_fee = Decimal(str((shop.delivery_fees or {}).get(order.delivery_zone or "phnom_penh", 1.5)))
    order.total = order.subtotal + order.delivery_fee


def update_order(db: Session, shop: Shop, order: Order, items: list[tuple[int, int]] | None,
                 zone: str | None, address: str | None) -> Order:
    if order.status not in (OrderStatus.awaiting_payment, OrderStatus.needs_review):
        raise HTTPException(409, "Only unpaid orders can be edited")
    if items is not None:
        products = {p.id: p for p in db.scalars(select(Product).where(
            Product.shop_id == shop.id, Product.id.in_([pid for pid, _ in items])))}
        order.items.clear()
        for pid, qty in items:
            if p := products.get(pid):
                order.items.append(OrderItem(product_id=p.id, name=p.name, quantity=qty, unit_price=p.price))
    if zone:
        order.delivery_zone = zone
    if address is not None:
        order.delivery_address = address
    _recalculate(shop, order)
    return order


def post_invoice(db: Session, shop: Shop, conversation: Conversation, order: Order, khmer: bool) -> None:
    khqr, provider = khqr_for_order(db, shop, order)
    order.khqr = khqr
    order.payment_provider = provider
    provider_obj = invoice_provider(db, shop)
    deep_links = build_deep_links(
        khqr,
        provider or "bakong",
        provider_obj.account_id if provider_obj else "",
        order.total,
        order.invoice_no,
    ) if khqr else {}

    zone = ZONE_LABEL.get(order.delivery_zone or "", "")
    lines = [f"🧾 {'វិក្កយបត្រ' if khmer else 'Invoice'} {order.invoice_no}"]
    lines += [f"{i.name} × {i.quantity} = {_money(i.unit_price * i.quantity)}" for i in order.items]
    lines.append(f"{'ដឹកជញ្ជូន' if khmer else 'Delivery'} {zone} = {_money(order.delivery_fee)}")

    if provider == "aba_payway":
        pay_with = "ABA KHQR"
    elif provider == "acleda":
        pay_with = "ACLEDA KHQR"
    else:
        pay_with = "Bakong KHQR"

    lines.append(f"{'សរុប' if khmer else 'Total'} = {_money(order.total)} — "
                 f"{'សូមបង់តាម' if khmer else 'please pay with'} {pay_with}")

    inbox.send_ai(
        db,
        conversation,
        "\n".join(lines),
        kind=MessageKind.invoice,
        attachment_url=f"/api/v1/orders/{order.id}/khqr-image" if khqr else None,
        meta={
            "order_id": order.id,
            "invoice_no": order.invoice_no,
            "total": float(order.total),
            "khqr": khqr,
            "provider": provider,
            "khqr_image_url": f"/api/v1/orders/{order.id}/khqr-image" if khqr else None,
            "deep_links": deep_links,
            "merchant_name": (provider_obj.merchant_name if provider_obj else None) or shop.name,
            "account_id": provider_obj.account_id if provider_obj else None,
            "is_paid_invoice": False,
        },
    )


def open_order(db: Session, conversation: Conversation) -> Order | None:
    return db.scalars(select(Order).where(
        Order.conversation_id == conversation.id,
        Order.status.in_([OrderStatus.awaiting_payment, OrderStatus.needs_review, OrderStatus.checking_slip]),
    ).order_by(Order.id.desc())).first()


def apply_slip(db: Session, shop: Shop, order: Order, reading: SlipReading, image_url: str | None) -> PaymentSlip:
    result = check_slip(db, shop, order, reading)
    slip = PaymentSlip(order_id=order.id, image_url=image_url, bank=reading.bank, amount=reading.amount,
                       receiver=reading.receiver, reference=reading.reference, paid_time=reading.paid_time,
                       confidence=reading.confidence, status=result.status, checks=result.checks)
    order.slips.append(slip)
    db.flush()
    conversation = db.get(Conversation, order.conversation_id) if order.conversation_id else None

    if result.status == SlipStatus.verified:
        order.status = OrderStatus.checking_slip
        if conversation:
            inbox.add_event(db, conversation, "🤖 AI is checking the slip with the bank…", tone="info")
        confirmed = bank_confirms(db, shop, order, order.khqr)
        if confirmed:
            mark_paid(db, shop, order, provider=order.payment_provider, bank_ref=reading.reference)
        elif confirmed is False:
            _needs_review(db, shop, order, "The bank has no matching transaction for this slip.")
    else:
        _needs_review(db, shop, order, _mismatch_reason(result.checks, order))
    return slip


def _mismatch_reason(checks: dict[str, bool], order: Order) -> str:
    if not checks.get("amount_matches"):
        return f"Slip amount does not match {_money(order.total)}."
    if not checks.get("receiver_matches"):
        return "Receiver name on the slip does not match the shop."
    if not checks.get("not_duplicate"):
        return "This slip reference was already used on another order."
    return "AI could not read the slip confidently."


def _needs_review(db: Session, shop: Shop, order: Order, reason: str) -> None:
    order.status = OrderStatus.needs_review
    notify(db, shop, "payment", f"⚠️ Check payment · {order.invoice_no}", reason,
           conversation_id=order.conversation_id)
    if order.conversation_id and (c := db.get(Conversation, order.conversation_id)):
        inbox.add_event(db, c, f"⚠️ Low confidence / mismatch — {reason} Human review needed.", tone="warning")


def mark_paid(db: Session, shop: Shop, order: Order, provider: str | None, bank_ref: str | None) -> Order:
    if order.status in (OrderStatus.paid, OrderStatus.confirmed, OrderStatus.shipped, OrderStatus.delivered):
        return order
    order.status = OrderStatus.paid
    order.paid_at = utcnow()
    order.payment_provider = provider or order.payment_provider
    order.bank_ref = bank_ref or order.bank_ref
    for slip in order.slips:
        if slip.status == SlipStatus.pending:
            slip.status = SlipStatus.verified

    # Generate high-resolution paid invoice receipt image
    invoice_url: str | None = None
    try:
        from app.services.invoice_image import create_paid_invoice_image

        invoice_url = create_paid_invoice_image(shop, order)
        order.invoice_url = invoice_url
    except Exception as e:
        log.error("Failed to generate paid invoice image for %s: %s", order.invoice_no, e)

    notify(db, shop, "payment", f"✓ {order.invoice_no} paid · {_money(order.total)}",
           f"Confirmed by {(order.payment_provider or 'the bank').replace('_', ' ').title()}",
           conversation_id=order.conversation_id)
    if order.conversation_id and (c := db.get(Conversation, order.conversation_id)):
        inbox.add_event(db, c, f"✓ Verified — {order.invoice_no} paid · {_money(order.total)}", tone="success")
        khmer = is_khmer(" ".join(m.body for m in c.messages[-5:] if m.sender == Sender.customer))
        reply_text = (
            f"🧾 {'វិក្កយបត្របង់ប្រាក់រួច' if khmer else 'Paid Invoice Receipt'} · {order.invoice_no}\n"
            f"✅ {'បានទទួលការទូទាត់' if khmer else 'Payment verified & received for'} {_money(order.total)}. "
            f"{'អរគុណបង 🙏 យើងនឹងរៀបចំផ្ញើជូនឆាប់ៗនេះ។' if khmer else 'Thank you 🙏 we will ship your order soon.'}"
        )
        inbox.send_ai(
            db,
            c,
            text=reply_text,
            kind=MessageKind.invoice if invoice_url else MessageKind.text,
            attachment_url=invoice_url,
            meta={
                "order_id": order.id,
                "invoice_no": order.invoice_no,
                "total": float(order.total),
                "is_paid_invoice": True,
                "paid_at": order.paid_at.isoformat() if order.paid_at else None,
                "invoice_url": invoice_url,
            },
        )
    return order


def confirm_and_print(db: Session, shop: Shop, order: Order, staff: User) -> Order:
    if order.status != OrderStatus.paid:
        raise HTTPException(409, "Confirm & Print is enabled after the bank confirms the transaction")
    for item in order.items:
        product = db.get(Product, item.product_id) if item.product_id else None
        if product is None:
            continue
        product.stock = max(0, product.stock - item.quantity)
        threshold = product.low_stock_threshold if product.low_stock_threshold is not None else shop.low_stock_threshold
        if product.stock < threshold:
            notify(db, shop, "low_stock", f"⚠️ {product.name} low stock",
                   f"Only {product.stock} left (threshold {threshold}). Time to restock.", telegram=True)
    order.status = OrderStatus.confirmed
    order.confirmed_at = utcnow()
    order.staff_id = order.staff_id or staff.id
    return order


def send_to_delivery(db: Session, shop: Shop, order: Order, courier: Courier, cash_on_delivery: bool,
                     staff: User) -> Delivery:
    if order.status == OrderStatus.paid:
        confirm_and_print(db, shop, order, staff)
    if order.status != OrderStatus.confirmed:
        raise HTTPException(409, "Only paid and confirmed orders can be sent to delivery")
    name, prefix, zone = COURIER[courier]
    tracking_no = f"{prefix}{secrets.randbelow(10**9):09d}"
    delivery = Delivery(
        order_id=order.id, courier=courier,
        fee=Decimal(str((shop.delivery_fees or {}).get(zone, order.delivery_fee))),
        cod_amount=Decimal(0) if not cash_on_delivery else order.total,
        tracking_no=tracking_no,
        tracking_url=f"{get_settings().public_base_url}/api/v1/track/{tracking_no}",
    )
    db.add(delivery)
    order.status = OrderStatus.shipped

    customer = order.customer
    customer.orders_count += 1
    customer.total_spent += order.total
    customer.loyalty_points += int(order.total) * LOYALTY_POINTS_PER_DOLLAR
    if customer.total_spent >= shop.vip_spend_threshold or customer.orders_count >= VIP_ORDER_COUNT:
        customer.is_vip = True
    db.flush()

    if order.conversation_id and (c := db.get(Conversation, order.conversation_id)):
        inbox.add_event(db, c, f"🚚 Sent to {name} · {tracking_no}", tone="info")
        khmer = is_khmer(" ".join(m.body for m in c.messages[-8:] if m.sender == Sender.customer))
        text = (f"🚚 អីវ៉ាន់របស់បងបានផ្ញើតាម {name} ហើយ។ តាមដាន: {delivery.tracking_url}" if khmer else
                f"🚚 Your order is on its way with {name}. Track it here: {delivery.tracking_url}")
        sender = Sender.staff if c.mode.value == "manual" else Sender.ai
        if sender == Sender.staff:
            inbox.send_staff(db, c, staff, text)
        else:
            inbox.send_ai(db, c, text)
    return delivery
