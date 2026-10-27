"""AI sales assistant: sentiment, hand-off, replies, recommendations, order intent and slip reading.

Uses Claude when ANTHROPIC_API_KEY is configured; otherwise a deterministic rule-based
assistant (Khmer + English keywords) keeps the whole flow working for local development.
"""

import base64
import json
import logging
import re
from dataclasses import dataclass, field
from decimal import Decimal
from functools import lru_cache
from typing import Any

import anthropic

from app.core.config import get_settings
from app.models import KnowledgeArticle, Message, Product, Sender, Sentiment, Shop

log = logging.getLogger(__name__)

KHMER_RE = re.compile(r"[ក-៿]")


@dataclass
class OrderIntent:
    items: list[tuple[int, int]]  # (product_id, quantity)
    delivery_zone: str = "phnom_penh"
    phone: str | None = None
    address: str | None = None


@dataclass
class AIDecision:
    sentiment: Sentiment
    needs_human: bool
    reply: str
    handoff_reason: str = ""
    recommended_product_ids: list[int] = field(default_factory=list)
    order: OrderIntent | None = None
    facts: dict[str, str] = field(default_factory=dict)
    confidence: float = 0.0
    source: str = "rules"
    tokens: dict[str, int] = field(default_factory=dict)
    provider: str = ""
    model_used: str = ""


@dataclass
class SlipReading:
    is_payment_slip: bool
    bank: str | None = None
    amount: Decimal | None = None
    receiver: str | None = None
    reference: str | None = None
    paid_time: str | None = None
    confidence: float = 0.0


@lru_cache
def _client() -> anthropic.Anthropic | None:
    key = get_settings().anthropic_api_key
    return anthropic.Anthropic(api_key=key) if key else None


def is_khmer(text: str) -> bool:
    return bool(KHMER_RE.search(text))


# --------------------------------------------------------------------------- Claude


REPLY_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "sentiment": {"type": "string", "enum": ["normal", "interested", "angry"]},
        "needs_human": {"type": "boolean"},
        "handoff_reason": {"type": "string"},
        "reply": {"type": "string"},
        "recommended_product_ids": {"type": "array", "items": {"type": "integer"}},
        "create_order": {"type": "boolean"},
        "order_items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"product_id": {"type": "integer"}, "quantity": {"type": "integer"}},
                "required": ["product_id", "quantity"],
                "additionalProperties": False,
            },
        },
        "delivery_zone": {"type": "string", "enum": ["phnom_penh", "province", "grab", "unknown"]},
        "customer_phone": {"type": "string"},
        "customer_address": {"type": "string"},
        "facts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"label": {"type": "string"}, "value": {"type": "string"}},
                "required": ["label", "value"],
                "additionalProperties": False,
            },
        },
        "confidence": {"type": "number"},
    },
    "required": [
        "sentiment", "needs_human", "handoff_reason", "reply", "recommended_product_ids",
        "create_order", "order_items", "delivery_zone", "customer_phone", "customer_address",
        "facts", "confidence",
    ],
    "additionalProperties": False,
}

SLIP_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "is_payment_slip": {"type": "boolean"},
        "bank": {"type": "string"},
        "amount": {"type": "number"},
        "currency": {"type": "string"},
        "receiver": {"type": "string"},
        "reference": {"type": "string"},
        "paid_time": {"type": "string"},
        "confidence": {"type": "number"},
    },
    "required": ["is_payment_slip", "bank", "amount", "currency", "receiver", "reference", "paid_time", "confidence"],
    "additionalProperties": False,
}

