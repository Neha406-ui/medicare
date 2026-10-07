from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base
from app.models.user import UserRole


class Resident(Base):
    __tablename__ = "residents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(30), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    room_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    building: Mapped[str | None] = mapped_column(String(80), nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(20), nullable=True)
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    medical_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    admission_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    assigned_caretaker_id: Mapped[int | None] = mapped_column(ForeignKey("caretakers.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="resident")
    assigned_caretaker: Mapped["Caretaker | None"] = relationship(back_populates="assigned_residents", foreign_keys="Resident.assigned_caretaker_id")
    medications: Mapped[list["Medication"]] = relationship(back_populates="resident")
    administrations: Mapped[list["MedicationAdministration"]] = relationship(back_populates="resident")
