"""Multimodal Knowledge Base Extraction Service for Chhlat AI.

Extracts structured product catalogues and business policies from:
- Images (menus, flyers, brochures, price sheets)
- Documents (PDF catalogs, policy handbooks)
- Spreadsheets (CSV inventory or price lists)

Uses Gemini 2.0/1.5 Flash multimodal capabilities with strict JSON schemas,
automated store syncing, and robust fallbacks.
"""

from __future__ import annotations

import base64
import csv
import io
import json
import logging
import re
from decimal import Decimal
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import KnowledgeArticle, KnowledgeBase, Product, SystemSetting

log = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """You are a precision retail knowledge extraction AI for e-commerce stores.
Analyze the provided document/image/spreadsheet (product catalog, restaurant menu, price list, flyer, promotional leaflet, or store policy).
Extract all products/services and store operational policies.

Respond STRICTLY in valid JSON matching this schema:
{
  "products": [
    {
      "name": "Exact product or menu item name",
      "price": 12.50,
      "details": "Description, size, specifications, options, or ingredients"
    }
  ],
  "policies": [
    {
      "topic": "shipping | payment | warranty | return | contact | general",
      "content": "Specific policy rules, delivery fees, accepted payment methods, guarantee, etc."
    }
  ]
}

Formatting rules:
- Price should be a numeric float or string representation of the price (e.g. 15.0 or 15).
- If no products are found, return "products": [].
- If no policies are found, return "policies": [].
- Return pure JSON only. Do not wrap in markdown or include conversational text.
"""


