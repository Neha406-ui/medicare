from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.caretaker import Caretaker
from app.models.inventory import Inventory
from app.models.medication import Medication
from app.models.medication_administration import MedicationAdministration, MedicationAdministrationStatus
from app.models.medication_schedule import MedicationSchedule
from app.models.resident import Resident
from app.models.user import User, UserRole

router = APIRouter()


@router.get("/admin")
def admin_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Administrator access required")

    today = date.today()
    starts = datetime.combine(today, datetime.min.time())
    ends = datetime.combine(today, datetime.max.time())

    scheduled_today = (
        db.query(MedicationSchedule)
        .join(Medication, Medication.id == MedicationSchedule.medication_id)
        .join(Resident, Resident.id == Medication.resident_id)
        .filter(
            MedicationSchedule.is_active.is_(True),
            Medication.status == "active",
            Resident.status == "active",
            (Medication.start_date.is_(None) | (Medication.start_date <= today)),
            (Medication.end_date.is_(None) | (Medication.end_date >= today)),
        )
        .count()
    )
    todays_records = db.query(MedicationAdministration).filter(
        MedicationAdministration.scheduled_time >= starts,
        MedicationAdministration.scheduled_time <= ends,
    ).all()
    given_today = sum(item.status == MedicationAdministrationStatus.GIVEN for item in todays_records)
    late_today = sum(item.status == MedicationAdministrationStatus.LATE for item in todays_records)
    missed_today = sum(item.status == MedicationAdministrationStatus.MISSED for item in todays_records)
    refused_today = sum(item.status == MedicationAdministrationStatus.REFUSED for item in todays_records)
    resolved_today = sum(item.status in (MedicationAdministrationStatus.GIVEN, MedicationAdministrationStatus.MISSED, MedicationAdministrationStatus.REFUSED) for item in todays_records)
    pending_today = max(0, scheduled_today - resolved_today)
    low_stock = db.query(Inventory).filter(Inventory.current_stock <= Inventory.minimum_stock).count()
    adherence_percentage = round((given_today / scheduled_today) * 100, 2) if scheduled_today else 0
    weekly_schedules = (
        db.query(MedicationSchedule, Medication)
        .join(Medication, Medication.id == MedicationSchedule.medication_id)
        .join(Resident, Resident.id == Medication.resident_id)
        .filter(
            MedicationSchedule.is_active.is_(True),
            Medication.status == "active",
            Resident.status == "active",
        )
        .all()
    )
    weekly_adherence = []
    for days_ago in range(6, -1, -1):
        day = today - timedelta(days=days_ago)
        day_start = datetime.combine(day, time.min)
        day_end = datetime.combine(day, time.max)
        daily = db.query(MedicationAdministration).filter(
            MedicationAdministration.scheduled_time >= day_start,
            MedicationAdministration.scheduled_time <= day_end,
        ).all()
        completed = sum(item.status == MedicationAdministrationStatus.GIVEN for item in daily)
        expected = sum(
            medication.start_date is None or medication.start_date <= day
            for schedule, medication in weekly_schedules
            if schedule.is_active
            and (medication.end_date is None or medication.end_date >= day)
            and (day < today or schedule.scheduled_time <= datetime.now().time())
        )
        weekly_adherence.append({
            "name": day.strftime("%a"),
            "adherence": round(completed / expected * 100, 2) if daily and expected else None,
            "total": expected,
        })

    return {
        "total_residents": db.query(Resident).filter(Resident.status == "active").count(),
        "scheduled_today": scheduled_today,
        "given_today": given_today,
        "pending_today": pending_today,
        "late_today": late_today,
        "missed_today": missed_today,
        "refused_today": refused_today,
        "low_stock": low_stock,
        "adherence_percentage": adherence_percentage,
        "weekly_adherence": weekly_adherence,
        "recent_administrations": [
            {
                "id": item.id,
                "resident": item.resident.full_name,
                "medication": item.medication.medicine_name,
                "status": item.status.value,
                "administered_at": item.administered_at.isoformat() if item.administered_at else None,
            }
            for item in db.query(MedicationAdministration).order_by(MedicationAdministration.created_at.desc()).limit(5).all()
        ],
        "alerts": [
            {"title": item.medicine_name, "message": f"Inventory for {item.medicine_name} is below minimum level."}
            for item in db.query(Inventory).filter(Inventory.current_stock <= Inventory.minimum_stock).limit(5).all()
        ],
    }


