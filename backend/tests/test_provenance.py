# Tests for GET /api/v1/provenance/{dataset_slug}/{model_name} with in-memory SQLite.

from collections.abc import AsyncGenerator, AsyncIterator
from datetime import UTC, datetime

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.models import Dataset, PrecomputeRun
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
async def provenance_session_factory(
    sqlite_engine: AsyncEngine,
) -> async_sessionmaker[AsyncSession]:
    """Session factory bound to the in-memory engine."""

    return async_sessionmaker(
        sqlite_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


@pytest_asyncio.fixture
async def provenance_client(
    provenance_session_factory: async_sessionmaker[AsyncSession],
) -> AsyncGenerator[AsyncClient, None]:
    """HTTP client with ``get_session`` overridden to the SQLite engine."""

    session_factory = provenance_session_factory

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
async def test_provenance_returns_latest_row(
    provenance_client: AsyncClient,
    provenance_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    """Latest precompute run by created_at is returned for a dataset × model pair."""

    older = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)
    newer = datetime(2024, 6, 1, 12, 0, 0, tzinfo=UTC)
    async with provenance_session_factory() as session:
        ds = Dataset(
            slug="pbmc3k",
            display_name="PBMC 3k",
            citation="c",
            license="CC",
            cell_count=100,
            gene_count=200,
        )
        session.add(ds)
        await session.commit()
        await session.refresh(ds)
        assert ds.id is not None
        session.add(
            PrecomputeRun(
                dataset_id=ds.id,
                model_name="geneformer",
                model_version="v1",
                parameters={},
                output_parquet_key="v1/pbmc3k/geneformer_embeddings.parquet",
                git_sha="abcdef1234567890abcdef1234567890abcd",
                created_at=older,
            ),
        )
        session.add(
            PrecomputeRun(
                dataset_id=ds.id,
                model_name="geneformer",
                model_version="v1",
                parameters={},
                output_parquet_key="v2/pbmc3k/geneformer_embeddings.parquet",
                git_sha="111111111111111111111111111111111111",
                created_at=newer,
            ),
        )
        await session.commit()

    response = await provenance_client.get("/api/v1/provenance/pbmc3k/geneformer")
    assert response.status_code == 200
    body = response.json()
    assert body["output_parquet_key"] == "v2/pbmc3k/geneformer_embeddings.parquet"
    assert body["git_sha"] == "111111111111111111111111111111111111"
    assert body["model_name"] == "geneformer"
    assert body["model_version"] == "v1"
    assert body["dataset_slug"] == "pbmc3k"


@pytest.mark.asyncio
async def test_provenance_404_unknown_dataset(provenance_client: AsyncClient) -> None:
    """Unknown dataset slug yields 404."""

    response = await provenance_client.get("/api/v1/provenance/nonexistent/geneformer")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_provenance_404_unknown_model(
    provenance_client: AsyncClient,
    provenance_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    """Dataset exists but no run for requested model yields 404."""

    async with provenance_session_factory() as session:
        ds = Dataset(
            slug="pbmc3k",
            display_name="PBMC 3k",
            citation="c",
            license="CC",
            cell_count=100,
            gene_count=200,
        )
        session.add(ds)
        await session.commit()

    response = await provenance_client.get("/api/v1/provenance/pbmc3k/scgpt")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_provenance_datetime_iso8601(
    provenance_client: AsyncClient,
    provenance_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    """created_at serializes as ISO-8601 with offset."""

    fixed = datetime(2024, 3, 15, 8, 30, 0, tzinfo=UTC)
    async with provenance_session_factory() as session:
        ds = Dataset(
            slug="pbmc3k",
            display_name="PBMC 3k",
            citation="c",
            license="CC",
            cell_count=100,
            gene_count=200,
        )
        session.add(ds)
        await session.commit()
        await session.refresh(ds)
        assert ds.id is not None
        session.add(
            PrecomputeRun(
                dataset_id=ds.id,
                model_name="geneformer",
                model_version="v1",
                parameters={},
                output_parquet_key="k.parquet",
                git_sha="abcdef1234567890abcdef1234567890abcd",
                created_at=fixed,
            ),
        )
        await session.commit()

    response = await provenance_client.get("/api/v1/provenance/pbmc3k/geneformer")
    assert response.status_code == 200
    raw = response.json()["created_at"]
    normalized = raw.replace("Z", "+00:00")
    parsed_raw = datetime.fromisoformat(normalized)
    parsed = (
        parsed_raw.replace(tzinfo=UTC) if parsed_raw.tzinfo is None else parsed_raw.astimezone(UTC)
    )
    assert parsed == fixed
