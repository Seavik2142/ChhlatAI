// Static fixtures that reproduce the Figma product shots (ST-01 hero, ST-02 spotlight) with the real components.
import type { ConversationDetail, ConversationSummary, Customer, InboxList, Message, Order, PaymentProvider, QuickReply } from "../../lib/types";

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const at = (hhmm: string, daysAgo = 0) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const customer = (id: number, name: string, platform: Customer["platform"], extra: Partial<Customer> = {}): Customer => ({
  id, name, platform, phone: null, address: null, is_vip: false, loyalty_points: 0, total_spent: 0, orders_count: 0,
  created_at: "2026-03-02T00:00:00Z", ...extra,
});

const dara = customer(0, "Dara Sok", "instagram", { is_vip: true, orders_count: 6, total_spent: 214, loyalty_points: 214 });
const bopha = customer(0, "Bopha Heng", "facebook", { is_vip: true, orders_count: 5 });
const channy = customer(1, "Channy Lim", "facebook", { phone: "012 777 845" });
const rithy = customer(2, "Rithy Kong", "telegram");
const sophea = customer(3, "Sophea Meas", "tiktok");
const kimleng = customer(4, "Kimleng Tan", "instagram");
const sovann = customer(5, "Sovann Pich", "telegram");

const summary = (id: number, c: Customer, s: Partial<ConversationSummary>): ConversationSummary => ({
  id, customer: c, platform: c.platform, mode: "ai", sentiment: "normal", high_priority: false, unread_count: 0,
  last_message_preview: "", last_message_at: minsAgo(0), assigned_staff_id: null, assigned_staff_name: null, ...s,
});

const VANNA = 99;

export const demoInbox = (): InboxList => ({
  counts: { all: 412, staff: 7, ai: 0, vip: 0, mine: 0 },
  items: [
    summary(1, dara, { mode: "waiting_staff", sentiment: "angry", high_priority: true, unread_count: 3,
      last_message_preview: "ខ្ញុំវេរលុយតាំងពីម្សិលមិញ មិនទាន់ឃើញផ្ញើអីវ៉ាន់ទេ!", last_message_at: minsAgo(0) }),
    summary(2, bopha, { mode: "waiting_staff", sentiment: "interested", unread_count: 1,
      last_message_preview: "ចង់បានបញ្ចុះតម្លៃ 30% បានទេបង?", last_message_at: minsAgo(3) }),
    summary(3, channy, { sentiment: "interested", last_message_preview: "[Photo] ABA slip", last_message_at: minsAgo(1) }),
    summary(4, rithy, { last_message_preview: "Delivery ទៅ Toul Kork ប៉ុន្មាន?", last_message_at: minsAgo(6) }),
    summary(5, sophea, { mode: "manual", sentiment: "interested", assigned_staff_id: VANNA, last_message_preview: "F1 2 ដប 🙏", last_message_at: minsAgo(11) }),
    summary(6, kimleng, { last_message_preview: "Hello, do you have the toner in stock?", last_message_at: minsAgo(19) }),
    summary(7, sovann, { last_message_preview: "អរគុណបង ទទួលបានហើយ 👍", last_message_at: minsAgo(32) }),
  ],
});

export const demoInboxST02 = (): InboxList => {
  const inbox = demoInbox();
  inbox.items[0] = { ...inbox.items[0], mode: "manual", assigned_staff_id: VANNA, unread_count: 3 };
  return inbox;
};

let mid = 0;
const msg = (sender: Message["sender"], body: string, time: string, extra: Partial<Message> = {}): Message => ({
  id: ++mid, sender, staff_name: null, kind: "text", body, attachment_url: null, meta: {}, created_at: at(time), ...extra,
});
const event = (body: string, time: string, tone: string) => msg("system", body, time, { kind: "event", meta: { tone } });

