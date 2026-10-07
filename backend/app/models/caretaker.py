from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class Caretaker(Base):
    __tablename__ = "caretakers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    shift_start: Mapped[str | None] = mapped_column(String(10), nullable=True)
    shift_end: Mapped[str | None] = mapped_column(String(10), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="caretaker")
    assigned_residents: Mapped[list["Resident"]] = relationship(back_populates="assigned_caretaker", foreign_keys="Resident.assigned_caretaker_id")
    administrations: Mapped[list["MedicationAdministration"]] = relationship(back_populates="caretaker")
