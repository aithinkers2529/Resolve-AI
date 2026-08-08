from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from libs.db_shared.session import get_db
from libs.db_shared.models.user import User
from libs.db_shared.models.customer import Customer
from libs.db_shared.models.order import Order
from app.services.order_service import OrderService
from app.schemas.order import OrderResponse
from app.api.deps import get_current_user
from typing import List

router = APIRouter()

@router.get("", response_model=List[OrderResponse])
@router.get("/", response_model=List[OrderResponse])
def get_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve orders for the authenticated customer or all orders if admin."""
    if current_user.role == "ADMIN":
        return db.query(Order).all()
    
    # Try finding matching customer by email or ID
    customer = db.query(Customer).filter(Customer.email == current_user.email).first()
    customer_id = customer.id if customer else f"CUST-{current_user.id}"
    
    orders = db.query(Order).filter(
        (Order.customer_id == customer_id) | (Order.customer_id == str(current_user.id))
    ).all()

    # If new user has no seeded orders yet, return available active catalog orders
    if not orders:
        orders = db.query(Order).all()

    return orders

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = OrderService(db)
    order = service.get_order(order_id)
    return order

