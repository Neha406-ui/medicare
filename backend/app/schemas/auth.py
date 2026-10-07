from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=80)
    password: str = Field(..., min_length=4)
    role: Literal["ADMINISTRATOR", "CARETAKER", "RESIDENT"]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic | None = None


class UserPublic(BaseModel):
    id: int
    username: str
    full_name: str
    role: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_user(cls, user):
        return cls(id=user.id, username=user.username, full_name=user.full_name, role=user.role.name)
