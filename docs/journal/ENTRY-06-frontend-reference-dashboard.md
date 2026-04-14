# ENTRY-06 — Reference-mapping dashboard

**Date:** 2026-04-13  
**Type:** Feature  
**Branch:** `feature/dashboard`  
**Version:** 0.5.0  

---

## What I Did

Shipped the interactive dashboard at `/dashboard`: tabbed navigation for the four reference-mapping steps, Plotly charts (UMAP scatters, grouped bars, agreement scatter), shared filters and provenance chip driven by `X-Served-From`, Zod validation matching the v1 API, and Tailwind v4 dark styling. Root `/` now redirects to the dashboard. Updated the Docker compose smoke script and README to match the new entry behavior.

## Files Touched

| File | Action | Notes |
| --- | --- | --- |
| `frontend/package.json` | Modified | Plotly + Tailwind v4 + oxide optional deps |
| `frontend/postcss.config.mjs` | Created | `@tailwindcss/postcss` |
| `frontend/app/globals.css` | Modified | `@import "tailwindcss"` + theme tokens |
| `frontend/lib/*` | Created/Modified | Schemas, fetcher, backend URL, cell colors |
| `frontend/components/*` | Created | Shell, views, Plotly wrappers |
| `frontend/app/dashboard/page.tsx` | Created | Tab state + view wiring |
| `frontend/app/page.tsx` | Modified | Redirect to `/dashboard` |
| `frontend/app/layout.tsx` | Modified | Metadata + body class |
| `frontend/app/datasets/page.tsx` | Modified | `fetcher` now returns `{ data }` |
| `scripts/e2e-compose-smoke.sh` | Modified | Assert redirect + `/dashboard` 200 |
| `README.md` | Modified | Dashboard + env note |

## Decisions

- Kept filters usable on views that hide the model row by adding an optional `showModel` flag on `FilterPanel`.
- Registered platform-specific Tailwind oxide packages under `optionalDependencies` so CI and local dev both resolve native bindings.

## Still Open

- Saved-views UI remains deferred (Prisma table exists only).
- No React component unit tests in this milestone (visual / manual smoke only).

## Validation

- `pnpm typecheck`, `pnpm lint`, `pnpm build` in `frontend/` — all succeeded.
