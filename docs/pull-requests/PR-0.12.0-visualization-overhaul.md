# PR-0.12.0 — Dashboard visualization overhaul: filtering, responsive layout, and distance plots

**Branch:** `feature/visualization-overhaul` → `main`
**Version:** 0.12.0
**Date:** 2026-04-18
**Status:** 🟡 Ready to push

---

## Summary

Transforms the dashboard from a static read-only viewer into an interactive, filterable analysis tool with responsive layout, dark/light theming, and richer distance visualizations. 70 files changed across frontend and backend.

## What was built

### Interactive filtering
- **FilterSidebar** — collapsible panel with cell-type checkboxes and disease-activity toggles
- **MobileFilterToolbar** — responsive drawer (shadcn Sheet) for screens below `md` breakpoint
- **SelectedCellsPanel** — displays selected cell details with sortable table
- **useSelectionStore** — Zustand store managing cell selection state, unit-tested with Vitest

### Richer visualizations
- **DistanceHeatmapPlot** — cell type × condition color matrix alongside the existing scatter
- **UmapLoadingCanvas** — procedural 2,350-cell particle animation replacing static loading skeletons
- **DistanceHeatmapSkeleton / DistanceScatterSkeleton** — new skeleton variants for distance plots
- **Dynamic grid columns** — ReferenceView and DisagreementView adapt layout based on selection state

### Responsive layout
- All four dashboard views converted to viewport-locked flex layouts (no scroll bounce)
- UmapScatter accepts string heights, defaults to 100% parent fill
- Description cards added to ProjectionView and DisagreementView
- Consistent stats-left / description-right layout across all tabs

### Theme system
- **ThemeProvider** (next-themes) + **ThemeToggle** with sun/moon icons
- **dashboardPlotTheme** — Plotly layout tokens derived from CSS custom properties
- **useDashboardPlotlyColors** — hook that re-reads theme tokens on toggle
- CSS custom property migration in `globals.css`

### shadcn UI primitives
badge, button, card, popover, sheet, slider, tabs, toggle-group, tooltip — all configured via `components.json`

### Backend
- ParquetReader and ParquetStore updated for GenePT data pipeline
- Summary endpoint fix for aggregated statistics
- `seed_precompute_runs.py` script for local development

## Architecture decisions

| Decision | Rationale |
|---|---|
| Zustand for selection state | Multiple unrelated consumers; avoids prop drilling and context re-renders |
| shadcn primitives (copy-paste, not package) | Full control, no runtime dependency, interview-polished UI |
| CSS custom properties → Plotly | Plotly can't consume Tailwind classes; `getComputedStyle()` bridges the gap |
| Vitest over Jest | Native ESM, faster, simpler config for Next.js 15 |
| Viewport-locked flex | Eliminates scroll bounce during live demo presentations |

## Testing

- `useSelectionStore.test.ts` — unit tests for Zustand store (add/remove/clear selection)
- `test_parquet_store.py` — updated backend store tests
- Manual: all four tabs render, filter sidebar toggles, theme switch works, mobile drawer opens

## Deployment notes

- New frontend dependencies: `zustand`, `next-themes`, `@radix-ui/*` (via shadcn), `vitest`
- No database migrations
- No new environment variables
- Backend changes are backward-compatible

## Files changed

70 files, +8,486 / −2,525 lines

Key new files:
- `frontend/components/dashboard/FilterSidebar/` (4 files)
- `frontend/components/dashboard/MobileFilterToolbar/` (3 files)
- `frontend/components/dashboard/SelectedCellsPanel/` (4 files)
- `frontend/components/providers/ThemeProvider.tsx`
- `frontend/components/ui/ThemeToggle/` (4 files)
- `frontend/components/ui/` (8 shadcn primitives)
- `frontend/components/DistanceView/DistanceHeatmapPlot.tsx`
- `frontend/components/ChartSkeleton/UmapLoadingCanvas.tsx`
- `frontend/lib/stores/useSelectionStore.ts`
- `frontend/lib/plotly/dashboardPlotTheme.ts`
- `backend/app/scripts/seed_precompute_runs.py`
