from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from libs.db_shared.session import get_db
from libs.db_shared.models.user import User
from app.api.deps import get_current_user
from app.services.notification_service import NotificationService
from typing import List, Dict, Any

router = APIRouter()

@router.get("")
@router.get("/")
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ns = NotificationService(db)
    return ns.list_notifications(current_user.email)

@router.post("/{notification_id}/read")
def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ns = NotificationService(db)
    ok = ns.mark_as_read(notification_id, current_user.email)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"success": True, "id": notification_id}

@router.post("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ns = NotificationService(db)
    count = ns.mark_all_as_read(current_user.email)
    return {"success": True, "count": count}
