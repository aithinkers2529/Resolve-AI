from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from libs.db_shared.session import get_db
from libs.db_shared.models.user import User
from libs.db_shared.models.audit import AuditLog
from libs.db_shared.enums import UserRole
from app.core.permissions import USER_MANAGE, AUDIT_VIEW
from app.api.deps import require_permission
from app.schemas.auth import UserSchema, UserRoleUpdateRequest, UserStatusUpdateRequest
from typing import List

router = APIRouter()

@router.get("/users", response_model=List[UserSchema])
def list_users(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_permission(USER_MANAGE)),
    db: Session = Depends(get_db)
):
    """Retrieve system users list. Requires ADMIN / USER_MANAGE permission."""
    return db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/users/{user_id}", response_model=UserSchema)
def get_user_by_id(
    user_id: str,
    current_user: User = Depends(require_permission(USER_MANAGE)),
    db: Session = Depends(get_db)
):
    """Retrieve single user details. Requires USER_MANAGE permission."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' was not found."
        )
    return user

@router.patch("/users/{user_id}/role", response_model=UserSchema)
def update_user_role(
    user_id: str,
    payload: UserRoleUpdateRequest,
    current_user: User = Depends(require_permission(USER_MANAGE)),
    db: Session = Depends(get_db)
):
    """Update user role. Requires USER_MANAGE permission."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' was not found."
        )

    target_role = payload.role.upper()
    valid_roles = [r.value for r in UserRole]
    if target_role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{payload.role}'. Must be one of {valid_roles}"
        )

    old_role = user.role
    user.role = target_role
    db.commit()
    db.refresh(user)

    audit = AuditLog(
        operator=current_user.email,
        action="ROLE_CHANGED",
        details=f"Role changed for user '{user.email}' (ID: {user.id}) from {old_role} to {target_role}"
    )
    db.add(audit)
    db.commit()

    return user

@router.patch("/users/{user_id}/status", response_model=UserSchema)
def update_user_status(
    user_id: str,
    payload: UserStatusUpdateRequest,
    current_user: User = Depends(require_permission(USER_MANAGE)),
    db: Session = Depends(get_db)
):
    """Enable or disable a user account. Requires USER_MANAGE permission."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' was not found."
        )

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)

    audit = AuditLog(
        operator=current_user.email,
        action="USER_STATUS_CHANGED",
        details=f"Account active status for '{user.email}' set to {payload.is_active}"
    )
    db.add(audit)
    db.commit()

    return user

@router.get("/audit-logs")
def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_permission(AUDIT_VIEW)),
    db: Session = Depends(get_db)
):
    """Retrieve security audit events log."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs
