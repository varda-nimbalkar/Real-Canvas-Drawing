# app/websockets/events.py
from fastapi import WebSocket
from .manager import ConnectionManager

manager = ConnectionManager()

async def handle_event(event: dict, websocket: WebSocket, room_id: str):
    """
    Handles different types of events like drawing, clearing, etc.
    """
    event_type = event.get("type")
    data = event.get("data")

    if event_type == "draw":
        # Broadcast drawing data to others
        await manager.broadcast(room_id, {"type": "draw", "data": data})
    elif event_type == "clear":
        # Clear the canvas for all
        await manager.broadcast(room_id, {"type": "clear"})
    else:
        await websocket.send_json({"error": f"Unknown event type: {event_type}"})