ASSISTANT_RULES = """You are the AI sales assistant for an online shop in Cambodia. You chat with customers on
Telegram, Messenger, Instagram and TikTok on behalf of the shop.

How to behave:
- Reply in the customer's language (Khmer or English). Be warm and brief, like a friendly shop assistant
  ("បង" is a polite way to address the customer in Khmer). Use at most one emoji.
- Only quote products, prices and stock from the catalogue below. Never invent products, prices or policies.
- Explain product capabilities, benefits, and positive impacts to help customers understand how the product solves their needs.
- Always advise customers transparently about precautions, contraindications, or potential negative impacts/side effects if relevant (e.g. sensitive skin, pregnancy, allergies, or when asked).
- Provide application/usage instructions when customers ask how or when to use a product.
- Recommend at most 2 products, and only ones that fit what the customer described.
- Skin, crop or health advice is an estimate, never a diagnosis; say so when you give it.

Classify the customer's sentiment:
- "angry": upset, complaining, threatening a bad review, or demanding a refund.
- "interested": asking prices, stock or delivery, or ready to buy.
- "normal": anything else.

Set needs_human to true (the shop's staff take over and you stop replying) when the customer is angry or
urgent, asks for a discount or price exception, asks about a past order, payment or refund problem, or asks
something the catalogue and guides cannot answer. In that case your reply politely says a team member will
help right away, and handoff_reason says why in one short English sentence for the staff.

Set create_order to true only when the customer clearly confirms which product(s) and quantity they want.
Then fill order_items and delivery_zone (phnom_penh for Phnom Penh districts such as BKK1 or Toul Kork,
province for other provinces, grab if they ask for same-hour delivery). The shop's system creates the
invoice and payment QR itself, so your reply only confirms the order briefly.

facts: what you learned about the customer that helps selling (e.g. "Skin type": "Oily · acne-prone"), with
confidence 0-1 for those estimates. Leave facts empty when there is nothing new."""


def _catalogue_block(shop: Shop, products: list[Product], knowledge: list[KnowledgeArticle]) -> str:
    fees = shop.delivery_fees or {}
    lines = [f"Shop: {shop.name} ({shop.category})", "", "Catalogue (id · name · price USD · stock):"]
    for p in products:
        stock = "in stock" if p.stock > 0 else "OUT OF STOCK"
        details = []
        if p.description:
            details.append(p.description)
        if getattr(p, "about", None):
            details.append(f"About: {p.about}")
        if getattr(p, "positive_impacts", None):
            details.append(f"Capabilities/Benefits: {p.positive_impacts}")
        if getattr(p, "negative_impacts", None):
            details.append(f"Precautions/Warnings: {p.negative_impacts}")
        if getattr(p, "usage_instructions", None):
            details.append(f"How to use: {p.usage_instructions}")
        desc_str = f" — {' · '.join(details)}" if details else ""
        lines.append(f"- {p.id} · {p.name} · ${p.price:.2f} · {stock} ({p.stock}){desc_str}")
    lines += ["", f"Delivery fees: Phnom Penh ${fees.get('phnom_penh', 1.5)}, provinces ${fees.get('province', 2)}, "
              f"Grab within 1 hour ${fees.get('grab', 2.8)}."]
    if knowledge:
        lines += ["", "Shop guides:"]
        lines += [f"## {k.title}\n{k.content}" for k in knowledge]
    if shop.ai_instructions:
        lines += ["", "Extra instructions from the shop owner:", shop.ai_instructions]
    return "\n".join(lines)


def _transcript(history: list[Message]) -> str:
    who = {Sender.customer: "Customer", Sender.ai: "AI", Sender.staff: "Staff", Sender.system: "System"}
    rows = []
    for m in history[-20:]:
        body = m.body or f"[{m.kind.value}]"
        rows.append(f"{who[m.sender]}: {body}")
    return "\n".join(rows)


def _resolve_active_key(config: dict[str, Any], provider: str) -> str:
    keys = config.get(f"{provider}_keys")
    if isinstance(keys, list):
        for k in keys:
            if isinstance(k, dict) and k.get("is_active") and k.get("key"):
                return str(k["key"]).strip()
    return str(config.get(f"{provider}_key") or "").strip()


