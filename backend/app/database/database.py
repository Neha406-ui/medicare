from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from alembic import command
from alembic.config import Config
from pathlib import Path

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    backend_dir = Path(__file__).resolve().parents[2]
    alembic_config = Config(str(backend_dir / "alembic.ini"))
    alembic_config.set_main_option("script_location", str(backend_dir / "alembic"))
    alembic_config.set_main_option("sqlalchemy.url", settings.DATABASE_URL.replace("%", "%%"))
    command.upgrade(alembic_config, "head")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
