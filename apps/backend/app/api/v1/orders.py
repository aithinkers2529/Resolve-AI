from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from libs.db_shared.session import get_db
from libs.db_shared.models.user import User
from app.services.order_service import OrderService
from app.schemas.order import OrderResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = OrderService(db)
    order = service.get_order(order_id)
    return order
