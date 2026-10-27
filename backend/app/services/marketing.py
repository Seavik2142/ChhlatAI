from itertools import islice

from sqlalchemy import select

from app.core.database import session_scope
from app.models import Broadcast, Conversation, Customer, Order, OrderItem, Shop, utcnow
from app.services import ai, inbox

BATCH_SIZE = 100


def audience(db, shop_id: int, kind: str):
    stmt = select(Customer).where(Customer.shop_id == shop_id)
    if kind == "vip":
        stmt = stmt.where(Customer.is_vip)
    elif kind == "buyers":
        stmt = stmt.where(Customer.orders_count > 0)
    return stmt


def _batch_iterator(iterable, size: int):
    iterator = iter(iterable)
    while batch := list(islice(iterator, size)):
        yield batch


def deliver(broadcast_id: int) -> int:
    """Send one personalised message per customer through their own app; commits in batches.

    Eliminates N+1 queries by fetching latest conversations and previous purchases
    in bulk per batch of customers via PostgreSQL DISTINCT ON.
    """
    with session_scope() as db:
        b = db.get(Broadcast, broadcast_id)
        if b is None or b.status == "sent":
            return 0
        shop = db.get(Shop, b.shop_id)
        sent = 0
        all_customers = db.scalars(audience(db, shop.id, b.audience).order_by(Customer.id)).all()
        needs_product = b.personalize or "{product}" in b.message

        for batch in _batch_iterator(all_customers, BATCH_SIZE):
            customer_ids = [c.id for c in batch]
            if not customer_ids:
                continue

            # 1. Fetch latest conversation per customer in bulk using PostgreSQL DISTINCT ON
            conv_stmt = (
                select(Conversation)
                .where(Conversation.customer_id.in_(customer_ids))
                .distinct(Conversation.customer_id)
                .order_by(Conversation.customer_id, Conversation.last_message_at.desc())
            )
            conv_map = {c.customer_id: c for c in db.scalars(conv_stmt).all()}

            # 2. Fetch last purchased product per customer in bulk if needed
            product_map = {}
            if needs_product:
                prod_stmt = (
                    select(Order.customer_id, OrderItem.name)
                    .join(OrderItem, OrderItem.order_id == Order.id)
                    .where(Order.customer_id.in_(customer_ids))
                    .distinct(Order.customer_id)
                    .order_by(Order.customer_id, Order.id.desc())
                )
                product_map = dict(db.execute(prod_stmt).all())

            # 3. Deliver to each customer in the batch
            for customer in batch:
                c = conv_map.get(customer.id)
                if c is None:
                    continue
                last_product = product_map.get(customer.id)
                text = (
                    ai.personalize_broadcast(b.message, customer.name, last_product)
                    if b.personalize
                    else b.message.replace("{name}", customer.name).replace("{product}", last_product or "")
                )
                inbox.send_ai(db, c, text, meta={"broadcast_id": b.id})
                sent += 1

            b.sent_count = sent
            db.commit()

        b.status, b.sent_count, b.sent_at = "sent", sent, utcnow()
        return sent
