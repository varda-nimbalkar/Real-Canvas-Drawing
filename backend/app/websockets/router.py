from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websockets.manager import ConnectionManager
from app.api import rooms  # ✅ Correct import

router = APIRouter()
manager = ConnectionManager()

video_rooms = {}   


@router.websocket("/ws/room/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(room_id, data)
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)

@router.websocket("/ws/video/{room_id}")
async def video_signaling(websocket: WebSocket, room_id: str):
    await websocket.accept()

    # Add room if not exists
    if room_id not in video_rooms:
        video_rooms[room_id] = []

    # Add the connection
    video_rooms[room_id].append(websocket)

    try:
        while True:
            msg = await websocket.receive_text()

            # Broadcast to all except sender
            for conn in video_rooms[room_id]:
                if conn != websocket:
                    await conn.send_text(msg)

    except WebSocketDisconnect:
        video_rooms[room_id].remove(websocket)
