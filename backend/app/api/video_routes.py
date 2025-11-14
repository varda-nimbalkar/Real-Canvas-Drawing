from fastapi import APIRouter

router = APIRouter(prefix="/video", tags=["Video"])

@router.get("/")
async def video_home():
    return {"message": "Video route working!"}