const inv1187: Order = {
  id: 1187, invoice_no: "INV-1187", status: "checking_slip", customer: channy, conversation_id: 3, subtotal: 14,
  delivery_fee: 1.5, total: 15.5, delivery_zone: "phnom_penh", delivery_address: "BKK1, Phnom Penh", created_by_ai: true,
  staff_id: null, payment_provider: "aba_payway", bank_ref: null, paid_at: null, confirmed_at: null, created_at: at("10:06"),
  items: [{ id: 1, product_id: 2, name: "Acne Clear Serum", quantity: 1, unit_price: 14 }],
  slips: [{ id: 1, image_url: null, bank: "ABA Mobile", amount: 15.5, receiver: "GLOW SKIN CAMBODIA", reference: null,
    paid_time: "10:09", confidence: 0.94, status: "verified", created_at: at("10:09"),
    checks: { amount_matches: true, receiver_matches: true, not_duplicate: true, confident: true } }],
  delivery: null,
};

const product = (id: number, name: string, price: number) => ({
  id, name, price, sku: null, category: null, description: "", stock: 10, low_stock_threshold: null, is_active: true,
});

export const demoChannyChat = (): ConversationDetail => ({
  ...demoInbox().items[2],
  reply_route: "Facebook Messenger · replies go back via Messenger",
  ai_analysis: { facts: { "Skin type": "Oily · acne-prone" }, confidence: 0.9 },
  recommended_products: [product(1, "Gentle Foam Cleanser", 9.5), product(2, "Acne Clear Serum 30ml", 14)],
  orders: [inv1187],
  messages: [
    event("Today · ថ្ងៃនេះ", "10:00", "neutral"),
    msg("customer", "សួស្តីបង! ស្បែកខ្ញុំប្រែង ហើយមុនច្រើន គួរប្រើអ្វីល្អ?", "10:01"),
    msg("customer", "Selfie · face skin", "10:01", { kind: "image" }),
    msg("ai", "ជម្រាបសួរបង 🙏 តាមរូបភាព ស្បែកបងទំនងជាស្បែកប្រែង និងមានមុនតិចតួច។ ខ្ញុំណែនាំ Cleanser ស្រាល និង Serum ប្រឆាំងមុន ពេលយប់ 👇", "10:02"),
    msg("ai", "", "10:04", { kind: "product_card", meta: { products: [
      { id: 1, name: "Gentle Foam Cleanser", price: 9.5 }, { id: 2, name: "Acne Clear Serum 30ml", price: 14 }] } }),
    msg("customer", "OK យក Serum 1 ដប ផ្ញើទៅ BKK1 🙏", "10:06"),
    msg("ai", "🧾 វិក្កយបត្រ INV-1187\nAcne Clear Serum × 1 = $14.00\nដឹកជញ្ជូន BKK1 = $1.50\nសរុប = $15.50 — សូមបង់តាម ABA KHQR", "10:06", { kind: "invoice" }),
    msg("customer", "", "10:09", { kind: "slip", meta: { bank: "ABA Mobile", amount: -15.5, receiver: "GLOW SKIN CAMBODIA" } }),
    event("🤖 AI is checking the ABA slip with the bank…", "10:10", "info"),
  ],
});

const inv1172: Order = {
  id: 1172, invoice_no: "INV-1172", status: "shipped", customer: dara, conversation_id: 1, subtotal: 43.5, delivery_fee: 1.5,
  total: 45, delivery_zone: "phnom_penh", delivery_address: "#45, St. 271, Toul Kork, Phnom Penh", created_by_ai: true,
  staff_id: VANNA, payment_provider: "aba_payway", bank_ref: "100FT3381207", paid_at: at("18:21", 1), confirmed_at: at("18:40", 1),
  created_at: at("18:00", 1), items: [], slips: [],
  delivery: { id: 1, courier: "jnt", fee: 1.5, cod_amount: 0, tracking_no: "JT004418230", tracking_url: "#", status: "pickup_missed", created_at: at("19:00", 1) },
};

