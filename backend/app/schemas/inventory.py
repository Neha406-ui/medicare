from datetime import date, datetime

from pydantic import BaseModel, Field


class InventoryBase(BaseModel):
    medicine_name: str = Field(..., min_length=2, max_length=120)
    category: str | None = None
    current_stock: float = Field(..., ge=0)
    minimum_stock: float = Field(..., ge=0)
    unit: str = Field(..., min_length=1, max_length=20)
    expiry_date: date | None = None
    batch_number: str | None = None


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(InventoryBase):
    pass


class InventoryRead(InventoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
