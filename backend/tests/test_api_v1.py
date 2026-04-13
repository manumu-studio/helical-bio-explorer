# Integration tests for /api/v1 parquet routes (mocked store + version resolver).

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Literal

import pytest
import pytest_asyncio
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from app.dependencies import get_parquet_store
from app.main import app

_V1_MODULES = (
    "app.api.v1.embeddings",
    "app.api.v1.scores",
    "app.api.v1.disagreement",
    "app.api.v1.summary",
)


class _StubParquetStore:
    """Returns fixture parquet bytes per artifact type (local source)."""

    def __init__(
        self,
        *,
        healthy_embedding_parquet: bytes,
        disease_projection_parquet: bytes,
        distance_scores_parquet: bytes,
        disagreement_parquet: bytes,
    ) -> None:
        self._mapping: dict[str, bytes] = {
            "geneformer_embeddings": healthy_embedding_parquet,
            "genept_embeddings": healthy_embedding_parquet,
            "geneformer_projected": disease_projection_parquet,
            "genept_projected": disease_projection_parquet,
            "distance_scores": distance_scores_parquet,
            "cross_model_disagreement": disagreement_parquet,
        }

    async def read(
        self,
        version: str,
        dataset_slug: str,
        artifact_type: str,
    ) -> tuple[bytes, Literal["s3", "local"]]:
        _ = version, dataset_slug
        payload = self._mapping.get(artifact_type)
        if payload is None:
            msg = f"unknown artifact {artifact_type}"
            raise FileNotFoundError(msg)
        return payload, "local"


