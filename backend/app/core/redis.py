from functools import lru_cache

import redis

from app.core.config import get_settings


@lru_cache
def get_redis() -> redis.Redis | None:
    """Shared Redis client, or None in single-process development mode."""
    url = get_settings().redis_url
    return (
        redis.Redis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        if url
        else None
    )
