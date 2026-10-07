from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(..., min_length=1, max_length=80)
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    password: str = Field(..., min_length=6)
    role: str


class UserRead(BaseModel):
    id: int
    username: str
    full_name: str
    email: EmailStr | None
    phone: str | None
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
