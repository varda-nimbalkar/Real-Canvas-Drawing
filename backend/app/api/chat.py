from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.chat import ChatMessage
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    username: str
    message: str


@router.post("/send")
def send_message(data: ChatRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_msg = ChatMessage(user_id=user.id, message=data.message)
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    return {"message": "Message sent successfully"}


@router.get("/messages")
def get_messages(db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).order_by(ChatMessage.timestamp).all()
    return [
        {
            "id": msg.id,
            "username": msg.user.username,
            "message": msg.message,
            "timestamp": msg.timestamp,
        }
        for msg in messages
    ]
