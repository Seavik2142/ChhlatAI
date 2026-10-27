"""Add refresh_token and token_expires_at to channels table.

Revision ID: 0015
Revises: 0014
Create Date: 2026-10-20
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0015"
down_revision: str | None = "0014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("channels")]
    if "refresh_token" not in cols:
        op.add_column("channels", sa.Column("refresh_token", sa.Text(), nullable=True))
    if "token_expires_at" not in cols:
        op.add_column("channels", sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("channels")]
    if "token_expires_at" in cols:
        op.drop_column("channels", "token_expires_at")
    if "refresh_token" in cols:
        op.drop_column("channels", "refresh_token")
