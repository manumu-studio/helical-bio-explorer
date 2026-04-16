# Tests for ``seed_covid_dataset`` idempotent upsert (SQLite, no live Neon).

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession as SQLModelAsyncSession

from app.db.models import Dataset  # noqa: F401 — register table
from app.scripts import seed_covid_dataset


@pytest_asyncio.fixture
async def sqlite_engine() -> AsyncIterator[AsyncEngine]:
    """In-memory SQLite with ``datasets`` schema."""

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    try:
        yield engine
    finally:
        await engine.dispose()


@pytest_asyncio.fixture
async def sqlite_session_maker(
    sqlite_engine: AsyncEngine,
) -> async_sessionmaker[SQLModelAsyncSession]:
    return async_sessionmaker(
        sqlite_engine,
        class_=SQLModelAsyncSession,
        expire_on_commit=False,
    )


@pytest.mark.asyncio
async def test_seed_covid_inserts_row(
    sqlite_session_maker: async_sessionmaker[SQLModelAsyncSession],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        seed_covid_dataset,
        "async_session_maker",
        sqlite_session_maker,
    )
    await seed_covid_dataset.main()

    async with sqlite_session_maker() as session:
        result = await session.exec(select(Dataset).where(Dataset.slug == "covid_wilk"))
        row = result.one()
        assert row.display_name == "COVID-19 PBMCs (Wilk et al.)"
        assert row.cell_count == 10000


@pytest.mark.asyncio
async def test_seed_covid_idempotent(
    sqlite_session_maker: async_sessionmaker[SQLModelAsyncSession],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        seed_covid_dataset,
        "async_session_maker",
        sqlite_session_maker,
    )
    await seed_covid_dataset.main()
    await seed_covid_dataset.main()

    async with sqlite_session_maker() as session:
        result = await session.exec(select(Dataset).where(Dataset.slug == "covid_wilk"))
        rows = result.all()
        assert len(rows) == 1
