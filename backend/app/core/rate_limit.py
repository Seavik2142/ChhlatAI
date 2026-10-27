"""Fixed-window rate limits in Redis (shared by all API servers); in-memory fallback for development."""

import time
from collections import defaultdict

from fastapi import HTTPException, Request

from app.core.redis import get_redis

_local: dict[str, tuple[int, int]] = defaultdict(lambda: (0, 0))


def hit(key: str, limit: int, window_seconds: int = 60) -> bool:
    """Count one hit; True if the caller is still within the limit."""
    window = int(time.time() // window_seconds)
    r = get_redis()
    if r is not None:
        try:
            rkey = f"rl:{key}:{window}"
            pipe = r.pipeline()
            pipe.incr(rkey)
            pipe.expire(rkey, window_seconds + 1)
            count, _ = pipe.execute()
            return int(count) <= limit
        except Exception:
            # Redis unreachable or disconnected — fall back gracefully to in-memory limit
            pass
    seen_window, count = _local[key]
    count = count + 1 if seen_window == window else 1
    _local[key] = (window, count)
    return count <= limit


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    return forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")


def enforce(key: str, limit: int) -> None:
    if not hit(key, limit):
        raise HTTPException(429, "Too many requests — please wait a minute and try again")
