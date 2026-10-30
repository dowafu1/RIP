from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.security import decode_access_token
from app.realtime.manager import manager

router = APIRouter()


def _extract_token(websocket: WebSocket, query_token: str | None) -> str | None:
    if query_token:
        return query_token

    authorization = websocket.headers.get("authorization", "")
    scheme, _, header_token = authorization.partition(" ")
    if scheme.lower() == "bearer" and header_token:
        return header_token.strip()

    return None


@router.websocket("/ws")
async def task_events(
    websocket: WebSocket,
    token: str | None = Query(default=None),
) -> None:
    raw_token = _extract_token(websocket, token)
    user_id = decode_access_token(raw_token) if raw_token else None
    if user_id is None:
        await websocket.accept()
        await websocket.close(code=1008, reason="Invalid or expired token")
        return

    await manager.connect(user_id, websocket)
    await websocket.send_json({"type": "connected"})

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(user_id, websocket)