def _clean_json_response(raw_text: str) -> dict[str, Any]:
    """Strip markdown backticks, preamble, and extract valid JSON object."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    
    # Locate first { and last }
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        cleaned = cleaned[start : end + 1]

    data = json.loads(cleaned)
    if not isinstance(data, dict):
        raise ValueError("Root JSON is not an object")
    return data


def _resolve_gemini_key(db: Session | None = None) -> str:
    """Resolve Gemini API key from environment, settings, or database."""
    settings = get_settings()
    if settings.gemini_api_key:
        return settings.gemini_api_key

    if db is not None:
        try:
            setting = db.get(SystemSetting, "ai")
            if setting and isinstance(setting.value, dict):
                key = setting.value.get("gemini_key")
                if key:
                    return key
                keys = setting.value.get("gemini_keys") or []
                active = next((k["key"] for k in keys if k.get("is_active") and k.get("key")), None)
                if active:
                    return active
        except Exception as e:
            log.warning("Could not read ai system setting: %s", e)

    return ""


def _resolve_ai_credentials(db: Session | None = None) -> dict[str, Any]:
    """Resolve CodeCraft API and Google Gemini credentials from environment or DB."""
    settings = get_settings()
    cc_key = settings.codecraft_api_key
    cc_base = settings.codecraft_base_url or "https://codecraftapi.com/v1"
    cc_model = settings.codecraft_default_model or "gemini-3.8-flash"
    gem_key = _resolve_gemini_key(db)

    if db is not None:
        try:
            setting = db.get(SystemSetting, "ai")
            if setting and isinstance(setting.value, dict):
                v = setting.value
                # CodeCraft resolution
                if not cc_key:
                    cc_key = v.get("codecraft_key")
                    if not cc_key:
                        keys = v.get("codecraft_keys") or []
                        cc_key = next((k["key"] for k in keys if k.get("is_active") and k.get("key")), "")
                if v.get("codecraft_base_url"):
                    cc_base = v.get("codecraft_base_url")
                if v.get("codecraft_model") or v.get("model"):
                    cc_model = v.get("codecraft_model") or v.get("model")
        except Exception as e:
            log.warning("Could not read ai system setting: %s", e)

    return {
        "codecraft_key": cc_key or "",
        "codecraft_base_url": cc_base,
        "codecraft_model": cc_model,
        "gemini_key": gem_key or "",
    }


def _parse_csv_locally(csv_text: str) -> dict[str, Any]:
    """Deterministic CSV parsing fallback when no AI key is configured or API is unreachable."""
    products: list[dict[str, Any]] = []
    policies: list[dict[str, Any]] = []

    lines = [line.strip() for line in csv_text.splitlines() if line.strip()]
    current_mode = "product"
    policy_keywords = {"shipping", "payment", "warranty", "return", "refund", "delivery", "policy", "faq", "terms"}

    for line in lines:
        parts = [p.strip().strip('"') for p in line.split(",")]
        if not parts or not any(parts):
            continue
        first_cell = parts[0].lower()

        # Check for section header row
        if "topic" in first_cell or ("policy" in first_cell and len(parts) > 1 and "content" in parts[1].lower()):
            current_mode = "policy"
            continue
        elif "product" in first_cell or "item" in first_cell or ("name" in first_cell and "price" in line.lower()):
            current_mode = "product"
            continue

        if current_mode == "policy" or first_cell in policy_keywords:
            topic = parts[0]
            content = parts[1] if len(parts) > 1 else ""
            if topic and content and topic.lower() not in ("topic", "policy"):
                policies.append({"topic": topic.lower(), "content": content})
        else:
            name = parts[0]
            price_str = parts[1] if len(parts) > 1 else "0"
            details = parts[2] if len(parts) > 2 else ""
            try:
                price_val = float(re.sub(r"[^\d.]", "", price_str) or 0)
            except ValueError:
                price_val = 0.0
            if name and name.lower() not in ("name", "item", "product", "title"):
                products.append({"name": name, "price": price_val, "details": details})

    return {"products": products, "policies": policies}


def call_gemini_multimodal(
    file_bytes: bytes,
    content_type: str,
    api_key: str,
    prompt: str = EXTRACTION_SYSTEM_PROMPT,
    model: str = "gemini-2.0-flash",
) -> dict[str, Any]:
    """Call Google Gemini multimodal API with image/PDF/text."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    parts: list[dict[str, Any]] = [{"text": prompt}]

    if content_type.startswith("text/") or content_type in ("application/csv", "text/csv"):
        text_content = file_bytes.decode("utf-8", errors="replace")
        parts.append({"text": f"Document content:\n\n{text_content}"})
    else:
        # Multimodal binary: JPEG, PNG, WEBP, PDF
        b64_data = base64.b64encode(file_bytes).decode("utf-8")
        parts.append({
            "inline_data": {
                "mime_type": content_type,
                "data": b64_data,
            }
        })

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1,
        },
    }

    headers = {"Content-Type": "application/json"}
    with httpx.Client(timeout=45.0) as client:
        res = client.post(url, headers=headers, json=payload)
        
        # Handle rate limits or errors gracefully
        if res.status_code == 429:
            log.warning("Gemini API rate limit (429) hit. Response: %s", res.text[:200])
            raise RuntimeError("Gemini API rate limit reached. Please retry in a few moments.")
        if not res.is_success:
            log.error("Gemini API returned error %s: %s", res.status_code, res.text[:300])
            res.raise_for_status()

        data = res.json()
        candidates = data.get("candidates") or []
        if not candidates:
            raise ValueError("No candidates returned from Gemini API")

        raw_output = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return _clean_json_response(raw_output)


