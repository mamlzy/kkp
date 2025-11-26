"""
Authentication service for user management and JWT token handling.
"""
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from enum import Enum

import bcrypt
from jose import JWTError, jwt
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services.db_service import Base, get_db, SessionLocal

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production-kkp-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours default

# Security scheme
security = HTTPBearer()


class UserRole(str, Enum):
    """User role enumeration."""
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    USER = "USER"


class UserDB(Base):
    """SQLAlchemy model for users table."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.USER)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """Hash a password."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# User CRUD operations
def get_user_by_username(db: Session, username: str) -> Optional[UserDB]:
    """Get a user by username."""
    return db.query(UserDB).filter(UserDB.username == username).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[UserDB]:
    """Get a user by ID."""
    return db.query(UserDB).filter(UserDB.id == user_id).first()


def create_user(
    db: Session,
    username: str,
    name: str,
    password: str,
    role: UserRole = UserRole.USER
) -> UserDB:
    """Create a new user."""
    hashed_password = get_password_hash(password)
    user = UserDB(
        id=str(uuid.uuid4()),
        username=username,
        name=name,
        password=hashed_password,
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> Optional[UserDB]:
    """Authenticate a user with username and password."""
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user


def get_all_users(db: Session) -> list[UserDB]:
    """Get all users."""
    return db.query(UserDB).order_by(UserDB.created_at.desc()).all()


def update_user(
    db: Session,
    user_id: str,
    name: Optional[str] = None,
    password: Optional[str] = None,
    username: Optional[str] = None,
    role: Optional[UserRole] = None
) -> Optional[UserDB]:
    """Update a user's information."""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    if name is not None:
        user.name = name
    if password is not None:
        user.password = get_password_hash(password)
    if username is not None:
        user.username = username
    if role is not None:
        user.role = role
    
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: str) -> bool:
    """Delete a user by ID."""
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True


# Dependency functions for protected routes
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserDB:
    """Get the current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau sudah kadaluarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    
    return user


def require_role(allowed_roles: list[UserRole]):
    """Dependency factory to require specific roles."""
    async def role_checker(current_user: UserDB = Depends(get_current_user)) -> UserDB:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Anda tidak memiliki akses untuk melakukan operasi ini"
            )
        return current_user
    return role_checker


# Role-based dependencies
require_super_admin = require_role([UserRole.SUPER_ADMIN])
require_admin_or_super = require_role([UserRole.SUPER_ADMIN, UserRole.ADMIN])
require_any_role = require_role([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER])


def seed_super_admin():
    """Seed the initial super admin user if not exists."""
    db = SessionLocal()
    try:
        existing_user = get_user_by_username(db, "superadmin")
        if not existing_user:
            create_user(
                db=db,
                username="superadmin",
                name="Super Admin",
                password="rahasia",
                role=UserRole.SUPER_ADMIN
            )
            print("Super admin user created successfully!")
        else:
            print("Super admin user already exists.")
    finally:
        db.close()

