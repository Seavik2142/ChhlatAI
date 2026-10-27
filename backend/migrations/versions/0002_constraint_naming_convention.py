"""Normalize constraint names to the project naming convention.

Databases created before the naming convention was added got PostgreSQL's default names
(e.g. users_pkey, users_shop_id_fkey) while newer ones get pk_users / fk_users_shop_id_shops.
This renames the old ones so every environment has identical, predictable names — later
migrations can then drop or alter constraints by name safely.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-18
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

RENAMES = [
    ("announcements", "announcements_pkey", "pk_announcements"),
    ("broadcasts", "broadcasts_pkey", "pk_broadcasts"),
    ("broadcasts", "broadcasts_shop_id_fkey", "fk_broadcasts_shop_id_shops"),
    ("channels", "channels_pkey", "pk_channels"),
    ("channels", "channels_shop_id_fkey", "fk_channels_shop_id_shops"),
    ("conversations", "conversations_assigned_staff_id_fkey", "fk_conversations_assigned_staff_id_users"),
    ("conversations", "conversations_channel_id_fkey", "fk_conversations_channel_id_channels"),
    ("conversations", "conversations_customer_id_fkey", "fk_conversations_customer_id_customers"),
    ("conversations", "conversations_pkey", "pk_conversations"),
    ("conversations", "conversations_shop_id_fkey", "fk_conversations_shop_id_shops"),
    ("customers", "customers_pkey", "pk_customers"),
    ("customers", "customers_shop_id_fkey", "fk_customers_shop_id_shops"),
    ("customers", "customers_shop_id_platform_external_user_id_key", "uq_customers_shop_id_platform_external_user_id"),
    ("deliveries", "deliveries_order_id_fkey", "fk_deliveries_order_id_orders"),
    ("deliveries", "deliveries_order_id_key", "uq_deliveries_order_id"),
    ("deliveries", "deliveries_pkey", "pk_deliveries"),
    ("error_logs", "error_logs_pkey", "pk_error_logs"),
    ("error_logs", "error_logs_shop_id_fkey", "fk_error_logs_shop_id_shops"),
    ("knowledge_articles", "knowledge_articles_pkey", "pk_knowledge_articles"),
    ("knowledge_articles", "knowledge_articles_shop_id_fkey", "fk_knowledge_articles_shop_id_shops"),
    ("messages", "messages_conversation_id_fkey", "fk_messages_conversation_id_conversations"),
    ("messages", "messages_pkey", "pk_messages"),
    ("messages", "messages_staff_id_fkey", "fk_messages_staff_id_users"),
    ("notifications", "notifications_conversation_id_fkey", "fk_notifications_conversation_id_conversations"),
    ("notifications", "notifications_pkey", "pk_notifications"),
    ("notifications", "notifications_shop_id_fkey", "fk_notifications_shop_id_shops"),
    ("order_items", "order_items_order_id_fkey", "fk_order_items_order_id_orders"),
    ("order_items", "order_items_pkey", "pk_order_items"),
    ("order_items", "order_items_product_id_fkey", "fk_order_items_product_id_products"),
    ("orders", "orders_conversation_id_fkey", "fk_orders_conversation_id_conversations"),
    ("orders", "orders_customer_id_fkey", "fk_orders_customer_id_customers"),
    ("orders", "orders_pkey", "pk_orders"),
    ("orders", "orders_shop_id_fkey", "fk_orders_shop_id_shops"),
    ("orders", "orders_staff_id_fkey", "fk_orders_staff_id_users"),
    ("payment_providers", "payment_providers_pkey", "pk_payment_providers"),
    ("payment_providers", "payment_providers_shop_id_fkey", "fk_payment_providers_shop_id_shops"),
    ("payment_providers", "payment_providers_shop_id_provider_key", "uq_payment_providers_shop_id_provider"),
    ("payment_slips", "payment_slips_order_id_fkey", "fk_payment_slips_order_id_orders"),
    ("payment_slips", "payment_slips_pkey", "pk_payment_slips"),
    ("plans", "plans_code_key", "uq_plans_code"),
    ("plans", "plans_pkey", "pk_plans"),
    ("products", "products_pkey", "pk_products"),
    ("products", "products_shop_id_fkey", "fk_products_shop_id_shops"),
    ("quick_replies", "quick_replies_pkey", "pk_quick_replies"),
    ("quick_replies", "quick_replies_shop_id_command_key", "uq_quick_replies_shop_id_command"),
    ("quick_replies", "quick_replies_shop_id_fkey", "fk_quick_replies_shop_id_shops"),
    ("shops", "shops_pkey", "pk_shops"),
    ("shops", "shops_plan_id_fkey", "fk_shops_plan_id_plans"),
    ("shops", "shops_slug_key", "uq_shops_slug"),
    ("system_settings", "system_settings_pkey", "pk_system_settings"),
    ("users", "users_pkey", "pk_users"),
    ("users", "users_shop_id_fkey", "fk_users_shop_id_shops"),
]


def upgrade() -> None:
    for table, old, new in RENAMES:
        op.execute(f"""
            DO $$ BEGIN
              IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '{old}' AND conrelid = '{table}'::regclass) THEN
                ALTER TABLE {table} RENAME CONSTRAINT {old} TO {new};
              END IF;
            END $$;
        """)


def downgrade() -> None:
    # Intentionally a no-op: the convention names are valid for revision 0001 too, and
    # renaming back would re-introduce the per-environment differences this fixes.
    pass
