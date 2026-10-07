from datetime import date, datetime

from pydantic import BaseModel, Field


class MedicationBase(BaseModel):
    medicine_name: str = Field(..., min_length=2, max_length=120)
    dosage: str = Field(..., min_length=1, max_length=50)
    unit: str = Field(..., min_length=1, max_length=20)
    frequency: str = Field(..., min_length=2, max_length=60)
    start_date: date | None = None
    end_date: date | None = None
    instructions: str | None = None
    prescribing_doctor: str | None = None
    status: str = "active"


class MedicationCreate(MedicationBase):
    resident_id: int


class MedicationUpdate(MedicationBase):
    pass


class MedicationRead(MedicationBase):
    id: int
    resident_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