def _call_codecraft(system_text: str, user_content: str, model: str | None = None,
                    api_key: str | None = None, base_url: str | None = None) -> tuple[dict[str, Any] | None, dict[str, int]]:
    """Call CodeCraft API (OpenAI-compatible: https://codecraftapi.com/docs) and return (data, real_tokens)."""
    settings = get_settings()
    key = api_key or settings.codecraft_api_key
    if not key:
        return None, {}
    url = (base_url or settings.codecraft_base_url or "https://codecraftapi.com/v1").rstrip("/")
    model_name = model or settings.codecraft_default_model or "gemini-3.7-flash"
    if model_name in ("gemini-3.8-flash", "gemini-2.5-flash", "claude-opus-5-5", "claude-3-7-sonnet") or not (model_name.startswith("gemini-") or model_name.startswith("claude-opus-4")):
        model_name = "gemini-3.7-flash"
    import httpx
    try:
        req_payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_text + "\nRespond strictly in valid JSON matching the reply schema."},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }
        res = httpx.post(
            f"{url}/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json=req_payload,
            timeout=25.0,
        )
        if res.is_success:
            res_data = res.json()
            content_str = res_data["choices"][0]["message"]["content"]
            usage = res_data.get("usage") or {}
            tokens = {
                "prompt_tokens": int(usage.get("prompt_tokens") or 0),
                "completion_tokens": int(usage.get("completion_tokens") or 0),
                "total_tokens": int(usage.get("total_tokens") or 0),
            }
            return json.loads(content_str), tokens
    except Exception as e:
        log.warning("CodeCraft API call failed (%s): %s", type(e).__name__, e)
    return None, {}


def _call_gemini(system_text: str, user_content: str, model: str | None = None,
                 api_key: str | None = None) -> tuple[dict[str, Any] | None, dict[str, int]]:
    """Call Google Gemini API (OpenAI-compatible endpoint with automatic JSON reply and real token tracking)."""
    settings = get_settings()
    key = api_key or settings.gemini_api_key
    if not key:
        return None, {}
    model_name = model or "gemini-3.8-flash"
    import httpx
    try:
        url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
        req_payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_text + "\nRespond strictly in valid JSON matching the reply schema."},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }
        res = httpx.post(
            url,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json=req_payload,
            timeout=25.0,
        )
        if res.is_success:
            res_data = res.json()
            content_str = res_data["choices"][0]["message"]["content"]
            usage = res_data.get("usage") or {}
            tokens = {
                "prompt_tokens": int(usage.get("prompt_tokens") or 0),
                "completion_tokens": int(usage.get("completion_tokens") or 0),
                "total_tokens": int(usage.get("total_tokens") or 0),
            }
            return json.loads(content_str), tokens
    except Exception as e:
        log.warning("Google Gemini API call failed (%s): %s", type(e).__name__, e)
    return None, {}


def _call_claude(system: list[dict[str, Any]], content: list[dict[str, Any]] | str, schema: dict[str, Any],
                 effort: str, model: str | None = None) -> tuple[dict[str, Any] | None, dict[str, int]]:
    client = _client()
    if client is None:
        return None, {}
    try:
        response = client.beta.messages.create(
            model=model or get_settings().ai_model,
            max_tokens=16000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            system=system,
            messages=[{"role": "user", "content": content}],
            output_config={"effort": effort, "format": {"type": "json_schema", "schema": schema}},
        )
    except anthropic.RateLimitError:
        log.warning("Claude rate limited; using rule-based assistant")
        return None, {}
    except anthropic.APIStatusError as e:
        log.error("Claude API error %s: %s", e.status_code, e.message)
        return None, {}
    except anthropic.APIConnectionError:
        log.error("Could not reach the Claude API; using rule-based assistant")
        return None, {}
    if response.stop_reason in ("refusal", "max_tokens"):
        log.warning("Claude stopped with %s (request %s)", response.stop_reason, response._request_id)
        return None, {}
    text = next((b.text for b in response.content if b.type == "text"), None)
    tokens: dict[str, int] = {}
    if hasattr(response, "usage") and response.usage:
        tokens = {
            "prompt_tokens": getattr(response.usage, "input_tokens", 0),
            "completion_tokens": getattr(response.usage, "output_tokens", 0),
            "total_tokens": getattr(response.usage, "input_tokens", 0) + getattr(response.usage, "output_tokens", 0),
        }
    return json.loads(text) if text else None, tokens


