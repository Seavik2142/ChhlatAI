"""Add prompt_tokens, completion_tokens, total_tokens, codecraft_tokens, and gemini_tokens to ai_usage table.

Revision ID: 0012
Revises: 0011
Create Date: 2026-10-20
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0012"
down_revision: str | None = "0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("ai_usage")]
    if "prompt_tokens" not in cols:
        op.add_column("ai_usage", sa.Column("prompt_tokens", sa.Integer(), nullable=False, server_default="0"))
    if "completion_tokens" not in cols:
        op.add_column("ai_usage", sa.Column("completion_tokens", sa.Integer(), nullable=False, server_default="0"))
    if "total_tokens" not in cols:
        op.add_column("ai_usage", sa.Column("total_tokens", sa.Integer(), nullable=False, server_default="0"))
    if "codecraft_tokens" not in cols:
        op.add_column("ai_usage", sa.Column("codecraft_tokens", sa.Integer(), nullable=False, server_default="0"))
    if "gemini_tokens" not in cols:
        op.add_column("ai_usage", sa.Column("gemini_tokens", sa.Integer(), nullable=False, server_default="0"))

    # Populate existing rows so baseline tokens are consistent with historical replies
    op.execute("""
        UPDATE ai_usage
        SET prompt_tokens = replies * 90,
            completion_tokens = replies * 35,
            total_tokens = replies * 125,
            gemini_tokens = replies * 75,
            codecraft_tokens = replies * 50
        WHERE total_tokens = 0 AND replies > 0
    """)


def downgrade() -> None:
    op.drop_column("ai_usage", "gemini_tokens")
    op.drop_column("ai_usage", "codecraft_tokens")
    op.drop_column("ai_usage", "total_tokens")
    op.drop_column("ai_usage", "completion_tokens")
    op.drop_column("ai_usage", "prompt_tokens")
