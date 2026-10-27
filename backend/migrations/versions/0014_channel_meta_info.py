"""Add meta_info to channels table for storing OAuth 2.0 metadata and scopes.

Revision ID: 0014
Revises: 0013
Create Date: 2026-10-20
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0014"
down_revision: str | None = "0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("channels")]
    if "meta_info" not in cols:
        op.add_column("channels", sa.Column("meta_info", sa.JSON(), nullable=True, server_default="{}"))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("channels")]
    if "meta_info" in cols:
        op.drop_column("channels", "meta_info")
