"""Database models, one module per domain. Importing this package registers every table."""

from app.models.base import Base, Money, str_enum, utcnow
from app.models.catalog import KnowledgeArticle, KnowledgeBase, Product, ProductCatalog, QuickReply
from app.models.channel import Channel
from app.models.conversation import Conversation, Message
from app.models.customer import Customer
from app.models.enums import (
    ConversationMode,
    Courier,
    MessageKind,
    OrderStatus,
    PaymentProviderType,
    Platform,
    Role,
    Sender,
    Sentiment,
    ShopStatus,
    SlipStatus,
)
from app.models.marketing import Announcement, Broadcast, Notification
from app.models.order import Delivery, Order, OrderItem, PaymentProvider, PaymentSlip
from app.models.system import AIUsage, AuditLog, ErrorLog, SystemSetting, WebhookEvent
from app.models.tenant import Plan, Shop, User

__all__ = [
    "Base",
    "Money",
    "str_enum",
    "utcnow",
    "Role",
    "ShopStatus",
    "Platform",
    "Sentiment",
    "ConversationMode",
    "Sender",
    "MessageKind",
    "OrderStatus",
    "SlipStatus",
    "PaymentProviderType",
    "Courier",
    "Plan",
    "Shop",
    "User",
    "Channel",
    "Customer",
    "Conversation",
    "Message",
    "Product",
    "ProductCatalog",
    "KnowledgeArticle",
    "KnowledgeBase",
    "QuickReply",
    "PaymentProvider",
    "Order",
    "OrderItem",
    "PaymentSlip",
    "Delivery",
    "Broadcast",
    "Notification",
    "Announcement",
    "SystemSetting",
    "AuditLog",
    "ErrorLog",
    "AIUsage",
    "WebhookEvent",
]