def call_codecraft_multimodal(
    file_bytes: bytes,
    content_type: str,
    api_key: str,
    base_url: str = "https://codecraftapi.com/v1",
    model: str = "gemini-3.7-flash",
    prompt: str = EXTRACTION_SYSTEM_PROMPT,
) -> dict[str, Any]:
    """Call CodeCraft API (OpenAI-compatible) with multimodal vision/PDF/text."""
    url = f"{base_url.rstrip('/')}/chat/completions"

    if content_type.startswith("text/") or content_type in ("application/csv", "text/csv"):
        text_content = file_bytes.decode("utf-8", errors="replace")
        user_message_content: Any = f"Document content:\n\n{text_content}"
    else:
        b64_data = base64.b64encode(file_bytes).decode("utf-8")
        mime = content_type if content_type.startswith("image/") else "image/png"
        user_message_content = [
            {"type": "text", "text": "Extract all products and policies from this document according to the JSON format."},
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime};base64,{b64_data}",
                },
            },
        ]

    # Map unavailable legacy model identifiers to CodeCraft supported models
    effective_model = model
    if effective_model in ("gemini-3.8-flash", "gemini-2.5-flash"):
        effective_model = "gemini-3.7-flash"

    payload = {
        "model": effective_model,
        "messages": [
            {
                "role": "system",
                "content": prompt + "\nRespond strictly in valid JSON matching the schema.",
            },
            {
                "role": "user",
                "content": user_message_content,
            },
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=45.0) as client:
        res = client.post(url, headers=headers, json=payload)
        if res.status_code == 429:
            raise RuntimeError("CodeCraft API rate limit reached. Please retry in a few moments.")
        if not res.is_success:
            err_msg = res.text
            try:
                err_data = res.json()
                err_msg = err_data.get("error", {}).get("message") or err_msg
            except Exception:
                pass
            log.error("CodeCraft API returned error %s for model %s: %s", res.status_code, effective_model, err_msg[:300])
            raise RuntimeError(f"CodeCraft API error ({res.status_code}): {err_msg}")

        res_data = res.json()
        choices = res_data.get("choices") or []
        if not choices:
            raise ValueError("No choices returned from CodeCraft API")
        content_str = choices[0].get("message", {}).get("content", "")
        return _clean_json_response(content_str)


def extract_and_structure_knowledge(
    file_bytes: bytes,
    content_type: str,
    filename: str,
    shop_id: int,
    db: Session | None = None,
) -> dict[str, Any]:
    """Primary extraction workflow supporting CodeCraft API, Google Gemini, and local CSV fallback."""
    ai_creds = _resolve_ai_credentials(db)
    cc_key = ai_creds["codecraft_key"]
    gemini_key = ai_creds["gemini_key"]
    is_csv = content_type in ("text/csv", "application/csv") or filename.lower().endswith(".csv")

    structured: dict[str, Any] = {"products": [], "policies": []}
    raw_content = ""
    last_error: Exception | None = None

    # 1. Attempt CodeCraft API if configured (Supports gemini-3.7-flash, gemini-3.6-flash, claude-opus-4.8)
    if cc_key:
        configured_m = ai_creds.get("codecraft_model") or "gemini-3.7-flash"
        raw_list = [configured_m, "gemini-3.7-flash", "gemini-3.6-flash", "claude-opus-4.8"]
        models_to_try = []
        for rm in raw_list:
            if rm in ("gemini-3.8-flash", "gemini-2.5-flash"):
                rm = "gemini-3.7-flash"
            if rm not in models_to_try:
                models_to_try.append(rm)
        for m in models_to_try:
            try:
                log.info("Extracting knowledge with CodeCraft API (%s) for shop %s (%s)", m, shop_id, filename)
                structured = call_codecraft_multimodal(
                    file_bytes,
                    content_type,
                    api_key=cc_key,
                    base_url=ai_creds.get("codecraft_base_url") or "https://codecraftapi.com/v1",
                    model=m,
                )
                if structured.get("products") or structured.get("policies"):
                    break
            except Exception as e:
                log.warning("CodeCraft model %s failed (%s): %s", m, type(e).__name__, e)
                last_error = e

    # 2. Attempt Google Gemini Direct if CodeCraft was not configured or produced no results
    if (not structured.get("products") and not structured.get("policies")) and gemini_key:
        models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash"]
        for m in models_to_try:
            try:
                log.info("Extracting knowledge with Google Gemini direct (%s) for shop %s (%s)", m, shop_id, filename)
                structured = call_gemini_multimodal(file_bytes, content_type, gemini_key, model=m)
                if structured.get("products") or structured.get("policies"):
                    break
            except Exception as e:
                log.warning("Gemini direct model %s failed (%s): %s", m, type(e).__name__, e)
                last_error = e

    # 3. If no key was configured at all and not CSV:
    if not cc_key and not gemini_key and not is_csv:
        raise ValueError(
            "No AI API key configured. Please configure CODECRAFT_API_KEY (or GEMINI_API_KEY) "
            "in .env or in Super Admin AI Settings (/admin/ai) to process image/PDF documents."
        )

    # 4. If CSV and AI extraction was empty or skipped, parse locally
    if is_csv and (not structured.get("products") and not structured.get("policies")):
        csv_text = file_bytes.decode("utf-8", errors="replace")
        structured = _parse_csv_locally(csv_text)
        raw_content = csv_text[:4000]
    elif not structured.get("products") and not structured.get("policies") and last_error and not is_csv:
        raise last_error

    # Validate and normalize structure
    normalized_products: list[dict[str, Any]] = []
    for p in structured.get("products", []):
        if not isinstance(p, dict):
            continue
        p_name = str(p.get("name", "")).strip()
        if not p_name:
            continue
        price_raw = p.get("price", 0)
        try:
            price_clean = float(re.sub(r"[^\d.]", "", str(price_raw)) or 0)
        except Exception:
            price_clean = 0.0
        normalized_products.append({
            "name": p_name,
            "price": price_clean,
            "details": str(p.get("details") or "").strip(),
        })

    normalized_policies: list[dict[str, Any]] = []
    for pol in structured.get("policies", []):
        if not isinstance(pol, dict):
            continue
        topic = str(pol.get("topic", "general")).strip()
        content = str(pol.get("content", "")).strip()
        if topic and content:
            normalized_policies.append({"topic": topic, "content": content})

    if not raw_content:
        # Generate summary for raw_content field
        summary_lines = [
            f"Extracted from {filename} ({content_type}):",
            f"- {len(normalized_products)} products found",
            f"- {len(normalized_policies)} policies found",
        ]
        if normalized_products:
            summary_lines.append("\nProducts Sample:")
            for p in normalized_products[:5]:
                summary_lines.append(f"  • {p['name']}: ${p['price']} ({p['details'][:50]})")
        if normalized_policies:
            summary_lines.append("\nPolicies Sample:")
            for pol in normalized_policies[:3]:
                summary_lines.append(f"  • [{pol['topic'].upper()}]: {pol['content'][:100]}")
        raw_content = "\n".join(summary_lines)

    return {
        "products": normalized_products,
        "policies": normalized_policies,
        "raw_content": raw_content,
    }


def sync_extracted_knowledge_to_shop(db: Session, shop_id: int, structured_data: dict[str, Any]) -> dict[str, int]:
    """Directly insert/update extracted products and policies so the chatbot has zero-friction access."""
    products_created = 0
    products_updated = 0
    articles_created = 0

    # 1. Sync Products
    for p in structured_data.get("products", []):
        name = p.get("name")
        if not name:
            continue
        price = Decimal(str(round(p.get("price", 0.0), 2)))
        details = p.get("details", "")

        existing = db.scalars(
            select(Product).where(Product.shop_id == shop_id, Product.name == name)
        ).first()

        if existing:
            existing.price = price
            if details and not existing.description:
                existing.description = details
            products_updated += 1
        else:
            new_prod = Product(
                shop_id=shop_id,
                name=name,
                price=price,
                description=details,
                about=details,
                stock=100,
                is_active=True,
            )
            db.add(new_prod)
            products_created += 1

    # 2. Sync Policies into KnowledgeArticles for the AI prompt
    for pol in structured_data.get("policies", []):
        topic = pol.get("topic", "general").strip()
        content = pol.get("content", "").strip()
        if not content:
            continue
        title = f"Policy: {topic.title()}"

        existing_art = db.scalars(
            select(KnowledgeArticle).where(KnowledgeArticle.shop_id == shop_id, KnowledgeArticle.title == title)
        ).first()

        if existing_art:
            existing_art.content = content
        else:
            db.add(KnowledgeArticle(shop_id=shop_id, title=title, content=content))
            articles_created += 1

    db.commit()
    log.info(
        "Synced extracted knowledge for shop %s: %s products created, %s updated, %s articles created",
        shop_id, products_created, products_updated, articles_created,
    )
    return {
        "products_created": products_created,
        "products_updated": products_updated,
        "articles_created": articles_created,
    }
