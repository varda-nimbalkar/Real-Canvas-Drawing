from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, rooms , chat
from app.core.database import Base, engine
from app.websockets.router import router as websocket_router
import os

app = FastAPI()

print("DATABASE_URL:", os.getenv("DATABASE_URL"))

# Create DB tables
Base.metadata.create_all(bind=engine)

# Allow frontend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(rooms.router, prefix="/rooms", tags=["Rooms"])
app.include_router(websocket_router, tags=["WebSockets"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])


@app.get("/")
def root():
    return {"message": "Backend running!"}
