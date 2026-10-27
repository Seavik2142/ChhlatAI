from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.database import SessionLocal
from app.realtime.hub import hub
from app.models import User
from app.core.security import decode_access_token

router = APIRouter()


@router.websocket("/ws")
async def inbox_events(ws: WebSocket, token: str) -> None:
    """Live inbox updates for the caller's shop: new messages, conversation changes, notifications."""
    user_id = decode_access_token(token)
    with SessionLocal() as db:
        user = db.get(User, user_id) if user_id else None
        shop_id = user.shop_id if user and user.is_active else None
    if shop_id is None:
        await ws.close(code=4401)
        return
    await hub.connect(shop_id, ws)
    try:
        while True:
            await ws.receive_text()  # keep-alive pings from the client
    except WebSocketDisconnect:
        hub.disconnect(shop_id, ws)
