"""Response control workflow: sentiment priority → AI reply or hand-off → human takeover → resume AI."""

import logging
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.realtime.hub import hub
from app.models import (
    Channel,
    Conversation,
    ConversationMode,
    Customer,
    KnowledgeArticle,
    Message,
    MessageKind,
    Platform,
    Product,
    QuickReply,
    Sender,
    Sentiment,
    Shop,
    SystemSetting,
    User,
    utcnow,
)
from app.services import ai, usage
from app.services.alerts import notify
from app.integrations.messaging import send_image, send_text

log = logging.getLogger(__name__)

PREVIEW = {MessageKind.image: "[Photo]", MessageKind.voice: "[Voice message]", MessageKind.slip: "[Photo] Payment slip",
           MessageKind.product_card: "[Products]", MessageKind.invoice: "[Invoice]"}


def _publish(c: Conversation, message: Message | None = None) -> None:
    from app.schemas.mappers import conversation_summary, message_out

    data: dict[str, Any] = {"conversation": conversation_summary(c).model_dump(mode="json")}
    if message is not None:
        data["message"] = message_out(message).model_dump(mode="json")
    hub.publish(c.shop_id, "message" if message else "conversation", data)


def add_message(db: Session, c: Conversation, sender: Sender, body: str, kind: MessageKind = MessageKind.text,
                staff: User | None = None, attachment_url: str | None = None,
                meta: dict[str, Any] | None = None) -> Message:
    m = Message(conversation_id=c.id, sender=sender, kind=kind, body=body, staff_id=staff.id if staff else None,
                attachment_url=attachment_url, meta=meta or {})
    c.messages.append(m)
    if kind != MessageKind.event:
        prefix = PREVIEW.get(kind, "")
        c.last_message_preview = (f"{prefix} {body}".strip() if kind in (MessageKind.image, MessageKind.slip)
                                  else prefix or body)[:255]
        c.last_message_at = utcnow()
    if sender == Sender.customer:
        c.unread_count += 1
    db.flush()
    _publish(c, m)
    return m


def add_event(db: Session, c: Conversation, text: str, tone: str = "neutral") -> Message:
    return add_message(db, c, Sender.system, text, kind=MessageKind.event, meta={"tone": tone})


def send_ai(db: Session, c: Conversation, text: str, kind: MessageKind = MessageKind.text,
            attachment_url: str | None = None,
            meta: dict[str, Any] | None = None) -> Message:
    m = add_message(db, c, Sender.ai, text, kind=kind, attachment_url=attachment_url, meta=meta)
    if attachment_url:
        from app.core.config import get_settings
        settings = get_settings()
        full_url = attachment_url
        if attachment_url.startswith("/") and settings.public_base_url:
            full_url = f"{settings.public_base_url.rstrip('/')}{attachment_url}"
        send_image(db, c, full_url, caption=text)
    else:
        send_text(db, c, text)
    return m


def send_staff(db: Session, c: Conversation, staff: User, text: str) -> Message:
    m = add_message(db, c, Sender.staff, text, staff=staff)
    send_text(db, c, text)
    return m


def get_or_create_conversation(db: Session, shop: Shop, platform: Platform, external_user_id: str,
                               chat_id: str, name: str, channel: Channel | None = None) -> Conversation:
    customer = db.scalars(select(Customer).where(
        Customer.shop_id == shop.id, Customer.platform == platform, Customer.external_user_id == external_user_id
    )).first()
    if customer is None:
        customer = Customer(shop_id=shop.id, platform=platform, external_user_id=external_user_id, name=name)
        db.add(customer)
        db.flush()
    conversation = db.scalars(select(Conversation).where(
        Conversation.customer_id == customer.id, Conversation.platform == platform
    ).order_by(Conversation.id.desc())).first()
    if conversation is None:
        conversation = Conversation(shop_id=shop.id, customer_id=customer.id, platform=platform,
                                    external_chat_id=chat_id, channel_id=channel.id if channel else None)
        db.add(conversation)
        db.flush()
    return conversation


def receive(db: Session, shop: Shop, platform: Platform, user_id: str, chat_id: str, name: str, text: str = "",
            image: tuple[bytes, str, str] | None = None, channel: Channel | None = None) -> Conversation:
    """Entry point for every inbound customer message (workers and the dev simulator)."""
    c = get_or_create_conversation(db, shop, platform, user_id, chat_id, name, channel)
    # Serialize messages of the same conversation across all workers (row lock until commit).
    c = db.scalars(select(Conversation).where(Conversation.id == c.id).with_for_update()).one()
    handle_inbound(db, shop, c, text, image=image)
    return c


