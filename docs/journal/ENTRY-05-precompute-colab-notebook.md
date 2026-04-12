# ENTRY-05 — Precompute Colab notebook and cSLE dataset seed

**Date:** 2026-04-12
**Type:** Feature
**Branch:** `feature/precompute-colab`
**Version:** `0.4.0`

---

## What I Did

Added the offline reference-mapping pipeline as a documented Colab workflow: pinned Python dependencies, a reproducible Jupyter notebook that runs Geneformer and GenePT on PBMC 3k plus the childhood SLE cohort (GEO GSE135779), fits UMAP on healthy cells, projects disease cells, exports six versioned parquet artifacts to S3, and writes two provenance rows to Postgres. Registered the disease cohort in the dataset table via a new idempotent seed script.

## Files Touched

| File | Action | Notes |
|------|--------|------|
| `notebooks/README.md` | Added | Colab setup, env vars, verification |
| `notebooks/requirements-colab.txt` | Added | Pins compatible with `helical` 1.8.3 |
| `notebooks/precompute_reference_mapping.ipynb` | Added | Full 26-cell pipeline |
| `backend/app/scripts/seed_sle_dataset.py` | Added | Upsert `sle_csle` |
| `README.md` | Updated | Second seed command + precompute status line |

## Decisions

- Prefer explicit `helical.models.*` imports because the top-level `helical` package does not export model classes.
- Keep async DB writes Colab-friendly using `nest-asyncio` and the same asyncpg URL normalization approach as the FastAPI service.
- Use `PRECOMPUTE_RUN_VERSION` (default `1`) for the `v{n}/` S3 prefix so reruns do not overwrite prior artifacts unintentionally.

## Still Open

- Populate `backend/data/parquet/` with the six files after a successful Colab run if you want the Docker image local fallback populated before the next deploy.
- Run `seed_sle_dataset` against your Neon instance if `sle_csle` is not yet in `datasets`.

## Validation

```bash
cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy --strict app/ && uv run pytest -v
cd frontend && pnpm typecheck && pnpm lint && pnpm build
python3 -c "import json; json.load(open('notebooks/precompute_reference_mapping.ipynb'))"
```

Results: backend 12 tests passed; frontend build succeeded; notebook JSON valid with 26 cells.
