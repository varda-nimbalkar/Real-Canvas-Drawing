# room_schema.py
from pydantic import BaseModel
from datetime import datetime

class RoomCreate(BaseModel):
    name: str

class RoomResponse(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True  # For SQLAlchemy v2
