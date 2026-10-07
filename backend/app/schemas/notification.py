from datetime import datetime

from pydantic import BaseModel, Field


class NotificationRead(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationCreate(BaseModel):
    title: str = Field(..., min_length=3)
    message: str = Field(..., min_length=3)
    notification_type: str = "SYSTEM"
