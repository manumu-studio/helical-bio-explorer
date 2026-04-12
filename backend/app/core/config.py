# Typed application settings loaded from environment and optional .env file.

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration sourced from the environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    env: Literal["dev", "prod"] = Field(default="dev", validation_alias="ENV")
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(
        default="INFO",
        validation_alias="LOG_LEVEL",
    )
    backend_cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000"],
        validation_alias="BACKEND_CORS_ORIGINS",
    )
    # DATABASE_URL: Neon pooled endpoint for runtime asyncpg (must include +asyncpg dialect).
    database_url: str = Field(validation_alias="DATABASE_URL")
    # DIRECT_URL: Neon direct (non-pooled) URL for Alembic / sync tools — plain postgresql://.
    direct_url: str = Field(validation_alias="DIRECT_URL")

    # S3 / Parquet (ADR-005): optional bucket enables S3-first reads; None = local-only.
    s3_bucket: str | None = Field(default=None, validation_alias="S3_BUCKET")
    s3_region: str = Field(default="us-east-1", validation_alias="S3_REGION")
    s3_endpoint_url: str | None = Field(default=None, validation_alias="S3_ENDPOINT_URL")
    parquet_local_fallback_dir: str = Field(
        default="data/parquet",
        validation_alias="PARQUET_LOCAL_FALLBACK_DIR",
    )

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        """Ensure runtime URL targets asyncpg (pooled Neon)."""

        if not value.startswith("postgresql+asyncpg://"):
            msg = (
                "DATABASE_URL must start with postgresql+asyncpg:// "
                "(pooled Neon runtime for asyncpg)"
            )
            raise ValueError(msg)
        return value

    @field_validator("direct_url")
    @classmethod
    def validate_direct_url(cls, value: str) -> str:
        """Ensure migrations URL is non-pooled Postgres."""

        if not value.startswith("postgresql://"):
            msg = "DIRECT_URL must start with postgresql:// (non-pooled Neon for Alembic)"
            raise ValueError(msg)
        return value


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""

    return Settings()
