from datetime import datetime

from pydantic import BaseModel, Field


class AdministrationMarkRequest(BaseModel):
    notes: str | None = None


class AdministrationMissRequest(BaseModel):
    reason: str = Field(..., min_length=2)
    notes: str | None = None


class AdministrationRead(BaseModel):
    id: int
    medication_id: int
    resident_id: int
    caretaker_id: int | None
    scheduled_time: datetime
    status: str
    administered_at: datetime | None = None
    administered_by: str | None = None
    missed_reason: str | None = None
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
