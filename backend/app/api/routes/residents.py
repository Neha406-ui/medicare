from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.database.database import get_db
from app.models.audit_log import AuditLog
from app.models.caretaker import Caretaker
from app.models.resident import Resident
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.schemas.resident import ResidentCreate, ResidentRead, ResidentUpdate

router = APIRouter()


def filter_resident_query(db: Session, current_user: User):
    query = db.query(Resident)
    if current_user.role == UserRole.ADMINISTRATOR:
        return query
    if current_user.role == UserRole.CARETAKER:
        caretaker = db.query(Caretaker).filter(Caretaker.user_id == current_user.id).first()
        if caretaker:
            return query.filter(Resident.assigned_caretaker_id == caretaker.id)
        return query.filter(Resident.id == -1)
    if current_user.role == UserRole.RESIDENT:
        resident = current_user.resident
        if not resident:
            return query.filter(Resident.id == -1)
        return query.filter(Resident.id == resident.id)
    return query.filter(Resident.id == -1)


@router.get("", response_model=list[ResidentRead])
def list_residents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return filter_resident_query(db, current_user).all()


@router.get("/{resident_id}", response_model=ResidentRead)
def get_resident(resident_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    resident = filter_resident_query(db, current_user).filter(Resident.id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resident not found")
    return resident


@router.post("", response_model=ResidentRead)
def create_resident(payload: ResidentCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    values = payload.model_dump(exclude={"user_id", "username", "password"}, exclude_none=True)
    if payload.assigned_caretaker_id is not None:
        caretaker = db.query(Caretaker).filter(Caretaker.id == payload.assigned_caretaker_id).first()
        if caretaker is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The selected caretaker does not exist.")
    if payload.user_id is not None:
        account = db.query(User).filter(User.id == payload.user_id).first()
        if account is None or account.role != UserRole.RESIDENT:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The selected user must have the resident role.")
        if account.resident is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This user already has a resident profile.")
    else:
        if db.query(User).filter(User.username == payload.username).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That username is already in use.")
        account = User(
            username=payload.username,
            full_name=payload.full_name,
            phone=payload.phone,
            password_hash=get_password_hash(payload.password),
            role=UserRole.RESIDENT,
            is_active=True,
        )
        db.add(account)
        db.flush()

    values["user_id"] = account.id
    resident = Resident(**values)
    db.add(resident)
    try:
        db.flush()
        db.add(AuditLog(
            user_id=current_user.id,
            action="resident.created",
            entity_type="resident",
            entity_id=resident.id,
            description=f"Created resident profile for {resident.full_name}.",
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The resident account could not be created because of a conflicting record.") from exc
    db.refresh(resident)
    return resident


@router.put("/{resident_id}", response_model=ResidentRead)
def update_resident(resident_id: int, payload: ResidentUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    resident = db.query(Resident).filter(Resident.id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resident not found")
    if payload.assigned_caretaker_id is not None:
        caretaker = db.query(Caretaker).filter(Caretaker.id == payload.assigned_caretaker_id).first()
        if caretaker is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The selected caretaker does not exist.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(resident, key, value)
    resident.user.full_name = resident.full_name
    resident.user.phone = resident.phone
    resident.user.is_active = resident.status == "active"
    db.add(AuditLog(
        user_id=current_user.id,
        action="resident.updated",
        entity_type="resident",
        entity_id=resident.id,
        description=f"Updated resident profile for {resident.full_name}.",
    ))
    db.commit()
    db.refresh(resident)
    return resident
