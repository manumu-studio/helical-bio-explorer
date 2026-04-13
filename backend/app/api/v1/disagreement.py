# GET /disagreement — cross-model disagreement per cell from parquet.

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.v1.schemas import DisagreementCell, DisagreementResponse
from app.db.session import get_session
from app.dependencies import get_parquet_store
from app.services import parquet_reader
from app.services.parquet_store import ParquetStore
from app.services.version_resolver import resolve_latest_version

router = APIRouter(tags=["disagreement"])


@router.get("/disagreement/{dataset_slug}", response_model=DisagreementResponse)
async def get_disagreement(
    dataset_slug: str,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_session)],
    store: Annotated[ParquetStore, Depends(get_parquet_store)],
    cell_type: str | None = None,
    disease_activity: str | None = None,
    sample_size: int = 5000,
    seed: int = 42,
) -> DisagreementResponse:
    """Return sampled disagreement scores with per-model distances."""

    artifact_type = "cross_model_disagreement"
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
        "disagreement",
    ]
    rows = parquet_reader.table_to_dicts(sampled_table, columns)
    cells = [DisagreementCell.model_validate(row) for row in rows]

    response.headers["X-Served-From"] = source
    return DisagreementResponse(
        dataset=dataset_slug,
        total_cells=total_cells,
        sampled=sampled_table.num_rows,
        source=source,
        cells=cells,
    )