export const demoDaraChat = (): ConversationDetail => ({
  ...demoInboxST02().items[0],
  reply_route: "Instagram DM · replies go back via Instagram",
  ai_analysis: {},
  recommended_products: [],
  orders: [inv1172],
  messages: [
    msg("customer", "ខ្ញុំវេរលុយតាំងពីម្សិលមិញ មិនទាន់ឃើញផ្ញើអីវ៉ាន់ទេ! 😡", "10:41"),
    msg("customer", "ធ្វើការបែបនេះមែន?? ចង់បានលុយវិញ!", "10:41"),
    msg("ai", "សូមអភ័យទោសបង 🙏 ខ្ញុំកំពុងភ្ជាប់បងទៅកាន់បុគ្គលិករបស់យើងភ្លាមៗ។", "10:41"),
    event("[Wait Staff 🔴] · AI handed off to staff", "10:41", "danger"),
    event("Vanna took over · AI paused", "10:43", "brand"),
    msg("staff", "សូមអភ័យទោសខ្លាំងណាស់បង Dara 🙏 ការកម្មង់ INV-1172 បានបង់រួច ✓ ប៉ុន្តែ J&T មិនទាន់មកយក។ ខ្ញុំបានប្តូរទៅ Grab Express — នឹងដល់ក្នុង 1 ម៉ោង។", "10:44", { staff_name: "Vanna (you)" }),
    msg("staff", "", "10:45", { kind: "voice", meta: { duration: "0:12" } }),
    msg("customer", "អូខេ អរគុណបង 🙏", "10:46"),
  ],
});

export const demoQuickReplies: QuickReply[] = [
  { id: 1, command: "/price", text: "ផ្ញើព័ត៌មានតម្លៃផលិតផល + link" },
  { id: 2, command: "/delivery", text: "ថ្លៃដឹក: ភ្នំពេញ $1.50 · ខេត្ត $2.00 · Grab 1 ម៉ោង" },
  { id: 3, command: "/bank", text: "ABA: GLOW SKIN CAMBODIA · 000 123 456 + KHQR" },
];

export const demoSuggestion = "បង Dara 🙏 Grab កំពុងដឹកទៅបង ETA 11:45។ ជាការសុំទោស យើងបានដាក់ voucher VIP 5% សម្រាប់ការកម្មង់បន្ទាប់ 💛";

export const demoProviders: PaymentProvider[] = [
  { id: 1, provider: "bakong", environment: "production", is_connected: true, use_for_invoices: true,
    merchant_name: "GLOW SKIN CAMBODIA", account_id: "glowskin@aclb", secret_masked: "•••••••••• 8f2c",
    methods: ["KHQR · USD", "KHQR · KHR"], token_expires_at: new Date(Date.now() + 74 * 86_400_000).toISOString() },
  { id: 2, provider: "aba_payway", environment: "sandbox", is_connected: true, use_for_invoices: true,
    merchant_name: null, account_id: "ec00•••62", secret_masked: "•••••••••• a91e", methods: ["ABA KHQR", "Cards", "Deeplink"],
    token_expires_at: null },
  { id: 3, provider: "acleda", environment: "sandbox", is_connected: false, use_for_invoices: false, merchant_name: null,
    account_id: null, secret_masked: "—", methods: ["KHQR", "Account / Wallet", "Cards (MPGS)"], token_expires_at: null },
];

export const demoDeliveryOrder = {
  invoice_no: "INV-1185", status: "paid" as const, total: 38.5, delivery_zone: "phnom_penh",
  customer: { ...dara, phone: "012 345 678" }, delivery_address: "#45, St. 271, Toul Kork, Phnom Penh",
  items: [1, 2, 3].map((id) => ({ id, product_id: id, name: "", quantity: 1, unit_price: 0 })),
};

export const DEMO_STAFF = { id: VANNA, name: "Vanna C." };
