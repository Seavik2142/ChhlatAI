"""Collision-free invoice numbers: per-shop sequence + unique (shop_id, invoice_no).

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-18
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    duplicates = op.get_bind().execute(sa.text(
        "SELECT shop_id, invoice_no FROM orders GROUP BY shop_id, invoice_no HAVING count(*) > 1 LIMIT 5"
    )).all()
    if duplicates:
        raise RuntimeError(f"Duplicate invoice numbers must be fixed before upgrading: {duplicates}")

    op.add_column("shops", sa.Column("invoice_seq", sa.Integer(), nullable=False, server_default="1000"))
    # Continue numbering after each shop's highest existing INV-<n>.
    op.execute(r"""
        UPDATE shops s SET invoice_seq = GREATEST(1000, COALESCE((
            SELECT max(substring(o.invoice_no FROM 5)::int) FROM orders o
            WHERE o.shop_id = s.id AND o.invoice_no ~ '^INV-\d+$'), 1000))
    """)
    op.drop_index("ix_orders_invoice_no", table_name="orders")
    op.create_unique_constraint(op.f("uq_orders_shop_id_invoice_no"), "orders", ["shop_id", "invoice_no"])


def downgrade() -> None:
    op.drop_constraint(op.f("uq_orders_shop_id_invoice_no"), "orders", type_="unique")
    op.create_index("ix_orders_invoice_no", "orders", ["invoice_no"])
    op.drop_column("shops", "invoice_seq")
