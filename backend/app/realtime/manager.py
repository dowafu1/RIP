import asyncio
import json
import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(user_id, set()).add(websocket)

    async def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        async with self._lock:
            connections = self._connections.get(user_id)
            if connections is None:
                return
            connections.discard(websocket)
            if not connections:
                self._connections.pop(user_id, None)

    async def broadcast(self, user_id: int, event: dict) -> None:
        async with self._lock:
            connections = list(self._connections.get(user_id, ()))

        if not connections:
            return

        payload = json.dumps(event, ensure_ascii=False)
        results = await asyncio.gather(
            *(websocket.send_text(payload) for websocket in connections),
            return_exceptions=True,
        )

        for websocket, result in zip(connections, results):
            if isinstance(result, Exception):
                logger.warning(
                    "Dropping failed websocket for user %s: %s", user_id, result
                )
                await self.disconnect(user_id, websocket)


manager = ConnectionManager()
