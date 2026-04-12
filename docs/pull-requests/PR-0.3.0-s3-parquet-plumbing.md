# PR-0.3.0 — S3 parquet plumbing

**Branch:** `feature/s3-parquet-plumbing` → `main`  
**Version:** `0.3.0`  
**Date:** 2026-04-12  
**Status:** ✅ Ready to merge

---

## Summary

This change adds a `ParquetStore` service to the FastAPI backend. The store reads versioned parquet objects from S3 when `S3_BUCKET` is set, and on any S3 client error it immediately reads the same logical artifact from a local directory (`PARQUET_LOCAL_FALLBACK_DIR`, default `data/parquet`). The public async API returns raw bytes plus a source flag (`"s3"` or `"local"`). Unit tests use moto to mock S3. The backend Dockerfile accepts `BAKE_PARQUET=true` to copy fallback parquet into the image for offline-friendly deployments. Documentation covers environment variables and high-level bucket setup.

## Files changed

| File | Action | Notes |
| --- | --- | --- |
| `backend/pyproject.toml` | Modified | boto3, pyarrow; dev: types-boto3, moto |
| `backend/uv.lock` | Modified | Lockfile |
| `backend/app/core/config.py` | Modified | S3 and fallback settings |
| `backend/app/services/*` | Added | `ParquetStore` |
| `backend/tests/test_parquet_store.py` | Added | S3 + fallback tests |
| `backend/data/parquet/.gitkeep` | Added | Tracked fallback path |
| `backend/.dockerignore` | Modified | Data exclusions |
| `backend/Dockerfile` | Modified | `BAKE_PARQUET` |
| `.github/workflows/ci.yml` | Modified | Comment |
| `.env.example` | Modified | S3 env vars |
| `README.md` | Modified | Configuration section |

## Architecture decisions

| Decision | Why |
| --- | --- |
| Optional `S3_BUCKET` | Local development and tests can run without AWS credentials. |
| No retries on S3 | Matches ADR-005: one failure triggers fallback immediately. |
| `bytes` from the store | Keeps the layer HTTP- and format-agnostic; routes choose how to stream or parse. |

## Testing checklist

- [x] `cd backend && uv run ruff check .`
- [x] `cd backend && uv run ruff format --check .`
- [x] `cd backend && uv run mypy --strict app/`
- [x] `cd backend && uv run mypy --strict tests/`
- [x] `cd backend && uv run pytest -v`
- [ ] `docker build` with `BAKE_PARQUET=false` and `true` from `backend/` (verify on a machine with Docker)

## Deployment notes

- Set `S3_BUCKET` (and optionally `S3_REGION` / `S3_ENDPOINT_URL`) in the runtime environment for S3-first behavior.
- For images that must run without S3, build the backend with `--build-arg BAKE_PARQUET=true` and ship parquet under `data/parquet` in the build context.

## Validation

```text
cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy --strict app/ && uv run mypy --strict tests/ && uv run pytest -v
# All green; 11 tests passed
```
