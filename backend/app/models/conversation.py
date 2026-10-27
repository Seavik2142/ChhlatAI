from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, str_enum, utcnow
from app.models.enums import ConversationMode, MessageKind, Platform, Sender, Sentiment

if TYPE_CHECKING:
    from app.models.channel import Channel
    from app.models.customer import Customer
    from app.models.tenant import User


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (
        UniqueConstraint("customer_id", "platform"),
        Index("ix_conversations_shop_last_message", "shop_id", "last_message_at"),
        Index("ix_conversations_shop_mode", "shop_id", "mode"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"), index=True)
    channel_id: Mapped[int | None] = mapped_column(ForeignKey("channels.id", ondelete="SET NULL"))
    platform: Mapped[Platform] = mapped_column(str_enum(Platform))
    external_chat_id: Mapped[str] = mapped_column(String(120))  # where replies are routed back to
    mode: Mapped[ConversationMode] = mapped_column(str_enum(ConversationMode), default=ConversationMode.ai)
    sentiment: Mapped[Sentiment] = mapped_column(str_enum(Sentiment), default=Sentiment.normal)
    high_priority: Mapped[bool] = mapped_column(Boolean, default=False)
    assigned_staff_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    unread_count: Mapped[int] = mapped_column(Integer, default=0)
    last_message_preview: Mapped[str] = mapped_column(String(255), default="")
    last_message_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    # Latest AI estimate shown in the Copilot panel, e.g. {"facts": {"Skin type": "Oily"}, "confidence": 0.9}
    ai_analysis: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    recommended_product_ids: Mapped[list[int]] = mapped_column(JSON, default=list)

    customer: Mapped[Customer] = relationship()
    channel: Mapped[Channel | None] = relationship()
    assigned_staff: Mapped[User | None] = relationship()
    messages: Mapped[list[Message]] = relationship(
        back_populates="conversation", order_by="Message.id", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (Index("ix_messages_conversation_id_id", "conversation_id", "id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"))
    sender: Mapped[Sender] = mapped_column(str_enum(Sender))
    staff_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    kind: Mapped[MessageKind] = mapped_column(str_enum(MessageKind), default=MessageKind.text)
    body: Mapped[str] = mapped_column(Text, default="")
    attachment_url: Mapped[str | None] = mapped_column(String(500))
    meta: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    conversation: Mapped[Conversation] = relationship(back_populates="messages")
    staff: Mapped[User | None] = relationship()
