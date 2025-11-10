from sqlalchemy import Column,Integer,String,DateTime,func   # type: ignore
from app.models.base import Base

class Room(Base):
    __tablename__ = "rooms"

    id=Column(Integer,primary_key=True,index=True)
    name=Column(String,unique=True,nullable=False)
    created_at=Column(DateTime(timezone=True),server_default=func.now())

