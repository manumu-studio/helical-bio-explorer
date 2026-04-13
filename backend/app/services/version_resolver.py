# Resolves latest precompute artifact version from precompute_runs.output_parquet_key (ADR-003).

from __future__ import annotations

from typing import cast

from fastapi import HTTPException
from sqlalchemy import desc
from sqlalchemy.sql.elements import ColumnElement
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.models import Dataset, PrecomputeRun


def _version_from_output_key(output_parquet_key: str) -> str:
    """Extract semver folder from keys like ``v0.1.0/dataset/artifact.parquet``."""

    first_segment = output_parquet_key.split("/", maxsplit=1)[0]
    if not first_segment.startswith("v"):
        msg = f"Invalid precompute output key (missing v-prefix): {output_parquet_key!r}"
        raise HTTPException(status_code=500, detail=msg)
    return first_segment.removeprefix("v")


async def resolve_latest_version(dataset_slug: str, db: AsyncSession) -> str:
    """Return latest precompute version string for ``dataset_slug`` or raise 404."""

    dataset_result = await db.exec(select(Dataset).where(Dataset.slug == dataset_slug))
    dataset = dataset_result.first()
    if dataset is None or dataset.id is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    run_result = await db.exec(
        select(PrecomputeRun)
        .where(PrecomputeRun.dataset_id == dataset.id)
        .order_by(desc(cast(ColumnElement[object], PrecomputeRun.created_at)))
        .limit(1)
    )
    run = run_result.first()
    if run is None:
        raise HTTPException(status_code=404, detail="No precompute run found")

    return _version_from_output_key(run.output_parquet_key)
