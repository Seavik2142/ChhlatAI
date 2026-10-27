from sqlalchemy import select
from sqlalchemy.orm import Session

from app.realtime.hub import hub
from app.models import Channel, Notification, Platform, Shop
from app.integrations.messaging import send_telegram_alert


def notify(db: Session, shop: Shop, kind: str, title: str, body: str = "",
           conversation_id: int | None = None, telegram: bool = False) -> Notification:
    """Ring the shop's team in the dashboard and, optionally, the owner's Telegram."""
    n = Notification(shop_id=shop.id, kind=kind, title=title, body=body, conversation_id=conversation_id)
    db.add(n)
    db.flush()
    hub.publish(shop.id, "notification", {"id": n.id, "kind": kind, "title": title, "body": body,
                                          "conversation_id": conversation_id})
    if telegram and shop.telegram_alert_chat_id:
        bot = db.scalars(select(Channel).where(Channel.shop_id == shop.id, Channel.platform == Platform.telegram,
                                               Channel.access_token.is_not(None))).first()
        if bot and bot.access_token:
            send_telegram_alert(bot.access_token, shop.telegram_alert_chat_id, f"{title}\n{body}")
    return n
