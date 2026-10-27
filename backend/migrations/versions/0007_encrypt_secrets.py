"""Encrypt channel access tokens and bank API keys at rest (Fernet, ENCRYPTION_KEY).

Data migration: run it with the same ENCRYPTION_KEY the app uses. Without a key (local
development) values stay as they are and the app keeps reading them as plain text.

Revision ID: 0007
Revises: 0006
Create Date: 2026-10-18
"""
import os
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from cryptography.fernet import Fernet

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

PREFIX = "enc:v1:"  # must match app.core.security.ENCRYPTED_PREFIX
COLUMNS = [("channels", "access_token"), ("payment_providers", "secret")]


def _fernet() -> Fernet | None:
    from app.core.config import get_settings

    key = os.environ.get("ENCRYPTION_KEY") or get_settings().encryption_key
    return Fernet(key.encode()) if key else None


def _rewrite(transform, encrypted: bool) -> None:
    """Apply transform to every stored secret that is (encrypted=True) or isn't yet encrypted."""
    conn = op.get_bind()
    for table, column in COLUMNS:
        op_ = "LIKE" if encrypted else "NOT LIKE"
        rows = conn.execute(sa.text(f"SELECT id, {column} FROM {table} WHERE {column} IS NOT NULL "
                                    f"AND {column} {op_} :prefix"), {"prefix": PREFIX + "%"}).all()
        for row_id, value in rows:
            conn.execute(sa.text(f"UPDATE {table} SET {column} = :v WHERE id = :id"),
                         {"v": transform(value), "id": row_id})


def upgrade() -> None:
    f = _fernet()
    if f is None:
        print("0007: ENCRYPTION_KEY not set — secrets left unencrypted (development only)")
        return
    _rewrite(lambda v: PREFIX + f.encrypt(v.encode()).decode(), encrypted=False)


def downgrade() -> None:
    f = _fernet()
    if f is None:
        return
    _rewrite(lambda v: f.decrypt(v[len(PREFIX):].encode()).decode(), encrypted=True)
