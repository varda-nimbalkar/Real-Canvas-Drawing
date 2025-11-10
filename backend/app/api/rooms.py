from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.room_schema import RoomCreate, RoomResponse
from app.models.room import Room
from app.core.database import get_db

router = APIRouter()

# Create a new room
@router.post("/", response_model=RoomResponse)
def create_room(room_data: RoomCreate, db: Session = Depends(get_db)):
    # Check if room exists
    existing_room = db.query(Room).filter(Room.name == room_data.name).first()
    if existing_room:
        raise HTTPException(status_code=400, detail="Room already exists")
    
    new_room = Room(name=room_data.name)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

# Get all rooms
@router.get("/", response_model=list[RoomResponse])
def list_rooms(db: Session = Depends(get_db)):
    rooms = db.query(Room).all()
    return rooms
