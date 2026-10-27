"""Add metadata columns to announcements table (category, channels, is_active, pinned).

Revision ID: 0008
Revises: 0007
Create Date: 2026-10-19
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = {c["name"] for c in inspector.get_columns("announcements")}
    if "category" not in cols:
        op.add_column("announcements", sa.Column("category", sa.String(32), server_default="update", nullable=False))
    if "channels" not in cols:
        op.add_column("announcements", sa.Column("channels", sa.String(128), server_default="banner,telegram", nullable=False))
    if "is_active" not in cols:
        op.add_column("announcements", sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False))
    if "pinned" not in cols:
        op.add_column("announcements", sa.Column("pinned", sa.Boolean(), server_default="false", nullable=False))


def downgrade() -> None:
    op.drop_column("announcements", "pinned")
    op.drop_column("announcements", "is_active")
    op.drop_column("announcements", "channels")
    op.drop_column("announcements", "category")
