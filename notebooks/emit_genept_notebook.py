# Emit `precompute_genept_disagreement.ipynb` (stdlib only). Run once from repo root: python notebooks/emit_genept_notebook.py

from __future__ import annotations

import json
from pathlib import Path


def _cell_md(lines: str) -> dict[str, object]:
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in lines.strip("\n").split("\n")],
    }


def _cell_code(lines: str) -> dict[str, object]:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in lines.strip("\n").split("\n")],
    }


def main() -> None:
    cells: list[dict[str, object]] = []

    cells.append(
        _cell_md(
            """# GenePT + cross-model disagreement — PBMC 3k + Wilk COVID

**Author:** Manu Murillo · **Purpose:** Run GenePT (Helical SDK) on the same PBMC3k reference and Wilk 2020 COVID subsample as PACKET-02c (Geneformer), compute GenePT-native distances, then **percentile-rank disagreement** vs Geneformer.

**Expected runtime:** ~45 min on Colab **T4 GPU** (GenePT inference dominates).

**Helical SDK:** pin via `requirements-colab.txt` (same numpy 1.26.x / scipy 1.13.x strategy as COVID projection notebook).

**Artifacts:** uploads `genept_embeddings.parquet`, `genept_projected.parquet`, `cross_model_disagreement.parquet`, and rewrites `distance_scores.parquet` in place (`distance_genept` column). FastAPI reads `cross_model_disagreement.parquet` (not `disagreement.parquet`)."""
        )
    )

    cells.append(
        _cell_code(
            """# Cell 1 — deps (FRESH runtime + Restart session after pip — see PACKET-02c notebook)
!pip install --quiet \\
  "numpy==1.26.4" "scipy==1.13.1" "pandas==2.2.2" "torch==2.6.0" \\
  "helical>=0.0.1a14,<1.0" \\
  "cellxgene-census>=1.14,<1.17" \\
  "scanpy>=1.10,<1.11" "pyarrow>=15,<17" "boto3>=1.34,<2.0" \\
  "sqlmodel>=0.0.22,<0.1" "asyncpg>=0.29,<0.30" \\
  "umap-learn>=0.5,<0.6" "nest-asyncio>=1.6,<2.0" \\
  "httpx>=0.27,<0.29"
!pip uninstall -y cupy cupy-cuda11x cupy-cuda12x 2>/dev/null || true
print("pip done — Runtime → Restart session, then run the next cell.")"""
        )
    )

    cells.append(
        _cell_code(
            """# Cell 2 — config + seeds + git SHA
import os
import random
import subprocess
from pathlib import Path

import numpy as np

np.random.seed(42)
random.seed(42)

DATABASE_URL = os.environ.get("DATABASE_URL", "")
S3_BUCKET = os.environ.get("S3_BUCKET", "")
S3_REGION = os.environ.get("S3_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

VERSION = "v1"
SEED = 42
CENSUS_VERSION = "2025-11-08"
GIT_SHA = (
    subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=Path.cwd(), text=True).strip()
    if Path(".git").exists()
    else "colab-unknown"
)
print("GIT_SHA", GIT_SHA)"""
        )
    )

    cells.append(_cell_md("## Step 1: Load PBMC 3k + Wilk COVID subsample"))

    cells.append(
        _cell_code(
            """# Cell 4 — PBMC3k + Census Wilk, filtered to canonical cell_ids from distance_scores.parquet
import numpy as np
import pandas as pd
import scanpy as sc
import cellxgene_census as cgc
import pyarrow.parquet as pq
from pathlib import Path

# Resolve scores table: S3 in Colab, or clone-relative local fallback for dev
scores_candidates = [
    Path(f"/content/helical-bio-explorer/backend/data/parquet/covid_wilk/distance_scores.parquet"),
    Path("backend/data/parquet/covid_wilk/distance_scores.parquet"),
]
scores_path = next((p for p in scores_candidates if p.is_file()), None)
if scores_path is None and S3_BUCKET:
    scores_path = Path("/tmp/distance_scores.parquet")
    import boto3

    boto3.client("s3").download_file(
        S3_BUCKET, f"{VERSION}/covid_wilk/distance_scores.parquet", str(scores_path)
    )
elif scores_path is None:
    raise FileNotFoundError("Set S3_BUCKET or run from repo with backend/data parquets.")

scores_df = pq.read_table(scores_path).to_pandas()
cell_ids = set(scores_df["cell_id"].astype(str))
print("scores rows", len(scores_df), "unique cell_ids", len(cell_ids))

adata_pbmc = sc.datasets.pbmc3k_processed()
# pbmc3k_processed ships cell-type labels under `louvain`; downstream code expects `cell_type`.
if "cell_type" not in adata_pbmc.obs.columns:
    if "louvain" in adata_pbmc.obs.columns:
        adata_pbmc.obs["cell_type"] = adata_pbmc.obs["louvain"].astype(str)
    else:
        raise KeyError("pbmc3k AnnData has neither `cell_type` nor `louvain` obs columns")
print("PBMC", adata_pbmc.shape)

with cgc.open_soma(census_version=CENSUS_VERSION) as census:
    datasets = census["census_info"]["datasets"].read().concat().to_pandas()
mask = datasets["dataset_title"].str.contains("Wilk", case=False, na=False) & datasets[
    "collection_name"
].str.contains("COVID", case=False, na=False)
hit = datasets.loc[mask].iloc[0]
WILK_DATASET_ID = hit["dataset_id"]
WILK_FILTER = f"dataset_id == '{WILK_DATASET_ID}'"
with cgc.open_soma(census_version=CENSUS_VERSION) as census:
    adata_covid = cgc.get_anndata(
        census,
        organism="Homo sapiens",
        obs_value_filter=WILK_FILTER,
        X_name="raw",
    )

adata_covid = adata_covid[adata_covid.obs.index.astype(str).isin(cell_ids)].copy()
assert adata_covid.shape[0] == len(scores_df), (adata_covid.shape[0], len(scores_df))
print("COVID subsample", adata_covid.shape)"""
        )
    )

    cells.append(_cell_md("## Step 2: GenePT on PBMC 3k (healthy reference)"))

    cells.append(
        _cell_code(
            """# Cell 6 — GenePT embed PBMC (read embedding dim D from SDK — do not hardcode)
from helical.models.genept import GenePT, GenePTConfig

config = GenePTConfig()
model = GenePT(configurer=config)
dataset_pbmc = model.process_data(adata_pbmc)
emb_pbmc = model.get_embeddings(dataset_pbmc)
adata_pbmc.obsm["X_genept"] = emb_pbmc
D = int(emb_pbmc.shape[1])
print("PBMC GenePT", emb_pbmc.shape, "D=", D)"""
        )
    )

    cells.append(
        _cell_code(
            """# Cell 7 — UMAP on GenePT PB + centroids in full embedding space
import pandas as pd
import umap  # umap-learn

reducer = umap.UMAP(
    n_components=2, metric="cosine", random_state=42, n_neighbors=15, min_dist=0.1
)
umap_xy = reducer.fit_transform(adata_pbmc.obsm["X_genept"])
adata_pbmc.obsm["X_umap_genept"] = umap_xy

centroids_genept = (
    pd.DataFrame(adata_pbmc.obsm["X_genept"])
    .assign(cell_type=adata_pbmc.obs["cell_type"].values)
    .groupby("cell_type", observed=True)
    .mean()
)
print("centroids", centroids_genept.shape)"""
        )
    )

    cells.append(
        _cell_code(
            """# Cell 8 — export PBMC GenePT embeddings parquet + S3
import boto3
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from io import BytesIO

rows = []
X = adata_pbmc.obsm["X_genept"]
U = adata_pbmc.obsm["X_umap_genept"]
for i, cid in enumerate(adata_pbmc.obs.index.astype(str)):
    row = {
        "cell_id": cid,
        "cell_type": str(adata_pbmc.obs["cell_type"].iloc[i]),
        "umap_1": float(U[i, 0]),
        "umap_2": float(U[i, 1]),
    }
    for j in range(D):
        row[f"embedding_{j}"] = float(X[i, j])
    rows.append(row)
df_pbmc = pd.DataFrame(rows)
buf = BytesIO()
pq.write_table(pa.Table.from_pandas(df_pbmc, preserve_index=False), buf, compression="snappy")
buf.seek(0)
key = f"{VERSION}/pbmc3k/genept_embeddings.parquet"
if S3_BUCKET:
    boto3.client("s3").upload_fileobj(buf, S3_BUCKET, key)
print("uploaded", key, "rows", len(df_pbmc))"""
        )
    )

    cells.append(_cell_md("## Step 3: GenePT on Wilk COVID subsample"))

    cells.append(
        _cell_code(
            """# Cell 10 — GenePT embed COVID (reuse model)
dataset_cov = model.process_data(adata_covid)
emb_cov = model.get_embeddings(dataset_cov)
adata_covid.obsm["X_genept"] = emb_cov
assert emb_cov.shape[1] == D
print("COVID GenePT", emb_cov.shape)"""
        )
    )

    cells.append(_cell_md("## Step 4: Project COVID into PBMC GenePT UMAP + distances"))

    cells.append(
        _cell_code(
            """# Cell 12 — transform UMAP + distance_to_healthy (full embedding space)
from scipy.spatial.distance import cdist

adata_covid.obsm["X_umap_genept"] = reducer.transform(adata_covid.obsm["X_genept"])
dists = cdist(adata_covid.obsm["X_genept"], centroids_genept.values, metric="euclidean")
adata_covid.obs["distance_to_healthy"] = dists.min(axis=1)
print(adata_covid.obs["distance_to_healthy"].describe())"""
        )
    )

    cells.append(
        _cell_code(
            """# Cell 13 — export COVID genept_embeddings + genept_projected
import boto3
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from io import BytesIO

def _emb_df(adata, include_activity: bool):
    rows = []
    X = adata.obsm["X_genept"]
    U = adata.obsm["X_umap_genept"]
    for i, cid in enumerate(adata.obs.index.astype(str)):
        row = {
            "cell_id": cid,
            "cell_type": str(adata.obs["cell_type"].iloc[i]),
            "umap_1": float(U[i, 0]),
            "umap_2": float(U[i, 1]),
        }
        if include_activity:
            row["disease_activity"] = str(adata.obs["disease_activity"].iloc[i])
            row["distance_to_healthy"] = float(adata.obs["distance_to_healthy"].iloc[i])
        for j in range(D):
            row[f"embedding_{j}"] = float(X[i, j])
        rows.append(row)
    return pd.DataFrame(rows)

# Map disease_activity from scores (authoritative)
sa = scores_df.set_index("cell_id")
adata_covid.obs["disease_activity"] = adata_covid.obs.index.map(
    lambda x: str(sa.loc[str(x), "disease_activity"])
)

df_ce = _emb_df(adata_covid, include_activity=False)
df_cp = _emb_df(adata_covid, include_activity=True)

for df, name in [
    (df_ce, f"{VERSION}/covid_wilk/genept_embeddings.parquet"),
    (df_cp, f"{VERSION}/covid_wilk/genept_projected.parquet"),
]:
    b = BytesIO()
    pq.write_table(pa.Table.from_pandas(df, preserve_index=False), b, compression="snappy")
    b.seek(0)
    if S3_BUCKET:
        boto3.client("s3").upload_fileobj(b, S3_BUCKET, name)
    print("uploaded", name)"""
        )
    )

    cells.append(_cell_md("## Step 5: Cross-model disagreement"))

    cells.append(
        _cell_code(
            """# Cell 16a — join GenePT distances onto scores (distance_scores.parquet)
import pandas as pd

dist_cov = pd.DataFrame(
    {
        "cell_id": adata_covid.obs.index.astype(str),
        "distance_genept_raw": adata_covid.obs["distance_to_healthy"].astype(float),
    }
)
base = scores_df[
    ["cell_id", "cell_type", "disease_activity", "distance_geneformer"]
].copy()
base["cell_id"] = base["cell_id"].astype(str)
merged = base.merge(dist_cov, on="cell_id", how="inner", validate="one_to_one")
merged = merged.rename(columns={"distance_genept_raw": "distance_genept"})
assert len(merged) == len(scores_df)
print(merged.head())"""
        )
    )

    cells.append(
        _cell_code(
            """# Cell 16b — percentile ranks [0,1]
from scipy.stats import rankdata

n = len(merged)
merged["percentile_gf"] = rankdata(merged["distance_geneformer"].values, method="average") / n
merged["percentile_gp"] = rankdata(merged["distance_genept"].values, method="average") / n
print(merged[["percentile_gf", "percentile_gp"]].describe())"""
        )
    )

    cells.append(
        _cell_code(
            """# Cell 16c — disagreement + trim columns for parquet
merged["disagreement"] = (merged["percentile_gf"] - merged["percentile_gp"]).abs()
disc_df = merged[
    ["cell_id", "cell_type", "disease_activity", "distance_geneformer", "distance_genept", "disagreement"]
].copy()
assert disc_df["disagreement"].notna().all()
print(disc_df["disagreement"].describe())"""
        )
    )

    cells.append(
        _cell_code(
            """# Cell 17 — idempotent rewrite of distance_scores.parquet (sorted cell_id)
import boto3
import pyarrow as pa
import pyarrow.parquet as pq
from io import BytesIO

full_scores = scores_df.copy()
full_scores["cell_id"] = full_scores["cell_id"].astype(str)
gp_map = disc_df.set_index("cell_id")["distance_genept"]
full_scores["distance_genept"] = full_scores["cell_id"].map(gp_map).astype(float)
full_scores = full_scores.sort_values("cell_id").reset_index(drop=True)
out = BytesIO()
pq.write_table(
    pa.Table.from_pandas(full_scores, preserve_index=False), out, compression="snappy"
)
out.seek(0)
if S3_BUCKET:
    boto3.client("s3").upload_fileobj(out, S3_BUCKET, f"{VERSION}/covid_wilk/distance_scores.parquet")
print("rewrote distance_scores", full_scores["distance_genept"].isna().sum(), "NaNs")"""
        )
    )

    cells.append(
        _cell_code(
            """# Cell 18 — cross_model_disagreement.parquet (FastAPI artifact name)
import boto3
import pyarrow as pa
import pyarrow.parquet as pq
from io import BytesIO

out2 = BytesIO()
pq.write_table(
    pa.Table.from_pandas(disc_df.sort_values("cell_id"), preserve_index=False),
    out2,
    compression="snappy",
)
out2.seek(0)
if S3_BUCKET:
    boto3.client("s3").upload_fileobj(
        out2, S3_BUCKET, f"{VERSION}/covid_wilk/cross_model_disagreement.parquet"
    )
print("uploaded cross_model_disagreement.parquet")"""
        )
    )

    cells.append(_cell_md("## Step 6: Provenance"))

    cells.append(
        _cell_code(
            """# Cell 20 — two precompute_runs rows (adapted from precompute_covid_projection.ipynb)
import ssl
import uuid
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import Field, SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession as SQLModelAsyncSession


def _prepare_asyncpg_url(raw_url: str) -> tuple:
    connect_args = {"statement_cache_size": 0}
    parsed = urlparse(raw_url)
    params = parse_qs(parsed.query, keep_blank_values=True)
    sslmode = params.pop("sslmode", [None])[0]
    if sslmode and sslmode in ("require", "verify-ca", "verify-full"):
        connect_args["ssl"] = ssl.create_default_context()
    params.pop("channel_binding", None)
    clean_query = urlencode({k: v[0] for k, v in params.items()}, doseq=False)
    clean_url = urlunparse(parsed._replace(query=clean_query))
    return clean_url, connect_args


async def _write_provenance() -> None:
    class Dataset(SQLModel, table=True):
        __tablename__ = "datasets"
        __table_args__ = {"extend_existing": True}
        id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
        slug: str = Field(index=True)
        display_name: str = ""
        citation: str = ""
        license: str = ""
        cell_count: int = 0
        gene_count: int = 0

    class PrecomputeRun(SQLModel, table=True):
        __tablename__ = "precompute_runs"
        __table_args__ = {"extend_existing": True}
        id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
        dataset_id: uuid.UUID = Field(foreign_key="datasets.id", index=True)
        model_name: str
        model_version: str
        parameters: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False))
        output_parquet_key: str
        git_sha: str
        created_at: datetime = Field(
            default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
        )

    database_url, connect_args = _prepare_asyncpg_url(DATABASE_URL)
    engine = create_async_engine(database_url, echo=False, connect_args=connect_args)
    session_factory = async_sessionmaker(
        engine, class_=SQLModelAsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        pbmc = (await session.exec(select(Dataset).where(Dataset.slug == "pbmc3k"))).first()
        cov = (await session.exec(select(Dataset).where(Dataset.slug == "covid_wilk"))).first()
        if pbmc is None or cov is None:
            raise RuntimeError("Missing datasets rows for pbmc3k / covid_wilk")

        r1 = PrecomputeRun(
            dataset_id=pbmc.id,
            model_name="genept",
            model_version="v1",
            parameters={"dataset": "pbmc3k", "embedding_dim": D},
            output_parquet_key=f"{VERSION}/pbmc3k/genept_embeddings.parquet",
            git_sha=GIT_SHA,
        )
        r2 = PrecomputeRun(
            dataset_id=cov.id,
            model_name="genept_projection_disagreement",
            model_version="v1",
            parameters={
                "reference": "pbmc3k",
                "disagreement_metric": "percentile_diff",
                "distance_metric": "euclidean_to_nearest_celltype_centroid",
                "embedding_dim": D,
            },
            output_parquet_key=f"{VERSION}/covid_wilk/cross_model_disagreement.parquet",
            git_sha=GIT_SHA,
        )
        session.add(r1)
        session.add(r2)
        await session.commit()
        print("inserted", r1.id, r2.id)


await _write_provenance()"""
        )
    )

    cells.append(_cell_md("## Step 7: Verification"))

    cells.append(
        _cell_code(
            """# Cell 22 — verification: re-read every artifact, assert shape / schema / signal invariants.
import io
import boto3
import pandas as pd
import pyarrow.parquet as pq

s3 = boto3.client("s3") if S3_BUCKET else None


def _load(key: str) -> pd.DataFrame:
    if s3 is None:
        return pq.read_table(key).to_pandas()
    obj = s3.get_object(Bucket=S3_BUCKET, Key=key)
    return pq.read_table(io.BytesIO(obj["Body"].read())).to_pandas()


pbmc_emb = _load(f"{VERSION}/pbmc3k/genept_embeddings.parquet")
cov_emb = _load(f"{VERSION}/covid_wilk/genept_embeddings.parquet")
cov_proj = _load(f"{VERSION}/covid_wilk/genept_projected.parquet")
disc = _load(f"{VERSION}/covid_wilk/cross_model_disagreement.parquet")
scores_after = _load(f"{VERSION}/covid_wilk/distance_scores.parquet")

# Embedding-dim invariants — real GenePT embeddings are high-dimensional (SDK-defined, not 64).
pbmc_emb_cols = [c for c in pbmc_emb.columns if c.startswith("embedding_")]
cov_emb_cols = [c for c in cov_emb.columns if c.startswith("embedding_")]
assert len(pbmc_emb_cols) == D, (len(pbmc_emb_cols), D)
assert len(cov_emb_cols) == D, (len(cov_emb_cols), D)
assert D >= 256, f"D={D} is too small to be real GenePT output — aborting Colab run"

# Shape invariants vs upstream scores table.
assert len(scores_after) == len(scores_df)
assert len(cov_emb) == len(scores_df)
assert len(cov_proj) == len(scores_df)
assert len(disc) == len(scores_df)

# No-NaN invariants on the critical numeric columns.
assert not scores_after["distance_genept"].isna().any(), "distance_genept has NaN after rewrite"
assert not disc["disagreement"].isna().any()
assert not cov_proj["distance_to_healthy"].isna().any()

# Signal invariants — two independent foundation models should disagree somewhere.
# If this fails on a real run, something is wrong with GenePT embeddings or the join.
pearson_dd = disc[["distance_geneformer", "distance_genept"]].corr().iloc[0, 1]
print(f"distance pearson: {pearson_dd:.4f}")
assert pearson_dd < 0.95, (
    f"distance_genept and distance_geneformer are suspiciously correlated (r={pearson_dd:.3f}). "
    "Expected < 0.95 for genuinely independent embedding spaces."
)

print("disagreement quantiles (p50/p90/p99):",
      disc["disagreement"].quantile([0.5, 0.9, 0.99]).round(3).tolist())
print("top-5 highest-disagreement cells:")
print(disc.nlargest(5, "disagreement")[
    ["cell_id", "cell_type", "disease_activity",
     "distance_geneformer", "distance_genept", "disagreement"]
].to_string(index=False))"""
        )
    )

    cells.append(
        _cell_code(
            """# Cell 23 — backend round-trip smoke test (assert 200 + non-empty)
import httpx

url = os.environ.get("BACKEND_URL", "http://localhost:8000")
r1 = httpx.get(f"{url}/api/v1/disagreement/covid_wilk", timeout=60.0)
r2 = httpx.get(f"{url}/api/v1/summary/covid_wilk", timeout=60.0)
r3 = httpx.get(f"{url}/api/v1/scores/covid_wilk", timeout=60.0)

for label, r in [("disagreement", r1), ("summary", r2), ("scores", r3)]:
    assert r.status_code == 200, f"{label} returned {r.status_code}: {r.text[:200]}"
    body = r.json()
    assert body, f"{label} returned empty body"
    print(f"{label}: 200, keys={list(body)[:6]}")"""
        )
    )

    cells.append(
        _cell_md(
            """## Done — local fallbacks

Copy the four new parquets + rewritten `distance_scores.parquet` into `backend/data/parquet/` (see `notebooks/README.md`). **FastAPI artifact filenames:** `distance_scores.parquet`, `cross_model_disagreement.parquet`.

Open `http://localhost:3000/dashboard` → **Disagreement** tab: UMAP colored by `disagreement`, tooltips show both distances."""
        )
    )

    nb = {
        "cells": cells,
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python", "version": "3.11.0"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }

    out = Path(__file__).resolve().parent / "precompute_genept_disagreement.ipynb"
    out.write_text(json.dumps(nb, indent=1), encoding="utf-8")
    print("wrote", out, "cells", len(cells))


if __name__ == "__main__":
    main()
