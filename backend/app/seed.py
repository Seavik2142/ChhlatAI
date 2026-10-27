"""Demo data matching the Figma file. Run: python -m app.seed"""

from datetime import timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import (
    AIUsage,
    Announcement,
    Channel,
    Conversation,
    ConversationMode,
    Courier,
    Customer,
    Delivery,
    KnowledgeArticle,
    Message,
    MessageKind,
    Notification,
    Order,
    OrderItem,
    OrderStatus,
    PaymentProvider,
    PaymentProviderType,
    PaymentSlip,
    Plan,
    Platform,
    Product,
    QuickReply,
    Role,
    Sender,
    Sentiment,
    Shop,
    ShopStatus,
    SlipStatus,
    SystemSetting,
    User,
    utcnow,
)
from app.services.usage import current_period

DEMO_PASSWORDS = {
    "admin@omnichat.kh": "Admin@12345",
    "owner@glowskin.kh": "Owner@12345",
    "vanna@glowskin.kh": "Staff@12345",
}


def ago(**kw):
    return utcnow() - timedelta(**kw)


def seed_notifications(db: Session, shop_id: int | None = None, coffee_id: int | None = None) -> None:
    if not db.scalar(select(Notification.id)):
        db.add_all([
            Notification(
                shop_id=shop_id,
                kind="payment",
                title="Bakong KHQR Payment Verified",
                body="Order INV-1187 ($15.50) received ABA payment slip. Matched with KHQR transaction.",
                is_read=False,
            ),
            Notification(
                shop_id=coffee_id,
                kind="high_priority",
                title="Omnichannel Sync: Brown Bean Coffee",
                body="Enterprise tier store connected Facebook Messenger, Instagram, and TikTok live.",
                is_read=True,
            ),
            Notification(
                shop_id=None,
                kind="system",
                title="System Operational & Clusters Active",
                body="FastAPI backend, PostgreSQL database, and WebSocket event hub running with zero errors.",
                is_read=False,
            ),
        ])
        db.commit()
        print("Seeded default notifications.")


