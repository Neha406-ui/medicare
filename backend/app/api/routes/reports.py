from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.database.database import get_db
from app.models.medication_administration import MedicationAdministration, MedicationAdministrationStatus
from app.models.user import User

router = APIRouter()


@router.get("/adherence")
def adherence_report(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    resident_id: int | None = None,
    caretaker_id: int | None = None,
    medication_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(MedicationAdministration)
    if resident_id:
        query = query.filter(MedicationAdministration.resident_id == resident_id)
    if caretaker_id:
        query = query.filter(MedicationAdministration.caretaker_id == caretaker_id)
    if medication_id:
        query = query.filter(MedicationAdministration.medication_id == medication_id)
    if start_date:
        query = query.filter(MedicationAdministration.created_at >= start_date)
    if end_date:
        query = query.filter(MedicationAdministration.created_at <= end_date)

    total = query.count()
    given = query.filter(MedicationAdministration.status == MedicationAdministrationStatus.GIVEN).count()
    missed = query.filter(MedicationAdministration.status == MedicationAdministrationStatus.MISSED).count()
    late = query.filter(MedicationAdministration.status == MedicationAdministrationStatus.LATE).count()
    adherence = round(((given / total) * 100) if total else 0, 2)

    return {
        "total_scheduled": total,
        "total_given": given,
        "total_missed": missed,
        "total_late": late,
        "adherence_percentage": adherence,
    }


@router.get("/missed-medications")
def missed_medications(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(MedicationAdministration).filter(MedicationAdministration.status == MedicationAdministrationStatus.MISSED).all()


@router.get("/caretaker-performance")
def caretaker_performance(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return {"message": "Caretaker performance report available for administrators."}
