from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.medication_administration import MedicationAdministration, MedicationAdministrationStatus


def get_status_for_scheduled_time(scheduled_time: datetime) -> MedicationAdministrationStatus:
    return MedicationAdministrationStatus.DUE


def create_administration_record(
    db: Session,
    *,
    medication_id: int,
    resident_id: int,
    caretaker_id: int,
    scheduled_time: datetime,
    status: MedicationAdministrationStatus,
    notes: str | None = None,
    reason: str | None = None,
    administered_by: str | None = None,
) -> MedicationAdministration:
    record = MedicationAdministration(
        medication_id=medication_id,
        resident_id=resident_id,
        caretaker_id=caretaker_id,
        scheduled_time=scheduled_time,
        status=status,
        notes=notes,
        missed_reason=reason,
        administered_by=administered_by,
        administered_at=datetime.utcnow() if status == MedicationAdministrationStatus.GIVEN else None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
