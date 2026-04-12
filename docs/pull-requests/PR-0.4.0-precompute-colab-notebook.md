# PR-0.4.0 — Precompute Colab notebook and cSLE dataset seed

**Branch:** `feature/precompute-colab` → `main`
**Version:** `0.4.0`
**Date:** 2026-04-12
**Status:** ✅ Ready to merge

---

## Summary

This change adds the offline precompute story for the SLE reference-mapping demo: a Colab-oriented Jupyter notebook that runs Geneformer and GenePT, exports six parquet artifacts to S3, and records provenance in Postgres, plus documentation and a pinned Colab requirements file. A new seed script registers the childhood SLE cohort (`sle_csle`) in the dataset registry idempotently. The root README now mentions the second seed command next to the existing PBMC 3k seed.

## Files Changed

| File | Action | Notes |
|------|--------|------|
| `notebooks/README.md` | Added | Env vars, GPU expectations, verification |
| `notebooks/requirements-colab.txt` | Added | Colab dependency pins |
| `notebooks/precompute_reference_mapping.ipynb` | Added | End-to-end precompute pipeline |
| `backend/app/scripts/seed_sle_dataset.py` | Added | Neon upsert for `sle_csle` |
| `README.md` | Updated | Seed `sle_csle`; status blurb for precompute |

## Architecture Decisions

| Decision | Why |
|----------|-----|
| Notebook-driven precompute | Matches the “run once offline, serve static parquet at runtime” architecture and keeps intermediate outputs visible for review. |
| `sle_csle` slug | Stable registry key for the disease cohort referenced by provenance rows. |
| S3 keys `v{version}/...` | Aligns with the existing parquet store key layout. |

## Testing Checklist

- [ ] `cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy --strict app/ && uv run pytest -v`
- [ ] `cd frontend && pnpm typecheck && pnpm lint && pnpm build`
- [ ] `cd backend && uv run python -m app.scripts.seed_sle_dataset` (twice) against Neon — expect `seeded` then `updated`
- [ ] Open `notebooks/precompute_reference_mapping.ipynb` and confirm 26 cells load as valid JSON
- [ ] (Colab) Run the notebook top-to-bottom on a T4 with secrets set — confirm S3 objects and `precompute_runs` rows

## Deployment Notes

- No change to the production FastAPI read path beyond future parquet files appearing in S3 and optional local fallback copies under `backend/data/parquet/`.
- Ensure IAM credentials used in Colab can `PutObject` into the configured bucket prefix.

## Validation

```bash
cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy --strict app/ && uv run pytest -v
cd frontend && pnpm typecheck && pnpm lint && pnpm build
```

Backend: 12 passed. Frontend: typecheck, lint, and build succeeded.
