from fastapi import APIRouter, Form, HTTPException, UploadFile
from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import contains_eager, selectinload

from app.core.config import get_settings
from app.integrations.storage import get_storage
from app.api.deps import DB, CurrentShop, ShopMember, get_in_shop
from app.models import (
    Conversation,
    ConversationMode,
    Customer,
    KnowledgeArticle,
    Message,
    MessageKind,
    Platform,
    Product,
    Sender,
    Sentiment,
)
from app.schemas import ConversationDetail, MessageOut, SimulateInboundIn, StaffMessageIn, SuggestIn
from app.schemas.mappers import conversation_detail, conversation_summary, message_out
from app.services import ai, inbox

router = APIRouter(prefix="/conversations", tags=["inbox"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_AUDIO_TYPES = {"audio/ogg", "audio/mpeg", "audio/mp4", "audio/webm", "audio/wav"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


async def save_upload(file: UploadFile, allowed: set[str]) -> tuple[bytes, str, str]:
    if file.content_type not in allowed:
        raise HTTPException(415, f"Unsupported file type {file.content_type}")
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File is larger than 10 MB")
    ext = file.filename.rsplit(".", 1)[-1].lower()[:8] if file.filename and "." in file.filename else "bin"
    return data, file.content_type, get_storage().save(data, file.content_type, ext)


# AI priority: urgent first, then chats waiting for a human, then hot leads, then newest.
PRIORITY_ORDER = (
    Conversation.high_priority.desc(),
    case((Conversation.mode == ConversationMode.waiting_staff, 0), else_=1),
    case((Conversation.sentiment == Sentiment.angry, 0), (Conversation.sentiment == Sentiment.interested, 1), else_=2),
    Conversation.last_message_at.desc(),
)


@router.get("")
def list_conversations(shop: CurrentShop, user: ShopMember, db: DB, tab: str = "all", q: str | None = None,
                       limit: int = 50) -> dict:
    base = (select(Conversation).join(Customer).where(Conversation.shop_id == shop.id)
            .options(contains_eager(Conversation.customer), selectinload(Conversation.assigned_staff)))
    if q:
        like = f"%{q}%"
        base = base.where(or_(Customer.name.ilike(like), Customer.phone.ilike(like),
                              Conversation.last_message_preview.ilike(like)))
    filters = {
        "staff": Conversation.mode.in_([ConversationMode.waiting_staff, ConversationMode.manual]),
        "ai": Conversation.mode == ConversationMode.ai,
        "vip": Customer.is_vip,
        "mine": Conversation.assigned_staff_id == user.id,
    }
    # One aggregate query for every tab badge instead of one COUNT per tab.
    count_q = select(func.count(), *[func.count().filter(cond) for cond in filters.values()]).select_from(
        Conversation).join(Customer).where(Conversation.shop_id == shop.id)
    if q:
        count_q = count_q.where(or_(Customer.name.ilike(like), Customer.phone.ilike(like),
                                    Conversation.last_message_preview.ilike(like)))
    totals = db.execute(count_q).one()
    counts = {"all": totals[0], **dict(zip(filters, totals[1:], strict=True))}
    stmt = base.where(filters[tab]) if tab in filters else base
    rows = db.scalars(stmt.order_by(*PRIORITY_ORDER).limit(min(limit, 200))).all()
    return {"items": [conversation_summary(c) for c in rows], "counts": counts}


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation(conversation_id: int, shop: CurrentShop, _: ShopMember, db: DB):
    c = db.scalars(select(Conversation).where(Conversation.id == conversation_id, Conversation.shop_id == shop.id)
                   .options(selectinload(Conversation.messages).selectinload(Message.staff),
                            selectinload(Conversation.customer), selectinload(Conversation.assigned_staff))).first()
    if c is None:
        raise HTTPException(404, "Conversation not found")
    return conversation_detail(db, c)


@router.post("/{conversation_id}/read", status_code=204)
def mark_read(conversation_id: int, shop: CurrentShop, _: ShopMember, db: DB) -> None:
    get_in_shop(db, Conversation, conversation_id, shop.id).unread_count = 0
    db.commit()


@router.post("/{conversation_id}/takeover", response_model=ConversationDetail)
def take_over(conversation_id: int, shop: CurrentShop, user: ShopMember, db: DB):
    c = get_in_shop(db, Conversation, conversation_id, shop.id)
    inbox.take_over(db, c, user)
    db.commit()
    return conversation_detail(db, c)


@router.post("/{conversation_id}/resume-ai", response_model=ConversationDetail)
def resume_ai(conversation_id: int, shop: CurrentShop, user: ShopMember, db: DB):
    c = get_in_shop(db, Conversation, conversation_id, shop.id)
    inbox.resume_ai(db, c, user)
    db.commit()
    return conversation_detail(db, c)


@router.post("/{conversation_id}/messages", response_model=MessageOut, status_code=201)
def send_message(conversation_id: int, body: StaffMessageIn, shop: CurrentShop, user: ShopMember, db: DB):
    c = get_in_shop(db, Conversation, conversation_id, shop.id)
    m = inbox.staff_reply(db, shop, c, user, body.body)
    db.commit()
    return message_out(m)


@router.post("/{conversation_id}/media", response_model=MessageOut, status_code=201)
async def send_media(conversation_id: int, file: UploadFile, shop: CurrentShop, user: ShopMember, db: DB):
    """Staff replies with a photo or a voice note."""
    c = get_in_shop(db, Conversation, conversation_id, shop.id)
    if c.mode == ConversationMode.ai:
        raise HTTPException(409, 'Input is locked while AI is replying — click "Take over" first')
    is_audio = file.content_type in ALLOWED_AUDIO_TYPES
    _, _, url = await save_upload(file, ALLOWED_IMAGE_TYPES | ALLOWED_AUDIO_TYPES)
    kind = MessageKind.voice if is_audio else MessageKind.image
    m = inbox.add_message(db, c, Sender.staff, "", kind=kind, staff=user, attachment_url=url)
    db.commit()
    return message_out(m)


@router.post("/{conversation_id}/suggest")
def suggest(conversation_id: int, body: SuggestIn, shop: CurrentShop, _: ShopMember, db: DB) -> dict:
    c = get_in_shop(db, Conversation, conversation_id, shop.id)
    products = list(db.scalars(select(Product).where(Product.shop_id == shop.id, Product.is_active)))
    knowledge = list(db.scalars(select(KnowledgeArticle).where(KnowledgeArticle.shop_id == shop.id)))
    return {"reply": ai.suggest_reply(shop, c.messages, products, knowledge, body.instruction)}


# ------------------------------------------------------------------ dev simulator


def _require_dev() -> None:
    if get_settings().environment == "production":
        raise HTTPException(404, "Not found")


@router.post("/simulate", response_model=ConversationDetail, tags=["dev"])
def simulate_inbound(body: SimulateInboundIn, shop: CurrentShop, _: ShopMember, db: DB):
    """Pretend a customer sent a message from Telegram/Messenger/IG/TikTok (no real channel needed)."""
    _require_dev()
    c = inbox.receive(db, shop, body.platform, body.external_user_id, body.external_user_id, body.name, body.text)
    db.commit()
    return conversation_detail(db, c)


@router.post("/simulate/image", response_model=ConversationDetail, tags=["dev"])
async def simulate_inbound_image(file: UploadFile, shop: CurrentShop, _: ShopMember, db: DB,
                                 external_user_id: str = Form(...), name: str = Form(...),
                                 platform: Platform = Form(Platform.telegram), text: str = Form("")):
    """Pretend a customer sent a photo — e.g. an ABA slip for an open invoice."""
    _require_dev()
    image = await save_upload(file, ALLOWED_IMAGE_TYPES)
    c = inbox.receive(db, shop, platform, external_user_id, external_user_id, name, text, image=image)
    db.commit()
    return conversation_detail(db, c)
