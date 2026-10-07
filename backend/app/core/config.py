import os
from pathlib import Path
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"
    FRONTEND_URL: str = "http://localhost:5173"
    APP_ENV: Literal["development", "production"] = "development"

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if not isinstance(value, str) or not value.strip():
            raise ValueError("DATABASE_URL must be a non-empty database URL.")

        url = value.strip()
        if url.startswith("postgres://"):
            return "postgresql+psycopg://" + url.removeprefix("postgres://")
        if url.startswith("postgresql://"):
            return "postgresql+psycopg://" + url.removeprefix("postgresql://")
        if url.startswith("postgresql+psycopg2://"):
            raise ValueError(
                "The psycopg2 URL scheme is unsupported; install the configured psycopg 3 driver "
                "or use postgresql://."
            )
        return url

    @model_validator(mode="after")
    def require_postgresql_in_production(self) -> "Settings":
        if self.APP_ENV == "production" and self.DATABASE_URL.lower().startswith("sqlite:"):
            raise ValueError("Production requires PostgreSQL; SQLite is supported only for development.")
        return self


settings = Settings()

if settings.APP_ENV == "production":
    required_environment = ("DATABASE_URL", "SECRET_KEY", "FRONTEND_URL")
    missing_environment = [name for name in required_environment if not os.getenv(name)]
    if missing_environment:
        raise RuntimeError(
            "Production configuration requires environment variables: "
            + ", ".join(missing_environment)
        )
