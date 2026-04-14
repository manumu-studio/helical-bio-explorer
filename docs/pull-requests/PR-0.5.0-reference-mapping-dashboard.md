# PR-0.5.0 — Reference-mapping dashboard

**Branch:** `feature/dashboard` → `main`  
**Version:** 0.5.0  
**Date:** 2026-04-13  
**Status:** ✅ Ready to merge  

---

## Summary

This change adds the main product UI: a dark-themed, tabbed dashboard at `/dashboard` that loads precomputed single-cell artifacts from the FastAPI `/api/v1` routes. Users can step through reference UMAP, disease projection, distance summaries, and cross-model disagreement, with filters and a provenance indicator tied to the `X-Served-From` response header. The home route redirects to the dashboard. Compose smoke checks now validate the redirect and a successful response from `/dashboard`.

## Files Changed

| File | Action | Notes |
| --- | --- | --- |
| `frontend/*` | Created/Modified | Dashboard routes, components, Zod schemas, Tailwind v4, Plotly |
| `scripts/e2e-compose-smoke.sh` | Modified | Redirect and `/dashboard` health check |
| `README.md` | Modified | Dashboard description and `NEXT_PUBLIC_BACKEND_URL` |

## Architecture Decisions

| Decision | Why |
| --- | --- |
| Client-side fetches with `NEXT_PUBLIC_BACKEND_URL` | Browser calls the API directly; avoids proxying through Next for this milestone. |
| Dynamic `import()` for Plotly | Keeps SSR bundles safe (`react-plotly.js` needs `window`). |
| Optional Tailwind oxide platform packages | Fixes “Cannot find native binding” under pnpm on macOS and Linux runners. |

## Testing Checklist

- [x] `pnpm typecheck` (frontend)
- [x] `pnpm lint` (frontend)
- [x] `pnpm build` (frontend)
- [ ] Manual: backend up with parquet fixtures; open `/dashboard`, exercise all four tabs and filters
- [ ] `./scripts/e2e-compose-smoke.sh` with Docker (optional local verification)

## Deployment Notes

- Set `NEXT_PUBLIC_BACKEND_URL` in the frontend environment to the public API base URL (same value you use for server-side `BACKEND_URL` in development).
- Ensure CORS on the backend allows the frontend origin if API and app are on different hosts.

## Validation

```text
cd frontend && pnpm typecheck && pnpm lint && pnpm build
# typecheck: pass, lint: no warnings, build: success
```