@router.get("/caretaker")
def caretaker_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.CARETAKER:
        raise HTTPException(status_code=403, detail="Caretaker access required")

    caretaker = db.query(Caretaker).filter(Caretaker.user_id == current_user.id).first()
    if not caretaker:
        return {
            "assigned_residents": 0,
            "assigned_today": 0,
            "given_today": 0,
            "pending_today": 0,
            "missed_today": 0,
            "late_today": 0,
            "refused_today": 0,
            "today_schedule": [],
        }

    resident_ids = [resident.id for resident in db.query(Resident).filter(Resident.assigned_caretaker_id == caretaker.id).all()]
    today_schedule = []
    if resident_ids:
        today_schedule = (
            db.query(MedicationSchedule, Medication, Resident)
            .join(Medication, Medication.id == MedicationSchedule.medication_id)
            .join(Resident, Resident.id == Medication.resident_id)
            .filter(
                Medication.resident_id.in_(resident_ids),
                MedicationSchedule.is_active.is_(True),
                Medication.status == "active",
                Resident.status == "active",
                (Medication.start_date.is_(None) | (Medication.start_date <= date.today())),
                (Medication.end_date.is_(None) | (Medication.end_date >= date.today())),
            )
            .all()
        )

    starts = datetime.combine(date.today(), time.min)
    ends = datetime.combine(date.today(), time.max)
    todays_records = db.query(MedicationAdministration).filter(
        MedicationAdministration.caretaker_id == caretaker.id,
        MedicationAdministration.scheduled_time >= starts,
        MedicationAdministration.scheduled_time <= ends,
    ).all()
    record_by_schedule = {item.schedule_id: item for item in todays_records if item.schedule_id is not None}
    given_today = sum(item.status == MedicationAdministrationStatus.GIVEN for item in todays_records)
    missed_today = sum(item.status == MedicationAdministrationStatus.MISSED for item in todays_records)
    refused_today = sum(item.status == MedicationAdministrationStatus.REFUSED for item in todays_records)
    late_today = sum(item.status == MedicationAdministrationStatus.LATE for item in todays_records)

    schedule_payload = []
    for schedule, medication, resident in today_schedule:
        record = record_by_schedule.get(schedule.id)
        schedule_status = record.status.value if record else (
            "LATE" if schedule.scheduled_time < datetime.now().time() else "PENDING"
        )
        schedule_payload.append({
            "id": schedule.id,
            "resident_id": resident.id,
            "medication_id": medication.id,
            "resident": resident.full_name,
            "room": resident.room_number,
            "medication": medication.medicine_name,
            "dose": medication.dosage,
            "unit": medication.unit,
            "scheduled_time": schedule.scheduled_time.strftime("%H:%M"),
            "status": schedule_status,
            "instructions": schedule.instructions or medication.instructions,
            "administration_id": record.id if record else None,
            "administered_at": record.administered_at.isoformat() if record and record.administered_at else None,
            "administered_by": record.administered_by if record else None,
            "missed_reason": record.missed_reason if record else None,
        })

    assigned_today = len(schedule_payload)
    pending_today = sum(item["status"] in ("PENDING", "LATE") for item in schedule_payload)
    return {
        "assigned_residents": len(resident_ids),
        "assigned_today": assigned_today,
        "given_today": given_today,
        "pending_today": pending_today,
        "missed_today": missed_today,
        "late_today": late_today,
        "refused_today": refused_today,
        "today_schedule": schedule_payload,
    }


