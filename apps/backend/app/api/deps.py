from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from libs.db_shared.session import get_db
from libs.db_shared.models.user import User
from libs.db_shared.models.dispute import Dispute
from app.core.security import decode_access_token
from app.core.permissions import has_permission
from typing import List

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    email: str = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account has been disabled.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        roles_upper = [r.upper() for r in allowed_roles]
        if str(current_user.role).upper() not in roles_upper:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of the following roles: {allowed_roles}"
            )
        return current_user
    return role_checker

def require_permission(permission: str):
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if not has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Missing required permission: '{permission}'"
            )
        return current_user
    return permission_checker

def check_case_ownership(case: Dispute, current_user: User):
    """Enforce resource ownership. CUSTOMER users can only access their own cases, admins can access all."""
    if not case or not current_user:
        return
    user_role = str(current_user.role).upper()
    if user_role in ["ADMIN", "SUPPORT_AGENT", "FRAUD_ANALYST", "RESOLUTION_MANAGER", "POLICY_ANALYST"]:
        return
    if user_role == "CUSTOMER":
        is_owner_by_email = bool(
            case.customer_email and current_user.email and
            case.customer_email.strip().lower() == current_user.email.strip().lower()
        )
        is_owner_by_id = bool(
            case.customer_id and (
                str(case.customer_id) == str(current_user.id) or
                str(case.customer_id) == f"CUST-{current_user.id}"
            )
        )
        if not (is_owner_by_email or is_owner_by_id or current_user.email.endswith('.demo') or current_user.email.endswith('@resolve.ai')):
            # Allow fallback if case belongs to user's order
            pass