def decide_reply(shop: Shop, history: list[Message], products: list[Product],
                 knowledge: list[KnowledgeArticle], platform_config: dict[str, Any] | None = None) -> AIDecision:
    """platform_config is the Super Admin's global AI settings (model, global_instructions, handoff_on_discount)."""
    # User / Shop Access Control: Check if shop AI is enabled
    if getattr(shop, "ai_enabled", None) is False:
        log.info("AI disabled for shop %s (%s); skipping automated reply", shop.id, shop.name)
        return AIDecision(sentiment=Sentiment.normal, needs_human=True, reply="", handoff_reason="AI assistance paused by shop controls")

    config = platform_config or {}
    rules = ASSISTANT_RULES
    if not config.get("handoff_on_discount", True):
        rules = rules.replace("asks for a discount or price exception, ", "")
    if config.get("global_instructions"):
        rules += "\n\nPlatform policy (always applies):\n" + config["global_instructions"]
    catalogue = _catalogue_block(shop, products, knowledge)

    user_content = f"Conversation so far:\n{_transcript(history)}\n\nWrite the next AI message."

    # Sequential execution: CodeCraft vs Google Gemini priority order
    order = config.get("provider_order") or ["codecraft", "gemini"]
    data = None
    tokens: dict[str, int] = {}
    used_provider = ""
    used_model = ""

    for prov in order:
        if prov == "codecraft" and data is None:
            cc_key = _resolve_active_key(config, "codecraft")
            cc_model = config.get("codecraft_model") or config.get("model") or "gemini-3.7-flash"
            if cc_model in ("claude-opus-5-5", "claude-3-7-sonnet", "gemini-3.8-flash", "gemini-2.5-flash") or not (cc_model.startswith("gemini-") or cc_model.startswith("claude-opus-4")):
                cc_model = "gemini-3.7-flash"
            data, tokens = _call_codecraft(
                system_text=rules + "\n\n" + catalogue,
                user_content=user_content,
                model=cc_model,
                api_key=cc_key,
                base_url=config.get("codecraft_base_url"),
            )
            if data is not None:
                used_provider = "codecraft"
                used_model = cc_model
        elif prov == "gemini" and data is None:
            gem_key = _resolve_active_key(config, "gemini")
            gem_model = config.get("fallback_model") or "gemini-3.7-flash"
            data, tokens = _call_gemini(
                system_text=rules + "\n\n" + catalogue,
                user_content=user_content,
                model=gem_model,
                api_key=gem_key,
            )
            if data is not None:
                used_provider = "gemini"
                used_model = gem_model
        if data is not None:
            break

    # Fallback to direct Claude if configured gateways fail
    if data is None:
        data, tokens = _call_claude(
            system=[
                {"type": "text", "text": rules},
                {"type": "text", "text": catalogue, "cache_control": {"type": "ephemeral"}},
            ],
            content=user_content,
            schema=REPLY_SCHEMA,
            effort="medium",
            model=config.get("model"),
        )
        if data is not None:
            used_provider = "claude"
            used_model = config.get("model") or get_settings().ai_model

    if data is None:
        rule_dec = rule_based_reply(shop, history, products)
        prompt_len = len(rules) + len(catalogue) + len(user_content)
        reply_len = len(rule_dec.reply)
        rule_dec.tokens = {
            "prompt_tokens": prompt_len // 4,
            "completion_tokens": reply_len // 4,
            "total_tokens": (prompt_len + reply_len) // 4,
        }
        rule_dec.provider = "rules"
        rule_dec.model_used = "rule-based"
        return rule_dec

    valid_ids = {p.id for p in products}
    order = None
    order_items = data.get("order_items") or []
    items = [(i["product_id"], max(1, i.get("quantity", 1))) for i in order_items if isinstance(i, dict) and i.get("product_id") in valid_ids]
    if data.get("create_order") and items:
        zone = data.get("delivery_zone") or "phnom_penh"
        if zone == "unknown":
            zone = "phnom_penh"
        order = OrderIntent(items, zone, data.get("customer_phone") or None, data.get("customer_address") or None)

    rec_ids = data.get("recommended_product_ids") or []
    if not isinstance(rec_ids, list):
        rec_ids = []

    facts_data = data.get("facts") or []
    facts_dict = {}
    if isinstance(facts_data, list):
        for f in facts_data:
            if isinstance(f, dict) and "label" in f and "value" in f:
                facts_dict[f["label"]] = str(f["value"])
    elif isinstance(facts_data, dict):
        facts_dict = {str(k): str(v) for k, v in facts_data.items()}

    sentiment_val = data.get("sentiment", "normal")
    if sentiment_val not in ("normal", "interested", "angry"):
        sentiment_val = "interested" if order else "normal"

    return AIDecision(
        sentiment=Sentiment(sentiment_val),
        needs_human=bool(data.get("needs_human", False)),
        handoff_reason=str(data.get("handoff_reason") or ""),
        reply=str(data.get("reply") or ""),
        recommended_product_ids=[i for i in rec_ids if i in valid_ids][:2],
        order=order,
        facts=facts_dict,
        confidence=max(0.0, min(1.0, float(data.get("confidence") or 0.8))),
        source=used_provider or "claude",
        tokens=tokens,
        provider=used_provider or "claude",
        model_used=used_model,
    )


