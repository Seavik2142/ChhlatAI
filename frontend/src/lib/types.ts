// Mirrors backend/app/schemas.py
export type Role = "super_admin" | "owner" | "staff";
export type Platform = "telegram" | "facebook" | "instagram" | "tiktok";
export type Sentiment = "normal" | "interested" | "angry";
export type ConversationMode = "ai" | "waiting_staff" | "manual";
export type Sender = "customer" | "ai" | "staff" | "system";
export type MessageKind = "text" | "image" | "voice" | "product_card" | "invoice" | "slip" | "event";
export type OrderStatus =
  | "awaiting_payment" | "checking_slip" | "needs_review" | "paid" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type Courier = "jnt" | "vet" | "grab";
export type ShopStatus = "trial" | "active" | "suspended";

export interface User {
  id: number; email: string; full_name: string; role: Role; shop_id: number | null;
  is_active: boolean; is_online: boolean; commission_rate: number;
}

export interface Plan {
  id: number; code: string; name: string; price_monthly: number; ai_replies_limit: number;
  staff_seats: number; channels_limit: number; features: string[]; shops_count?: number;
  is_current?: boolean;
}

export interface Shop {
  id: number; name: string; slug: string; category: string; status: ShopStatus; plan: Plan | null;
  phone: string | null; address: string | null; ai_enabled: boolean; ai_instructions: string;
  low_stock_threshold: number; telegram_alert_chat_id: string | null; delivery_fees: Record<string, number>;
  vip_spend_threshold: number; ai_replies_used: number; created_at: string;
}

export interface AdminShop extends Shop {
  owner_name: string | null; owner_email: string | null; staff_count: number; orders_count: number; revenue: number;
  channels?: ("messenger" | "telegram" | "instagram" | "tiktok" | string)[];
  messages_count?: number;
  next_bill?: string;
  avatar_bg?: string;
  initials?: string;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  shop_id: number | null;
  shop_name?: string | null;
  shop_status?: ShopStatus | null;
  plan_id?: number | null;
  plan_name?: string | null;
  plan_code?: string | null;
  is_active: boolean;
  is_online: boolean;
  commission_rate: number;
  created_at?: string;
}

export interface Customer {
  id: number; name: string; platform: Platform; phone: string | null; address: string | null; is_vip: boolean;
  loyalty_points: number; total_spent: number; orders_count: number; created_at: string;
}

export interface Message {
  id: number; sender: Sender; staff_name: string | null; kind: MessageKind; body: string;
  attachment_url: string | null; meta: Record<string, any>; created_at: string;
}

export interface ConversationSummary {
  id: number; customer: Customer; platform: Platform; mode: ConversationMode; sentiment: Sentiment;
  high_priority: boolean; unread_count: number; last_message_preview: string; last_message_at: string;
  assigned_staff_id: number | null; assigned_staff_name: string | null;
}

export interface Product {
  id: number;
  name: string;
  sku: string | null;
  category: string | null;
  description: string;
  about?: string | null;
  positive_impacts?: string | null;
  negative_impacts?: string | null;
  usage_instructions?: string | null;
  price: number;
  stock: number;
  low_stock_threshold: number | null;
  is_active: boolean;
  image_url?: string | null;
}

export interface OrderItem { id: number; product_id: number | null; name: string; quantity: number; unit_price: number }

export interface Slip {
  id: number; image_url: string | null; bank: string | null; amount: number | null; receiver: string | null;
  reference: string | null; paid_time: string | null; confidence: number; status: "pending" | "verified" | "mismatch";
  checks: Record<string, boolean>; created_at: string;
}

export interface Delivery {
  id: number; courier: Courier; fee: number; cod_amount: number; tracking_no: string; tracking_url: string;
  status: string; created_at: string;
}

export interface Order {
  id: number; invoice_no: string; status: OrderStatus; customer: Customer; conversation_id: number | null;
  subtotal: number; delivery_fee: number; total: number; delivery_zone: string | null; delivery_address: string | null;
  created_by_ai: boolean; staff_id: number | null; payment_provider: string | null; bank_ref: string | null;
  paid_at: string | null; confirmed_at: string | null; invoice_url?: string | null; created_at: string; items: OrderItem[]; slips: Slip[];
  delivery: Delivery | null;
}

export interface ConversationDetail extends ConversationSummary {
  messages: Message[];
  ai_analysis: { facts?: Record<string, string>; confidence?: number; source?: string };
  recommended_products: Product[];
  orders: Order[];
  reply_route: string;
}

export interface InboxList {
  items: ConversationSummary[];
  counts: { all: number; staff: number; ai: number; vip: number; mine: number };
}

export interface QuickReply { id: number; command: string; text: string }
export interface KnowledgeArticle { id: number; title: string; content: string; created_at: string }

