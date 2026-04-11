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

**Foundation skeleton (v0.1.0).** FastAPI `/health` plus global error handling (`app/core/errors.py`) and a Next.js home page that probes `/health` via `lib/fetcher.ts` + `HealthSchema` (server-side **`BACKEND_URL`**, not `NEXT_PUBLIC_*`). See [docs/learning/PACKET-01a-concepts.md](docs/learning/PACKET-01a-concepts.md) for the concept brief and interview drills.

Docker Compose and GitHub Actions CI are wired. The Helical SDK and database layers come in later milestones.

See [docs/research/DECISIONS.md](docs/research/DECISIONS.md) for architecture decisions and [docs/journal/](docs/journal/) for the build log.

## Quick start

```bash
cp .env.example .env
# Backend (Python 3.11 + uv)
cd backend && uv venv --python 3.11 .venv && source .venv/bin/activate && uv pip install -e ".[dev]" && uvicorn app.main:app --reload --port 8000
# Frontend (in another terminal); optional .env.local with BACKEND_URL=http://localhost:8000
cd frontend && corepack enable && pnpm install && pnpm dev
```

With Docker: from the repo root, run **`./scripts/e2e-compose-smoke.sh`** — builds both images, waits for `/health`, checks the home page contains **`backend: ok`**, then runs `docker compose down`. Requires Docker Desktop (or Colima) running.

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
