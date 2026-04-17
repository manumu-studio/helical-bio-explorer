# ENTRY-12 — Demo polish for R2 interview

**Date:** 2026-04-17
**Type:** Feature (polish)
**Branch:** `feature/demo-polish`
**Version:** 0.11.0

---

## What I did

Took the dashboard from "technically live" to "presentation-ready" for the 20-min Helical R2 show-and-tell. This was entirely polish — no new dashboard views, no new data transformations.

### Provenance chip — full surface

The `ProvenanceChip` previously showed only an S3/Local dot from the `X-Served-From` header. Now it renders all five provenance dimensions: source dot, model name, model version, 7-char git SHA, and relative timestamp ("2 hours ago" via `date-fns`). A new backend route `GET /api/v1/provenance/{dataset}/{model}` returns the latest `precompute_runs` row for a given pair. The chip re-fetches when the user switches tabs or toggles models.

### Empty states

Previously, a missing parquet would crash the Zod parse or render a broken Plotly chart — both look like bugs during a demo. A new `fetchJsonOrNotFound` helper distinguishes HTTP 404 (artifact not computed yet) from 5xx (real error). Each view hook now returns a discriminated union (`loading | ready | not_found | error`), and `DashboardEmptyState` renders clear copy explaining what notebook run is needed.

### About panel

A modal triggered by an info icon in the `DashboardShell` header. Three paragraphs: what reference mapping is (paraphrasing ADR-001), what each tab shows, and how the demo was built. Copy lives in `aboutPanelCopy.ts` for easy editing. Three external links: GitHub, API Explorer (Swagger), Helical SDK.

### Footer

Persistent row below `<main>` with the same three links. Tailwind only, `target="_blank"`, color-shift hover.

### Chart skeletons

`ChartSkeleton` component with `umap` and `bar` variants — gray `animate-pulse` rectangles matching each chart's aspect ratio. Replaces the previous spinner pattern and eliminates layout shift (CLS) when data lands.

### README hero

Product one-liner, embedded dashboard screenshot (`docs/assets/dashboard-hero.png`), 2-column live demo / API table, quick-links section.

## Decisions

- **One new backend route only** — provenance is a clean read off the existing table; no other backend surface area touched.
- **Empty state, not error state, on 404** — a missing parquet is expected during staged rollout, not a failure.
- **Modal, not route, for About** — one-page demo doesn't need `/about` routing.
- **Skeleton over spinner** — prevents CLS, which is one of the cheapest polish wins.
- **Manual screenshot** — Playwright adds a dep and CI step for one PNG.

## Files touched

| File | Action | Notes |
|---|---|---|
| `backend/app/api/v1/provenance.py` | Created | GET route returning latest precompute_runs row |
| `backend/app/schemas/provenance.py` | Created | ProvenanceResponse Pydantic model |
| `backend/app/api/v1/__init__.py` | Modified | Register provenance router |
| `backend/tests/test_provenance.py` | Created | 4 tests: happy path, 404 unknown dataset, 404 unknown model, ISO-8601 |
| `backend/data/parquet/covid_wilk/distance_scores.parquet` | Modified | Updated with GenePT distance values |
| `frontend/components/AboutPanel/` | Created | 4-file pattern + aboutPanelCopy.ts constants |
| `frontend/components/ChartSkeleton/` | Created | 4-file pattern, umap + bar variants |
| `frontend/components/DashboardEmptyState/` | Created | 4-file pattern, shared empty state |
| `frontend/components/DashboardFooter/` | Created | 4-file pattern, 3 external links |
| `frontend/components/DashboardShell/` | Modified | Info icon, provenance wiring, footer placement |
| `frontend/components/DashboardShell/useDashboardProvenance.ts` | Created | Tab-aware provenance fetcher hook |
| `frontend/components/ProvenanceChip/` | Modified | Renders all 5 provenance fields |
| `frontend/components/ReferenceView/` | Modified | Skeleton + empty state + discriminated union state |
| `frontend/components/ProjectionView/` | Modified | Skeleton + empty state + discriminated union state |
| `frontend/components/DistanceView/` | Modified | Skeleton + empty state + discriminated union state |
| `frontend/components/DisagreementView/` | Modified | Skeleton + empty state + discriminated union state |
| `frontend/lib/fetchJson.ts` | Created | fetchJsonOrNotFound with 404 vs 5xx split |
| `frontend/lib/fetchers/provenance.ts` | Created | Provenance-specific fetcher using fetchJsonOrNotFound |
| `frontend/lib/schemas/provenance.ts` | Created | Zod schema for ProvenanceResponse |
| `frontend/app/dashboard/page.tsx` | Modified | Provenance hook + source tracking per tab |
| `README.md` | Modified | Hero section with screenshot, URLs, quick links |
| `docs/assets/dashboard-hero.png` | Created | Dashboard screenshot for README |

## Validation

```text
cd backend && ruff check . && ruff format --check . && mypy --strict app/ && pytest -v
# 44 passed in 4.89s

cd frontend && pnpm lint && pnpm tsc --noEmit && pnpm build
# All zero errors, build succeeds
```

## Post-audit fixes

After auditing Cursor's output, six design nits were fixed:
1. `useDashboardProvenance` hardcoded `"geneformer"` for distance/disagreement — now uses `projectionModel`
2. Distance/Disagreement empty states said "geneformer" — changed to "geneformer × genept" for dual-model accuracy
3. `AboutPanel` had no Escape key dismiss — added `onKeyDown` handler
4. Dead `DashboardFooterProps` type removed
5. `fetchers/provenance.ts` duplicated 404 logic — refactored to use `fetchJsonOrNotFound`
6. All fixes pass `tsc --noEmit` clean
