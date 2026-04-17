# GET /provenance/{dataset_slug}/{model_name} — latest precompute run row from the registry.

from __future__ import annotations

from typing import Annotated, cast

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.sql.elements import ColumnElement
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.models import Dataset, PrecomputeRun
from app.db.session import get_session
from app.schemas.provenance import ProvenanceResponse

router = APIRouter(tags=["provenance"])


@router.get("/provenance/{dataset_slug}/{model_name}", response_model=ProvenanceResponse)
async def get_provenance(
    dataset_slug: str,
    model_name: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ProvenanceResponse:
    """Return the most recent precompute run for the given dataset slug and model name."""

    ds_result = await session.exec(select(Dataset).where(Dataset.slug == dataset_slug))
    dataset = ds_result.first()
    if dataset is None or dataset.id is None:
        raise HTTPException(
            status_code=404,
            detail=f"No precompute run found for {dataset_slug}/{model_name}",
        )

    stmt = (
        select(PrecomputeRun)
        .where(PrecomputeRun.dataset_id == dataset.id)
        .where(PrecomputeRun.model_name == model_name)
        .order_by(desc(cast(ColumnElement[object], PrecomputeRun.created_at)))
        .limit(1)
    )
    result = await session.exec(stmt)
    run = result.first()
    if run is None:
        raise HTTPException(
            status_code=404,
            detail=f"No precompute run found for {dataset_slug}/{model_name}",
        )
    return ProvenanceResponse(
        dataset_slug=dataset_slug,
        model_name=run.model_name,
        model_version=run.model_version,
        git_sha=run.git_sha,
        created_at=run.created_at,
        output_parquet_key=run.output_parquet_key,
    )
