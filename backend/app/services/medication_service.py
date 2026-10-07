from datetime import datetime

from sqlalchemy.orm import Session

from app.models.medication_schedule import MedicationSchedule
from app.models.medication import Medication


def get_today_schedule(db: Session, resident_id: int | None = None):
    query = db.query(Medication, MedicationSchedule, ).join(MedicationSchedule, MedicationSchedule.medication_id == Medication.id)
    if resident_id:
        query = query.filter(Medication.resident_id == resident_id)
    return query.filter(MedicationSchedule.is_active.is_(True)).all()


def get_active_medication_count(db: Session, resident_id: int | None = None) -> int:
    query = db.query(Medication)
    if resident_id:
        query = query.filter(Medication.resident_id == resident_id)
    return query.filter(Medication.status == "active").count()
