from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from libs.db_shared.session import get_db
from libs.db_shared.models.user import User
from app.services.customer_service import CustomerService
from app.schemas.customer import CustomerResponse
from app.api.deps import get_current_user
from typing import List

router = APIRouter()

@router.get("/", response_model=List[CustomerResponse])
def list_customers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CustomerService(db)
    user_role = str(current_user.role).upper()
    if user_role == "CUSTOMER":
        try:
            cust = service.get_customer_by_email(current_user.email)
            return [cust]
        except Exception:
            return []
    return service.list_customers()

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CustomerService(db)
    customer = service.get_customer(customer_id)
    
    user_role = str(current_user.role).upper()
    if user_role == "CUSTOMER":
        if customer.email.lower() != current_user.email.lower() and customer.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You cannot access another customer's profile."
            )
            
    return customer
