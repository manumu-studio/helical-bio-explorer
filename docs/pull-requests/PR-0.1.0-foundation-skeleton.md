# PR 0.1.0 — Foundation skeleton

**Branch:** `feat/foundation-skeleton` → `main`  
**Version:** 0.1.0  
**Date:** 2026-04-11  
**Status:** Open PR — **do not merge** until the gates below are checked (pushing the branch is fine; merging is the permanent record).

## Summary

This change introduces the initial application skeleton: a FastAPI backend exposing `/health` with structured logging, request correlation IDs, and global JSON error handlers (`backend/app/core/errors.py`); a Next.js 15 app whose home page probes `/health` through a Zod-validated fetch helper (`frontend/lib/fetcher.ts`) using server-side **`BACKEND_URL`** (not `NEXT_PUBLIC_*`); Dockerfiles for both services; a root Docker Compose file; and CI that runs Python and Node quality gates in parallel.

**Honest scope:** Unit and static checks are green locally; **Docker Compose end-to-end** (`backend: ok` in HTML from the running stack) is **not** verified until you run the compose smoke test below. Do not claim full stack verification in conversation or interviews until that box is checked.

## Push vs merge (first PR on an empty repo)

| Step | What it is | When |
| --- | --- | --- |
| **Push** | `feat/foundation-skeleton` to origin | After the three gates; cheap and reversible |
| **Open PR** | PR into `main`, leave **open** | Right after push; review the diff in GitHub’s UI (different lens than local) |
| **Merge** | Closes PR, updates `main` | Only after compose smoke passes **and** you are satisfied with the diff — consider sleeping on it |

**Pushing is not merging.** Interviewers see `main`; treat merge as a separate, deliberate decision.

## Three gates before you push

1. **Docker Compose smoke:** run **`./scripts/e2e-compose-smoke.sh`** from the repo root (wraps `docker compose up --build`, curls `/health` and `/`, asserts **`backend: ok`** in HTML, then `docker compose down`). Requires Docker locally — CI does not replace this.
2. **Muscle memory on boundary files:** Re-type or re-copy-with-reading `backend/app/core/errors.py` and `frontend/lib/fetcher.ts` (~20 minutes). Defensibility in R2 is “I wrote this,” not “I recognize this.” *(Only you can do this.)*
3. **Socratic pass:** Out loud using `docs/learning/PACKET-01a-concepts.md`; use `docs/learning/SOCRATIC-PACKET-01a-self-check.md` as a prompt sheet; log gaps in `docs/learning/LEARNING-LOG.md` if anything wobbles.

## Files changed (overview)

| File / area | Action | Notes |
| --- | --- | --- |
| `backend/` | Added | FastAPI app, settings, logging, middleware, error handlers, tests, packaging, Docker |
| `frontend/` | Added | Next.js App Router app, schemas, fetch helper, tooling, Docker |
| `docker-compose.yml` | Added | Backend port 8000, frontend 3000, network `helical-net` |
| `.env.example` | Added | Non-secret defaults for local development |
| `.github/workflows/ci.yml` | Added | Backend: uv, ruff, mypy, pytest; frontend: pnpm, lint, typecheck, build |
| `.gitignore` | Updated | Explicit `.env.local` / `.env.*.local` entries |
| `README.md` | Updated | Reflects runnable skeleton |
| `DEVELOPMENT_JOURNAL.md` | Added | Index linking to this work |

## Architecture decisions

| Decision | Why |
| --- | --- |
| Pydantic settings for CORS origins | Keeps deployment-specific values out of code; supports JSON-encoded list from the environment. |
| Zod parse at the fetch boundary (`frontend/lib/fetcher.ts`) | Runtime validation of JSON over the wire; TypeScript alone does not prove the server’s shape at runtime. |
| Separate Docker images + Compose | Matches the target deployment shape (two processes) while keeping build contexts small. |

## Testing checklist

- [x] `cd backend && uv venv --python 3.11 .venv && source .venv/bin/activate && uv pip install -e ".[dev]" && ruff check . && mypy --strict app/ && mypy --strict tests/ && pytest -v`
- [x] `cd frontend && pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm build`
- [ ] **Gate 1 — Compose E2E:** `./scripts/e2e-compose-smoke.sh` (or equivalent manual curls)
- [ ] **Gate 2 — Retype:** `errors.py` + `fetcher.ts` (muscle memory pass)
- [ ] **Gate 3 — Socratic:** verbal pass on `docs/learning/PACKET-01a-concepts.md`
- [ ] **Then:** push branch, open PR, **do not merge** until you re-read the GitHub diff and are willing to stand behind it

## Deployment notes

- Set **`BACKEND_URL`** at runtime for the Next.js container when using server-side fetches (Compose already sets `BACKEND_URL=http://backend:8000` for `frontend`). Use `NEXT_PUBLIC_*` only when the browser must call the API directly.
- Backend reads `ENV`, `LOG_LEVEL`, and `BACKEND_CORS_ORIGINS` (JSON array string) from the environment; see `.env.example`.

## Validation (author)

Backend: `ruff check .`, `mypy --strict app/`, `mypy --strict tests/`, `pytest -v` — all green (4 tests).  
Frontend: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm build` — all green.
