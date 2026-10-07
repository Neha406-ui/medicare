from datetime import datetime, time

from pydantic import BaseModel, Field


class MedicationScheduleCreate(BaseModel):
    medication_id: int
    scheduled_time: time
    instructions: str | None = None
    is_active: bool = True


class MedicationScheduleUpdate(BaseModel):
    scheduled_time: time | None = None
    instructions: str | None = None
    is_active: bool | None = None


class MedicationScheduleRead(BaseModel):
    id: int
    medication_id: int
    scheduled_time: time
    instructions: str | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
