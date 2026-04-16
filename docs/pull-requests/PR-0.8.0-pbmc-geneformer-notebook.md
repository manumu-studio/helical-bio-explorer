# PR-0.8.0 — PBMC 3k Geneformer embedding notebook

**Branch:** `feat/packet-02b-pbmc-geneformer` -> `main`
**Version:** 0.8.0
**Date:** 2026-04-16
**Status:** 🟡 Notebook ready — must be executed on Colab before parquet replacement

---

## Summary

Adds a Google Colab notebook that produces real Geneformer 512-dim embeddings for PBMC 3k healthy cells via the Helical SDK. The output parquet uses the exact same schema as the existing baseline placeholder, so replacing it is a pure data swap with zero code changes to the API, dashboard, or type contracts.

- Geneformer initialized via Helical SDK (`GeneformerConfig` + `Geneformer`)
- UMAP computed on the Geneformer embedding space (not scanpy's precomputed PCA-UMAP)
- Fitted UMAP reducer persisted to S3 for disease projection in the next phase
- Provenance row written to Neon with `model_name="geneformer"`, `model_version="v1"`

## What changed

| Area | File | Action | Notes |
|---|---|---|---|
| Notebook | `notebooks/precompute_pbmc_mvp.ipynb` | Created | 15-cell Colab notebook (T4 GPU, ~15-25 min) |
| Docs | `notebooks/README.md` | Created | Setup, env vars, verification checklist |
| Deps | `notebooks/requirements-colab.txt` | Created | 10 pinned deps for Colab |

## Architecture decisions

| Decision | Why |
|---|---|
| **Same parquet schema as baseline** | `cell_id`, `cell_type`, `umap_1`, `umap_2`, `embedding_0..511` — dashboard, API, Zod/Pydantic contracts unchanged |
| **UMAP on Geneformer embeddings** | The 2D projection should reflect the learned representation, not the original PCA space |
| **Fitted UMAP reducer to S3** | Next phase projects disease cells into the healthy reference manifold using `reducer.transform()` |
| **Inline SQLModel in notebook** | Runs on Colab without the full repo; mirrors backend schema without import coupling |

## Testing

### Pre-merge (structure validation) ✅
- [x] Notebook is valid JSON with `nbformat=4` and 15 cells
- [x] README documents all 5 required env vars
- [x] Requirements file pins all necessary dependencies
- [x] Cell structure matches packet spec (markdown headers + code cells in correct order)

### Post-merge (Colab execution — MUST be done)
- [ ] Open notebook in Colab with T4 GPU runtime
- [ ] Set all 5 env vars via Colab Secrets
- [ ] Run all 15 cells top-to-bottom without errors
- [ ] Cell 6 prints embedding shape `(2638, 512)`
- [ ] Cell 8 prints UMAP shape `(2638, 2)` and 8 cell-type centroids
- [ ] Cell 10 uploads parquet + UMAP reducer to S3
- [ ] Cell 12 inserts `precompute_runs` row with `model_name="geneformer"`
- [ ] Cell 14 re-reads parquet from S3, confirms non-zero embeddings
- [ ] Copy `/tmp/geneformer_embeddings.parquet` to `backend/data/parquet/pbmc3k/`
- [ ] Verify dashboard renders real Geneformer UMAP (not scanpy baseline)

## Deployment notes

- **No backend/frontend code changes** — this PR adds only a notebook and supporting files.
- **After Colab execution:** copy the output parquet to `backend/data/parquet/pbmc3k/geneformer_embeddings.parquet` (overwrites the PACKET-02a placeholder). Commit and push. The API and dashboard will serve real Geneformer embeddings automatically.
- **S3 artifacts:** `v1/pbmc3k/geneformer_embeddings.parquet` (real embeddings) and `v1/pbmc3k/pbmc_umap_reducer.joblib` (fitted UMAP for disease projection).

## What's intentionally not done

- **COVID/disease dataset** — deferred to PACKET-02c
- **GenePT embeddings** — deferred to PACKET-02d
- **Cross-model disagreement** — requires both Geneformer and GenePT
- **Backend or frontend code changes** — none needed; schema is stable