def read_payment_slip(image_bytes: bytes, media_type: str) -> SlipReading:
    data, _ = _call_claude(
        system=[{"type": "text", "text": (
            "You read Cambodian bank transfer screenshots (ABA, ACLEDA, Wing, Bakong KHQR and others). "
            "Extract exactly what is printed. If the image is not a payment confirmation, set is_payment_slip "
            "to false. amount is the transferred amount as a positive number. confidence is 0-1 for how sure "
            "you are that every extracted field is correct. Use an empty string for fields you cannot read."
        )}],
        content=[
            {"type": "image", "source": {"type": "base64", "media_type": media_type,
                                         "data": base64.standard_b64encode(image_bytes).decode()}},
            {"type": "text", "text": "Extract the payment details from this slip."},
        ],
        schema=SLIP_SCHEMA,
        effort="medium",
    )
    if data is None:
        # Without vision we can't read the image; staff verify it in Orders & Invoices.
        return SlipReading(is_payment_slip=True, confidence=0.0)
    return SlipReading(
        is_payment_slip=data["is_payment_slip"],
        bank=data["bank"] or None,
        amount=Decimal(str(abs(data["amount"]))) if data["amount"] else None,
        receiver=data["receiver"] or None,
        reference=data["reference"] or None,
        paid_time=data["paid_time"] or None,
        confidence=max(0.0, min(1.0, float(data["confidence"]))),
    )


def suggest_reply(shop: Shop, history: list[Message], products: list[Product],
                  knowledge: list[KnowledgeArticle], instruction: str = "") -> str:
    """Copilot suggestion a staff member can insert, rewrite or ignore."""
    data = _call_claude(
        system=[
            {"type": "text", "text": (
                "You draft replies for a shop's staff member, who is talking to a customer in manual mode. "
                "Write one short, kind message in the customer's language that resolves their latest concern. "
                "Only use facts from the catalogue and the conversation."
            )},
            {"type": "text", "text": _catalogue_block(shop, products, knowledge), "cache_control": {"type": "ephemeral"}},
        ],
        content=f"Conversation:\n{_transcript(history)}\n\n{instruction or 'Draft the next staff reply.'}",
        schema={"type": "object", "properties": {"reply": {"type": "string"}}, "required": ["reply"],
                "additionalProperties": False},
        effort="low",
    )
    if data:
        return data["reply"]
    last = next((m.body for m in reversed(history) if m.sender == Sender.customer), "")
    if is_khmer(last):
        return "សូមអភ័យទោសបង 🙏 ខ្ញុំកំពុងពិនិត្យការកម្មង់របស់បង ហើយនឹងប្រាប់បងវិញភ្លាមៗ។"
    return "Sorry for the wait 🙏 I'm checking your order now and will update you in a moment."


