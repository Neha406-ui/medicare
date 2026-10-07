from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_caretaker
from app.database.database import get_db
from app.models.caretaker import Caretaker
from app.models.medication import Medication
from app.models.medication_administration import MedicationAdministration, MedicationAdministrationStatus
from app.models.medication_schedule import MedicationSchedule
from app.models.resident import Resident
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.models.user import User, UserRole
from app.schemas.administration import AdministrationMarkRequest, AdministrationMissRequest, AdministrationRead

router = APIRouter()


def get_administration_scope_query(db: Session, current_user: User):
    query = db.query(MedicationAdministration)
    if current_user.role == UserRole.ADMINISTRATOR:
        return query
    if current_user.role == UserRole.CARETAKER:
        caretaker = db.query(Caretaker).filter(Caretaker.user_id == current_user.id).first()
        if caretaker:
            return query.filter(MedicationAdministration.caretaker_id == caretaker.id)
        return query.filter(MedicationAdministration.id == -1)
    if current_user.role == UserRole.RESIDENT:
        resident = db.query(Resident).filter(Resident.user_id == current_user.id).first()
        if resident:
            return query.filter(MedicationAdministration.resident_id == resident.id)
        return query.filter(MedicationAdministration.id == -1)
    return query.filter(MedicationAdministration.id == -1)


def get_assigned_schedule(schedule_id: int, db: Session, current_user: User):
    caretaker = db.query(Caretaker).filter(Caretaker.user_id == current_user.id).first()
    if not caretaker:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Caretaker profile required.")

    schedule_row = (
        db.query(MedicationSchedule, Medication, Resident)
        .join(Medication, Medication.id == MedicationSchedule.medication_id)
        .join(Resident, Resident.id == Medication.resident_id)
        .filter(
            MedicationSchedule.id == schedule_id,
            Resident.assigned_caretaker_id == caretaker.id,
            MedicationSchedule.is_active.is_(True),
            Resident.status == "active",
        )
        .first()
    )
    if not schedule_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    schedule, medication, resident = schedule_row
    return schedule, medication, resident, caretaker


def get_or_create_administration(schedule, medication, resident, caretaker, current_user, db, administration_status, *, notes=None, reason=None):
    scheduled_time = datetime.combine(date.today(), schedule.scheduled_time)
    record = (
        db.query(MedicationAdministration)
        .filter(
            MedicationAdministration.schedule_id == schedule.id,
            MedicationAdministration.scheduled_time == scheduled_time,
        )
        .first()
    )
    if record and record.status in (
        MedicationAdministrationStatus.GIVEN,
        MedicationAdministrationStatus.MISSED,
        MedicationAdministrationStatus.REFUSED,
    ):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This scheduled dose has already been recorded.")
    if record is None:
        record = MedicationAdministration(
            schedule_id=schedule.id,
            medication_id=medication.id,
            resident_id=resident.id,
            caretaker_id=caretaker.id,
            scheduled_time=scheduled_time,
        )
        db.add(record)
        db.flush()

    record.status = administration_status
    record.administered_at = datetime.utcnow() if administration_status == MedicationAdministrationStatus.GIVEN else None
    record.administered_by = current_user.full_name
    record.missed_reason = reason
    record.notes = notes
    db.add(AuditLog(
        user_id=current_user.id,
        action=f"medication.{administration_status.value.lower()}",
        entity_type="medication_administration",
        entity_id=record.id,
        description=f"Recorded {administration_status.value.lower()} for {medication.medicine_name} for {resident.full_name}.",
    ))
    if administration_status in (MedicationAdministrationStatus.MISSED, MedicationAdministrationStatus.REFUSED):
        db.add(Notification(
            user_id=resident.user_id,
            title=f"Medication {administration_status.value.lower()}",
            message=f"{resident.full_name}'s {medication.medicine_name} dose was recorded as {administration_status.value.lower()}.",
            notification_type="MEDICATION_MISSED",
            is_read=False,
        ))
        if caretaker.user_id != resident.user_id:
            db.add(Notification(
                user_id=caretaker.user_id,
                title=f"Follow-up: medication {administration_status.value.lower()}",
                message=f"{resident.full_name}'s {medication.medicine_name} dose was recorded as {administration_status.value.lower()}.",
                notification_type="MEDICATION_MISSED",
                is_read=False,
            ))
    db.commit()
    db.refresh(record)
    return record


@router.get("", response_model=list[AdministrationRead])
def list_administrations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_administration_scope_query(db, current_user).order_by(MedicationAdministration.scheduled_time.desc()).all()


@router.post("/{schedule_id}/given", response_model=AdministrationRead)
def mark_given(schedule_id: int, payload: AdministrationMarkRequest, db: Session = Depends(get_db), current_user: User = Depends(require_caretaker)):
    schedule, medication, resident, caretaker = get_assigned_schedule(schedule_id, db, current_user)
    return get_or_create_administration(schedule, medication, resident, caretaker, current_user, db, MedicationAdministrationStatus.GIVEN, notes=payload.notes)


@router.post("/{schedule_id}/missed", response_model=AdministrationRead)
def mark_missed(schedule_id: int, payload: AdministrationMissRequest, db: Session = Depends(get_db), current_user: User = Depends(require_caretaker)):
    schedule, medication, resident, caretaker = get_assigned_schedule(schedule_id, db, current_user)
    if payload.reason.lower() == "resident refused":
        state = MedicationAdministrationStatus.REFUSED
    else:
        state = MedicationAdministrationStatus.MISSED
    return get_or_create_administration(schedule, medication, resident, caretaker, current_user, db, state, notes=payload.notes, reason=payload.reason)


@router.post("/{schedule_id}/refused", response_model=AdministrationRead)
def mark_refused(schedule_id: int, payload: AdministrationMissRequest, db: Session = Depends(get_db), current_user: User = Depends(require_caretaker)):
    schedule, medication, resident, caretaker = get_assigned_schedule(schedule_id, db, current_user)
    return get_or_create_administration(
        schedule,
        medication,
        resident,
        caretaker,
        current_user,
        db,
        MedicationAdministrationStatus.REFUSED,
        notes=payload.notes,
        reason=payload.reason,
    )
