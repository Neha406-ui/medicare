from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.security import create_access_token
from app.database.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserPublic
from app.services.auth_service import authenticate_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    if user.role.name != payload.role:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Selected role does not match this account.")

    token_payload = {
        "sub": str(user.id),
        "user_id": user.id,
        "username": user.username,
        "role": user.role.name,
    }
    access_token = create_access_token(token_payload, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserPublic.from_user(user),
    }


@router.get("/me", response_model=UserPublic)
def get_current_user_details(current_user: User = Depends(get_current_user)):
    return UserPublic.from_user(current_user)
