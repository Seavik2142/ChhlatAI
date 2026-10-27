from datetime import timedelta

from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.core.redis import get_redis
from app.models import WebhookEvent, utcnow

RETENTION = timedelta(days=7)
REDIS_TTL_SECONDS = int(RETENTION.total_seconds())


def claim_event(db: Session, source: str, event_id: str) -> bool:
    """Record an inbound event; False if it was already processed (provider retry / duplicate delivery).

    Uses Redis SET NX as a high-speed hot cache (sub-millisecond rejection during spikes)
    before writing to PostgreSQL for permanent idempotency tracking.
    """
    r = get_redis()
    if r is not None:
        try:
            # Atomic check-and-set: returns True if key was set, None if key already existed
            if not r.set(f"idempotency:{source}:{event_id}", "1", ex=REDIS_TTL_SECONDS, nx=True):
                return False
        except Exception:
            # Fall back gracefully to database if Redis is temporarily unreachable
            pass

    stmt = (insert(WebhookEvent).values(source=source, event_id=event_id, created_at=utcnow())
            .on_conflict_do_nothing(index_elements=["source", "event_id"]).returning(WebhookEvent.id))
    claimed = db.execute(stmt).scalar_one_or_none() is not None
    db.commit()
    return claimed


def prune_events(db: Session) -> int:
    """Providers only retry for minutes/hours, so a week of history is plenty."""
    result = db.execute(delete(WebhookEvent).where(WebhookEvent.created_at < utcnow() - RETENTION))
    return result.rowcount or 0
