from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_access_token
from app.database.database import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id") or payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials") from exc

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def require_roles(required_roles: list[str]):
    def role_dependency(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role.value not in required_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to perform this action.")
        return current_user

    return role_dependency


def require_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role != UserRole.ADMINISTRATOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required.")
    return current_user


def require_caretaker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role != UserRole.CARETAKER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Caretaker access required.")
    return current_user


def require_resident(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role != UserRole.RESIDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Resident access required.")
    return current_user


def require_authenticated(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user
