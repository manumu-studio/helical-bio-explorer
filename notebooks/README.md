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
