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
    get_user_by_id,
    get_all_users,
    get_current_user,
    require_super_admin,
    update_user,
    delete_user,
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


class UpdateProfileRequest(BaseModel):
    """Update profile request schema (for users updating their own profile)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    password: Optional[str] = Field(None, min_length=6, max_length=255)


class UpdateUserRequest(BaseModel):
    """Update user request schema (for SUPER_ADMIN updating any user)."""
    username: Optional[str] = Field(None, min_length=3, max_length=255)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    password: Optional[str] = Field(None, min_length=6, max_length=255)
    role: Optional[UserRole] = None


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


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    """
    Update current user's profile (name and/or password only).
    """
    if request.name is None and request.password is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak ada data yang diubah"
        )
    
    updated_user = update_user(
        db=db,
        user_id=current_user.id,
        name=request.name,
        password=request.password
    )
    
    return user_to_response(updated_user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_by_admin(
    user_id: str,
    request: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_super_admin)
):
    """
    Update any user. Only SUPER_ADMIN can access this.
    Special rules for superadmin account.
    """
    target_user = get_user_by_id(db, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan"
        )
    
    # Special rule: only user with username 'superadmin' can edit 'superadmin' account
    if target_user.username == "superadmin":
        if current_user.username != "superadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Hanya superadmin yang dapat mengedit akun superadmin"
            )
        # For superadmin account, only password can be changed
        if request.username is not None or request.name is not None or request.role is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Untuk akun superadmin, hanya password yang dapat diubah"
            )
    
    # Check if new username already exists (if changing username)
    if request.username is not None and request.username != target_user.username:
        existing_user = get_user_by_username(db, request.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username sudah digunakan"
            )
    
    if request.username is None and request.name is None and request.password is None and request.role is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak ada data yang diubah"
        )
    
    updated_user = update_user(
        db=db,
        user_id=user_id,
        username=request.username,
        name=request.name,
        password=request.password,
        role=request.role
    )
    
    return user_to_response(updated_user)


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user_by_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_super_admin)
):
    """
    Delete a user. Only SUPER_ADMIN can access this.
    Cannot delete the main superadmin account.
    """
    target_user = get_user_by_id(db, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan"
        )
    
    # Cannot delete the main superadmin account
    if target_user.username == "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun superadmin utama tidak dapat dihapus"
        )
    
    # Cannot delete yourself
    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak dapat menghapus akun sendiri"
        )
    
    delete_user(db, user_id)
    
    return MessageResponse(message="User berhasil dihapus")

