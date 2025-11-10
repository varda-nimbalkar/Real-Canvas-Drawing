from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, constr
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.core.database import get_db
from app.models.user import User

router = APIRouter()

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Schemas with password length validation
class RegisterModel(BaseModel):
    username: constr(strip_whitespace=True, min_length=3, max_length=50)
    password: constr(strip_whitespace=True, min_length=6, max_length=72)  # bcrypt limit

class LoginModel(BaseModel):
    username: str
    password: str

# Helper functions
def hash_password(password: str):
    # Truncate to 72 characters for bcrypt
    return pwd_context.hash(password[:72])

def verify_password(plain_password: str, hashed_password: str):
    # Truncate input to 72 characters before verifying
    return pwd_context.verify(plain_password[:72], hashed_password)

# Register endpoint
@router.post("/register")
def register_user(data: RegisterModel, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pwd = hash_password(data.password)
    new_user = User(username=data.username, password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

# Login endpoint
@router.post("/login")
def login_user(data: LoginModel, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid password")

    return {"message": "Login successful", "username": user.username}
