# ENTRY-05 — FastAPI v1 parquet API

**Date:** 2026-04-13  
**Type:** Feature  
**Branch:** `feature/api-routes`  
**Version:** `0.4.0`

---

## What I did

Shipped read-only JSON endpoints under `/api/v1` that load precomputed single-cell artifacts through the existing `ParquetStore`, resolve the latest precompute version from Postgres, and return typed payloads for embeddings, projections, distance scores, cross-model disagreement, and server-computed summary statistics. Each response sets `X-Served-From` to reflect S3 versus local fallback. Added focused PyArrow utilities with no network I/O, pytest fixtures that generate tiny parquet bytes in memory, and integration tests that override FastAPI dependencies so the suite stays hermetic.

## Files touched

| File | Action | Notes |
| --- | --- | --- |
| `backend/app/api/v1/*.py` | Added | Routers + schemas |
| `backend/app/services/parquet_reader.py` | Added | Parse, filter, sample |
| `backend/app/services/version_resolver.py` | Added | Latest run lookup |
| `backend/app/dependencies.py` | Added | Cached `ParquetStore` |
| `backend/app/main.py` | Modified | Mount v1 API |
| `backend/tests/conftest.py` | Modified | Parquet fixtures |
| `backend/tests/test_api_v1.py` | Added | Async client tests |
| `README.md` | Modified | Status + API hints |

## Decisions

- Kept `/summary` aggregation in the Python stdlib so the backend does not pick up pandas as a transitive requirement for one endpoint.
- Called `ParquetStore.read` with `(version, dataset_slug, artifact_type)` to match the store that shipped in the previous milestone.

## Still open

- Frontend consumption and Zod schemas for these payloads.
- End-to-end verification against real S3 keys and seeded `precompute_runs` rows outside CI mocks.

## Validation

```bash
cd backend && uv run ruff check . && uv run ruff format --check .
cd backend && uv run mypy --strict app/ && uv run mypy --strict tests/
cd backend && uv run pytest -v
```

All completed successfully (21 tests).
