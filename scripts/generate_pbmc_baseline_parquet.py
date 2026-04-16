# Generates PBMC 3k baseline parquet (scanpy UMAP + zero embeddings) for local ADR-005 fallback.
# Placeholder until PACKET-02b Geneformer; provenance is precompute_runs.model_name=scanpy_baseline.

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import ssl
import subprocess
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
from uuid import UUID

import pandas as pd
from anndata import AnnData

logger = logging.getLogger(__name__)

_REPO_ROOT = Path(__file__).resolve().parent.parent
_BACKEND_ROOT = _REPO_ROOT / "backend"


def _ensure_backend_on_path() -> None:
    if str(_BACKEND_ROOT) not in sys.path:
        sys.path.insert(0, str(_BACKEND_ROOT))


def _resolve_git_sha(cli_sha: str | None) -> str:
    if cli_sha is not None:
        return cli_sha
    try:
        proc = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=_REPO_ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        return proc.stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        logger.warning("Could not resolve git SHA; using placeholder")
        return "unknown-local"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build PBMC 3k baseline parquet from scanpy (placeholder until PACKET-02b).",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("backend/data/parquet/pbmc3k"),
        help="Directory for geneformer_embeddings.parquet (default: backend/data/parquet/pbmc3k).",
    )
    parser.add_argument(
        "--upload-s3",
        action="store_true",
        help="Upload parquet to S3 (requires S3_* and AWS_* env vars).",
    )
    parser.add_argument(
        "--skip-db",
        action="store_true",
        help="Skip inserting precompute_runs row (dry-run / CI).",
    )
    parser.add_argument(
        "--git-sha",
        default=None,
        help="Git commit SHA (default: git rev-parse HEAD).",
    )
    ns = parser.parse_args(argv)
    ns.git_sha_resolved = _resolve_git_sha(ns.git_sha)
    return ns


def load_pbmc() -> AnnData:
    import scanpy as sc

    # Keep scanpy's download cache out of the repo root (default: ./data/).
    # Use XDG_CACHE_HOME / ~/.cache/scanpy so re-runs reuse the file.
    cache_dir = (
        Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "scanpy" / "datasets"
    )
    cache_dir.mkdir(parents=True, exist_ok=True)
    sc.settings.datasetdir = cache_dir

    logger.info("Loading PBMC 3k via scanpy.datasets.pbmc3k_processed() from %s", cache_dir)
    adata = sc.datasets.pbmc3k_processed()
    n = int(adata.n_obs)
    if n != 2638:
        msg = f"scanpy PBMC 3k shape drift: expected 2638, got {n} (see PACKET-02a Risk register)"
        raise RuntimeError(msg)
    if "louvain" not in adata.obs.columns:
        raise KeyError(
            "scanpy moved cell-type key; update script per PACKET-02a Risk register",
        )
    if "X_umap" not in adata.obsm:
        raise KeyError("scanpy moved UMAP key; update script per PACKET-02a Risk register")

    expected_types = {
        "CD4 T cells",
        "CD14+ Monocytes",
        "B cells",
        "CD8 T cells",
        "NK cells",
        "FCGR3A+ Monocytes",
        "Dendritic cells",
        "Megakaryocytes",
    }
    counts = adata.obs["louvain"].value_counts()
    unknown = set(counts.index.astype(str)) - expected_types
    if unknown:
        logger.warning("Unexpected louvain labels (expected PBMC 3k set): %s", unknown)

    logger.info("Loaded PBMC 3k: %s cells", n)
    logger.info("Cell-type distribution:\n%s", counts.to_string())
    return adata


def build_dataframe(adata: AnnData) -> pd.DataFrame:
    import numpy as np

    n = int(adata.n_obs)
    umap = adata.obsm["X_umap"]
    base = pd.DataFrame(
        {
            "cell_id": adata.obs_names.astype(str),
            "cell_type": adata.obs["louvain"].astype(str),
            "umap_1": umap[:, 0].astype("float32"),
            "umap_2": umap[:, 1].astype("float32"),
        }
    )
    emb = pd.DataFrame(
        np.zeros((n, 512), dtype=np.float32),
        columns=[f"embedding_{i}" for i in range(512)],
    )
    # AnnData uses string obs index; embedding frame uses RangeIndex — align before concat.
    base = base.reset_index(drop=True)
    emb = emb.reset_index(drop=True)
    df = pd.concat([base, emb], axis=1)
    if df.shape != (2638, 516):
        raise RuntimeError(f"Expected DataFrame shape (2638, 516), got {df.shape}")
    logger.info(
        "DataFrame shape: %s; columns: cell_id, cell_type, umap_1/2 (float32), "
        "embedding_0..511 (float32 zeros)",
        df.shape,
    )
    return df


def write_parquet_local(df: pd.DataFrame, out_dir: Path) -> Path:
    import pyarrow as pa
    import pyarrow.parquet as pq

    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "geneformer_embeddings.parquet"
    table = pa.Table.from_pandas(df, preserve_index=False)
    pq.write_table(table, path, compression="snappy")
    size_mb = path.stat().st_size / (1024 * 1024)
    logger.info("Wrote parquet: %s (%.2f MB)", path, size_mb)
    if size_mb > 10:
        raise RuntimeError(f"Parquet size {size_mb:.2f} MB exceeds 10 MB — consider float16 zeros")
    return path


