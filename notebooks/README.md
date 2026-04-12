<!-- Colab precompute notebook: how to run, env vars, GPU, verification. -->

# Precompute notebook (Google Colab)

This folder holds the **offline** reference-mapping pipeline: Geneformer + GenePT embeddings, UMAP, disease projection, parquet export to S3, and provenance rows in Postgres. Runtime FastAPI does **not** run these models; it only serves the artifacts you produce here.

## Open in Colab

1. Push this repository to GitHub (or use a private fork).
2. In Colab: **File → Open notebook → GitHub** and select `notebooks/precompute_reference_mapping.ipynb`.
3. Set the runtime to **GPU** (Runtime → Change runtime type → **T4 GPU**).

## Before you run

- Run the backend seed locally so `sle_csle` exists in `datasets` (see main [README](../README.md) for backend setup):

  ```bash
  cd backend
  uv run python -m app.scripts.seed_sle_dataset
  ```

- In Neon / Postgres, ensure migrations are applied so `datasets` and `precompute_runs` exist.

## Install dependencies

The first code cell runs:

```bash
pip install -r notebooks/requirements-colab.txt
```

If you upload **only** the `.ipynb` to Colab, upload `requirements-colab.txt` into the same working directory and change the cell to `pip install -r requirements-colab.txt`, or clone the full repo and `cd` into it so `notebooks/requirements-colab.txt` resolves.

## Required environment variables

Set these in Colab (**Secrets** or the config cell via `os.environ` before running downstream cells).

| Variable | Description | Example format |
|----------|-------------|----------------|
| `DATABASE_URL` | Neon **pooled** async URL for `asyncpg` | `postgresql+asyncpg://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `S3_BUCKET` | Target bucket for versioned parquet keys | `helical-bio-parquet` |
| `S3_REGION` | AWS region for the bucket | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | IAM access key with `s3:PutObject` on the prefix | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Secret for the key above | (secret string) |

Optional:

| Variable | Description |
|----------|-------------|
| `PRECOMPUTE_RUN_VERSION` | Integer or string used in S3 keys as `v{VERSION}/...` (default `1`). |
| `CSLE_RAW_TAR` | Local path to `GSE135779_RAW.tar` if you downloaded it outside the notebook. |
| `CSLE_MAX_SAMPLES` | Limit number of GEO supplementary 10x libraries to load (for smoke tests; omit for full cohort). |
| `BACKEND_ROOT` | Path to this repo’s `backend/` folder on the Colab VM so provenance cells can `import app.db.models` (e.g. after `git clone`). |

## GPU and wall time

- **GPU:** NVIDIA **T4** (Colab free tier) is sufficient for Geneformer + GenePT on this workload.
- **Wall time:** expect roughly **30–60 minutes** for the full notebook (depends on GPU, network when downloading GEO data, and whether you limit `CSLE_MAX_SAMPLES`).

## cSLE expression data (GEO)

Childhood SLE PBMC counts are published as **GSE135779** (Cell Ranger outputs in `GSE135779_RAW.tar`, ~1.3 GB). The notebook downloads that tar (unless `CSLE_RAW_TAR` points to an existing file), extracts 10x matrices, and joins author metadata (`SLEDAI`, cell-type-related labels) from the companion GitHub repo linked in the paper.

## Verification (after the last cells)

When the notebook finishes successfully you should see:

1. **S3:** Six objects under `v{VERSION}/pbmc3k/` and `v{VERSION}/sle_csle/` matching the paths printed in the export cell.
2. **Postgres:** Two new rows in `precompute_runs` (Geneformer and GenePT), queryable from your ORM or SQL client.
3. **Local folder (Colab disk):** `output/parquet/...` copies for quick inspection.

Copy the `output/parquet` tree into `backend/data/parquet/` in this repo if you want the Docker **local fallback** layout described in the architecture docs.

## Troubleshooting

- **OOM on GPU:** Reduce Geneformer / GenePT `batch_size` in the embedding cells, or set `CSLE_MAX_SAMPLES` to load fewer 10x libraries (document the subsample in your run notes).
- **GEO download failures:** Retry the data-loading cell; confirm Colab outbound network is enabled; or prefetch `GSE135779_RAW.tar` and set `CSLE_RAW_TAR`.
- **DB writes fail:** Confirm `DATABASE_URL` uses the `postgresql+asyncpg://` scheme and includes `sslmode=require` for Neon.
