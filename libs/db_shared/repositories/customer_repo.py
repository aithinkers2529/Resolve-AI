from sqlalchemy.orm import Session
from libs.db_shared.models.customer import Customer
from typing import Optional, List

class CustomerRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, customer_id: str) -> Optional[Customer]:
        return self.db.query(Customer).filter(Customer.id == customer_id).first()

    def get_by_email(self, email: str) -> Optional[Customer]:
        return self.db.query(Customer).filter(Customer.email == email).first()

    def create(self, customer_data: dict) -> Customer:
        customer = Customer(**customer_data)
        self.db.add(customer)
        self.db.commit()
        self.db.refresh(customer)
        return customer

    def get_all(self, skip: int = 0, limit: int = 50) -> List[Customer]:
        return self.db.query(Customer).offset(skip).limit(limit).all()
