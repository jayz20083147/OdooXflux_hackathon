from pydantic import BaseModel, EmailStr, constr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER

class UserCreate(UserBase):
    password: constr(min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_verified: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_verified: str
    created_at: datetime
    last_login: Optional[str] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    username: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: constr(min_length=8)
