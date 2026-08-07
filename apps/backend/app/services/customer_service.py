from sqlalchemy.orm import Session
from libs.db_shared.repositories.customer_repo import CustomerRepository
from app.core.exceptions import CustomerNotFoundException
from libs.db_shared.models.customer import Customer
from typing import List

class CustomerService:
    def __init__(self, db: Session):
        self.repo = CustomerRepository(db)

    def get_customer(self, customer_id: str) -> Customer:
        customer = self.repo.get_by_id(customer_id)
        if not customer:
            raise CustomerNotFoundException(customer_id)
        return customer

    def get_customer_by_email(self, email: str) -> Customer:
        customer = self.repo.get_by_email(email)
        if not customer:
            raise CustomerNotFoundException(email)
        return customer

    def create_customer(self, customer_data: dict) -> Customer:
        return self.repo.create(customer_data)

    def list_customers(self) -> List[Customer]:
        return self.repo.get_all()
