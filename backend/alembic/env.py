# Alembic env: sync migrations against DIRECT_URL using psycopg and SQLModel metadata.

from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from sqlmodel import SQLModel

from alembic import context
from app.core.config import get_settings
from app.db import models as _models  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata


def _sync_migrations_url() -> str:
    """Map Neon direct URL to a SQLAlchemy URL for psycopg (sync Alembic runner)."""

    direct = get_settings().direct_url
    if direct.startswith("postgresql://"):
        return "postgresql+psycopg://" + direct.removeprefix("postgresql://")
    return direct


def run_migrations_offline() -> None:
    """Generate SQL without connecting (``alembic upgrade head --sql``)."""

    url = _sync_migrations_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Apply migrations with a live connection."""

    connectable = create_engine(_sync_migrations_url(), poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
