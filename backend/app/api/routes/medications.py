from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.core.dependencies import get_current_user, require_admin
from app.database.database import get_db
from app.models.caretaker import Caretaker
from app.models.medication import Medication
from app.models.resident import Resident
from app.models.user import User, UserRole
from app.schemas.medication import MedicationCreate, MedicationRead, MedicationUpdate

router = APIRouter()


def filter_medication_query(db: Session, current_user: User):
    query = db.query(Medication)
    if current_user.role == UserRole.ADMINISTRATOR:
        return query
    if current_user.role == UserRole.CARETAKER:
        caretaker = db.query(Caretaker).filter(Caretaker.user_id == current_user.id).first()
        if caretaker is None:
            return query.filter(Medication.id == -1)
        return query.join(Resident).filter(Resident.assigned_caretaker_id == caretaker.id)
    if current_user.role == UserRole.RESIDENT:
        resident = current_user.resident
        if not resident:
            return query.filter(Medication.id == -1)
        return query.filter(Medication.resident_id == resident.id)
    return query.filter(Medication.id == -1)


@router.get("", response_model=list[MedicationRead])
def list_medications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return filter_medication_query(db, current_user).all()


@router.get("/{medication_id}", response_model=MedicationRead)
def get_medication(medication_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    medication = filter_medication_query(db, current_user).filter(Medication.id == medication_id).first()
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    return medication


@router.post("", response_model=MedicationRead)
def create_medication(payload: MedicationCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    resident = db.query(Resident).filter(Resident.id == payload.resident_id).first()
    if resident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resident not found.")
    medication = Medication(**payload.model_dump())
    db.add(medication)
    db.flush()
    db.add(AuditLog(
        user_id=current_user.id,
        action="medication.created",
        entity_type="medication",
        entity_id=medication.id,
        description=f"Created medication record for {medication.medicine_name} for {resident.full_name}.",
    ))
    db.commit()
    db.refresh(medication)
    return medication


@router.put("/{medication_id}", response_model=MedicationRead)
def update_medication(medication_id: int, payload: MedicationUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    medication = db.query(Medication).filter(Medication.id == medication_id).first()
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(medication, key, value)
    db.add(AuditLog(
        user_id=current_user.id,
        action="medication.updated",
        entity_type="medication",
        entity_id=medication.id,
        description=f"Updated medication record for {medication.medicine_name}.",
    ))
    db.commit()
    db.refresh(medication)
    return medication


@router.delete("/{medication_id}")
def delete_medication(medication_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    medication = db.query(Medication).filter(Medication.id == medication_id).first()
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    medication.status = "inactive"
    db.add(AuditLog(
        user_id=current_user.id,
        action="medication.deactivated",
        entity_type="medication",
        entity_id=medication.id,
        description=f"Deactivated medication record for {medication.medicine_name}.",
    ))
    db.commit()
    return {"detail": "Medication deactivated"}
