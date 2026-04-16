# Precompute Notebooks

## `precompute_pbmc_mvp.ipynb`

Runs Geneformer (via the Helical SDK) on PBMC 3k healthy cells, exports embeddings + UMAP coordinates as parquet, uploads to S3, and writes a provenance row to Neon Postgres.

**This notebook overwrites the PACKET-02a scanpy baseline placeholder** (`backend/data/parquet/pbmc3k/geneformer_embeddings.parquet`) with real Geneformer 512-dim embeddings. The column schema is identical (`cell_id`, `cell_type`, `umap_1`, `umap_2`, `embedding_0..511`) so no downstream code changes are needed.

### Runtime

- **Environment:** Google Colab with T4 GPU runtime
- **Expected wall time:** 15-25 minutes
- **Python:** 3.11 (Colab default)

### Required Environment Variables

Set these in Colab via `google.colab.userdata` or `os.environ`:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon pooled connection string (`postgresql+asyncpg://...`) |
| `S3_BUCKET` | Yes | S3 bucket name (e.g. `helical-bio-parquet`) |
| `S3_REGION` | Yes | AWS region (e.g. `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | Yes | IAM credentials for S3 upload |
| `AWS_SECRET_ACCESS_KEY` | Yes | IAM credentials for S3 upload |

### Setup

1. Open `precompute_pbmc_mvp.ipynb` in Google Colab
2. Select **Runtime > Change runtime type > T4 GPU**
3. Set all 5 env vars via Colab Secrets (`google.colab.userdata`)
4. Run all cells top-to-bottom

### Post-Run

After the notebook completes successfully:

```bash
# Copy the real Geneformer parquet to the local fallback (ADR-005)
cp /tmp/geneformer_embeddings.parquet backend/data/parquet/pbmc3k/
```

This overwrites the PACKET-02a zero-padded placeholder with real 512-dim Geneformer embeddings.

### Verification Checklist

- [ ] All 15 cells run without errors on Colab T4
- [ ] Cell 6 prints Geneformer embedding shape `(2638, 512)`
- [ ] Cell 8 prints UMAP shape `(2638, 2)` and 8 cell-type centroids
- [ ] Cell 10 uploads parquet to S3 at `v1/pbmc3k/geneformer_embeddings.parquet`
- [ ] Cell 10 uploads UMAP reducer to S3 at `v1/pbmc3k/pbmc_umap_reducer.joblib`
- [ ] Cell 12 inserts `precompute_runs` row with `model_name="geneformer"`
- [ ] Cell 14 re-reads parquet from S3, prints shape `(2638, 516)` and 3 sample rows
- [ ] After local copy, embedding columns are non-zero (real Geneformer output)
- [ ] Local parquet size under 10 MB

---

## `precompute_covid_projection.ipynb`

Runs the PACKET-02c disease arm: Wilk et al. 2020 COVID PBMCs via CELLxGENE Census → Geneformer (Helical SDK) → project into the PACKET-02b PBMC3k reference UMAP (`pbmc_umap_reducer.joblib`) → cosine distance to healthy centroids → three parquets under `v1/covid_wilk/` on S3 + local fallback.

### Runtime

- **Environment:** Google Colab with **T4 GPU**
- **Expected wall time:** 25–45 minutes (Census download + ~10k-cell Geneformer pass)
- **Python:** 3.11

### Prerequisites

- S3 artifacts from PACKET-02b: `v1/pbmc3k/geneformer_embeddings.parquet` and `v1/pbmc3k/pbmc_umap_reducer.joblib`
- Neon row for `slug=covid_wilk` (run `uv run python -m app.scripts.seed_covid_dataset` from `backend/` before provenance cells)

### Required environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon async URL (`postgresql+asyncpg://...`) |
| `S3_BUCKET` | Yes | Parquet bucket |
| `S3_REGION` | Yes | e.g. `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Yes | S3 upload |
| `AWS_SECRET_ACCESS_KEY` | Yes | S3 upload |
| `BACKEND_URL` | No | Defaults to production API; override for local smoke tests |

### Post-run (local fallback)

```bash
mkdir -p backend/data/parquet/covid_wilk/
cp /tmp/{geneformer_embeddings,geneformer_projected,distance_scores}.parquet backend/data/parquet/covid_wilk/
```

**Note:** The FastAPI artifact name for scores is `distance_scores.parquet` (not `scores.parquet`).
