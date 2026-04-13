# GET /embeddings and /projections — UMAP coordinates from precomputed parquet artifacts.

from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.v1.schemas import CellPoint, EmbeddingResponse, ProjectedCell, ProjectionResponse
from app.db.session import get_session
from app.dependencies import get_parquet_store
from app.services import parquet_reader
from app.services.parquet_store import ParquetStore
from app.services.version_resolver import resolve_latest_version

ModelName = Literal["geneformer", "genept"]

router = APIRouter(tags=["embeddings"])


def _artifact_type(model_name: ModelName, kind: Literal["embeddings", "projected"]) -> str:
    return f"{model_name}_{kind}"


@router.get("/embeddings/{dataset_slug}/{model_name}", response_model=EmbeddingResponse)
async def get_embeddings(
    dataset_slug: str,
    model_name: ModelName,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_session)],
    store: Annotated[ParquetStore, Depends(get_parquet_store)],
    cell_type: str | None = None,
    disease_activity: str | None = None,
    sample_size: int = 5000,
    seed: int = 42,
) -> EmbeddingResponse:
    """Return sampled healthy reference UMAP coordinates for a foundation model."""

    artifact_type = _artifact_type(model_name, "embeddings")
    version = await resolve_latest_version(dataset_slug, session)
    s3_key = f"v{version}/{dataset_slug}/{artifact_type}.parquet"
    try:
        data, source = await store.read(version, dataset_slug, artifact_type)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Artifact not found: {s3_key}") from None

    table = parquet_reader.read_parquet_table(data)
    table = parquet_reader.filter_table(table, cell_type, disease_activity)
    sampled_table, total_cells = parquet_reader.sample_table(table, sample_size, seed)
    columns = ["cell_id", "cell_type", "umap_1", "umap_2"]
    rows = parquet_reader.table_to_dicts(sampled_table, columns)
    cells = [CellPoint.model_validate(row) for row in rows]

    response.headers["X-Served-From"] = source
    return EmbeddingResponse(
        dataset=dataset_slug,
        model=model_name,
        total_cells=total_cells,
        sampled=sampled_table.num_rows,
        source=source,
        cells=cells,
    )


@router.get("/projections/{dataset_slug}/{model_name}", response_model=ProjectionResponse)
async def get_projections(
    dataset_slug: str,
    model_name: ModelName,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_session)],
    store: Annotated[ParquetStore, Depends(get_parquet_store)],
    cell_type: str | None = None,
    disease_activity: str | None = None,
    sample_size: int = 5000,
    seed: int = 42,
) -> ProjectionResponse:
    """Return sampled disease projections into the reference manifold."""

    artifact_type = _artifact_type(model_name, "projected")
    version = await resolve_latest_version(dataset_slug, session)
    s3_key = f"v{version}/{dataset_slug}/{artifact_type}.parquet"
    try:
        data, source = await store.read(version, dataset_slug, artifact_type)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Artifact not found: {s3_key}") from None

    table = parquet_reader.read_parquet_table(data)
    table = parquet_reader.filter_table(table, cell_type, disease_activity)
    sampled_table, total_cells = parquet_reader.sample_table(table, sample_size, seed)
    columns = [
        "cell_id",
        "cell_type",
        "disease_activity",
        "umap_1",
        "umap_2",
        "distance_to_healthy",
    ]
    rows = parquet_reader.table_to_dicts(sampled_table, columns)
    cells = [ProjectedCell.model_validate(row) for row in rows]

    response.headers["X-Served-From"] = source
    return ProjectionResponse(
        dataset=dataset_slug,
        model=model_name,
        total_cells=total_cells,
        sampled=sampled_table.num_rows,
        source=source,
        cells=cells,
    )
