"""One conversation per customer+channel, and composite indexes for the hot queries.

Indexes are built CONCURRENTLY so a large production database keeps serving reads and
writes while they build (no table lock).

Revision ID: 0006
Revises: 0005
Create Date: 2026-10-18
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# (name, table, columns) — inbox sort, chat history paging, order filters, unread badge.
NEW_INDEXES = [
    ("ix_conversations_shop_last_message", "conversations", ["shop_id", "last_message_at"]),
    ("ix_conversations_shop_mode", "conversations", ["shop_id", "mode"]),
    ("ix_messages_conversation_id_id", "messages", ["conversation_id", "id"]),
    ("ix_orders_shop_status_created", "orders", ["shop_id", "status", "created_at"]),
    ("ix_orders_shop_created", "orders", ["shop_id", "created_at"]),
    ("ix_orders_staff_created", "orders", ["staff_id", "created_at"]),
    ("ix_notifications_shop_read_id", "notifications", ["shop_id", "is_read", "id"]),
]
# Single-column indexes now covered by the composites above.
SUPERSEDED = [
    ("ix_conversations_last_message_at", "conversations", ["last_message_at"]),
    ("ix_messages_conversation_id", "messages", ["conversation_id"]),
]


def upgrade() -> None:
    duplicates = op.get_bind().execute(sa.text(
        "SELECT customer_id, platform FROM conversations GROUP BY 1, 2 HAVING count(*) > 1 LIMIT 5"
    )).all()
    if duplicates:
        raise RuntimeError(f"Merge duplicate conversations before upgrading: {duplicates}")
    op.create_unique_constraint(op.f("uq_conversations_customer_id_platform"), "conversations",
                                ["customer_id", "platform"])

    with op.get_context().autocommit_block():
        for name, table, cols in NEW_INDEXES:
            op.create_index(name, table, cols, postgresql_concurrently=True, if_not_exists=True)
        for name, table, _ in SUPERSEDED:
            op.drop_index(name, table_name=table, postgresql_concurrently=True, if_exists=True)


def downgrade() -> None:
    with op.get_context().autocommit_block():
        for name, table, cols in SUPERSEDED:
            op.create_index(name, table, cols, postgresql_concurrently=True, if_not_exists=True)
        for name, table, _ in NEW_INDEXES:
            op.drop_index(name, table_name=table, postgresql_concurrently=True, if_exists=True)
    op.drop_constraint(op.f("uq_conversations_customer_id_platform"), "conversations", type_="unique")
