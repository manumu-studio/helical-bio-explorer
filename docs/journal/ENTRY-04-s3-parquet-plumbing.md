# ENTRY-04 — S3 parquet plumbing

**Date:** 2026-04-12  
**Type:** Feature  
**Branch:** `feature/s3-parquet-plumbing`  
**Version:** `0.3.0`

---

## What I did

Implemented a backend `ParquetStore` that reads versioned parquet bytes from S3 when a bucket is configured, falls back to the local `data/parquet/{dataset}/{artifact}.parquet` layout on any S3 client failure, and returns whether bytes came from `"s3"` or `"local"`. Added moto-based tests, optional Docker image baking via `BAKE_PARQUET`, and README / env example documentation for the new settings.

## Files touched

| File | Action | Notes |
| --- | --- | --- |
| `backend/pyproject.toml` | Modified | boto3, pyarrow, dev test deps |
| `backend/uv.lock` | Modified | Locked dependencies |
| `backend/app/core/config.py` | Modified | `S3_*`, `PARQUET_LOCAL_FALLBACK_DIR` |
| `backend/app/services/parquet_store.py` | Added | Store implementation |
| `backend/app/services/__init__.py` | Added | Package init |
| `backend/tests/test_parquet_store.py` | Added | Unit tests |
| `backend/data/parquet/.gitkeep` | Added | Fallback directory |
| `backend/.dockerignore` | Modified | Data ignore + parquet exception |
| `backend/Dockerfile` | Modified | `BAKE_PARQUET` |
| `.github/workflows/ci.yml` | Modified | Comment |
| `.env.example` | Modified | S3-related vars |
| `README.md` | Modified | S3/parquet docs |

## Decisions

- Kept `data/parquet` visible to Docker context via `.dockerignore` exceptions so production bakes can still `COPY` the tree while other `data/` paths stay out of builds.
- Left HTTP headers to future API routes; the store only returns a source tag.

## Still open

- Wire `ParquetStore` into FastAPI routes when the data-serving milestone lands.
- Run Docker builds on a workstation with Docker installed to confirm both `BAKE_PARQUET` values.

## Validation

```text
cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy --strict app/ && uv run mypy --strict tests/ && uv run pytest -v
# ruff OK; mypy OK; 11 tests passed
```
