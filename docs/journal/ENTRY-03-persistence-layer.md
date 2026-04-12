# Entry 03 — Persistence layer

**Date:** 2026-04-12  
**Type:** Feature  
**Branch:** `feature/persistence-layer`  
**Version:** 0.2.0  

## Summary

Introduced the first database-backed API slice: SQLModel models for `datasets` and `precompute_runs`, Alembic migrations, an async session dependency with Neon-safe asyncpg settings, `GET /api/datasets`, an idempotent Postgres seed for PBMC 3k, and pytest coverage over an in-memory SQLite override. On the Next.js side, added Prisma with a hand-written `saved_views` migration, a lazy Prisma client singleton, Zod schemas mirroring the API, and a server-rendered `/datasets` table. CI now checks Alembic offline SQL and runs `prisma generate` before the frontend build; the compose smoke script seeds and asserts `pbmc3k`.

## What was done

1. **Backend** — New dependencies (`sqlmodel`, `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `psycopg[binary]`), `Settings.database_url` / `direct_url` with strict prefix validation, `app/db/session.py` and `app/db/models.py`, Alembic env wired to `SQLModel.metadata` and `DIRECT_URL` via psycopg, first revision creating both SQLModel-owned tables, Pydantic `DatasetOut` / `DatasetsResponse`, `GET /api/datasets`, and `app/scripts/seed_datasets.py` using `INSERT ... ON CONFLICT (slug) DO UPDATE`.
2. **Frontend** — `prisma` + `@prisma/client`, `schema.prisma` with `directUrl`, first migration SQL for `saved_views` only, `lib/db/prisma.ts`, `lib/schemas/datasets.ts`, and `app/datasets/page.tsx` using the existing Zod fetch helper.
3. **Ops** — Docker Compose `env_file: .env` for both services, Dockerfiles updated to ship Alembic and to run `prisma generate` during the frontend image build, CI steps for offline migration SQL and Prisma client generation, and an extended `e2e-compose-smoke.sh`.

## Files touched (high level)

| Area | Files |
| --- | --- |
| Backend | `backend/pyproject.toml`, `backend/app/core/config.py`, `backend/app/db/`, `backend/app/schemas/`, `backend/app/api/datasets.py`, `backend/app/main.py`, `backend/app/scripts/seed_datasets.py`, `backend/alembic.ini`, `backend/alembic/`, `backend/tests/` |
| Frontend | `frontend/package.json`, `frontend/pnpm-lock.yaml`, `frontend/prisma/`, `frontend/lib/db/prisma.ts`, `frontend/lib/schemas/datasets.ts`, `frontend/app/datasets/page.tsx`, `frontend/.gitignore`, `frontend/Dockerfile` |
| Repo | `docker-compose.yml`, `.env.example`, `.github/workflows/ci.yml`, `scripts/e2e-compose-smoke.sh`, `README.md`, `backend/Dockerfile` |

## Decisions

- **Dual-ORM on one Neon instance** — Matches [ADR-003](../research/DECISIONS.md#adr-003--dual-orm-bounded-contexts-on-a-shared-postgres): FastAPI + SQLModel + Alembic own `datasets` and `precompute_runs`; Next.js + Prisma owns `saved_views` only. Neither stack migrates the other’s tables.
- **asyncpg at runtime, psycopg for Alembic** — Alembic runs synchronously; `alembic/env.py` maps `DIRECT_URL` to `postgresql+psycopg://` for SQLAlchemy’s psycopg3 driver.
- **`statement_cache_size=0` on asyncpg** — Avoids prepared-statement cache clashes with PgBouncer in Neon’s pooled mode.
- **Seed script separate from migrations** — Schema is versioned by Alembic; canonical dataset rows are applied idempotently via `python -m app.scripts.seed_datasets`.
- **Unit tests on SQLite** — FastAPI tests override `get_session` with `sqlite+aiosqlite:///:memory:` and `create_all` for SQLModel metadata; production remains Postgres.

## Still open

- Compose smoke and production deploys assume migrations have been applied to the target database before seeding.
- A second disease PBMC dataset for the precompute milestone is still TBD in project planning docs.

## Validation

**Backend**

```text
ruff check . && ruff format --check . && mypy --strict app/ && mypy --strict tests/ && pytest -v
# 7 passed
```

**Frontend**

```text
pnpm install --frozen-lockfile && pnpm prisma generate && pnpm lint && pnpm typecheck && pnpm build
# success
```

**Alembic (offline)**

```text
uv run alembic upgrade head --sql
uv run alembic downgrade head:base --sql
```
