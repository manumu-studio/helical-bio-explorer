# GET /summary — aggregated distance and disagreement stats (full table, no sampling).

from __future__ import annotations

import asyncio
from collections import defaultdict
from pathlib import Path
from statistics import mean, pstdev
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.v1.schemas import CellTypeSummary, SummaryResponse
from app.db.session import get_session
from app.dependencies import get_parquet_store
from app.services import parquet_reader
from app.services.parquet_store import ParquetStore
from app.services.version_resolver import resolve_latest_version

router = APIRouter(tags=["summary"])


def _scalar_float(value: object) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    msg = f"Expected numeric scalar, got {type(value).__name__}"
    raise TypeError(msg)


def _mean_std(values: list[float]) -> tuple[float, float]:
    if not values:
        return 0.0, 0.0
    m = float(mean(values))
    if len(values) < 2:
        return m, 0.0
    return m, float(pstdev(values))


@router.get("/summary/{dataset_slug}", response_model=SummaryResponse)
async def get_summary(
    dataset_slug: str,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_session)],
    store: Annotated[ParquetStore, Depends(get_parquet_store)],
) -> SummaryResponse:
    """Return mean/std aggregates per cell type and disease activity (full data)."""

    version = await resolve_latest_version(dataset_slug, session)

    async def _read_or_404(artifact: str) -> tuple[bytes | Path, str]:
        key = f"v{version}/{dataset_slug}/{artifact}.parquet"
        try:
            data, src = await store.read(version, dataset_slug, artifact)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail=f"Artifact not found: {key}") from None
        return data, src

    (scores_bytes, source), (disagreement_bytes, _) = await asyncio.gather(
        _read_or_404("distance_scores"),
        _read_or_404("cross_model_disagreement"),
    )

    scores_table = parquet_reader.read_parquet_table(scores_bytes)
    disagreement_table = parquet_reader.read_parquet_table(disagreement_bytes)

    score_cols = [
        "cell_id",
        "cell_type",
        "disease_activity",
        "distance_geneformer",
        "distance_genept",
    ]
    disc_cols = ["cell_id", "disagreement"]
    score_rows = parquet_reader.table_to_dicts(scores_table, score_cols)
    disc_rows = parquet_reader.table_to_dicts(disagreement_table, disc_cols)
    disagreement_by_id = {
        str(row["cell_id"]): _scalar_float(row["disagreement"]) for row in disc_rows
    }

    buckets: dict[tuple[str, str], dict[str, list[float]]] = defaultdict(
        lambda: {
            "distance_geneformer": [],
            "distance_genept": [],
            "disagreement": [],
        }
    )

    for row in score_rows:
        cell_id = str(row["cell_id"])
        disagreement = disagreement_by_id.get(cell_id)
        if disagreement is None:
            continue
        cell_type = str(row["cell_type"])
        disease_activity = str(row.get("disease_activity", "") or "")
        key = (cell_type, disease_activity)
        buckets[key]["distance_geneformer"].append(_scalar_float(row["distance_geneformer"]))
        buckets[key]["distance_genept"].append(_scalar_float(row["distance_genept"]))
        buckets[key]["disagreement"].append(disagreement)

    groups: list[CellTypeSummary] = []
    for (cell_type, disease_activity), metrics in sorted(buckets.items()):
        mgf, sgf = _mean_std(metrics["distance_geneformer"])
        mgp, sgp = _mean_std(metrics["distance_genept"])
        md, sd = _mean_std(metrics["disagreement"])
        count = len(metrics["distance_geneformer"])
        groups.append(
            CellTypeSummary(
                cell_type=cell_type,
                disease_activity=disease_activity,
                count=count,
                mean_distance_geneformer=mgf,
                std_distance_geneformer=sgf,
                mean_distance_genept=mgp,
                std_distance_genept=sgp,
                mean_disagreement=md,
                std_disagreement=sd,
            )
        )

    response.headers["X-Served-From"] = source
    return SummaryResponse(dataset=dataset_slug, source=source, groups=groups)