def upload_to_s3(local_path: Path, bucket: str, key: str, region: str) -> None:
    import boto3

    s3 = boto3.client("s3", region_name=region)
    size_mb = local_path.stat().st_size / (1024 * 1024)
    s3.upload_file(str(local_path), bucket, key)
    logger.info("Uploaded to s3://%s/%s (%.2f MB)", bucket, key, size_mb)


S3_KEY_BASELINE = "v1/pbmc3k/geneformer_embeddings.parquet"


def _prepare_asyncpg_url(raw_url: str) -> tuple[str, dict[str, object]]:
    # Neon (and most managed Postgres) append libpq-style query params like
    # `?sslmode=require&channel_binding=require` to DATABASE_URL. asyncpg does
    # not accept those as URL params — SQLAlchemy+asyncpg wants SSL configured
    # via connect_args. So we: (1) lift `sslmode` into an ssl.Context,
    # (2) drop `channel_binding` (not supported by asyncpg), (3) disable the
    # prepared-statement cache (`statement_cache_size=0`) because PgBouncer
    # transaction pooling used by Neon breaks cached statements.
    connect_args: dict[str, object] = {"statement_cache_size": 0}
    parsed = urlparse(raw_url)
    params = parse_qs(parsed.query, keep_blank_values=True)
    sslmode = params.pop("sslmode", [None])[0]
    if sslmode and sslmode in ("require", "verify-ca", "verify-full"):
        connect_args["ssl"] = ssl.create_default_context()
    params.pop("channel_binding", None)
    clean_query = urlencode({k: v[0] for k, v in params.items()}, doseq=False)
    clean_url = urlunparse(parsed._replace(query=clean_query))
    return clean_url, connect_args


async def write_precompute_run(git_sha: str, parquet_key: str) -> UUID:
    """Insert one precompute_runs row; requires DATABASE_URL and pbmc3k seed (PACKET-01b)."""
    _ensure_backend_on_path()
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
    from sqlmodel import select
    from sqlmodel.ext.asyncio.session import AsyncSession as SQLModelAsyncSession

    from app.db.models import Dataset, PrecomputeRun

    raw_url = os.environ.get("DATABASE_URL")
    if not raw_url:
        raise RuntimeError("DATABASE_URL not set — required unless --skip-db")

    connect_args: dict[str, object] = {}
    if raw_url.startswith("postgresql+asyncpg"):
        database_url, connect_args = _prepare_asyncpg_url(raw_url)
    elif raw_url.startswith("sqlite"):
        database_url = raw_url
    else:
        database_url = raw_url

    engine = create_async_engine(
        database_url,
        echo=False,
        connect_args=connect_args,
    )
    session_factory = async_sessionmaker(
        engine,
        class_=SQLModelAsyncSession,
        expire_on_commit=False,
    )

    parameters: dict[str, object] = {
        "note": "scanpy PCA UMAP used as Geneformer placeholder; superseded by PACKET-02b",
        "umap_source": "adata.obsm['X_umap']",
        "label_source": "adata.obs['louvain']",
        "embedding_columns": "zeros (n, 512)",
    }

    try:
        async with session_factory() as session:
            result = await session.exec(select(Dataset).where(Dataset.slug == "pbmc3k"))
            dataset = result.first()
            if dataset is None or dataset.id is None:
                raise RuntimeError(
                    "No datasets row with slug=pbmc3k — run PACKET-01b seed "
                    "(app.scripts.seed_datasets)",
                )

            row = PrecomputeRun(
                dataset_id=dataset.id,
                model_name="scanpy_baseline",
                model_version="placeholder-v1",
                parameters=parameters,
                output_parquet_key=parquet_key,
                git_sha=git_sha,
            )
            session.add(row)
            await session.commit()
            await session.refresh(row)
            rid = row.id
            if rid is None:
                raise RuntimeError("Insert did not return id")
            logger.info("Inserted precompute_runs id=%s", rid)
            return rid
    finally:
        await engine.dispose()


def main(args: argparse.Namespace) -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    adata = load_pbmc()
    df = build_dataframe(adata)

    out_path = write_parquet_local(df, args.out_dir)

    if args.upload_s3:
        bucket = os.environ.get("S3_BUCKET")
        region = os.environ.get("S3_REGION")
        if not bucket:
            raise RuntimeError("S3_BUCKET not set — required when --upload-s3 is passed")
        if not region:
            raise RuntimeError("S3_REGION not set — required when --upload-s3 is passed")
        upload_to_s3(out_path, bucket=bucket, key=S3_KEY_BASELINE, region=region)

    if not args.skip_db:
        resolved_sha = getattr(args, "git_sha_resolved", None) or _resolve_git_sha(
            getattr(args, "git_sha", None),
        )
        asyncio.run(write_precompute_run(resolved_sha, S3_KEY_BASELINE))

    return 0


if __name__ == "__main__":
    sys.exit(main(parse_args()))
