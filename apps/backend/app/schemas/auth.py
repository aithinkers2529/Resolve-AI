from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserSchema(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserSchema

class UserRoleUpdateRequest(BaseModel):
    role: str

class UserStatusUpdateRequest(BaseModel):
    is_active: bool
