"""Monthly AI reply quota per shop (resets automatically: one ai_usage row per calendar month)."""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import AIUsage, Shop


def current_period() -> str:
    return datetime.now(UTC).strftime("%Y-%m")


def replies_used(db: Session, shop_id: int) -> int:
    return db.scalar(select(AIUsage.replies).where(AIUsage.shop_id == shop_id,
                                                    AIUsage.period == current_period())) or 0


def has_quota(db: Session, shop: Shop) -> bool:
    return shop.plan is None or replies_used(db, shop.id) < shop.plan.ai_replies_limit


def record_reply(db: Session, shop_id: int, tokens: dict[str, int] | None = None, provider: str = "") -> int:
    """Atomically count one AI reply and real token usage (safe under concurrent workers); returns this month's total replies."""
    tk = tokens or {}
    p_tokens = int(tk.get("prompt_tokens") or 0)
    c_tokens = int(tk.get("completion_tokens") or 0)
    t_tokens = int(tk.get("total_tokens") or (p_tokens + c_tokens))
    cc_tokens = t_tokens if provider == "codecraft" else 0
    gem_tokens = t_tokens if provider == "gemini" else 0

    stmt = (
        insert(AIUsage).values(
            shop_id=shop_id,
            period=current_period(),
            replies=1,
            prompt_tokens=p_tokens,
            completion_tokens=c_tokens,
            total_tokens=t_tokens,
            codecraft_tokens=cc_tokens,
            gemini_tokens=gem_tokens,
        )
        .on_conflict_do_update(
            index_elements=["shop_id", "period"],
            set_={
                "replies": AIUsage.replies + 1,
                "prompt_tokens": AIUsage.prompt_tokens + p_tokens,
                "completion_tokens": AIUsage.completion_tokens + c_tokens,
                "total_tokens": AIUsage.total_tokens + t_tokens,
                "codecraft_tokens": AIUsage.codecraft_tokens + cc_tokens,
                "gemini_tokens": AIUsage.gemini_tokens + gem_tokens,
            },
        )
        .returning(AIUsage.replies)
    )
    return db.execute(stmt).scalar_one()