export interface KnowledgeBaseRecord {
  id: number;
  store_id: number;
  source_type: "image" | "document" | "manual";
  status: "pending" | "processing" | "processed" | "failed";
  file_name?: string | null;
  file_url?: string | null;
  structured_data?: {
    products?: Array<{ name: string; price: number | string; details?: string }>;
    policies?: Array<{ topic: string; content: string }>;
  } | null;
  raw_content?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface KnowledgeUploadResponse {
  task_id: string;
  kb_id: number;
  status: string;
  message: string;
}

export interface KnowledgeStatusResponse {
  task_id: string;
  kb_id: number;
  store_id: number;
  source_type: string;
  file_name?: string | null;
  status: "pending" | "processing" | "processed" | "failed";
  preview?: {
    products?: Array<{ name: string; price: number | string; details?: string }>;
    policies?: Array<{ topic: string; content: string }>;
  } | null;
  error?: string | null;
  created_at: string;
}

export interface Channel {
  id: number;
  platform: Platform;
  name: string;
  external_id: string | null;
  is_connected: boolean;
  has_token: boolean;
  meta_info?: Record<string, any>;
}

export interface DiscoveredPage {
  id: string;
  name: string;
  category?: string | null;
  avatar_url?: string | null;
  access_token: string;
  is_already_connected: boolean;
  connected_channel_id?: number | null;
  scopes?: string[];
  meta?: Record<string, any>;
}

export interface OAuthExchangeResult {
  platform: Platform;
  user_name?: string | null;
  user_avatar?: string | null;
  pages: DiscoveredPage[];
  is_sandbox: boolean;
}

export interface TelegramVerifyResult {
  ok: boolean;
  bot_id?: number | null;
  bot_name?: string | null;
  bot_username?: string | null;
  can_join_groups?: boolean | null;
  can_read_all_group_messages?: boolean | null;
  supports_inline_queries?: boolean | null;
  webhook_registered: boolean;
  webhook_url?: string | null;
  error?: string | null;
  channel?: Channel;
}

export interface TelegramUserConfig {
  has_app_credentials: boolean;
  api_id_configured: boolean;
  api_id_hint?: string | null;
}

export interface TelegramUserSendCodeResponse {
  ok: boolean;
  phone: string;
  phone_code_hash?: string | null;
  message?: string | null;
  error?: string | null;
}

export interface TelegramUserVerifyResponse {
  ok: boolean;
  requires_password?: boolean;
  message?: string | null;
  error?: string | null;
  channel?: Channel;
  user?: {
    telegram_id: number;
    name: string;
    username?: string | null;
    phone: string;
  };
}

export interface ChannelTestResult {
  ok: boolean;
  platform: Platform;
  channel_id: number;
  status: string;
  latency_ms: number;
  details: Record<string, any>;
}

export interface OAuthCredentials {
  meta_app_id?: string | null;
  has_meta_app_secret: boolean;
  tiktok_client_key?: string | null;
  has_tiktok_client_secret: boolean;
  meta_redirect_uri?: string | null;
  tiktok_redirect_uri?: string | null;
  telegram_bot_username?: string | null;
  has_telegram_bot_token: boolean;
  telegram_redirect_uri?: string | null;
}


export interface PaymentProvider {
  id: number; provider: "bakong" | "aba_payway" | "acleda"; environment: string; is_connected: boolean;
  use_for_invoices: boolean; merchant_name: string | null; account_id: string | null; secret_masked: string;
  methods: string[]; token_expires_at: string | null;
}

export interface Notification {
  id: number; kind: string; title: string; body: string; conversation_id: number | null; is_read: boolean;
  created_at: string;
}

export interface AdminNotification {
  id: number;
  kind: string;
  title: string;
  body: string;
  shop_id?: number | null;
  shop_name?: string | null;
  conversation_id?: number | null;
  is_read: boolean;
  created_at: string;
  link?: string | null;
}

export interface Broadcast {
  id: number; title: string; message: string; audience: "all" | "vip" | "buyers"; personalize: boolean;
  status: string; sent_count: number; sent_at: string | null; created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  audience: string;
  category?: string;
  channels?: string;
  is_active?: boolean;
  pinned?: boolean;
  created_at: string;
}
export interface ErrorLog {
  id: number; level: string; source: string; message: string; context: Record<string, unknown>;
  shop_id: number | null; created_at: string;
}
export interface AISettings {
  model: string; global_instructions: string; handoff_on_discount: boolean; max_ai_replies_per_conversation: number;
}
export interface TrafficBar {
  day: string;
  count: number;
  height: number;
}

export interface RevenueByPlan {
  plan: string;
  shops: number;
  mrr: number;
  percentage: number;
}

export interface RecentShopItem {
  id: number;
  name: string;
  owner: string;
  category: string;
  plan: string;
  channels: ("messenger" | "telegram" | "instagram" | "tiktok")[];
  joined: string;
  status: string;
  avatarBg: string;
  initials: string;
}

export interface DashboardMetrics {
  shops_total?: number;
  total_shops?: number;
  shops_active?: number;
  shops_trial?: number;
  shops_suspended?: number;
  total_users?: number;
  users_super_admin?: number;
  users_owner?: number;
  users_staff?: number;
  users_active?: number;
  mrr?: number;
  conversations?: number;
  active_conversations?: number;
  ai_replies?: number;
  orders_paid?: number;
  gmv?: number;
  api_requests_today?: number;
  api_requests_month?: number;
  total_messages?: number;
  traffic_bars?: TrafficBar[];
  revenue_by_plan?: RevenueByPlan[];
  recent_shops?: RecentShopItem[];
}

export interface PaymentHistoryItem {
  id: string;
  shop: string;
  shop_id?: number;
  plan: "Pro" | "Enterprise" | "Free" | string;
  method: string;
  date: string;
  amount: string;
  status: "Paid" | "Overdue" | "Failed" | string;
  reference?: string | null;
  coupon_code?: string | null;
  discount_amount?: string | null;
  original_amount?: string | null;
  billing_cycle?: "monthly" | "yearly" | string;
  period?: string;
}

export interface SubscriptionCoupon {
  id: string;
  code: string;
  name: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  applicable_plan: "all" | "pro" | "enterprise" | "free" | string;
  max_uses: number | null;
  used_count: number;
  valid_until: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon: SubscriptionCoupon;
  original_price: number;
  discount_amount: number;
  final_price: number;
  message: string;
}

export interface TopShopAI {
  name: string;
  plan: string;
  requests: string;
  tokens: string;
  cost: string;
  quota: number;
  quotaColor: string;
}

export interface SpendBar {
  day: string;
  h: number;
}

export interface AIStats {
  monthly_spend: number;
  monthly_budget: number;
  total_tokens: string;
  total_tokens_num?: number;
  codecraft_tokens?: string;
  codecraft_tokens_num?: number;
  gemini_tokens?: string;
  gemini_tokens_num?: number;
  prompt_tokens?: string;
  completion_tokens?: string;
  primary_gateway?: string;
  is_real_telemetry?: boolean;
  spend_bars: SpendBar[];
  top_shops: TopShopAI[];
}

export interface AIProviderKey {
  id: string;
  name: string;
  key_masked: string;
  is_active: boolean;
  created_at: string;
}

export interface GlobalPromptConfig {
  system_prompt: string;
  default_model: string;
  temperature: number;
  allow_custom?: boolean;
  sentiment_analysis?: boolean;
  codecraft_key_masked?: string;
  codecraft_base_url?: string;
  codecraft_model?: string;
  user_control_enabled?: boolean;
  enforce_token_quotas?: boolean;
  fallback_model?: string;
  codecraft_keys?: AIProviderKey[];
  gemini_keys?: AIProviderKey[];
  provider_order?: string[];
  openai_key_masked?: string;
  gemini_key_masked?: string;
  providers?: Array<{
    id: string;
    name: string;
    provider: string;
    api_key_masked?: string;
    model: string;
    base_url?: string;
    is_active?: boolean;
  }>;
}

export interface ShopAIControl {
  id: number;
  name: string;
  category: string;
  plan_name: string;
  ai_enabled: boolean;
  ai_replies_used: number;
  ai_replies_limit: number;
  quota_pct: number;
}

export interface SecuritySettings {
  session_timeout_minutes: number;
  enforce_2fa: boolean;
  max_login_attempts: number;
  password_min_length: number;
  require_special_char: boolean;
  require_number: boolean;
  require_uppercase: boolean;
  ip_allowlist: string[];
  allow_admin_registration: boolean;
  auto_backup_enabled: boolean;
  ssl_enforced: boolean;
}

export interface SecurityAuditLog {
  id: number;
  actor_id: number | null;
  actor_email: string;
  action: string;
  status: string;
  details: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SystemDiagnostics {
  database: {
    status: string;
    latency_ms: number;
    active_connections: number;
    total_tables: number;
    database_name: string;
    dialect: string;
  };
  redis: {
    status: string;
    latency_ms: number | null;
    url: string;
  };
  server: {
    uptime_seconds: number;
    python_version: string;
    os: string;
    environment: string;
    app_version: string;
    storage_backend: string;
  };
  metrics: {
    total_shops: number;
    total_users: number;
    total_orders: number;
    total_messages: number;
    total_error_logs: number;
    total_audit_events: number;
  };
}

export interface AdminTelegramBotStatus {
  configured: boolean;
  bot_username: string;
  bot_token_present: boolean;
  webhook_url: string;
  chat_ids: string[];
  notify_new_users: boolean;
  notify_audit_trail: boolean;
  notify_health_alerts: boolean;
}

