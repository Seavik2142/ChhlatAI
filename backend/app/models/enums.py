from enum import StrEnum


class Role(StrEnum):
    super_admin = "super_admin"
    owner = "owner"
    staff = "staff"


class ShopStatus(StrEnum):
    trial = "trial"
    active = "active"
    suspended = "suspended"


class Platform(StrEnum):
    telegram = "telegram"
    facebook = "facebook"
    instagram = "instagram"
    tiktok = "tiktok"


class Sentiment(StrEnum):
    normal = "normal"
    interested = "interested"
    angry = "angry"


class ConversationMode(StrEnum):
    ai = "ai"  # AI Auto-Pilot replies
    waiting_staff = "waiting_staff"  # AI handed off politely and is waiting for a human
    manual = "manual"  # a staff member took over; AI is paused


class Sender(StrEnum):
    customer = "customer"
    ai = "ai"
    staff = "staff"
    system = "system"


class MessageKind(StrEnum):
    text = "text"
    image = "image"
    voice = "voice"
    product_card = "product_card"
    invoice = "invoice"
    slip = "slip"
    event = "event"


class OrderStatus(StrEnum):
    awaiting_payment = "awaiting_payment"
    checking_slip = "checking_slip"
    needs_review = "needs_review"  # low confidence / amount mismatch
    paid = "paid"  # bank confirmed — ready for staff to Confirm & Print
    confirmed = "confirmed"  # printed, stock deducted
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class SlipStatus(StrEnum):
    pending = "pending"
    verified = "verified"
    mismatch = "mismatch"


class PaymentProviderType(StrEnum):
    bakong = "bakong"
    aba_payway = "aba_payway"
    acleda = "acleda"


class Courier(StrEnum):
    jnt = "jnt"
    vet = "vet"
    grab = "grab"