def _patch_resolve_ok(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _resolve(_dataset_slug: str, _db: object) -> str:
        return "0.1.0"

    for mod in _V1_MODULES:
        monkeypatch.setattr(f"{mod}.resolve_latest_version", _resolve)


@pytest_asyncio.fixture
async def api_v1_client(
    monkeypatch: pytest.MonkeyPatch,
    healthy_embedding_parquet: bytes,
    disease_projection_parquet: bytes,
    distance_scores_parquet: bytes,
    disagreement_parquet: bytes,
) -> AsyncIterator[AsyncClient]:
    """AsyncClient with mocked ParquetStore and successful version resolution."""

    _patch_resolve_ok(monkeypatch)
    store = _StubParquetStore(
        healthy_embedding_parquet=healthy_embedding_parquet,
        disease_projection_parquet=disease_projection_parquet,
        distance_scores_parquet=distance_scores_parquet,
        disagreement_parquet=disagreement_parquet,
    )
    app.dependency_overrides[get_parquet_store] = lambda: store
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client
    app.dependency_overrides.pop(get_parquet_store, None)


@pytest.mark.asyncio
async def test_embeddings_ok(api_v1_client: AsyncClient) -> None:
    response = await api_v1_client.get("/api/v1/embeddings/pbmc3k/geneformer")
    assert response.status_code == 200
    payload = response.json()
    assert payload["dataset"] == "pbmc3k"
    assert payload["model"] == "geneformer"
    assert payload["total_cells"] == 10
    assert payload["sampled"] == 10
    assert payload["source"] == "local"
    assert len(payload["cells"]) == 10
    assert "umap_1" in payload["cells"][0]
    assert response.headers.get("X-Served-From") == "local"


@pytest.mark.asyncio
async def test_embeddings_sample_size(api_v1_client: AsyncClient) -> None:
    response = await api_v1_client.get(
        "/api/v1/embeddings/pbmc3k/geneformer",
        params={"sample_size": 3, "seed": 1},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["total_cells"] == 10
    assert payload["sampled"] == 3
    assert len(payload["cells"]) == 3


@pytest.mark.asyncio
async def test_embeddings_cell_type_filter(api_v1_client: AsyncClient) -> None:
    response = await api_v1_client.get(
        "/api/v1/embeddings/pbmc3k/geneformer",
        params={"cell_type": "CD4 T cells"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["total_cells"] == 2
    assert all(c["cell_type"] == "CD4 T cells" for c in payload["cells"])


@pytest.mark.asyncio
async def test_projections_genept_shape(api_v1_client: AsyncClient) -> None:
    response = await api_v1_client.get("/api/v1/projections/sle_csle/genept")
    assert response.status_code == 200
    payload = response.json()
    assert payload["model"] == "genept"
    cell = payload["cells"][0]
    assert "disease_activity" in cell
    assert "distance_to_healthy" in cell
    assert response.headers.get("X-Served-From") == "local"


@pytest.mark.asyncio
async def test_scores_shape(api_v1_client: AsyncClient) -> None:
    response = await api_v1_client.get("/api/v1/scores/sle_csle")
    assert response.status_code == 200
    payload = response.json()
    cell = payload["cells"][0]
    assert "distance_geneformer" in cell
    assert "distance_genept" in cell
    assert response.headers.get("X-Served-From") == "local"


@pytest.mark.asyncio
async def test_disagreement_shape(api_v1_client: AsyncClient) -> None:
    response = await api_v1_client.get("/api/v1/disagreement/sle_csle")
    assert response.status_code == 200
    payload = response.json()
    cell = payload["cells"][0]
    assert "disagreement" in cell
    assert response.headers.get("X-Served-From") == "local"


@pytest.mark.asyncio
async def test_summary_groups(api_v1_client: AsyncClient) -> None:
    response = await api_v1_client.get("/api/v1/summary/sle_csle")
    assert response.status_code == 200
    payload = response.json()
    assert payload["dataset"] == "sle_csle"
    assert payload["groups"]
    assert response.headers.get("X-Served-From") == "local"
    group = payload["groups"][0]
    for key in (
        "count",
        "mean_distance_geneformer",
        "std_distance_geneformer",
        "mean_distance_genept",
        "std_distance_genept",
        "mean_disagreement",
        "std_disagreement",
    ):
        assert key in group


@pytest.mark.asyncio
async def test_scores_disease_activity_filter(api_v1_client: AsyncClient) -> None:
    response = await api_v1_client.get(
        "/api/v1/scores/sle_csle",
        params={"disease_activity": "high"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["total_cells"] == 10
    assert all(c["disease_activity"] == "high" for c in payload["cells"])


@pytest.mark.asyncio
async def test_embeddings_sample_size_zero_returns_all(api_v1_client: AsyncClient) -> None:
    response = await api_v1_client.get(
        "/api/v1/embeddings/pbmc3k/geneformer",
        params={"sample_size": 0},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["total_cells"] == 10
    assert payload["sampled"] == 10
    assert len(payload["cells"]) == 10


@pytest.mark.asyncio
async def test_unknown_dataset_404(
    monkeypatch: pytest.MonkeyPatch,
    healthy_embedding_parquet: bytes,
    disease_projection_parquet: bytes,
    distance_scores_parquet: bytes,
    disagreement_parquet: bytes,
) -> None:
    async def _boom(_slug: str, _db: object) -> str:
        raise HTTPException(status_code=404, detail="Dataset not found")

    for mod in _V1_MODULES:
        monkeypatch.setattr(f"{mod}.resolve_latest_version", _boom)

    store = _StubParquetStore(
        healthy_embedding_parquet=healthy_embedding_parquet,
        disease_projection_parquet=disease_projection_parquet,
        distance_scores_parquet=distance_scores_parquet,
        disagreement_parquet=disagreement_parquet,
    )
    app.dependency_overrides[get_parquet_store] = lambda: store
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/v1/embeddings/missing/geneformer")
        assert response.status_code == 404
        assert response.json()["detail"] == "Dataset not found"
    finally:
        app.dependency_overrides.pop(get_parquet_store, None)


@pytest.mark.asyncio
async def test_invalid_model_name_422(api_v1_client: AsyncClient) -> None:
    response = await api_v1_client.get("/api/v1/embeddings/pbmc3k/not-a-model")
    assert response.status_code == 422
