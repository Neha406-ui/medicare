from datetime import datetime

from pydantic import BaseModel


class AdminDashboardResponse(BaseModel):
    total_residents: int
    today_scheduled: int
    today_given: int
    today_pending: int
    today_missed: int
    low_stock: int
    adherence_percentage: float
    recent_administrations: list[dict]
    alerts: list[dict]


class CaretakerDashboardResponse(BaseModel):
    assigned_today: int
    given: int
    pending: int
    missed: int
    today_schedule: list[dict]
    late_medications: list[dict]


class ResidentDashboardResponse(BaseModel):
    resident: dict
    next_medication: dict | None
    today_medications: list[dict]
    today_completed: int
    today_remaining: int
    weekly_adherence: float
