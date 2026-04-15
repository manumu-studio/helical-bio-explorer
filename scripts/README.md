# Baseline PBMC parquet generator (PACKET-02a)

This folder contains `generate_pbmc_baseline_parquet.py`, a **placeholder** pipeline that builds the healthy-reference parquet from scanpy’s PBMC 3k dataset (precomputed UMAP + louvain labels) and zero-filled `embedding_0..511` columns so the filename matches what PACKET-02b will ship. **Real Geneformer embeddings come from PACKET-02b**; this script exists so the dashboard and API can show real cell coordinates tonight while the Colab GPU run is pending.

## Install

```bash
pip install -r scripts/requirements-baseline.txt
```

## How to run

Default (writes `backend/data/parquet/pbmc3k/geneformer_embeddings.parquet` and inserts `precompute_runs` unless `--skip-db`):

```bash
python scripts/generate_pbmc_baseline_parquet.py
```

With optional S3 upload (`v1/pbmc3k/geneformer_embeddings.parquet`):

```bash
python scripts/generate_pbmc_baseline_parquet.py --upload-s3
```

Dry-run (no database write; useful for CI or quick parquet checks):

```bash
python scripts/generate_pbmc_baseline_parquet.py --skip-db --out-dir /tmp/pbmc-test
```

## CLI flags

| Flag | Meaning |
|------|---------|
| `--out-dir` | Output directory (default `backend/data/parquet/pbmc3k`). |
| `--upload-s3` | Upload the parquet to S3 using `S3_BUCKET` / `S3_REGION` / AWS credentials. |
| `--skip-db` | Do not insert into `precompute_runs`. |
| `--git-sha` | Override auto-detected `git rev-parse HEAD` for provenance. |

## Required environment variables

| Variable | When |
|----------|------|
| `DATABASE_URL` | Always, **unless** `--skip-db` (async SQLAlchemy URL, e.g. `postgresql+asyncpg://…` for Neon). |
| `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Only if `--upload-s3` is set. |

## Expected output

- Parquet at `backend/data/parquet/pbmc3k/geneformer_embeddings.parquet` (typically ~2 MB compressed).
- One new row in `precompute_runs` with `model_name="scanpy_baseline"` and `model_version="placeholder-v1"` (honest provenance).
- After the backend reloads or reads the file, the dashboard **Healthy Reference** view shows ~2,638 cells colored by louvain cell type.

## Honesty note

The artifact is intentionally named `geneformer_embeddings.parquet` so **PACKET-02b can overwrite the file without code changes**. The URL may still say `geneformer`, but the **source of truth** for what was run is `precompute_runs.model_name` (`scanpy_baseline` until PACKET-02b replaces the row with real Geneformer provenance).
