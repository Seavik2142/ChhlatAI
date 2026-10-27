from fastapi import APIRouter, HTTPException
from sqlalchemy import delete, func, select

from app.api.deps import DB, CurrentShop, Owner, ShopMember, get_in_shop
from app.models import Broadcast, Notification
from app.schemas import BroadcastIn, BroadcastOut, NotificationOut
from app.services import marketing
from app.workers.tasks import deliver_broadcast

router = APIRouter(tags=["marketing"])


@router.get("/broadcasts", response_model=list[BroadcastOut])
def list_broadcasts(shop: CurrentShop, _: Owner, db: DB):
    return db.scalars(select(Broadcast).where(Broadcast.shop_id == shop.id).order_by(Broadcast.id.desc())).all()


@router.post("/broadcasts", response_model=BroadcastOut, status_code=201)
def create_broadcast(body: BroadcastIn, shop: CurrentShop, _: Owner, db: DB):
    b = Broadcast(shop_id=shop.id, **body.model_dump())
    db.add(b)
    db.commit()
    return b


@router.get("/broadcasts/audience")
def audience_size(shop: CurrentShop, _: Owner, db: DB, audience: str = "all") -> dict:
    return {"count": db.scalar(select(func.count()).select_from(marketing.audience(db, shop.id, audience).subquery()))}


@router.post("/broadcasts/{broadcast_id}/send", response_model=BroadcastOut)
def send_broadcast(broadcast_id: int, shop: CurrentShop, _: Owner, db: DB):
    b = get_in_shop(db, Broadcast, broadcast_id, shop.id)
    if b.status != "draft":
        raise HTTPException(409, "This broadcast was already sent")
    b.status = "sending"
    db.commit()
    deliver_broadcast.delay(b.id)
    return b


@router.get("/notifications", response_model=list[NotificationOut])
def list_notifications(shop: CurrentShop, _: ShopMember, db: DB, unread: bool = False):
    stmt = select(Notification).where(Notification.shop_id == shop.id)
    if unread:
        stmt = stmt.where(Notification.is_read.is_(False))
    return db.scalars(stmt.order_by(Notification.id.desc()).limit(50)).all()


@router.post("/notifications/read-all", status_code=204)
def read_all(shop: CurrentShop, _: ShopMember, db: DB) -> None:
    for n in db.scalars(select(Notification).where(Notification.shop_id == shop.id, Notification.is_read.is_(False))):
        n.is_read = True
    db.commit()


@router.patch("/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(notification_id: int, shop: CurrentShop, _: ShopMember, db: DB):
    n = get_in_shop(db, Notification, notification_id, shop.id)
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n


@router.delete("/notifications/{notification_id}", status_code=204)
def delete_notification(notification_id: int, shop: CurrentShop, _: ShopMember, db: DB):
    n = get_in_shop(db, Notification, notification_id, shop.id)
    db.delete(n)
    db.commit()


@router.delete("/notifications", status_code=204)
def clear_all_notifications(shop: CurrentShop, _: ShopMember, db: DB):
    db.execute(delete(Notification).where(Notification.shop_id == shop.id))
    db.commit()