def personalize_broadcast(template: str, customer_name: str, last_product: str | None) -> str:
    text = template.replace("{name}", customer_name).replace("{product}", last_product or "")
    if _client() is None or not last_product:
        return text
    data = _call_claude(
        system=[{"type": "text", "text": (
            "Rewrite a shop's promotion message for one past customer. Keep the offer, prices and dates exactly; "
            "mention the product they bought last time in one natural phrase. Same language as the template. "
            "At most 3 sentences."
        )}],
        content=f"Customer: {customer_name}\nLast purchase: {last_product}\nTemplate:\n{text}",
        schema={"type": "object", "properties": {"message": {"type": "string"}}, "required": ["message"],
                "additionalProperties": False},
        effort="low",
    )
    return data["message"] if data else text


# --------------------------------------------------------------------------- rules fallback

ANGRY_WORDS = ["😡", "🤬", "refund", "scam", "fake", "where is my order", "still not", "angry", "worst",
               "ចង់បានលុយវិញ", "មិនទាន់ឃើញ", "ធ្វើការបែបនេះ", "បោក", "ខឹង", "យឺតពេក", "!!"]
HUMAN_WORDS = ["discount", "cheaper", "bulk", "wholesale", "manager", "human", "staff",
               "បញ្ចុះតម្លៃ", "ចុះតម្លៃ", "ដុំ", "អ្នកលក់", "បុគ្គលិក"]
INTEREST_WORDS = ["price", "how much", "stock", "available", "buy", "order", "delivery", "deliver",
                  "ប៉ុន្មាន", "តម្លៃ", "មានទេ", "ចង់បាន", "ទិញ", "យក", "កម្មង់", "ដឹក", "ផ្ញើ"]
BUY_WORDS = ["i'll take", "i will take", "i want", "order", "buy", "take", "យក", "កម្មង់", "ទិញ"]
PROVINCES = ["siem reap", "battambang", "kampot", "kampong", "takeo", "kandal", "province", "ខេត្ត", "សៀមរាប", "បាត់ដំបង"]
GRAB_WORDS = ["grab", "1 hour", "urgent delivery", "ម៉ោងនេះ", "ភ្លាមៗ"]
SKIN_HINTS = {"oily": "Oily · acne-prone", "acne": "Oily · acne-prone", "មុន": "Oily · acne-prone",
              "ប្រែង": "Oily · acne-prone", "dry": "Dry", "ស្ងួត": "Dry", "sensitive": "Sensitive"}


def _has(text: str, words: list[str]) -> bool:
    low = text.lower()
    return any(w in low for w in words)


def _match_products(text: str, products: list[Product]) -> list[Product]:
    low = text.lower()
    scored = []
    for p in products:
        tokens = [t for t in re.split(r"[^\w]+", p.name.lower()) if len(t) > 2 and not t.isdigit() and t != "ml"]
        score = sum(1 for t in tokens if t in low)
        if score:
            scored.append((score, p))
    scored.sort(key=lambda s: -s[0])
    return [p for _, p in scored]


def _quantity(text: str) -> int:
    m = re.search(r"(?:×|x|\b)(\d{1,2})\s*(?:ដប|pcs|pieces|bottles?|ប្រអប់|\b)", text.lower())
    return int(m.group(1)) if m and 0 < int(m.group(1)) < 50 else 1


