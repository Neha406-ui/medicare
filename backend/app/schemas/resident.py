from datetime import date, datetime

from pydantic import BaseModel, Field, model_validator


class ResidentBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    date_of_birth: date | None = None
    age: int | None = Field(default=None, ge=0, le=130)
    gender: str | None = None
    phone: str | None = None
    room_number: str | None = None
    building: str | None = None
    blood_group: str | None = None
    allergies: str | None = None
    medical_conditions: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    admission_date: date | None = None
    assigned_caretaker_id: int | None = None
    status: str = "active"


class ResidentCreate(ResidentBase):
    user_id: int | None = None
    username: str | None = Field(default=None, min_length=1, max_length=80)
    password: str | None = Field(default=None, min_length=8)

    @model_validator(mode="after")
    def validate_account_fields(self):
        if self.user_id is None and (not self.username or not self.password):
            raise ValueError("A username and password are required to create a resident account.")
        if (self.username is None) != (self.password is None):
            raise ValueError("Username and password must be provided together.")
        return self


class ResidentUpdate(ResidentBase):
    pass


class ResidentRead(ResidentBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
