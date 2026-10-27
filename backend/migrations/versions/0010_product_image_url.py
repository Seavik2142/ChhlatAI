"""Add image_url column to products table.

Revision ID: 0010
Revises: 0009
Create Date: 2026-10-20
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("products")]
    if "image_url" not in cols:
        op.add_column("products", sa.Column("image_url", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "image_url")
