# PR-0.11.0 — Demo polish for R2 interview

**Branch:** `feature/demo-polish` -> `main`
**Version:** 0.11.0
**Date:** 2026-04-17
**Status:** 🟡 Pushed — ready for PR creation and merge

---

## Summary

Polish pass taking the dashboard from "technically live" to "presentation-ready" for the Helical R2 interview on 2026-04-21. No new features — every change is UX refinement on top of what PACKET-02a through 02d shipped.

- Full provenance chip (model, version, SHA, relative time, source dot) backed by a new read-only API endpoint
- Graceful empty states when a parquet view isn't available yet (404 → copy, not broken Plotly)
- "About this demo" modal explaining the reference-mapping paradigm with external links
- Persistent footer row with API Explorer, GitHub, and Helical SDK links
- Chart skeletons replacing spinners to eliminate layout shift
- README hero section with dashboard screenshot

## What changed

### Backend (3 new files, 1 modified)

| File | Change |
|---|---|
| `backend/app/schemas/provenance.py` | `ProvenanceResponse` Pydantic model (6 fields) |
| `backend/app/api/v1/provenance.py` | `GET /provenance/{dataset_slug}/{model_name}` — returns latest precompute_runs row or 404 |
| `backend/app/api/v1/__init__.py` | Register provenance router |
| `backend/tests/test_provenance.py` | 4 async tests: happy path (latest row), 404 unknown dataset, 404 unknown model, ISO-8601 datetime serialization |

### Frontend (5 new components, 4 modified components, 3 new lib files)

| Component | Change |
|---|---|
| `AboutPanel/` | Modal with 3 paragraphs (ADR-001 narrative) + 3 external links; triggered by info icon |
| `ChartSkeleton/` | Gray `animate-pulse` rectangles, `umap` (square) and `bar` (wide) variants |
| `DashboardEmptyState/` | Shared empty state for missing parquet views |
| `DashboardFooter/` | 3 links: API Explorer, GitHub, Helical SDK; `target="_blank"` |
| `DashboardShell/` | Info icon button, provenance wiring, footer placement, `useDashboardProvenance` hook |
| `ProvenanceChip/` | Now renders model name, version, 7-char SHA, relative time (via `date-fns`), source dot |
| `ReferenceView/` | ChartSkeleton + DashboardEmptyState on 404 + discriminated union state |
| `ProjectionView/` | Same pattern |
| `DistanceView/` | Same pattern (two bar skeletons) |
| `DisagreementView/` | Same pattern |

| Lib file | Change |
|---|---|
| `lib/fetchJson.ts` | `fetchJsonOrNotFound` — discriminated union return, 404 vs 5xx split |
| `lib/fetchers/provenance.ts` | Provenance fetcher using `fetchJsonOrNotFound` |
| `lib/schemas/provenance.ts` | Zod schema for `ProvenanceResponse` with ISO-8601 refine |

### Repo

| File | Change |
|---|---|
| `README.md` | Hero: product one-liner, dashboard screenshot, live demo / API table, quick links |
| `docs/assets/dashboard-hero.png` | Dashboard screenshot |

## Architecture decisions

| Decision | Why |
|---|---|
| One new backend route (provenance read) | Clean read off existing table; cheaper than stuffing metadata into every response |
| Empty state on 404, not error state | Missing parquet is expected during staged rollout, not a failure |
| Modal for About, not a route | One-page demo; `/about` adds routing concerns for 200 words |
| Skeleton over spinner | Prevents CLS; gray rectangles match chart footprints |
| Manual screenshot, not Playwright | One PNG, one time; no CI dependency |

## Testing

### Backend ✅
```
ruff check . && ruff format --check . → zero issues
mypy --strict app/ → zero issues
pytest -v → 44 passed in 4.89s
```

New tests in `test_provenance.py`:
- [x] Latest row returned (200) when multiple runs exist
- [x] 404 on unknown dataset slug
- [x] 404 on unknown model name
- [x] `created_at` serializes as ISO-8601

### Frontend ✅
```
pnpm lint → zero warnings/errors
pnpm tsc --noEmit → zero errors
pnpm build → success (dashboard: 25 kB first load)
```

- [x] Zero `any` types across all new/modified files
- [x] Zero `as` assertions
- [x] Zod at every HTTP fetch boundary
- [x] All new components follow 4-file pattern

### Visual smoke test
- [ ] Provenance chip shows all 5 fields on every tab
- [ ] About panel opens from info icon, closes on backdrop click and Escape
- [ ] Footer visible on all tabs, all 3 links open in new tab
- [ ] Empty state renders for tabs without parquet data (no broken Plotly)
- [ ] Chart skeletons appear during loading (no spinner, no layout shift)
- [ ] README hero renders on GitHub (screenshot, table, links)

## Deployment notes

- **Frontend:** Vercel auto-deploys from `main` merge. No new env vars.
- **Backend:** `GET /api/v1/provenance/{dataset}/{model}` is read-only against existing `precompute_runs` table. No migration needed.
- **Dependency:** `date-fns` added to frontend for relative time formatting in the provenance chip.

## What's intentionally not done

- No new dashboard views or charts
- No mobile responsive layout (desktop-only demo, 1280px+)
- No state management library (useState + hooks)
- No animations on About panel (open/close is instant)
- No telemetry on footer link clicks
