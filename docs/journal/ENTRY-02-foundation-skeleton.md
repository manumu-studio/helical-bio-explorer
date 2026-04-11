# Entry 02 — Foundation skeleton

**Date:** 2026-04-11  
**Type:** Infrastructure  
**Branch:** `feat/foundation-skeleton`  
**Version:** 0.1.0  

## Summary

Added the first runnable monorepo slice: a FastAPI service with `/health`, structured logging, request IDs, and sanitized error responses; a Next.js 15 app that probes that endpoint with a Zod-validated fetch helper; Dockerfiles for both services; root Docker Compose wiring; and a GitHub Actions workflow that runs backend and frontend checks in parallel.

## What was done

1. **Backend** — Python 3.11 project managed with `uv`, FastAPI app factory, Pydantic settings (`ENV`, `LOG_LEVEL`, `BACKEND_CORS_ORIGINS`), JSON logs in production and plain text in development, `X-Request-ID` on every response, global handlers for `AppError` and uncaught exceptions (no stack traces in JSON bodies), and pytest smoke tests over `httpx` + `ASGITransport`.
2. **Frontend** — Next.js 15 App Router with strict TypeScript flags, ESLint flat config, Zod schema for `/health`, a small typed `fetch` wrapper, and a server-rendered home page that shows whether the backend health check succeeded.
3. **Ops** — Multi-stage non-root Dockerfiles, `docker-compose.yml` on a named network, `.env.example`, and CI on `ubuntu-latest` for both stacks.

## Files touched (high level)

| Area | Files |
| --- | --- |
| Backend | `backend/app/`, `backend/tests/`, `backend/pyproject.toml`, `backend/Dockerfile`, `backend/.dockerignore` |
| Frontend | `frontend/app/`, `frontend/lib/`, `frontend/package.json`, `frontend/pnpm-lock.yaml`, `frontend/tsconfig.json`, `frontend/next.config.ts`, `frontend/eslint.config.mjs`, `frontend/Dockerfile`, `frontend/.dockerignore` |
| Repo | `docker-compose.yml`, `.env.example`, `.github/workflows/ci.yml`, `.gitignore`, `README.md`, `DEVELOPMENT_JOURNAL.md` |

## Decisions

- **ASGI middleware for request IDs** — Implemented request ID injection as pure ASGI middleware instead of `BaseHTTPMiddleware`, because the latter interacts poorly with how Starlette/FastAPI surface handled exceptions through the stack. Behavior matches the original intent: propagate or generate `X-Request-ID` and attach a `LoggerAdapter`.
- **`ASGITransport(..., raise_app_exceptions=False)` in one test** — Starlette’s `ServerErrorMiddleware` deliberately re-raises after sending a 500 body so servers and test clients can log the original exception; httpx otherwise surfaces that as a failed request even when the HTTP response is correct.
- **Monorepo lockfile noise** — Set `outputFileTracingRoot` in `next.config.ts` so standalone builds do not pick up an unrelated `pnpm-lock.yaml` outside this repository.

## Still open

- Run `docker compose up --build` and image builds locally when Docker is available; they were not executed in the automation environment used for this change.
- `next lint` prints a deprecation notice toward ESLint CLI; lint still exits zero with no ESLint findings.
- Align local branch name with your preferred convention before opening the pull request.

## Validation

**Backend**

```text
ruff check . && ruff format --check . && mypy --strict app/ && mypy --strict tests/ && pytest -v
# 3 passed
```

**Frontend**

```text
pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm build
# success; next lint: no ESLint warnings or errors
```
