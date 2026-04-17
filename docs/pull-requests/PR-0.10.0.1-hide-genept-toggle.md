# PR-0.10.0.1 — hide GenePT toggle until real parquets land

**Branch:** `fix/hide-genept-toggle-until-data` → `main`
**Version:** 0.10.0.1 (hot-fix on 0.10.0)
**Date:** 2026-04-16
**Status:** Ready to merge — prod regression blocker

---

## Summary

Hot-fix for a scoping miss in PR-0.10.0. The GenePT toggle in the MODEL filter panel stayed live after merging 0.10.0, even though no GenePT embeddings shipped. Clicking it fired `GET /api/v1/embeddings/pbmc3k/genept`, the backend correctly returned 404, and the dashboard surfaced a page-blocking error banner over the Reference and Projection views on production.

This PR trims the FilterPanel MODEL toggle to Geneformer only, mirroring the DashboardShell TABS trim that already hides Distance + Disagreement. The GenePT toggle reappears in 0.10.1 by reverting this one line once the real parquets are present.

## Root cause

In PR-0.10.0 we hid the **tabs** that depend on GenePT data (Distance, Disagreement) but left the **MODEL toggle** untouched. The MODEL toggle is rendered by `FilterPanel.tsx` and shared across all four view hooks (`useReferenceView`, `useProjectionView`, `useDistanceView`, `useDisagreementView`). Each hook rebuilds its fetch URL from `modelName`, so the moment a user clicks GenePT on Reference or Projection, the UI calls a backend path that has no data or route behind it.

Evidence captured via Chrome DevTools on production:

```
Request URL:   https://api.helical.manumustudio.com/api/v1/embeddings/pbmc3k/genept?sample_size=5000
Request Method: GET
Status Code:    404 Not Found
Remote Address: 44.208.232.28:443
Server:         nginx/1.24.0 (Ubuntu)
CORS:           Access-Control-Allow-Origin: https://helical.manumustudio.com  (fine)
```

CORS, TLS, backend liveness, and the Geneformer path all verified healthy. The regression was entirely a frontend scoping gap.

## What this PR ships

| File | Action | Notes |
| --- | --- | --- |
| `frontend/components/FilterPanel/FilterPanel.tsx` | Modified | MODELS array trimmed from `[geneformer, genept]` to `[geneformer]`. Comment mirrors the TABS comment in `DashboardShell.tsx`. |
| `docs/pull-requests/PR-0.10.0.1-hide-genept-toggle.md` | Added | This file. |

## What this PR does **not** ship

- No backend changes. The 404 is the backend behaving correctly — nothing to fix there.
- No changes to `DashboardShell.tsx` (its TABS array was already correct).
- No revert of PR-0.10.0. The infrastructure PR is intact; only the MODEL toggle needs scoping.

## Why one-line over a feature flag

A feature flag (e.g. `NEXT_PUBLIC_ENABLE_GENEPT`) was considered and rejected. The gate is purely "are the parquets present in `backend/data/parquet/`?", which is a binary Colab-run checkpoint, not a rollout dial. Shipping a flag for a toggle that flips exactly once, in exactly one PR (0.10.1), is overhead without benefit. The one-line pattern also matches the TABS trim already in the codebase, so reviewers see a consistent "hide until data lands" idiom applied in two places instead of one flag + one literal.

## Verification

Local quality gate, run before push:

```text
cd frontend && pnpm typecheck && pnpm lint && pnpm build
```

- `pnpm typecheck` ✅ (no errors)
- `pnpm lint` ✅ (no ESLint warnings or errors)
- `pnpm build` ✅ (`/dashboard` 19.8 kB — no bundle-size regression)

## How to test after merge

1. Wait for Vercel to redeploy `main` (~1 minute).
2. Hard-reload https://helical.manumustudio.com/dashboard (Cmd/Ctrl + Shift + R).
3. On the **Reference** tab: confirm the MODEL section shows only the Geneformer button, no GenePT. UMAP renders cleanly, no `HTTP 404` banner.
4. Click **Projection**: same — Geneformer-only toggle, COVID UMAP renders, severity legend visible, no error banner.
5. DevTools Network (Fetch/XHR): confirm no requests to `/embeddings/pbmc3k/genept` are fired.

## Rollback path

Revert the `MODELS` array in `FilterPanel.tsx` to include `{ id: "genept", label: "GenePT" }`. No other change needed. This is the exact reversal path that PR-0.10.1 will execute once the real GenePT parquets are copied from S3 into `backend/data/parquet/`.

## Related

- **PR-0.10.0** — shipped the GenePT infrastructure (notebook, emitter, tests, docs, tab trim). Introduced the scoping gap this PR fixes.
- **PR-0.10.1** — will land the real GenePT parquets from a Colab T4 run and reverse both the TABS trim (DashboardShell) and the MODELS trim (FilterPanel).
