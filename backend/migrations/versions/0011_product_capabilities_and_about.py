"""Add about, positive_impacts, negative_impacts, and usage_instructions to products table.

Revision ID: 0011
Revises: 0010
Create Date: 2026-10-20
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("products")]
    if "about" not in cols:
        op.add_column("products", sa.Column("about", sa.Text(), nullable=False, server_default=""))
    if "positive_impacts" not in cols:
        op.add_column("products", sa.Column("positive_impacts", sa.Text(), nullable=False, server_default=""))
    if "negative_impacts" not in cols:
        op.add_column("products", sa.Column("negative_impacts", sa.Text(), nullable=False, server_default=""))
    if "usage_instructions" not in cols:
        op.add_column("products", sa.Column("usage_instructions", sa.Text(), nullable=False, server_default=""))


def downgrade() -> None:
    op.drop_column("products", "usage_instructions")
    op.drop_column("products", "negative_impacts")
    op.drop_column("products", "positive_impacts")
    op.drop_column("products", "about")
