"""Monthly AI usage per shop (replaces the never-resetting shops.ai_replies_used counter).

Existing counts are carried into the current month so no shop's quota changes on deploy.

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-18
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

CURRENT_PERIOD = "to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM')"


def upgrade() -> None:
    op.create_table(
        "ai_usage",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("shop_id", sa.Integer(), nullable=False),
        sa.Column("period", sa.String(length=7), nullable=False),
        sa.Column("replies", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["shop_id"], ["shops.id"], name=op.f("fk_ai_usage_shop_id_shops"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ai_usage")),
        sa.UniqueConstraint("shop_id", "period", name=op.f("uq_ai_usage_shop_id_period")),
    )
    op.execute(f"""
        INSERT INTO ai_usage (shop_id, period, replies)
        SELECT id, {CURRENT_PERIOD}, ai_replies_used FROM shops WHERE ai_replies_used > 0
    """)
    op.drop_column("shops", "ai_replies_used")


def downgrade() -> None:
    op.add_column("shops", sa.Column("ai_replies_used", sa.Integer(), nullable=False, server_default="0"))
    op.execute(f"""
        UPDATE shops s SET ai_replies_used = u.replies
        FROM ai_usage u WHERE u.shop_id = s.id AND u.period = {CURRENT_PERIOD}
    """)
    op.alter_column("shops", "ai_replies_used", server_default=None)
    op.drop_table("ai_usage")