def seed() -> None:
    db = SessionLocal()
    if db.scalar(select(User.id).where(User.email == "admin@omnichat.kh")):
        print("Demo data already present — checking missing records...")
        shop = db.scalar(select(Shop).where(Shop.slug == "glow-skin-cambodia"))
        coffee = db.scalar(select(Shop).where(Shop.slug == "brown-bean-coffee"))
        seed_notifications(db, shop.id if shop else None, coffee.id if coffee else None)
        print("Demo data verified.")
        return

    free = Plan(code="free", name="Free", price_monthly=0, ai_replies_limit=500, staff_seats=1, channels_limit=1,
                features=["1 channel (Telegram)", "500 AI replies / month", "1 staff seat", "Unified inbox",
                          "Bakong KHQR payments"])
    pro = Plan(code="pro", name="Pro", price_monthly=29, ai_replies_limit=10_000, staff_seats=5, channels_limit=4,
               features=["All 4 channels", "10,000 AI replies / month", "5 staff seats",
                         "Bakong, ABA PayWay & ACLEDA", "AI marketing broadcast", "Low-stock alerts & VIP tags"])
    ent = Plan(code="enterprise", name="Enterprise", price_monthly=99, ai_replies_limit=100_000, staff_seats=999,
               channels_limit=99, features=["Unlimited channels", "100,000 AI replies / month",
                                            "Unlimited staff & branches", "Delivery API (J&T, VET, Grab)",
                                            "TikTok Live orders", "Priority support on Telegram"])
    db.add_all([free, pro, ent])
    db.flush()

    db.add(User(email="admin@omnichat.kh", password_hash=hash_password(DEMO_PASSWORDS["admin@omnichat.kh"]),
                full_name="OmniChat Admin", role=Role.super_admin))

    shop = Shop(name="Glow Skin Cambodia", slug="glow-skin-cambodia", category="Skincare", status=ShopStatus.active,
                plan_id=pro.id, phone="012 345 999", address="St. 271, Toul Kork, Phnom Penh",
                ai_instructions="We are a skincare shop. Always remind customers to patch-test new products.",
                invoice_seq=1187, created_at=ago(days=210))
    agri = Shop(name="Kasekor Agri Depot", slug="kasekor-agri-depot", category="Agriculture", status=ShopStatus.active,
                plan_id=pro.id, created_at=ago(days=95))
    coffee = Shop(name="Brown Bean Coffee", slug="brown-bean-coffee", category="Coffee", status=ShopStatus.trial,
                  plan_id=free.id, created_at=ago(days=6))
    db.add_all([shop, agri, coffee])
    db.flush()

    owner = User(email="owner@glowskin.kh", password_hash=hash_password(DEMO_PASSWORDS["owner@glowskin.kh"]),
                 full_name="Sreypov C.", role=Role.owner, shop_id=shop.id)
    vanna = User(email="vanna@glowskin.kh", password_hash=hash_password(DEMO_PASSWORDS["vanna@glowskin.kh"]),
                 full_name="Vanna C.", role=Role.staff, shop_id=shop.id, commission_rate=Decimal(3), is_online=True)
    db.add_all([
        owner, vanna,
        User(email="dara@kasekor.kh", password_hash=hash_password("Owner@12345"), full_name="Dara S.",
             role=Role.owner, shop_id=agri.id),
        User(email="visal@brownbean.kh", password_hash=hash_password("Owner@12345"), full_name="Visal K.",
             role=Role.owner, shop_id=coffee.id),
    ])
    db.flush()

    channels = {
        Platform.telegram: Channel(shop_id=shop.id, platform=Platform.telegram, name="@glowskin_bot",
                                   external_id="glowskin_bot"),
        Platform.facebook: Channel(shop_id=shop.id, platform=Platform.facebook, name="Glow Skin Cambodia",
                                   external_id="100200300"),
        Platform.instagram: Channel(shop_id=shop.id, platform=Platform.instagram, name="@glowskin.kh",
                                    external_id="178400200"),
        Platform.tiktok: Channel(shop_id=shop.id, platform=Platform.tiktok, name="@glowskin.kh",
                                 external_id="tt-glowskin"),
    }
    db.add_all(channels.values())
    db.add_all([
        PaymentProvider(shop_id=shop.id, provider=PaymentProviderType.bakong, environment="sandbox",
                        is_connected=True, merchant_name="GLOW SKIN CAMBODIA", account_id="glowskin@aclb",
                        methods=["KHQR · USD", "KHQR · KHR"], token_expires_at=utcnow() + timedelta(days=74)),
        PaymentProvider(shop_id=shop.id, provider=PaymentProviderType.aba_payway, environment="sandbox",
                        is_connected=True, use_for_invoices=False, merchant_name="GLOW SKIN CAMBODIA",
                        account_id="ec000262", methods=["ABA KHQR", "Cards", "Deeplink"]),
        PaymentProvider(shop_id=shop.id, provider=PaymentProviderType.acleda, is_connected=False,
                        methods=["KHQR", "Account / Wallet", "Cards (MPGS)"]),
    ])

    p = {
        "cleanser": Product(shop_id=shop.id, name="Gentle Foam Cleanser", sku="GS-CL-01", category="Cleanser",
                            price=Decimal("9.50"), stock=24,
                            image_url="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80",
                            description="Low-pH foam cleanser for oily and acne-prone skin. Morning and night."),
        "serum": Product(shop_id=shop.id, name="Acne Clear Serum 30ml", sku="GS-SR-02", category="Serum",
                         price=Decimal("14.00"), stock=6,
                         image_url="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80",
                         description="2% salicylic acid + niacinamide night serum for breakouts and oily skin."),
        "toner": Product(shop_id=shop.id, name="Hydrating Toner 150ml", sku="GS-TN-03", category="Toner",
                         price=Decimal("11.00"), stock=3,
                         image_url="https://images.unsplash.com/photo-1608248597359-2e635f793b86?auto=format&fit=crop&w=400&q=80",
                         description="Alcohol-free hyaluronic toner for dry and sensitive skin."),
        "spf": Product(shop_id=shop.id, name="Daily Sunscreen SPF50", sku="GS-SPF-04", category="Sunscreen",
                       price=Decimal("12.50"), stock=18,
                       image_url="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80",
                       description="Light, non-greasy SPF50 PA++++ for Cambodian heat. Every morning."),
        "vitc": Product(shop_id=shop.id, name="Vitamin C Bright Serum", sku="GS-VC-05", category="Serum",
                        price=Decimal("16.00"), stock=10,
                        image_url="https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=400&q=80",
                        description="10% vitamin C for dark spots and dull skin. Morning, under sunscreen."),
        "cream": Product(shop_id=shop.id, name="Night Repair Cream", sku="GS-NC-06", category="Moisturiser",
                         price=Decimal("18.00"), stock=8,
                         image_url="https://images.unsplash.com/photo-1567928815116-f28876e65005?auto=format&fit=crop&w=400&q=80",
                         description="Ceramide night cream for dry skin and a damaged skin barrier."),
    }
    db.add_all(p.values())
    db.add_all([
        KnowledgeArticle(shop_id=shop.id, title="Skin type guide", content=(
            "Oily / acne-prone: Gentle Foam Cleanser + Acne Clear Serum at night + Daily Sunscreen.\n"
            "Dry / sensitive: Hydrating Toner + Night Repair Cream.\n"
            "Dark spots: Vitamin C Bright Serum in the morning, always with sunscreen.\n"
            "Pregnant or breastfeeding customers should ask a doctor before using salicylic acid.")),
        KnowledgeArticle(shop_id=shop.id, title="Delivery & payment", content=(
            "Phnom Penh delivery $1.50 (J&T, same/next day). Provinces $2.00 (Virak Buntham, next morning). "
            "Grab Express within 1 hour in Phnom Penh $2.80. Pay by Bakong KHQR or ABA. "
            "Exchanges within 7 days if unopened.")),
    ])
    db.add_all([
        QuickReply(shop_id=shop.id, command="/price", text="ផ្ញើព័ត៌មានតម្លៃផលិតផល + link: https://glowskin.kh/shop"),
        QuickReply(shop_id=shop.id, command="/delivery", text="ថ្លៃដឹក: ភ្នំពេញ $1.50 · ខេត្ត $2.00 · Grab 1 ម៉ោង $2.80"),
        QuickReply(shop_id=shop.id, command="/bank", text="ABA: GLOW SKIN CAMBODIA · 000 123 456 + KHQR"),
    ])
    db.flush()

    def customer(name, platform, ext, **kw):
        c = Customer(shop_id=shop.id, name=name, platform=platform, external_user_id=ext, **kw)
        db.add(c)
        return c

    def conversation(cust, *, mode=ConversationMode.ai, sentiment=Sentiment.normal, high=False, unread=0,
                     minutes=0, staff=None, analysis=None, recs=None):
        conv = Conversation(shop_id=shop.id, customer=cust, platform=cust.platform,
                            external_chat_id=cust.external_user_id, channel_id=channels[cust.platform].id,
                            mode=mode, sentiment=sentiment, high_priority=high, unread_count=unread,
                            last_message_at=ago(minutes=minutes), assigned_staff_id=staff.id if staff else None,
                            ai_analysis=analysis or {}, recommended_product_ids=recs or [])
        db.add(conv)
        db.flush()
        return conv

    def msg(conv, sender, body, minutes, kind=MessageKind.text, staff=None, **meta):
        m = Message(conversation_id=conv.id, sender=sender, body=body, kind=kind, meta=meta,
                    staff_id=staff.id if staff else None, created_at=ago(minutes=minutes))
        db.add(m)
        if kind != MessageKind.event:
            conv.last_message_preview = {MessageKind.slip: "[Photo] ABA slip"}.get(kind, body)[:255]
        return m

    # Dara Sok — VIP, angry, paid order not shipped (ST-02)
    dara = customer("Dara Sok", Platform.instagram, "ig-dara", phone="012 345 678", is_vip=True, orders_count=6,
                    total_spent=Decimal("214.00"), loyalty_points=214, address="#45, St. 271, Toul Kork, Phnom Penh",
                    created_at=ago(days=220))
    c1 = conversation(dara, mode=ConversationMode.waiting_staff, sentiment=Sentiment.angry, high=True, unread=3)
    inv1172 = Order(shop_id=shop.id, customer=dara, conversation_id=c1.id, invoice_no="INV-1172",
                    status=OrderStatus.shipped, subtotal=Decimal("43.50"), delivery_fee=Decimal("1.50"),
                    total=Decimal("45.00"), delivery_zone="phnom_penh", delivery_address=dara.address,
                    payment_provider="aba_payway", bank_ref="100FT3381207", paid_at=ago(hours=17),
                    confirmed_at=ago(hours=16), created_at=ago(hours=18), staff_id=vanna.id)
    inv1172.items = [OrderItem(product_id=None, name="Vitamin C Bright Serum", quantity=1, unit_price=Decimal(16)),
                     OrderItem(product_id=None, name="Night Repair Cream", quantity=1, unit_price=Decimal(18)),
                     OrderItem(product_id=None, name="Gentle Foam Cleanser", quantity=1, unit_price=Decimal("9.50"))]
    db.add(inv1172)
    db.flush()
    db.add(Delivery(order_id=inv1172.id, courier=Courier.jnt, fee=Decimal("1.50"), tracking_no="JT004418230",
                    tracking_url="http://localhost:8000/api/v1/track/JT004418230", status="pickup_missed",
                    created_at=ago(hours=16)))
    msg(c1, Sender.customer, "ខ្ញុំវេរលុយតាំងពីម្សិលមិញ មិនទាន់ឃើញផ្ញើអីវ៉ាន់ទេ! 😡", 3)
    msg(c1, Sender.customer, "ធ្វើការបែបនេះមែន?? ចង់បានលុយវិញ!", 2)
    msg(c1, Sender.ai, "សូមអភ័យទោសបង 🙏 ខ្ញុំកំពុងភ្ជាប់បងទៅកាន់បុគ្គលិករបស់យើងភ្លាមៗ។", 2)
    msg(c1, Sender.system, "[Wait Staff 🔴] · AI handed off to staff", 2, kind=MessageKind.event, tone="danger")
    msg(c1, Sender.customer, "ខ្ញុំវេរលុយតាំងពីម្សិលមិញ មិនទាន់ឃើញផ្ញើអីវ៉ាន់ទេ!", 0)

    # Bopha Heng — VIP asking for a discount (needs staff)
    bopha = customer("Bopha Heng", Platform.facebook, "fb-bopha", is_vip=True, orders_count=5,
                     total_spent=Decimal("162.00"), loyalty_points=162, created_at=ago(days=150))
    c2 = conversation(bopha, mode=ConversationMode.waiting_staff, sentiment=Sentiment.interested, unread=1, minutes=3)
    msg(c2, Sender.customer, "ចង់បានបញ្ចុះតម្លៃ 30% បានទេបង?", 3)
    msg(c2, Sender.ai, "បាទ/ចាស បង 🙏 សូមរង់ចាំបន្តិច បុគ្គលិករបស់យើងនឹងឆ្លើយបងភ្លាមៗ។", 3)
    msg(c2, Sender.system, "[Wait Staff 🔴] · AI handed off to staff", 3, kind=MessageKind.event, tone="danger")

    # Channy Lim — new lead, AI sold Acne Clear Serum, ABA slip being checked (ST-01 hero)
    channy = customer("Channy Lim", Platform.facebook, "fb-channy", phone="012 777 845", created_at=ago(minutes=12))
    c3 = conversation(channy, sentiment=Sentiment.interested, minutes=1,
                      analysis={"facts": {"Skin type": "Oily · acne-prone"}, "confidence": 0.9, "source": "claude"},
                      recs=[])
    msg(c3, Sender.system, "Today · ថ្ងៃនេះ", 12, kind=MessageKind.event, tone="neutral")
    msg(c3, Sender.customer, "សួស្តីបង! ស្បែកខ្ញុំប្រែង ហើយមុនច្រើន គួរប្រើអ្វីល្អ?", 11)
    msg(c3, Sender.customer, "Selfie · face skin", 11, kind=MessageKind.image)
    msg(c3, Sender.ai, "ជម្រាបសួរបង 🙏 តាមរូបភាព ស្បែកបងទំនងជាស្បែកប្រែង និងមានមុនតិចតួច។ ខ្ញុំណែនាំ Cleanser ស្រាល និង "
                       "Serum ប្រឆាំងមុន ពេលយប់ 👇", 10)
    db.flush()
    c3.recommended_product_ids = [p["cleanser"].id, p["serum"].id]
    msg(
        c3,
        Sender.ai,
        "",
        8,
        kind=MessageKind.product_card,
        products=[
            {"id": p["cleanser"].id, "name": p["cleanser"].name, "price": 9.5, "image_url": p["cleanser"].image_url},
            {"id": p["serum"].id, "name": p["serum"].name, "price": 14.0, "image_url": p["serum"].image_url},
        ],
    )
    msg(c3, Sender.customer, "OK យក Serum 1 ដប ផ្ញើទៅ BKK1 🙏", 6)
    inv1187 = Order(shop_id=shop.id, customer=channy, conversation_id=c3.id, invoice_no="INV-1187",
                    status=OrderStatus.checking_slip, subtotal=Decimal(14), delivery_fee=Decimal("1.50"),
                    total=Decimal("15.50"), delivery_zone="phnom_penh", delivery_address="BKK1, Phnom Penh",
                    payment_provider="bakong", created_at=ago(minutes=6))
    inv1187.items = [OrderItem(product_id=p["serum"].id, name=p["serum"].name, quantity=1, unit_price=Decimal(14))]
    db.add(inv1187)
    db.flush()
    msg(c3, Sender.ai, "🧾 វិក្កយបត្រ INV-1187\nAcne Clear Serum × 1 = $14.00\nដឹកជញ្ជូន BKK1 = $1.50\n"
                       "សរុប = $15.50 — សូមបង់តាម ABA KHQR", 6, kind=MessageKind.invoice,
        order_id=inv1187.id, invoice_no="INV-1187", total=15.5)
    msg(c3, Sender.customer, "", 3, kind=MessageKind.slip, bank="ABA Mobile", amount=-15.5,
        receiver="GLOW SKIN CAMBODIA")
    db.add(PaymentSlip(order_id=inv1187.id, bank="ABA Mobile", amount=Decimal("15.50"),
                       receiver="GLOW SKIN CAMBODIA", reference="100FT3390114", paid_time="10:09", confidence=0.94,
                       status=SlipStatus.verified,
                       checks={"amount_matches": True, "receiver_matches": True, "not_duplicate": True,
                               "confident": True}))
    msg(c3, Sender.system, "🤖 AI is checking the ABA slip with the bank…", 1, kind=MessageKind.event, tone="info")

    # Rithy Kong — normal, AI answering delivery fee
    rithy = customer("Rithy Kong", Platform.telegram, "tg-rithy", created_at=ago(days=3))
    c4 = conversation(rithy, minutes=6)
    msg(c4, Sender.customer, "Delivery ទៅ Toul Kork ប៉ុន្មាន?", 7)
    msg(c4, Sender.ai, "ដឹកក្នុងភ្នំពេញ (Toul Kork) តម្លៃ $1.50 បង 🙏 ដល់ក្នុងថ្ងៃនេះ ឬថ្ងៃស្អែក។", 6)

    # Sophea Meas — TikTok, Vanna handling manually
    sophea = customer("Sophea Meas", Platform.tiktok, "tt-sophea", created_at=ago(days=1))
    c5 = conversation(sophea, mode=ConversationMode.manual, sentiment=Sentiment.interested, minutes=11, staff=vanna)
    msg(c5, Sender.system, "Vanna C. took over · AI paused", 14, kind=MessageKind.event, tone="brand")
    msg(c5, Sender.staff, "ចាស បង F1 គឺ Gentle Foam Cleanser តម្លៃ $9.50 🙏", 13, staff=vanna)
    msg(c5, Sender.customer, "F1 2 ដប 🙏", 11)

    # Kimleng Tan — English, toner question (low stock)
    kim = customer("Kimleng Tan", Platform.instagram, "ig-kimleng", created_at=ago(days=12))
    c6 = conversation(kim, minutes=19)
    msg(c6, Sender.customer, "Hello, do you have the toner in stock?", 19)
    msg(c6, Sender.ai, "Hello 🙏 Yes — Hydrating Toner 150ml is $11.00 and we have 3 left. Would you like one?", 19)

    # Sovann Pich — happy delivered customer
    sovann = customer("Sovann Pich", Platform.telegram, "tg-sovann", orders_count=1, total_spent=Decimal("27.50"),
                      loyalty_points=27, created_at=ago(days=9))
    c7 = conversation(sovann, minutes=32)
    msg(c7, Sender.ai, "🚚 អីវ៉ាន់របស់បងបានផ្ញើតាម J&T Express ហើយ។", 40)
    msg(c7, Sender.customer, "អរគុណបង ទទួលបានហើយ 👍", 32)

    # A week of paid orders for the dashboard chart.
    history = [(6, 3, "cleanser"), (6, 1, "spf"), (5, 2, "serum"), (4, 1, "vitc"), (4, 2, "cleanser"),
               (3, 1, "cream"), (2, 2, "spf"), (2, 1, "serum"), (1, 3, "cleanser"), (1, 1, "vitc"), (0, 1, "cream")]
    for n, (days, qty, key) in enumerate(history):
        prod = p[key]
        total = prod.price * qty + Decimal("1.50")
        o = Order(shop_id=shop.id, customer=sovann if n % 2 else rithy, invoice_no=f"INV-{1100 + n}",
                  status=OrderStatus.delivered, subtotal=prod.price * qty, delivery_fee=Decimal("1.50"), total=total,
                  delivery_zone="phnom_penh", payment_provider="bakong", paid_at=ago(days=days),
                  created_at=ago(days=days, hours=1), staff_id=vanna.id if n % 3 == 0 else None)
        o.items = [OrderItem(product_id=prod.id, name=prod.name, quantity=qty, unit_price=prod.price)]
        db.add(o)

    db.add(AIUsage(shop_id=shop.id, period=current_period(), replies=1840))
    db.add(Announcement(title="ACLEDA Toan Chet Pay is live",
                        body="Connect ACLEDA in Settings → Payments to accept XPAY and MPGS cards.", audience="owners"))
    db.add(SystemSetting(key="ai", value={"model": "claude-opus-5-5", "global_instructions": (
        "Never ask customers for card numbers, PINs or passwords."), "handoff_on_discount": True,
        "max_ai_replies_per_conversation": 30}))

    seed_notifications(db, shop.id, coffee.id)
    db.commit()
    print("Seeded demo data. Logins:")
    for email, password in DEMO_PASSWORDS.items():
        print(f"  {email} / {password}")


if __name__ == "__main__":
    seed()