def handle_inbound(db: Session, shop: Shop, c: Conversation, text: str = "",
                   image: tuple[bytes, str, str] | None = None) -> None:
    """Process a customer message. `image` is (bytes, media_type, public_url)."""
    from app.services import orders

    if image:
        data, media_type, url = image
        pending = orders.open_order(db, c)
        add_message(db, c, Sender.customer, text, kind=MessageKind.slip if pending else MessageKind.image,
                    attachment_url=url)
        if pending:
            reading = ai.read_payment_slip(data, media_type)
            if reading.is_payment_slip:
                orders.apply_slip(db, shop, pending, reading, url)
                return
        if c.mode != ConversationMode.ai or not shop.ai_enabled:
            return
        # A photo that isn't a slip (e.g. a selfie for skin advice) goes through the normal assistant.
    else:
        add_message(db, c, Sender.customer, text)

    if c.mode != ConversationMode.ai or not shop.ai_enabled:
        # A human is handling it — still raise priority if the customer gets upset.
        rules = ai.rule_based_reply(shop, c.messages, [])
        if rules.sentiment == Sentiment.angry and not c.high_priority:
            _flag_high_priority(db, shop, c, rules.handoff_reason or "Customer is upset")
        _publish(c)
        return

    if not usage.has_quota(db, shop):
        _hand_off(db, shop, c, "Monthly AI reply limit reached — upgrade the plan to keep Auto-Pilot on.",
                  "សូមរង់ចាំបន្តិចបង 🙏 បុគ្គលិករបស់យើងនឹងឆ្លើយបងឆាប់ៗ។")
        return

    # Immediate handling if customer has an open unpaid order and asks for payment QR code
    pending = orders.open_order(db, c)
    QR_PAYMENT_PATTERNS = [
        r"\bqr\b", r"qr\s*code", r"qrcode", r"កូដ", r"បាញ់លុយ", r"បង់លុយ", r"បង់ប្រាក់",
        r"ផ្ញើ\s*qr", r"ផ្ញើរ\s*qr", r"សុំ\s*qr", r"លេខកូដ", r"ស្កេន", r"គណនី", r"\baba\b",
        r"acleda", r"bakong", r"\bpay\b", r"payment", r"how to pay", r"send qr", r"transfer",
    ]
    import re
    is_asking_qr = bool(text and any(re.search(pat, text.lower()) for pat in QR_PAYMENT_PATTERNS))

    if pending and is_asking_qr:
        from app.services import payments
        if not pending.khqr:
            khqr_str, p_name = payments.khqr_for_order(db, shop, pending)
            if khqr_str:
                pending.khqr = khqr_str
                if not pending.payment_provider:
                    pending.payment_provider = p_name
                db.flush()

        km = ai.is_khmer(text)
        qr_reply = (
            f"បាទ/ចាសបង 🙏 នេះជា QR Code សម្រាប់បង់ប្រាក់វិក្កយបត្រ {pending.invoice_no} ចំនួន ${pending.total:.2f}។ "
            f"សូមស្កេនបង់តាម Bakong/ABA KHQR ហើយផ្ញើបង្កាន់ដៃ (Slip) មកកាន់ទីនេះដើម្បីឱ្យប្រព័ន្ធផ្ទៀងផ្ទាត់ដោយស្វ័យប្រវត្តិ។"
            if km else
            f"Here is your payment QR Code for invoice {pending.invoice_no} (${pending.total:.2f}) 🙏 "
            f"Please scan with your banking app (Bakong/ABA KHQR) and send your payment slip here for instant verification."
        )
        img_url = f"/api/v1/orders/{pending.id}/khqr-image"
        send_ai(
            db,
            c,
            qr_reply,
            kind=MessageKind.invoice,
            attachment_url=img_url,
            meta={
                "order_id": pending.id,
                "invoice_no": pending.invoice_no,
                "total": float(pending.total),
                "khqr": pending.khqr,
                "provider": pending.payment_provider,
                "khqr_image_url": img_url,
                "is_paid_invoice": False,
            },
        )
        return

    setting = db.get(SystemSetting, "ai")
    platform_config = setting.value if setting else {}

    # Count consecutive AI turns since the last staff message or manual resume event
    ai_turns = 0
    for m in reversed(c.messages):
        if m.sender == Sender.staff or (m.kind == MessageKind.event and "resumed AI" in (m.body or "")):
            break
        if m.sender == Sender.ai:
            ai_turns += 1

    limit = platform_config.get("max_ai_replies_per_conversation", 50)
    if ai_turns >= limit:
        _hand_off(db, shop, c, "Long conversation — AI reply limit for one chat reached.",
                  "សូមរង់ចាំបន្តិចបង 🙏 បុគ្គលិករបស់យើងនឹងជួយបងបន្ត។")
        return

    products = list(db.scalars(select(Product).where(Product.shop_id == shop.id, Product.is_active)))
    knowledge = list(db.scalars(select(KnowledgeArticle).where(KnowledgeArticle.shop_id == shop.id)))


    decision = ai.decide_reply(shop, c.messages, products, knowledge, platform_config)
    usage.record_reply(db, shop.id, tokens=decision.tokens, provider=decision.provider)

    c.sentiment = decision.sentiment
    if decision.facts:
        facts = {**(c.ai_analysis or {}).get("facts", {}), **decision.facts}
        c.ai_analysis = {"facts": facts, "confidence": decision.confidence, "source": decision.source}
    if decision.recommended_product_ids:
        c.recommended_product_ids = list(dict.fromkeys(c.recommended_product_ids + decision.recommended_product_ids))

    if decision.needs_human:
        if decision.sentiment == Sentiment.angry:
            _flag_high_priority(db, shop, c, decision.handoff_reason)
        _hand_off(db, shop, c, decision.handoff_reason, decision.reply)
        return

    send_ai(
        db,
        c,
        decision.reply,
        meta={
            "tokens": decision.tokens,
            "provider": decision.provider,
            "model": decision.model_used,
        },
    )
    by_id = {p.id: p for p in products}
    if decision.order:
        order = orders.create_order(db, shop, c, decision.order.items, decision.order.delivery_zone,
                                    decision.order.address)
        if decision.order.phone and not c.customer.phone:
            c.customer.phone = decision.order.phone
        if decision.order.address and not c.customer.address:
            c.customer.address = decision.order.address
        orders.post_invoice(db, shop, c, order, khmer=ai.is_khmer(text))
    elif decision.recommended_product_ids:
        cards = [{"id": p.id, "name": p.name, "price": float(p.price), "image_url": p.image_url}
                 for pid in decision.recommended_product_ids if (p := by_id.get(pid))]
        if cards:
            add_message(db, c, Sender.ai, "", kind=MessageKind.product_card, meta={"products": cards})


