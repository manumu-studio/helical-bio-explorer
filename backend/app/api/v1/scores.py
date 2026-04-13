# GET /scores — per-cell distance scores for Geneformer and GenePT from parquet.

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.v1.schemas import CellScore, ScoresResponse
from app.db.session import get_session
from app.dependencies import get_parquet_store
from app.services import parquet_reader
from app.services.parquet_store import ParquetStore
from app.services.version_resolver import resolve_latest_version

router = APIRouter(tags=["scores"])


@router.get("/scores/{dataset_slug}", response_model=ScoresResponse)
async def get_scores(
    dataset_slug: str,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_session)],
    store: Annotated[ParquetStore, Depends(get_parquet_store)],
    cell_type: str | None = None,
    disease_activity: str | None = None,
    sample_size: int = 5000,
    seed: int = 42,
) -> ScoresResponse:
    """Return sampled distance-to-healthy scores for both models."""

    artifact_type = "distance_scores"
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
        "distance_geneformer",
        "distance_genept",
    ]
    rows = parquet_reader.table_to_dicts(sampled_table, columns)
    cells = [CellScore.model_validate(row) for row in rows]

    response.headers["X-Served-From"] = source
    return ScoresResponse(
        dataset=dataset_slug,
        total_cells=total_cells,
        sampled=sampled_table.num_rows,
        source=source,
        cells=cells,
    )
