"""Pushes inbox events to connected dashboards over WebSocket.

With REDIS_URL set, every API server and Celery worker publishes to Redis channel
`inbox:<shop_id>`, and each API server forwards those messages to the sockets it holds —
so it doesn't matter which server a dashboard is connected to. Without Redis (development)
events are delivered in-process.
"""

import asyncio
import json
import logging
from collections import defaultdict
from typing import Any

from fastapi import WebSocket

from app.core.redis import get_redis

log = logging.getLogger(__name__)
CHANNEL_PREFIX = "inbox:"


class EventHub:
    def __init__(self) -> None:
        self._sockets: dict[int, set[WebSocket]] = defaultdict(set)
        self._loop: asyncio.AbstractEventLoop | None = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect(self, shop_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self._sockets[shop_id].add(ws)

    def disconnect(self, shop_id: int, ws: WebSocket) -> None:
        self._sockets[shop_id].discard(ws)

    @property
    def connection_count(self) -> int:
        return sum(len(s) for s in self._sockets.values())

    def publish(self, shop_id: int, event: str, data: dict[str, Any]) -> None:
        payload = json.dumps({"event": event, "data": data}, default=str)
        r = get_redis()
        if r is not None:
            try:
                r.publish(f"{CHANNEL_PREFIX}{shop_id}", payload)
                return
            except Exception:
                log.exception("Redis publish failed; delivering locally only")
        self._deliver_local(shop_id, payload)

    def _deliver_local(self, shop_id: int, payload: str) -> None:
        if self._loop is None or not self._sockets.get(shop_id):
            return
        try:
            running = asyncio.get_running_loop()
        except RuntimeError:
            running = None
        if running is self._loop:
            self._loop.create_task(self._send(shop_id, payload))
        else:
            asyncio.run_coroutine_threadsafe(self._send(shop_id, payload), self._loop)

    async def _send_one(self, shop_id: int, ws: WebSocket, payload: str) -> None:
        try:
            await ws.send_text(payload)
        except Exception:  # client went away mid-send
            self.disconnect(shop_id, ws)

    async def _send(self, shop_id: int, payload: str) -> None:
        sockets = list(self._sockets.get(shop_id, ()))
        if not sockets:
            return
        # Broadcast concurrently so a high-latency client never blocks other staff members
        await asyncio.gather(*(self._send_one(shop_id, ws, payload) for ws in sockets), return_exceptions=True)

    async def run_redis_listener(self, redis_url: str) -> None:
        """Forward Redis pub/sub messages to local sockets; reconnects if Redis restarts."""
        import redis.asyncio as aioredis

        while True:
            client = aioredis.Redis.from_url(redis_url, decode_responses=True)
            try:
                pubsub = client.pubsub()
                await pubsub.psubscribe(f"{CHANNEL_PREFIX}*")
                async for msg in pubsub.listen():
                    if msg.get("type") != "pmessage":
                        continue
                    shop_id = int(msg["channel"][len(CHANNEL_PREFIX):])
                    if self._sockets.get(shop_id):
                        await self._send(shop_id, msg["data"])
            except asyncio.CancelledError:
                await client.aclose()
                raise
            except Exception:
                log.exception("Realtime listener lost Redis; retrying in 2s")
                await asyncio.sleep(2)
            finally:
                await client.aclose()


hub = EventHub()
