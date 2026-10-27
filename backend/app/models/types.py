from sqlalchemy import Text
from sqlalchemy.types import TypeDecorator

from app.core.security import decrypt_secret, encrypt_secret


class EncryptedText(TypeDecorator):
    """Text column encrypted at rest with Fernet (ENCRYPTION_KEY); plain value in Python."""

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return encrypt_secret(value)

    def process_result_value(self, value, dialect):
        return decrypt_secret(value)