def _flag_high_priority(db: Session, shop: Shop, c: Conversation, reason: str) -> None:
    c.high_priority = True
    vip = " ⭐ VIP" if c.customer.is_vip else ""
    notify(db, shop, "high_priority", f"🚨 High priority · {c.customer.name}{vip}", reason,
           conversation_id=c.id, telegram=True)


def _hand_off(db: Session, shop: Shop, c: Conversation, reason: str, polite_reply: str) -> None:
    send_ai(db, c, polite_reply)
    c.mode = ConversationMode.waiting_staff
    add_event(db, c, "[Wait Staff 🔴] · AI handed off to staff", tone="danger")
    if not c.high_priority:
        notify(db, shop, "wait_staff", f"🔴 {c.customer.name} is waiting for staff", reason, conversation_id=c.id)
    _publish(c)


def take_over(db: Session, c: Conversation, staff: User) -> Conversation:
    c.mode = ConversationMode.manual
    c.assigned_staff_id = staff.id
    c.unread_count = 0
    add_event(db, c, f"{staff.full_name} took over · AI paused", tone="brand")
    return c


def resume_ai(db: Session, c: Conversation, staff: User) -> Conversation:
    c.mode = ConversationMode.ai
    c.high_priority = False
    c.sentiment = Sentiment.normal if c.sentiment == Sentiment.angry else c.sentiment
    add_event(db, c, f"{staff.full_name} resumed AI · back to Auto-Pilot 🟢", tone="success")
    return c


def staff_reply(db: Session, shop: Shop, c: Conversation, staff: User, body: str) -> Message:
    if c.mode == ConversationMode.ai:
        raise HTTPException(409, 'Input is locked while AI is replying — click "Take over" first')
    if c.mode == ConversationMode.waiting_staff or c.assigned_staff_id != staff.id:
        take_over(db, c, staff)
    text = body.strip()
    if text.startswith("/") and " " not in text:
        qr = db.scalars(select(QuickReply).where(QuickReply.shop_id == shop.id, QuickReply.command == text)).first()
        if qr:
            text = qr.text
    c.unread_count = 0
    return send_staff(db, c, staff, text)
