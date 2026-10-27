"""Add invoice_url to orders table for storing generated paid invoice receipt images.

Revision ID: 0013
Revises: 0012
Create Date: 2026-10-20
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0013"
down_revision: str | None = "0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("orders")]
    if "invoice_url" not in cols:
        op.add_column("orders", sa.Column("invoice_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("orders")]
    if "invoice_url" in cols:
        op.drop_column("orders", "invoice_url")
