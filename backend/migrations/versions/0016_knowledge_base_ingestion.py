"""Add knowledge_bases table for zero-friction knowledge ingestion.

Revision ID: 0016
Revises: 0015
Create Date: 2026-10-22
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0016"
down_revision: str | None = "0015"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if "knowledge_bases" not in tables:
        op.create_table(
            "knowledge_bases",
            sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
            sa.Column("shop_id", sa.Integer(), sa.ForeignKey("shops.id", ondelete="CASCADE"), nullable=False),
            sa.Column("source_type", sa.String(length=32), nullable=False),
            sa.Column("raw_content", sa.Text(), nullable=True),
            sa.Column("structured_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
            sa.Column("task_id", sa.String(length=64), nullable=True),
            sa.Column("file_name", sa.String(length=255), nullable=True),
            sa.Column("file_url", sa.String(length=500), nullable=True),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index(op.f("ix_knowledge_bases_shop_id"), "knowledge_bases", ["shop_id"], unique=False)
        op.create_index(op.f("ix_knowledge_bases_status"), "knowledge_bases", ["status"], unique=False)
        op.create_index(op.f("ix_knowledge_bases_task_id"), "knowledge_bases", ["task_id"], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if "knowledge_bases" in tables:
        op.drop_index(op.f("ix_knowledge_bases_task_id"), table_name="knowledge_bases")
        op.drop_index(op.f("ix_knowledge_bases_status"), table_name="knowledge_bases")
        op.drop_index(op.f("ix_knowledge_bases_shop_id"), table_name="knowledge_bases")
        op.drop_table("knowledge_bases")
