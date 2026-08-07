from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

router = APIRouter()

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    # Skeleton register function
    return {"message": "User registered successfully", "email": user_data.email}

@router.post("/token", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Skeleton JWT token vendor endpoint
    if form_data.username == "admin@resolve.ai" and form_data.password == "adminpass":
        return {"access_token": "mock-token-secret-jwt-data-string", "token_type": "bearer"}
    raise HTTPException(status_code=400, detail="Incorrect email or password")
