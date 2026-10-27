from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, Numeric
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

__all__ = ["Base", "Money", "TimestampMixin", "str_enum", "utcnow"]


def utcnow() -> datetime:
    return datetime.now(UTC)


def str_enum(enum_cls: type[StrEnum]) -> SAEnum:
    """Store enums as their string value in a VARCHAR column (no native PG enum to migrate)."""
    return SAEnum(
        enum_cls,
        native_enum=False,
        length=32,
        values_callable=lambda e: [m.value for m in e],
        validate_strings=True,
    )


Money = Numeric(12, 2)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
