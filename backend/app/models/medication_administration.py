from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class MedicationAdministrationStatus(str, Enum):
    GIVEN = "GIVEN"
    DUE = "DUE"
    LATE = "LATE"
    MISSED = "MISSED"
    REFUSED = "REFUSED"


class MedicationAdministration(Base):
    __tablename__ = "medication_administrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    schedule_id: Mapped[int | None] = mapped_column(ForeignKey("medication_schedules.id"), nullable=True)
    medication_id: Mapped[int] = mapped_column(ForeignKey("medications.id"), nullable=False)
    resident_id: Mapped[int] = mapped_column(ForeignKey("residents.id"), nullable=False)
    caretaker_id: Mapped[int | None] = mapped_column(ForeignKey("caretakers.id"), nullable=True)
    scheduled_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[MedicationAdministrationStatus] = mapped_column(
        SAEnum(MedicationAdministrationStatus, native_enum=False, validate_strings=True),
        nullable=False,
        default=MedicationAdministrationStatus.DUE,
    )
    administered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    administered_by: Mapped[str | None] = mapped_column(String(150), nullable=True)
    missed_reason: Mapped[str | None] = mapped_column(String(80), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    medication: Mapped["Medication"] = relationship(back_populates="administrations")
    resident: Mapped["Resident"] = relationship(back_populates="administrations")
    caretaker: Mapped["Caretaker | None"] = relationship(back_populates="administrations")
    schedule: Mapped["MedicationSchedule | None"] = relationship()
