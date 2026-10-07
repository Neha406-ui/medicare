from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.audit_log import AuditLog
from app.models.caretaker import Caretaker
from app.models.medication import Medication
from app.models.medication_administration import MedicationAdministration, MedicationAdministrationStatus
from app.models.medication_schedule import MedicationSchedule
from app.models.resident import Resident
from app.models.user import User, UserRole
from app.schemas.schedule import MedicationScheduleCreate, MedicationScheduleRead, MedicationScheduleUpdate

router = APIRouter()


def _schedule_status_for(schedule_time: time, administration: MedicationAdministration | None) -> str:
    now = datetime.now().time()
    if administration is None:
        return "LATE" if now > schedule_time else "DUE"
    if administration.status == MedicationAdministrationStatus.GIVEN:
        return "GIVEN"
    if administration.status == MedicationAdministrationStatus.MISSED:
        return "MISSED"
    if administration.status == MedicationAdministrationStatus.REFUSED:
        return "REFUSED"
    return "LATE" if now > schedule_time else "DUE"


@router.get("/today")
def get_today_schedule(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    query = (db.query(MedicationSchedule, Medication, Resident, Caretaker)
        .join(Medication, Medication.id == MedicationSchedule.medication_id)
        .join(Resident, Resident.id == Medication.resident_id)
        .outerjoin(Caretaker, Caretaker.id == Resident.assigned_caretaker_id)
        .filter(
            MedicationSchedule.is_active.is_(True),
            Medication.status == "active",
            Resident.status == "active",
            (Medication.start_date.is_(None) | (Medication.start_date <= today)),
            (Medication.end_date.is_(None) | (Medication.end_date >= today)),
        ))

    if current_user.role == UserRole.ADMINISTRATOR:
        results = query.all()
    elif current_user.role == UserRole.CARETAKER:
        caretaker = db.query(Caretaker).filter(Caretaker.user_id == current_user.id).first()
        if not caretaker:
            results = []
        else:
            results = query.filter(Resident.assigned_caretaker_id == caretaker.id).all()
    elif current_user.role == UserRole.RESIDENT:
        resident = current_user.resident
        results = query.filter(Resident.user_id == current_user.id).all() if resident else []
    else:
        results = []

    schedule_rows = []
    for schedule, medication, resident, caretaker in results:
        scheduled_dt = datetime.combine(today, schedule.scheduled_time)
        administration = (
            db.query(MedicationAdministration)
            .filter(
                MedicationAdministration.medication_id == medication.id,
                MedicationAdministration.resident_id == resident.id,
                MedicationAdministration.schedule_id == schedule.id,
                MedicationAdministration.scheduled_time >= datetime.combine(today, time.min),
                MedicationAdministration.scheduled_time < datetime.combine(today, time.max),
            )
            .order_by(MedicationAdministration.created_at.desc())
            .first()
        )
        status = _schedule_status_for(schedule.scheduled_time, administration)
        schedule_rows.append({
            "id": schedule.id,
            "resident_id": resident.id,
            "medication_id": medication.id,
            "resident": resident.full_name,
            "room": resident.room_number,
            "medication": medication.medicine_name,
            "dose": medication.dosage,
            "unit": medication.unit,
            "scheduled_time": schedule.scheduled_time.strftime("%H:%M"),
            "instructions": schedule.instructions or medication.instructions,
            "status": status,
            "administration_id": administration.id if administration else None,
            "caretaker": caretaker.user.full_name if caretaker and caretaker.user else None,
            "administration_time": administration.administered_at.isoformat() if administration and administration.administered_at else None,
        })
    return schedule_rows


@router.post("", response_model=MedicationScheduleRead)
def create_schedule(
    payload: MedicationScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    medication = db.query(Medication).filter(Medication.id == payload.medication_id).first()
    if medication is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found.")

    if current_user.role == UserRole.ADMINISTRATOR:
        pass
    elif current_user.role == UserRole.CARETAKER:
        caretaker = db.query(Caretaker).filter(Caretaker.user_id == current_user.id).first()
        if caretaker is None or medication.resident.assigned_caretaker_id != caretaker.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only schedule medication for residents assigned to you.")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators and assigned caretakers can manage schedules.")

    today = date.today()
    if medication.status != "active":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="This medication record is inactive. Reactivate or update it before creating a schedule.",
        )
    if medication.start_date is not None and medication.start_date > today:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"This medication starts on {medication.start_date.isoformat()} and cannot be scheduled yet.",
        )
    if medication.end_date is not None and medication.end_date < today:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"This medication ended on {medication.end_date.isoformat()}. Update its prescription dates before creating a schedule.",
        )

    schedule = MedicationSchedule(**payload.model_dump())
    db.add(schedule)
    db.flush()
    db.add(AuditLog(
        user_id=current_user.id,
        action="schedule.created",
        entity_type="medication_schedule",
        entity_id=schedule.id,
        description=f"Created a schedule for {medication.medicine_name} at {schedule.scheduled_time.strftime('%H:%M')}.",
    ))
    db.commit()
    db.refresh(schedule)
    return schedule


@router.patch("/{schedule_id}", response_model=MedicationScheduleRead)
def update_schedule(
    schedule_id: int,
    payload: MedicationScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(MedicationSchedule, Medication, Resident)
        .join(Medication, Medication.id == MedicationSchedule.medication_id)
        .join(Resident, Resident.id == Medication.resident_id)
        .filter(MedicationSchedule.id == schedule_id)
    )
    if current_user.role == UserRole.CARETAKER:
        caretaker = db.query(Caretaker).filter(Caretaker.user_id == current_user.id).first()
        if caretaker is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Caretaker profile required.")
        query = query.filter(Resident.assigned_caretaker_id == caretaker.id)
    elif current_user.role != UserRole.ADMINISTRATOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators and assigned caretakers can manage schedules.")

    result = query.first()
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found.")
    schedule, medication, resident = result
    changes: list[str] = []
    updates = payload.model_dump(exclude_unset=True)
    if any(updates.get(field) is None for field in ("scheduled_time", "is_active") if field in updates):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Scheduled time and active status cannot be null.")
    for field, new_value in updates.items():
        old_value = getattr(schedule, field)
        if old_value != new_value:
            changes.append(f"{field}: {old_value} -> {new_value}")
            setattr(schedule, field, new_value)

    if changes:
        db.add(AuditLog(
            user_id=current_user.id,
            action="schedule.updated",
            entity_type="medication_schedule",
            entity_id=schedule.id,
            description=f"Updated {medication.medicine_name} schedule for {resident.full_name}: {'; '.join(changes)}.",
        ))
        db.commit()
        db.refresh(schedule)
    return schedule
