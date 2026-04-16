# Assert COVID Wilk local-fallback parquets validate as API row models (PACKET-02c / TASK-167).

from __future__ import annotations

from pathlib import Path
from typing import Any, cast

import numpy as np
import pyarrow.parquet as pq
import pytest

from app.api.v1.schemas import CellPoint, CellScore, ProjectedCell

_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "parquet" / "covid_wilk"


def _sample_rows(path: Path, n: int = 100) -> list[dict[str, Any]]:
    table = pq.read_table(path)
    df = table.to_pandas()
    return cast(list[dict[str, Any]], df.head(n).to_dict(orient="records"))


@pytest.mark.parametrize(
    "file_name",
    [
        "geneformer_embeddings.parquet",
        "geneformer_projected.parquet",
        "distance_scores.parquet",
    ],
)
def test_covid_parquet_files_exist(file_name: str) -> None:
    p = _DATA_DIR / file_name
    assert p.is_file(), f"missing {p}"


# GenePT-side files land in PR-0.10.1 after the Colab run; this is a soft check that
# skips cleanly until then so the pre-GenePT build stays green.
@pytest.mark.parametrize(
    "file_name",
    [
        "genept_embeddings.parquet",
        "genept_projected.parquet",
        "cross_model_disagreement.parquet",
    ],
)
def test_covid_genept_files_present_when_available(file_name: str) -> None:
    p = _DATA_DIR / file_name
    if not p.is_file():
        pytest.skip(f"{file_name} pending Colab GenePT run")
    assert p.stat().st_size > 0


def test_embeddings_rows_match_cell_point() -> None:
    rows = _sample_rows(_DATA_DIR / "geneformer_embeddings.parquet")
    for row in rows:
        CellPoint.model_validate(
            {
                "cell_id": str(row["cell_id"]),
                "cell_type": str(row["cell_type"]),
                "umap_1": float(cast(np.floating[Any] | float | int, row["umap_1"])),
                "umap_2": float(cast(np.floating[Any] | float | int, row["umap_2"])),
            }
        )


def test_projected_rows_match_projected_cell() -> None:
    rows = _sample_rows(_DATA_DIR / "geneformer_projected.parquet")
    for row in rows:
        ProjectedCell.model_validate(
            {
                "cell_id": str(row["cell_id"]),
                "cell_type": str(row["cell_type"]),
                "umap_1": float(cast(np.floating[Any] | float | int, row["umap_1"])),
                "umap_2": float(cast(np.floating[Any] | float | int, row["umap_2"])),
                "disease_activity": str(row["disease_activity"]),
                "distance_to_healthy": float(
                    cast(np.floating[Any] | float | int, row["distance_to_healthy"])
                ),
            }
        )


def test_scores_rows_validate_regardless_of_genept_fill() -> None:
    """CellScore validates whether `distance_genept` is NaN (pre-GenePT run) or filled (post)."""

    path = _DATA_DIR / "distance_scores.parquet"
    df = pq.read_table(path).to_pandas()

    for row in df.head(100).to_dict(orient="records"):
        CellScore.model_validate(
            {
                "cell_id": row["cell_id"],
                "cell_type": row["cell_type"],
                "disease_activity": row["disease_activity"],
                "distance_geneformer": float(row["distance_geneformer"]),
                "distance_genept": float(row["distance_genept"]),
            }
        )


def test_scores_nan_explicit() -> None:
    """Explicit NaN path for Pydantic (GenePT pending)."""

    CellScore.model_validate(
        {
            "cell_id": "x",
            "cell_type": "CD4 T cells",
            "disease_activity": "mild",
            "distance_geneformer": 0.5,
            "distance_genept": float("nan"),
        }
    )
    assert np.isnan(
        CellScore(
            cell_id="x",
            cell_type="CD4 T cells",
            disease_activity="mild",
            distance_geneformer=0.5,
            distance_genept=float("nan"),
        ).distance_genept
    )
