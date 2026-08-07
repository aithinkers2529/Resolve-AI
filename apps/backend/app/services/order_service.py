from sqlalchemy.orm import Session
from libs.db_shared.repositories.order_repo import OrderRepository
from app.core.exceptions import OrderNotFoundException
from libs.db_shared.models.order import Order
from libs.db_shared.models.product import Product
from typing import List

class OrderService:
    def __init__(self, db: Session):
        self.repo = OrderRepository(db)

    def get_order(self, order_id: str) -> Order:
        order = self.repo.get_order_by_id(order_id)
        if not order:
            raise OrderNotFoundException(order_id)
        return order

    def get_customer_orders(self, customer_id: str) -> List[Order]:
        return self.repo.get_orders_by_customer(customer_id)

    def create_order(self, order_data: dict) -> Order:
        return self.repo.create_order(order_data)

    def get_product(self, product_id: str) -> Product:
        product = self.repo.get_product_by_id(product_id)
        if not product:
            raise OrderNotFoundException(product_id)
        return product
