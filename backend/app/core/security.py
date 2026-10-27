from datetime import UTC, datetime, timedelta
from functools import lru_cache

import bcrypt
import jwt
from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(user_id: int) -> str:
    settings = get_settings()
    expires = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode({"sub": str(user_id), "exp": expires}, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def mask_secret(value: str | None) -> str:
    if not value:
        return "—"
    return "•" * 10 + " " + value[-4:]


# --------------------------------------------------------------- encryption at rest

ENCRYPTED_PREFIX = "enc:v1:"


@lru_cache
def _fernet() -> Fernet | None:
    key = get_settings().encryption_key
    return Fernet(key.encode()) if key else None


def encrypt_secret(value: str | None) -> str | None:
    """Encrypt a secret for storage. Without ENCRYPTION_KEY (dev only) values are stored as-is."""
    if value is None or value.startswith(ENCRYPTED_PREFIX):
        return value
    f = _fernet()
    return ENCRYPTED_PREFIX + f.encrypt(value.encode()).decode() if f else value


def decrypt_secret(value: str | None) -> str | None:
    if value is None or not value.startswith(ENCRYPTED_PREFIX):
        return value
    f = _fernet()
    if f is None:
        raise RuntimeError("ENCRYPTION_KEY is required to read encrypted secrets")
    try:
        return f.decrypt(value[len(ENCRYPTED_PREFIX):].encode()).decode()
    except InvalidToken as e:
        raise RuntimeError("ENCRYPTION_KEY does not match the key used to encrypt stored secrets") from e
