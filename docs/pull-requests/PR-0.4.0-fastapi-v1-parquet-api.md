# PR-0.4.0 — FastAPI v1 parquet API

**Branch:** `feature/api-routes` → `main`  
**Version:** `0.4.0`  
**Date:** 2026-04-13  
**Status:** ✅ Ready to merge

---

## Summary

This change adds versioned read-only HTTP routes under `/api/v1` that serve precomputed parquet artifacts as JSON for the dashboard. The service resolves the latest output version from the `precompute_runs` table, reads bytes through the existing S3-first `ParquetStore` with local fallback, applies optional cell-type and disease-activity filters, samples large tables for plotting endpoints, and computes full-dataset summary statistics on the server. Responses include an `X-Served-From` header indicating whether bytes came from S3 or disk. Tests use in-memory parquet fixtures and dependency overrides so no cloud services are required.

## Files changed

| File | Action | Notes |
| --- | --- | --- |
| `backend/app/api/v1/*` | Added | Schemas and routers |
| `backend/app/services/parquet_reader.py` | Added | Pure PyArrow helpers |
| `backend/app/services/version_resolver.py` | Added | DB-backed version pick |
| `backend/app/dependencies.py` | Added | Shared `ParquetStore` |
| `backend/app/main.py` | Modified | `/api/v1` mount |
| `backend/tests/conftest.py` | Modified | Fixture parquet bytes |
| `backend/tests/test_api_v1.py` | Added | Integration coverage |
| `README.md` | Modified | Describes new API surface |

## Architecture decisions

| Decision | Why |
| --- | --- |
| JSON instead of raw parquet in HTTP responses | Keeps the browser boundary friendly to schema validation and keeps payloads small when sampling. |
| No pandas for `/summary` | Avoids a heavy dependency when stdlib statistics plus grouping are sufficient at demo scale. |
| Dependency-injected store | Tests swap a stub without touching S3 or the filesystem layout. |

## Testing checklist

- [x] `cd backend && uv run ruff check .`
- [x] `cd backend && uv run ruff format --check .`
- [x] `cd backend && uv run mypy --strict app/`
- [x] `cd backend && uv run mypy --strict tests/`
- [x] `cd backend && uv run pytest -v`

## Deployment notes

- Ensure `precompute_runs.output_parquet_key` values follow `v{semver}/{dataset_slug}/...` so version parsing succeeds.
- Parquet must exist at the resolved keys in S3 or under `PARQUET_LOCAL_FALLBACK_DIR/{dataset_slug}/{artifact}.parquet`.

## Validation

Paste the same commands as the testing checklist; latest run reported 21 passing tests with clean Ruff and mypy.
