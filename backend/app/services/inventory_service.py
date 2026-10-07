from datetime import date

from sqlalchemy.orm import Session

from app.models.inventory import Inventory


def get_stock_status(item: Inventory) -> str:
    today = date.today()
    if item.expiry_date and item.expiry_date < today:
        return "EXPIRED"
    if item.current_stock <= 0:
        return "CRITICAL"
    if item.current_stock <= item.minimum_stock:
        return "LOW_STOCK"
    return "IN_STOCK"


def ensure_positive_stock(item: Inventory):
    if item.current_stock < 0:
        raise ValueError("Stock cannot be negative")
