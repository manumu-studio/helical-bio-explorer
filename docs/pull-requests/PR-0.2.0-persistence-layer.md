# PR-0.2.0 — Persistence layer

**Branch:** `feature/persistence-layer` → `main`  
**Version:** 0.2.0  
**Date:** 2026-04-12  
**Status:** Ready for review (merge only after Gate 1 below)

---

## Summary

Adds Neon-backed persistence with clear ownership boundaries: the Python service owns the dataset registry and future precompute provenance tables via SQLModel and Alembic; the Next.js app owns anonymous saved-view state via Prisma. Delivers `GET /api/datasets`, an idempotent seed for the PBMC 3k reference row, a `/datasets` server page that validates responses with Zod, CI checks for migration SQL and generated Prisma clients, and a compose smoke test that exercises seeding plus the new endpoint.

**Do not merge until Gate 1 (compose smoke with datasets assertion) passes on your machine** — from the repo root, with a valid repo-root `.env` pointing at Neon and migrations applied, run `./scripts/e2e-compose-smoke.sh` and confirm it exits zero.

## Files changed

| File / area | Action | Notes |
| --- | --- | --- |
| `backend/pyproject.toml` | Modified | Persistence dependencies; dev `aiosqlite`; Pydantic mypy plugin |
| `backend/app/core/config.py` | Modified | `DATABASE_URL` / `DIRECT_URL` with prefix validation |
| `backend/app/db/` | Added | Async engine, session dependency, SQLModel tables |
| `backend/app/schemas/datasets.py` | Added | API response models decoupled from ORM |
| `backend/app/api/datasets.py` | Added | `GET /api/datasets` |
| `backend/app/main.py` | Modified | Registers datasets router |
| `backend/app/scripts/seed_datasets.py` | Added | Idempotent upsert for `pbmc3k` |
| `backend/alembic/` | Added | Env + first migration for SQLModel tables |
| `backend/tests/` | Modified | Env defaults in `conftest`; datasets endpoint tests |
| `frontend/package.json` / lockfile | Modified | Prisma client + CLI |
| `frontend/prisma/` | Added | Schema, first migration (`saved_views` only) |
| `frontend/lib/db/prisma.ts` | Added | Lazy Prisma singleton |
| `frontend/lib/schemas/datasets.ts` | Added | Zod mirror of API |
| `frontend/app/datasets/page.tsx` | Added | Server table view |
| `frontend/Dockerfile` | Modified | Prisma generate in deps stage |
| `backend/Dockerfile` | Modified | Ship Alembic assets |
| `docker-compose.yml` | Modified | Load repo-root `.env` into both services |
| `.env.example` | Modified | Document Neon URL pair |
| `.github/workflows/ci.yml` | Modified | Alembic `--sql` check; `prisma generate` |
| `scripts/e2e-compose-smoke.sh` | Modified | Seed + `pbmc3k` assertion |
| `README.md` | Modified | Persistence setup and curl example |

## Architecture decisions

| Decision | Why |
| --- | --- |
| Dual-ORM bounded contexts (ADR-003) | Keeps Python and TypeScript each authoritative for their own tables and migration history without cross-coupling. |
| `DIRECT_URL` for Alembic / Prisma Migrate | Neon's pooler uses transaction-mode PgBouncer; migrations need a direct session. |
| `statement_cache_size=0` for asyncpg | Prevents prepared-statement reuse errors against the pooled endpoint. |
| SQLite in unit tests | Fast CI and local runs without Docker Postgres; integration is covered by compose smoke against real Neon. |

## Testing checklist

- [ ] `cd backend && uv sync --extra dev && ruff check . && ruff format --check . && mypy --strict app/ && mypy --strict tests/ && pytest -v`
- [ ] `cd backend && uv run alembic upgrade head` against your Neon database (after reviewing SQL)
- [ ] `cd backend && uv run python -m app.scripts.seed_datasets` (run twice; second run should log `updated`)
- [ ] `cd frontend && pnpm install && pnpm prisma migrate deploy && pnpm lint && pnpm typecheck && pnpm build`
- [ ] `./scripts/e2e-compose-smoke.sh` with repo-root `.env` configured (Gate 1 — **required before merge**)
- [ ] Manually open `http://localhost:3000/datasets` with backend running and confirm rows render

## Deployment notes

- Apply **both** migration streams to the same Neon database before deploying: `uv run alembic upgrade head` in `backend/`, then `pnpm prisma migrate deploy` in `frontend/`.
- Ensure runtime env vars are set in every environment: pooled `DATABASE_URL` with `+asyncpg` for the API and Next.js server, plus `DIRECT_URL` for migration commands.
- Re-run the seed after disaster recovery or empty databases: `python -m app.scripts.seed_datasets` inside the backend container or venv.

## Validation (author environment)

Backend: `ruff check .`, `ruff format --check .`, `mypy --strict app/`, `mypy --strict tests/`, `pytest -v` — seven tests passing. Frontend: `pnpm typecheck`, `pnpm lint`, `pnpm build` — success. Alembic: `upgrade head --sql` and `downgrade head:base --sql` produced expected DDL offline.
