# Tests for GET /api/datasets using in-memory SQLite and dependency override.

from collections.abc import AsyncGenerator, AsyncIterator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.models import Dataset
from app.db.session import get_session
from app.main import app


@pytest_asyncio.fixture
async def sqlite_engine() -> AsyncGenerator[AsyncEngine, None]:
    """In-memory SQLite engine with SQLModel tables created."""

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def datasets_session_factory(
    sqlite_engine: AsyncEngine,
) -> async_sessionmaker[AsyncSession]:
    """Session factory bound to the in-memory engine."""

    return async_sessionmaker(
        sqlite_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


@pytest_asyncio.fixture
async def datasets_client(
    datasets_session_factory: async_sessionmaker[AsyncSession],
) -> AsyncGenerator[AsyncClient, None]:
    """HTTP client with ``get_session`` overridden to the SQLite engine."""

    session_factory = datasets_session_factory

    async def override_get_session() -> AsyncIterator[AsyncSession]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_datasets_empty(datasets_client: AsyncClient) -> None:
    """Empty registry returns zero items."""

    response = await datasets_client.get("/api/datasets")
    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0}


@pytest.mark.asyncio
async def test_list_datasets_with_rows(
    datasets_client: AsyncClient,
    datasets_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    """Rows are returned sorted by slug with populated fields."""

    async with datasets_session_factory() as session:
        session.add(
            Dataset(
                slug="zebra",
                display_name="Zebra",
                citation="c1",
                license="MIT",
                cell_count=10,
                gene_count=20,
            ),
        )
        session.add(
            Dataset(
                slug="alpha",
                display_name="Alpha",
                citation="c2",
                license="MIT",
                cell_count=30,
                gene_count=40,
            ),
        )
        await session.commit()

    response = await datasets_client.get("/api/datasets")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    slugs = [item["slug"] for item in body["items"]]
    assert slugs == ["alpha", "zebra"]
    first = body["items"][0]
    assert first["display_name"] == "Alpha"
    assert first["cell_count"] == 30
    assert first["gene_count"] == 40
    assert "created_at" in first
    assert "id" in first


@pytest.mark.asyncio
async def test_list_datasets_request_id_echoed(datasets_client: AsyncClient) -> None:
    """X-Request-ID header is echoed on the datasets response."""

    response = await datasets_client.get(
        "/api/datasets",
        headers={"X-Request-ID": "trace-datasets"},
    )
    assert response.status_code == 200
    assert response.headers.get("x-request-id") == "trace-datasets"
