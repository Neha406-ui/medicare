from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.database.base  # noqa: F401
from app.api.routes import admin as admin_routes
from app.api.routes import administrations as administrations_routes
from app.api.routes import auth as auth_routes
from app.api.routes import caretakers as caretakers_routes
from app.api.routes import dashboards as dashboards_routes
from app.api.routes import inventory as inventory_routes
from app.api.routes import medications as medications_routes
from app.api.routes import notifications as notifications_routes
from app.api.routes import reports as reports_routes
from app.api.routes import residents as residents_routes
from app.api.routes import schedules as schedules_routes
from app.api.routes import users as users_routes
from app.core.config import settings
from app.database.database import init_db

app = FastAPI(
    title="MediCare Home API",
    version="1.0.0",
    description="Medication management backend for senior citizens living in care facilities",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_routes.router, prefix="/api/users", tags=["Users"])
app.include_router(residents_routes.router, prefix="/api/residents", tags=["Residents"])
app.include_router(caretakers_routes.router, prefix="/api/caretakers", tags=["Caretakers"])
app.include_router(medications_routes.router, prefix="/api/medications", tags=["Medications"])
app.include_router(schedules_routes.router, prefix="/api/schedules", tags=["Schedules"])
app.include_router(administrations_routes.router, prefix="/api/administrations", tags=["Administration"])
app.include_router(inventory_routes.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(notifications_routes.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(reports_routes.router, prefix="/api/reports", tags=["Reports"])
app.include_router(dashboards_routes.router, prefix="/api/dashboard", tags=["Dashboards"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["Users"])


@app.on_event("startup")
def initialize_app() -> None:
    init_db()


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "medicare-home-api"}
