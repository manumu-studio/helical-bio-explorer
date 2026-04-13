# Pytest fixtures: in-process AsyncClient over ASGITransport (no real network).
# pyarrow ships without py.typed; relax import-untyped for fixtures only.
# mypy: disable-error-code=import-untyped

import os
from collections.abc import AsyncIterator
from typing import cast

# Default URLs satisfy Settings validation before app import (real runs use Neon).
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://user:pass@localhost:5432/test",
)
os.environ.setdefault(
    "DIRECT_URL",
    "postgresql://user:pass@localhost:5432/test",
)

from app.core.config import get_settings

get_settings.cache_clear()

import io

import pyarrow as pa
import pyarrow.parquet as pq
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app


def _write_parquet_bytes(columns: dict[str, list[object]]) -> bytes:
    buffer = io.BytesIO()
    table = pa.table(columns)
    pq.write_table(table, buffer)
    return buffer.getvalue()


@pytest.fixture
def healthy_embedding_parquet() -> bytes:
    """Small healthy reference embedding table (~10 rows) for API tests."""

    cell_types = cast(
        list[object],
        ["CD4 T cells"] * 2
        + ["CD8 T cells"] * 2
        + ["B cells"] * 2
        + ["NK cells"] * 2
        + ["CD14 Monocytes"] * 2,
    )
    return _write_parquet_bytes(
        {
            "cell_id": [f"cell-{i}" for i in range(10)],
            "cell_type": cell_types,
            "umap_1": [float(i) for i in range(10)],
            "umap_2": [float(i * 2) for i in range(10)],
        }
    )


@pytest.fixture
def disease_projection_parquet() -> bytes:
    """Disease projection table (~20 rows) with activity and distance columns."""

    cell_types = cast(
        list[object],
        ["CD4 T cells"] * 4
        + ["CD8 T cells"] * 4
        + ["B cells"] * 4
        + ["NK cells"] * 4
        + ["CD14 Monocytes"] * 4,
    )
    activities = cast(list[object], ["low"] * 10 + ["high"] * 10)
    return _write_parquet_bytes(
        {
            "cell_id": [f"proj-{i}" for i in range(20)],
            "cell_type": cell_types,
            "disease_activity": activities,
            "umap_1": [float(i) for i in range(20)],
            "umap_2": [float(i * 3) for i in range(20)],
            "distance_to_healthy": [0.1 * float(i) for i in range(20)],
        }
    )


@pytest.fixture
def distance_scores_parquet() -> bytes:
    """Distance scores for both models (~20 rows)."""

    cell_types = cast(
        list[object],
        ["CD4 T cells"] * 4
        + ["CD8 T cells"] * 4
        + ["B cells"] * 4
        + ["NK cells"] * 4
        + ["CD14 Monocytes"] * 4,
    )
    activities = cast(list[object], ["low"] * 10 + ["high"] * 10)
    return _write_parquet_bytes(
        {
            "cell_id": [f"score-{i}" for i in range(20)],
            "cell_type": cell_types,
            "disease_activity": activities,
            "distance_geneformer": [0.2 * float(i) for i in range(20)],
            "distance_genept": [0.3 * float(i) for i in range(20)],
        }
    )


@pytest.fixture
def disagreement_parquet() -> bytes:
    """Cross-model disagreement table (~20 rows)."""

    cell_types = cast(
        list[object],
        ["CD4 T cells"] * 4
        + ["CD8 T cells"] * 4
        + ["B cells"] * 4
        + ["NK cells"] * 4
        + ["CD14 Monocytes"] * 4,
    )
    activities = cast(list[object], ["low"] * 10 + ["high"] * 10)
    return _write_parquet_bytes(
        {
            "cell_id": [f"score-{i}" for i in range(20)],
            "cell_type": cell_types,
            "disease_activity": activities,
            "distance_geneformer": [0.2 * float(i) for i in range(20)],
            "distance_genept": [0.3 * float(i) for i in range(20)],
            "disagreement": [abs(0.1 * float(i - 5)) for i in range(20)],
        }
    )


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    """HTTP client that talks to the application in-process."""

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