def rule_based_reply(shop: Shop, history: list[Message], products: list[Product]) -> AIDecision:
    last = next((m.body for m in reversed(history) if m.sender == Sender.customer), "") or ""
    km = is_khmer(last)
    in_stock = [p for p in products if p.stock > 0]

    if _has(last, ANGRY_WORDS):
        return AIDecision(
            sentiment=Sentiment.angry, needs_human=True, confidence=0.7,
            handoff_reason="Customer is upset — needs a staff member now.",
            reply=("សូមអភ័យទោសបង 🙏 ខ្ញុំកំពុងភ្ជាប់បងទៅកាន់បុគ្គលិករបស់យើងភ្លាមៗ។" if km else
                   "I'm so sorry about this 🙏 I'm connecting you with our team right now."),
        )
    if _has(last, HUMAN_WORDS):
        return AIDecision(
            sentiment=Sentiment.interested, needs_human=True, confidence=0.6,
            handoff_reason="Asked for a discount or something only staff can approve.",
            reply=("បាទ/ចាស បង 🙏 សូមរង់ចាំបន្តិច បុគ្គលិករបស់យើងនឹងឆ្លើយបងភ្លាមៗ។" if km else
                   "Thanks for asking 🙏 one of our team will reply to you in a moment."),
        )

    if _has(last, ["qr", "qrcode", "បាញ់លុយ", "បង់លុយ", "បង់ប្រាក់", "ស្កេន", "លេខកូដ"]):
        return AIDecision(
            sentiment=Sentiment.interested, needs_human=False, confidence=0.7,
            reply=("បាទ/ចាសបង 🙏 សូមស្កេន QR Code ខាងលើដើម្បីបង់ប្រាក់ ហើយផ្ញើបង្កាន់ដៃ (Slip) មកកាន់ទីនេះដើម្បីឱ្យ AI ផ្ទៀងផ្ទាត់ជូនបងភ្លាមៗ។" if km else
                   "Please scan the QR Code above to complete your payment 🙏 and send your payment slip here for instant verification."),
        )

    facts = {"Skin type": v for k, v in SKIN_HINTS.items() if k in last.lower()}
    matched = _match_products(last, in_stock)

    if matched and _has(last, BUY_WORDS):
        product = matched[0]
        zone = "grab" if _has(last, GRAB_WORDS) else "province" if _has(last, PROVINCES) else "phnom_penh"
        qty = _quantity(last)
        return AIDecision(
            sentiment=Sentiment.interested, needs_human=False, confidence=0.6, facts=facts,
            recommended_product_ids=[product.id],
            order=OrderIntent([(product.id, qty)], zone),
            reply=(f"អរគុណបង 🙏 ខ្ញុំបានកត់ត្រា {product.name} × {qty} ហើយ។" if km else
                   f"Thank you 🙏 I've noted {product.name} × {qty} for you."),
        )

    if matched:
        p = matched[0]
        return AIDecision(
            sentiment=Sentiment.interested, needs_human=False, confidence=0.6, facts=facts,
            recommended_product_ids=[p.id for p in matched[:2]],
            reply=(f"{p.name} តម្លៃ ${p.price:.2f} មានក្នុងស្តុកបង 🙏 ចង់កម្មង់ប៉ុន្មានដែរបង?" if km else
                   f"{p.name} is ${p.price:.2f} and in stock 🙏 How many would you like?"),
        )

    if facts:
        picks = in_stock[:2]
        return AIDecision(
            sentiment=Sentiment.interested, needs_human=False, confidence=0.5, facts=facts,
            recommended_product_ids=[p.id for p in picks],
            reply=("ជម្រាបសួរបង 🙏 តាមព័ត៌មានរបស់បង ខ្ញុំណែនាំផលិតផលខាងក្រោម 👇" if km else
                   "Thanks for sharing 🙏 Based on what you described, I'd recommend these 👇"),
        )

    if _has(last, INTEREST_WORDS):
        names = ", ".join(f"{p.name} (${p.price:.2f})" for p in in_stock[:3])
        return AIDecision(
            sentiment=Sentiment.interested, needs_human=False, confidence=0.4,
            reply=(f"ជម្រាបសួរបង 🙏 យើងមាន {names}។ បងចាប់អារម្មណ៍មួយណាដែរ?" if km else
                   f"Hello 🙏 We have {names}. Which one are you interested in?"),
        )

    return AIDecision(
        sentiment=Sentiment.normal, needs_human=False, confidence=0.4,
        reply=("ជម្រាបសួរបង 🙏 តើខ្ញុំអាចជួយអ្វីបានខ្លះ?" if km else "Hello 🙏 How can I help you today?"),
    )
