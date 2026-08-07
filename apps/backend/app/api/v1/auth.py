from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from libs.db_shared.session import get_db
from libs.db_shared.models.user import User
from libs.db_shared.models.audit import AuditLog
from libs.db_shared.enums import UserRole
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.schemas.auth import RegisterRequest, TokenResponse, UserSchema
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Public customer registration. Role is ALWAYS set to CUSTOMER."""
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Force role to CUSTOMER regardless of input payload
    new_user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=UserRole.CUSTOMER,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit event
    audit = AuditLog(
        operator=new_user.email,
        action="USER_REGISTERED",
        details=f"User registered with role CUSTOMER (ID: {new_user.id})"
    )
    db.add(audit)
    db.commit()

    return new_user

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    """Authenticate email & password (JSON or Form) and issue a JWT token."""
    content_type = request.headers.get("content-type", "")
    email = None
    password = None

    if "application/json" in content_type:
        body = await request.json()
        email = body.get("email")
        password = body.get("password")
    elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        email = form.get("username") or form.get("email")
        password = form.get("password")
    else:
        try:
            body = await request.json()
            email = body.get("email")
            password = body.get("password")
        except Exception:
            form = await request.form()
            email = form.get("username") or form.get("email")
            password = form.get("password")

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    user = db.query(User).filter(User.email == str(email).lower()).first()
    if not user or not verify_password(str(password), user.hashed_password):
        audit = AuditLog(
            operator=str(email),
            action="LOGIN_FAILURE",
            details="Invalid email or password attempt"
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled. Please contact support."
        )

    # Update last login timestamp
    user.last_login_at = func.now()
    db.commit()

    # Create access token
    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role
    )

    audit = AuditLog(
        operator=user.email,
        action="LOGIN_SUCCESS",
        details=f"User logged in successfully with role {user.role}"
    )
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserSchema.model_validate(user)
    )

@router.get("/me", response_model=UserSchema)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve current authenticated user profile."""
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout current user and log audit trail."""
    audit = AuditLog(
        operator=current_user.email,
        action="LOGOUT",
        details="User logged out"
    )
    db.add(audit)
    db.commit()
    return {"message": "Successfully logged out. Please remove token from client storage."}
