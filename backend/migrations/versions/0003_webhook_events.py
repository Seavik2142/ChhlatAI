"""Webhook idempotency: remember processed Telegram/Meta/bank events.

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-18
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "webhook_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("event_id", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_webhook_events")),
        sa.UniqueConstraint("source", "event_id", name=op.f("uq_webhook_events_source_event_id")),
    )
    op.create_index(op.f("ix_webhook_events_created_at"), "webhook_events", ["created_at"])


def downgrade() -> None:
    op.drop_index(op.f("ix_webhook_events_created_at"), table_name="webhook_events")
    op.drop_table("webhook_events")
