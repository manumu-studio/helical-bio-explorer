# ENTRY-09 — PBMC 3k Geneformer Embedding Notebook

**Date:** 2026-04-16
**Type:** Feature
**Branch:** `feat/packet-02b-pbmc-geneformer`
**Version:** 0.8.0

---

## What I Did

Built a Google Colab notebook that produces real Geneformer embeddings for the PBMC 3k healthy reference dataset. The notebook uses the Helical SDK to initialize Geneformer, tokenize the AnnData, and generate 512-dimensional cell embeddings. It then computes UMAP coordinates in the Geneformer embedding space (not the scanpy precomputed UMAP), exports a parquet file with the exact same schema as the baseline placeholder, uploads to S3, and writes a provenance row to Neon Postgres.

The key design decision was to keep the parquet schema identical to the PACKET-02a placeholder (`cell_id`, `cell_type`, `umap_1`, `umap_2`, `embedding_0..511`). This means replacing the placeholder with real embeddings requires zero code changes — the dashboard, API routes, Zod schemas, and Pydantic models all work unchanged.

## Files Touched

| File | Action | Notes |
|---|---|---|
| `notebooks/precompute_pbmc_mvp.ipynb` | Created | 15-cell Colab notebook for Geneformer embedding generation |
| `notebooks/README.md` | Created | Setup, env vars, runtime, verification checklist |
| `notebooks/requirements-colab.txt` | Created | 10 pinned dependencies for Colab T4 GPU |

## Decisions

- **Inline SQLModel definitions** in the notebook rather than importing from the backend — the notebook runs on Colab without repo access, so import coupling would break execution.
- **UMAP fitted on Geneformer embeddings** (not scanpy's precomputed UMAP) — this means the 2D projection reflects the learned representation, not the original PCA-based projection. The fitted reducer is saved to S3 for PACKET-02c to reuse when projecting disease cells.
- **`gene_name` column copied from var index** — the Helical SDK's `process_data` method requires a named column in `adata.var`, but scanpy's `pbmc3k_processed()` stores gene symbols in the index only.
- **`nest_asyncio` for Colab compatibility** — Colab's IPython kernel runs inside an existing event loop, so `asyncio.run()` fails. `nest_asyncio.apply()` enables nested execution.

## Still Open

- Notebook has not been executed on Colab yet — requires GPU runtime and credentials.
- After execution, the real parquet must be manually copied to `backend/data/parquet/pbmc3k/` to replace the placeholder.
- The actual embedding dimension needs runtime confirmation (expected 512 based on Helical SDK docs).

## Validation

```text
# Notebook structure
python3 -c "import json; nb=json.load(open('notebooks/precompute_pbmc_mvp.ipynb')); assert nb['nbformat']==4 and len(nb['cells'])==15"
# passes

# Supporting files
test -f notebooks/README.md && test -f notebooks/requirements-colab.txt
# both exist
```
