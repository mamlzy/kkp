"""
Authentication routes for login, register, and user management.
"""
from datetime import timedelta
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.services.db_service import get_db
from app.services.auth_service import (
    UserDB,
    UserRole,
    authenticate_user,
    create_user,
    create_access_token,
    get_user_by_username,
    get_all_users,
    get_current_user,
    require_super_admin,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()


# Pydantic models
class LoginRequest(BaseModel):
    """Login request schema."""
    username: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1)


class RegisterRequest(BaseModel):
    """Register request schema."""
    username: str = Field(..., min_length=3, max_length=255)
    name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=6, max_length=255)
    role: UserRole = Field(default=UserRole.USER)


class UserResponse(BaseModel):
    """User response schema."""
    id: str
    username: str
    name: str
    role: UserRole
    created_at: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str


def user_to_response(user: UserDB) -> UserResponse:
    """Convert UserDB to UserResponse."""
    return UserResponse(
        id=user.id,
        username=user.username,
        name=user.name,
        role=user.role,
        created_at=user.created_at.isoformat() if user.created_at else ""
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT token.
    """
    user = authenticate_user(db, request.username, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "username": user.username, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        user=user_to_response(user)
    )


@router.post("/register", response_model=UserResponse)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_super_admin)
):
    """
    Register a new user. Only SUPER_ADMIN can register new users.
    """
    # Check if username already exists
    existing_user = get_user_by_username(db, request.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username sudah digunakan"
        )
    
    # Create new user
    new_user = create_user(
        db=db,
        username=request.username,
        name=request.name,
        password=request.password,
        role=request.role
    )
    
    return user_to_response(new_user)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserDB = Depends(get_current_user)):
    """
    Get current authenticated user's information.
    """
    return user_to_response(current_user)


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_super_admin)
):
    """
    Get all users. Only SUPER_ADMIN can access this.
    """
    users = get_all_users(db)
    return [user_to_response(user) for user in users]


@router.post("/verify", response_model=UserResponse)
async def verify_token(current_user: UserDB = Depends(get_current_user)):
    """
    Verify if the current token is valid and return user info.
    """
    return user_to_response(current_user)

