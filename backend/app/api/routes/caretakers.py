from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.database.database import get_db
from app.core.security import get_password_hash
from app.models.audit_log import AuditLog
from app.models.caretaker import Caretaker
from app.models.user import User, UserRole
from app.schemas.caretaker import CaretakerCreate, CaretakerProvisionCreate, CaretakerRead

router = APIRouter()


@router.get("", response_model=list[CaretakerRead])
def list_caretakers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.ADMINISTRATOR:
        return db.query(Caretaker).all()
    if current_user.role == UserRole.CARETAKER:
        return db.query(Caretaker).filter(Caretaker.user_id == current_user.id).all()
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view caretakers.")


@router.post("", response_model=CaretakerRead)
def create_caretaker(payload: CaretakerCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    caretaker = Caretaker(**payload.model_dump(exclude_none=True))
    db.add(caretaker)
    db.commit()
    db.refresh(caretaker)
    return caretaker


@router.post("/accounts", response_model=CaretakerRead, status_code=status.HTTP_201_CREATED)
def provision_caretaker_account(
    payload: CaretakerProvisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That username is already in use.")
    if db.query(Caretaker).filter(Caretaker.employee_id == payload.employee_id).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That employee ID is already in use.")

    user = User(
        username=payload.username,
        full_name=payload.full_name,
        phone=payload.phone,
        password_hash=get_password_hash(payload.password),
        role=UserRole.CARETAKER,
        is_active=True,
    )
    caretaker_data = payload.model_dump(exclude={"username", "full_name", "password"})
    caretaker = Caretaker(user=user, **caretaker_data)
    db.add(caretaker)
    try:
        db.flush()
        db.add(AuditLog(
            user_id=current_user.id,
            action="caretaker.created",
            entity_type="caretaker",
            entity_id=caretaker.id,
            description=f"Created caretaker account for {user.full_name}.",
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The caretaker account could not be created because of a conflicting record.") from exc
    db.refresh(caretaker)
    return caretaker