@router.get("/resident")
def resident_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.RESIDENT:
        raise HTTPException(status_code=403, detail="Resident access required")

    resident = current_user.resident
    if not resident:
        return {
            "resident": None,
            "next_medication": None,
            "today_medications": [],
            "completed_today": 0,
            "remaining_today": 0,
            "weekly_adherence": None,
        }

    starts = datetime.combine(date.today(), time.min)
    ends = datetime.combine(date.today(), time.max)
    today_schedule = (
        db.query(MedicationSchedule, Medication)
        .join(Medication, Medication.id == MedicationSchedule.medication_id)
        .filter(
            Medication.resident_id == resident.id,
            Medication.status == "active",
            MedicationSchedule.is_active.is_(True),
            (Medication.start_date.is_(None) | (Medication.start_date <= date.today())),
            (Medication.end_date.is_(None) | (Medication.end_date >= date.today())),
            resident.status == "active",
        )
        .order_by(MedicationSchedule.scheduled_time)
        .all()
    )
    today_records = db.query(MedicationAdministration).filter(
        MedicationAdministration.resident_id == resident.id,
        MedicationAdministration.scheduled_time >= starts,
        MedicationAdministration.scheduled_time <= ends,
    ).all()
    records_by_schedule = {item.schedule_id: item for item in today_records if item.schedule_id is not None}
    today_medications = []
    for schedule, medication in today_schedule:
        record = records_by_schedule.get(schedule.id)
        scheduled_status = record.status.value if record else (
            "LATE" if schedule.scheduled_time < datetime.now().time() else "PENDING"
        )
        today_medications.append({
            "schedule_id": schedule.id,
            "medication_id": medication.id,
            "medicine_name": medication.medicine_name,
            "status": scheduled_status,
            "dosage": medication.dosage,
            "unit": medication.unit,
            "scheduled_time": schedule.scheduled_time.strftime("%H:%M"),
            "instructions": schedule.instructions or medication.instructions,
            "administered_at": record.administered_at.isoformat() if record and record.administered_at else None,
        })

    completed_today = sum(item["status"] == MedicationAdministrationStatus.GIVEN.value for item in today_medications)
    remaining_today = sum(item["status"] in ("PENDING", "LATE") for item in today_medications)
    next_medication = None
    next_item = next((item for item in today_medications if item["status"] == "PENDING"), None)
    if next_item:
        next_medication = {
            "medicine_name": next_item["medicine_name"],
            "dosage": next_item["dosage"],
            "unit": next_item["unit"],
            "scheduled_time": next_item["scheduled_time"],
        }

    week_start = datetime.combine(date.today() - timedelta(days=6), time.min)
    week_records = db.query(MedicationAdministration).filter(
        MedicationAdministration.resident_id == resident.id,
        MedicationAdministration.scheduled_time >= week_start,
        MedicationAdministration.scheduled_time <= ends,
    ).all()
    weekly_given = sum(record.status == MedicationAdministrationStatus.GIVEN for record in week_records)
    weekly_expected = 0
    resident_schedules = (
        db.query(MedicationSchedule, Medication)
        .join(Medication, Medication.id == MedicationSchedule.medication_id)
        .filter(
            Medication.resident_id == resident.id,
            Medication.status == "active",
            MedicationSchedule.is_active.is_(True),
        )
        .all()
    )
    for days_ago in range(6, -1, -1):
        day = date.today() - timedelta(days=days_ago)
        weekly_expected += sum(
            (medication.start_date is None or medication.start_date <= day)
            and (medication.end_date is None or medication.end_date >= day)
            and (day < date.today() or schedule.scheduled_time <= datetime.now().time())
            for schedule, medication in resident_schedules
        )

    return {
        "resident": {"id": resident.id, "full_name": resident.full_name},
        "next_medication": next_medication,
        "today_medications": today_medications,
        "completed_today": completed_today,
        "remaining_today": remaining_today,
        "weekly_adherence": round(weekly_given / weekly_expected * 100, 2) if week_records and weekly_expected else None,
    }
