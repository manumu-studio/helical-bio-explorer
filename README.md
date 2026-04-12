# helical-bio-explorer

A small web app that explores how different bio foundation models "see" single-cell RNA-seq data — pick a dataset, pick a model, see how it organizes the cells.

## Stack

- **Backend:** Python 3.11 + FastAPI + pytest
- **Frontend:** Next.js 15 + React + TypeScript (Tailwind in a later UI milestone)
- **Models:** wrapped via the open-source [Helical SDK](https://github.com/helicalAI/helical)
- **Data:** public single-cell datasets (PBMC 3k, `yolksac_human`, CELLxGENE)
- **Tooling:** Docker Compose, GitHub Actions, Husky (git hooks), pnpm

## Why this exists

Bio foundation models like Geneformer, scGPT and GenePT promise to do for cells what GPT did for text — but each lives behind different installation rituals, APIs and assumptions. The Helical SDK unifies them. This project is a small front-end on top of that SDK: side-by-side embeddings, interactive UMAPs, model-to-model comparisons.

## Status

**Persistence layer (v0.2.0).** FastAPI exposes `GET /api/datasets` backed by Neon Postgres via SQLModel (asyncpg at runtime). Next.js includes a server-rendered `/datasets` page and a Prisma schema for `saved_views` only — dual-ORM bounded contexts on one database, as described in [ADR-003](docs/research/DECISIONS.md#adr-003--dual-orm-bounded-contexts-on-a-shared-postgres).

**S3 / Parquet plumbing.** The backend includes a `ParquetStore` service that reads versioned parquet bytes from S3 first and falls back to a read-only local directory on any S3 error ([ADR-005](docs/research/DECISIONS.md#adr-005--local-parquet-fallback-for-runtime-resilience)). API routes will consume this store in a later milestone.

**Precompute (v0.4.0).** The `notebooks/` folder documents how to run `precompute_reference_mapping.ipynb` on Google Colab (GPU) to generate parquet artifacts and provenance rows; see `notebooks/README.md`.

The Helical SDK and interactive dashboard views are later milestones.

See [docs/research/DECISIONS.md](docs/research/DECISIONS.md) for architecture decisions and [docs/journal/](docs/journal/) for the build log.

## Quick start

```bash
cp .env.example .env
# Backend (Python 3.11 + uv)
cd backend && uv venv --python 3.11 .venv && source .venv/bin/activate && uv pip install -e ".[dev]" && uvicorn app.main:app --reload --port 8000
# Frontend (in another terminal); optional .env.local with BACKEND_URL=http://localhost:8000
cd frontend && corepack enable && pnpm install && pnpm dev
```

With Docker: from the repo root, run **`./scripts/e2e-compose-smoke.sh`** — builds both images, waits for `/health`, seeds the dataset registry, asserts `/api/datasets` includes **`pbmc3k`**, checks the home page contains **`backend: ok`**, then runs `docker compose down`. Requires Docker Desktop (or Colima) running and a populated **repo-root `.env`** with Neon URLs (see Persistence layer below).

### Persistence layer

Neon provides one Postgres database; the backend and frontend use **different ORMs and migration tools** on non-overlapping tables (`datasets` / `precompute_runs` vs `saved_views`). See [ADR-003](docs/research/DECISIONS.md#adr-003--dual-orm-bounded-contexts-on-a-shared-postgres).

1. **Environment variables**
   - **`DATABASE_URL`** — pooled Neon connection string for **asyncpg** at runtime. Must start with `postgresql+asyncpg://`.
   - **`DIRECT_URL`** — direct (non-pooled) Neon URL for **Alembic** and **Prisma Migrate**. Must start with `postgresql://` (no `+asyncpg`).
   - Put the same logical pair in **repo-root `.env`** (for Compose), **`backend/.env`** (for local `uvicorn`), and **`frontend/.env.local`** (for Next.js and Prisma). Comment templates live in [`.env.example`](.env.example).

2. **Backend schema (Alembic + SQLModel)**

   ```bash
   cd backend && uv sync --extra dev
   export DATABASE_URL="postgresql+asyncpg://..." DIRECT_URL="postgresql://..."
   uv run alembic upgrade head
   uv run python -m app.scripts.seed_datasets
   uv run python -m app.scripts.seed_sle_dataset
   ```

3. **Frontend schema (Prisma)**

   ```bash
   cd frontend && pnpm install
   export DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..."
   pnpm prisma migrate deploy
   ```

4. **Try the API locally**

   ```bash
   curl -sS http://localhost:8000/api/datasets | jq .
   ```

Runtime asyncpg uses `statement_cache_size=0` in `app/db/session.py` so Neon's PgBouncer transaction pool mode does not break prepared statements.

### S3 / Parquet configuration

Precomputed artifacts are stored as versioned parquet objects. The backend `ParquetStore` (see `backend/app/services/parquet_store.py`) tries S3 once per read, then falls back to the local directory below if the request fails (for example missing key, permissions, or network error). There is no retry or backoff.

1. **Create an S3 bucket** (for example in the AWS console) and keep it **public-read** for the demo dataset prefix, or use private buckets with credentials appropriate to your environment. Bucket creation and IAM are outside this repo; only the read path is implemented here.

2. **Environment variables** (see [`.env.example`](.env.example)):

   - **`S3_BUCKET`** — Optional. When set, `ParquetStore` attempts `get_object` on `s3://{S3_BUCKET}/v{version}/{dataset_slug}/{artifact_type}.parquet`. When unset, reads use **only** the local fallback directory (useful for offline development).

   - **`S3_REGION`** — AWS region for the S3 client. Defaults to `us-east-1`.

   - **`S3_ENDPOINT_URL`** — Optional. Override the S3 endpoint (for example LocalStack or moto-backed tests).

   - **`PARQUET_LOCAL_FALLBACK_DIR`** — Directory for fallback files at `{PARQUET_LOCAL_FALLBACK_DIR}/{dataset_slug}/{artifact_type}.parquet`. Defaults to `data/parquet` relative to the process working directory.

3. **Docker production images** — To bake fallback parquet into the backend image, build with `--build-arg BAKE_PARQUET=true` from `backend/`. Default builds skip copying parquet data; see `backend/Dockerfile`.

## Git hooks (Husky)

After cloning, from the **repo root** (once):

```bash
corepack enable && pnpm install
```

The root `package.json` `prepare` script runs **Husky**, which points Git at `.husky/`.

| Hook | What runs |
| --- | --- |
| **pre-commit** | `frontend`: `pnpm typecheck`, `pnpm lint`. `backend`: `ruff check`, `ruff format --check`, `mypy --strict` on `app/` and `tests/` (requires `backend/.venv` — see Quick start). |
| **pre-push** | `frontend`: `lint`, `typecheck`, `build`. `backend`: `ruff`, `mypy`, `pytest -v`. |
| **commit-msg** | Conventional commit first line + blocks internal tooling tokens in the message body. |

## Cursor

Project rule for the agent: **`.cursor/rules/helical-bio-explorer.mdc`** (`alwaysApply: true`). Optional skill assets may live under `.cursor/skills/` (listed in `.gitignore`, not committed); they are separate from that rule file.

## Structure

```
package.json      # root: husky prepare only (pnpm)
backend/          # FastAPI app (health, logging, error handling)
frontend/         # Next.js 15 + TypeScript strict + Zod
.husky/           # git hooks
.cursor/rules/    # Cursor project rules (.mdc)
docs/
  research/       # company/industry/model analysis + decisions
  friend-interview/  # domain expert input (PhD neuroscientist)
  journal/        # developer-facing journal entries
  chat-sessions/  # AI session summaries (auto-managed)
  pull-requests/  # PR docs
  architecture/   # ADRs + system docs
.github/workflows/  # CI (backend + frontend)
```

## License

TBD
