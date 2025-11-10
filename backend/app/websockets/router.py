# app/websockets/router.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websockets.manager import ConnectionManager

router = APIRouter()
manager = ConnectionManager()

@router.websocket("/ws/room/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(room_id, data)
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
