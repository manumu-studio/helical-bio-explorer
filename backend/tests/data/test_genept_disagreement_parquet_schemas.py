# Schema-regression tests for GenePT disagreement + rewritten distance_scores parquets.
# Tests skip when local fallbacks are absent so CI stays green before the real Colab run
# lands in PR-0.10.1. Once that PR copies real parquets into backend/data/parquet/,
# these tests run automatically.

from __future__ import annotations

from pathlib import Path
from typing import Any, cast

import numpy as np
import pyarrow.parquet as pq
import pytest

from app.api.v1.schemas import CellScore, DisagreementCell

_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "parquet" / "covid_wilk"

_DISAGREEMENT_PATH = _DATA_DIR / "cross_model_disagreement.parquet"
_SCORES_PATH = _DATA_DIR / "distance_scores.parquet"


def _sample_rows(path: Path, n: int = 100) -> list[dict[str, Any]]:
    table = pq.read_table(path)
    df = table.to_pandas()
    return cast(list[dict[str, Any]], df.head(n).to_dict(orient="records"))


@pytest.mark.skipif(
    not _DISAGREEMENT_PATH.is_file(),
    reason="cross_model_disagreement.parquet not yet materialized (pending Colab GenePT run)",
)
def test_disagreement_parquet_conforms() -> None:
    rows = _sample_rows(_DISAGREEMENT_PATH)
    for row in rows:
        dgf = float(cast(np.floating[Any] | float | int, row["distance_geneformer"]))
        dgp = float(cast(np.floating[Any] | float | int, row["distance_genept"]))
        disc = float(cast(np.floating[Any] | float | int, row["disagreement"]))
        assert 0.0 <= disc <= 1.0
        DisagreementCell.model_validate(
            {
                "cell_id": str(row["cell_id"]),
                "cell_type": str(row["cell_type"]),
                "disease_activity": str(row["disease_activity"]),
                "distance_geneformer": dgf,
                "distance_genept": dgp,
                "disagreement": disc,
            }
        )


@pytest.mark.skipif(
    not _SCORES_PATH.is_file(),
    reason="distance_scores.parquet missing",
)
def test_scores_parquet_regression_after_rewrite() -> None:
    df = pq.read_table(_SCORES_PATH).to_pandas()
    expected_cols = [
        "cell_id",
        "cell_type",
        "disease_activity",
        "distance_geneformer",
        "distance_genept",
    ]
    assert list(df.columns) == expected_cols

    # Once the Colab run rewrites distance_scores.parquet with real GenePT distances,
    # this assertion flips from "all NaN" to "no NaN" automatically.
    genept_all_nan = df["distance_genept"].isna().all()
    genept_no_nan = not df["distance_genept"].isna().any()
    assert genept_all_nan or genept_no_nan, (
        "distance_genept must be either all-NaN (pre-GenePT-run placeholder) "
        "or fully populated (post-run). Partial fills indicate a broken rewrite."
    )

    for row in df.head(100).to_dict(orient="records"):
        CellScore.model_validate(
            {
                "cell_id": str(row["cell_id"]),
                "cell_type": str(row["cell_type"]),
                "disease_activity": str(row["disease_activity"]),
                "distance_geneformer": float(row["distance_geneformer"]),
                "distance_genept": float(row["distance_genept"]),
            }
        )


@pytest.mark.skipif(
    not (_DISAGREEMENT_PATH.is_file() and _SCORES_PATH.is_file()),
    reason="GenePT disagreement parquet not yet materialized",
)
def test_disagreement_cell_ids_subset_of_scores() -> None:
    disc = pq.read_table(_DISAGREEMENT_PATH).to_pandas()
    scores = pq.read_table(_SCORES_PATH).to_pandas()
    d_ids = set(disc["cell_id"].astype(str))
    s_ids = set(scores["cell_id"].astype(str))
    assert d_ids <= s_ids
    assert len(d_ids) == len(disc)
