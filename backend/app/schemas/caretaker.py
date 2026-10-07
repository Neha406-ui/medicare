from datetime import datetime

from pydantic import BaseModel, Field


class CaretakerBase(BaseModel):
    employee_id: str = Field(..., min_length=2, max_length=50)
    phone: str | None = None
    shift_start: str | None = None
    shift_end: str | None = None
    status: str = "active"


class CaretakerCreate(CaretakerBase):
    user_id: int | None = None


class CaretakerProvisionCreate(CaretakerBase):
    username: str = Field(..., min_length=1, max_length=80)
    full_name: str = Field(..., min_length=2, max_length=150)
    password: str = Field(..., min_length=8)


class CaretakerRead(CaretakerBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
