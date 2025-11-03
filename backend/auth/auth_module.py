"""Authentication routes and utilities."""
import os
import jwt
import datetime
import hashlib
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
from passlib.context import CryptContext
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from backend.db import engine, SessionLocal, Base
from backend.auth.models import User

# Load environment variables
APP_DIR = Path(__file__).resolve().parent.parent
load_dotenv(APP_DIR.parent / '.env', override=False)
load_dotenv(APP_DIR / '.env', override=True)

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create router
auth_router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Pydantic models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address: str
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    email: str
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    password: Optional[str] = None

# Utility functions
def hash_password(password: str) -> str:
    """Hash password with SHA-256 pre-hash for bcrypt compatibility."""
    # Always pre-hash with SHA-256 to ensure consistent length
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return pwd_context.hash(password_hash)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password with SHA-256 pre-hash for bcrypt compatibility."""
    # Apply same pre-hash logic
    password_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    return pwd_context.verify(password_hash, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("user_id")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

# Routes
@auth_router.post("/register", response_model=dict)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Validate phone
    if not user_data.phone.isdigit() or len(user_data.phone) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number must be 10 digits"
        )
    
    # Check username
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )
    
    # Check email
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists"
        )
    
    # Create user
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        address=user_data.address,
        username=user_data.username,
        password_hash=hash_password(user_data.password)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "Registration successful! Please log in.", "success": True}

@auth_router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    access_token = create_access_token(
        data={"user_id": user.id, "username": user.username}
    )
    
    return TokenResponse(
        token=access_token,
        user=UserResponse(
            id=user.id,
            username=user.username,
            name=user.name,
            email=user.email
        )
    )

@auth_router.get("/verify", response_model=UserResponse)
async def verify_token(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        name=current_user.name,
        email=current_user.email
    )

@auth_router.get("/profile", response_model=dict)
async def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "address": current_user.address,
        "username": current_user.username,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }

@auth_router.put("/profile", response_model=dict)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile information."""
    updated_fields = []
    
    # Update name
    if profile_data.name is not None and profile_data.name.strip():
        current_user.name = profile_data.name.strip()
        updated_fields.append("name")
    
    # Update email
    if profile_data.email is not None and profile_data.email.strip():
        # Check if email is being changed and if it's taken by another user
        if profile_data.email != current_user.email:
            existing_email = db.query(User).filter(
                User.email == profile_data.email,
                User.id != current_user.id
            ).first()
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already in use"
                )
        current_user.email = profile_data.email.strip()
        updated_fields.append("email")
    
    # Update phone
    if profile_data.phone is not None and profile_data.phone.strip():
        phone = profile_data.phone.strip()
        if not phone.isdigit() or len(phone) != 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number must be 10 digits"
            )
        current_user.phone = phone
        updated_fields.append("phone")
    
    # Update address
    if profile_data.address is not None and profile_data.address.strip():
        current_user.address = profile_data.address.strip()
        updated_fields.append("address")
    
    # Update password (optional)
    if profile_data.password is not None and profile_data.password.strip():
        current_user.password_hash = hash_password(profile_data.password)
        updated_fields.append("password")
    
    # Check if any fields were updated
    if not updated_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully",
        "updated_fields": updated_fields,
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "phone": current_user.phone,
            "address": current_user.address,
            "username": current_user.username,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        }
    }

def init_auth_db():
    """Initialize authentication tables."""
    Base.metadata.create_all(bind=engine)