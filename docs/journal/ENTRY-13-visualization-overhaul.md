# ENTRY-13 — Visualization overhaul: filterable views, responsive chrome, and distance plots

**Date:** 2026-04-18
**Type:** Feature (major)
**Branch:** `feature/visualization-overhaul`
**Version:** 0.12.0

---

## What I did

Rebuilt the dashboard from a static four-tab viewer into a filterable, responsive analysis tool. Three pillars: interactive filtering, richer visualizations, and mobile-aware layout.

### Filter sidebar and mobile toolbar

Created `FilterSidebar` — a collapsible panel with cell-type checkboxes and disease-activity toggles backed by a Zustand `useSelectionStore`. On screens below `md`, the sidebar collapses into a `MobileFilterToolbar` using shadcn `Sheet` (slide-out drawer). The store is unit-tested with Vitest.

### Distance heatmap and scatter

`DistanceView` previously showed a single bar chart. It now renders two plots side-by-side: a `DistanceHeatmapPlot` (cell type × condition color matrix) and a scatter overlay. Both use the shared `dashboardPlotTheme` for consistent dark/light styling.

### Responsive Plotly theme

`dashboardPlotTheme.ts` provides a single source of truth for Plotly layout tokens (background, gridline, font colors) derived from CSS custom properties. `useDashboardPlotlyColors` is a hook that re-reads tokens on theme change so charts follow the light/dark toggle without a full remount.

### Full-screen flex layout

Every view (`ReferenceView`, `ProjectionView`, `DistanceView`, `DisagreementView`) was converted from fixed-height containers to flex-column layouts that fill the viewport. `UmapScatter` now accepts string heights and defaults to `100%` so it stretches with its parent. `ChartSkeleton` was updated to match, and two new skeleton variants (`DistanceHeatmapSkeleton`, `DistanceScatterSkeleton`) were added for the new plots.

### Animated UMAP loading canvas

`UmapLoadingCanvas` renders a procedural particle animation while embedding data loads — 2,350 cells drifting and clustering with blend-mode glow. Replaces the static pulse skeleton for UMAP charts.

### shadcn UI primitives and theme system

Initialized shadcn with `components.json`. Added: `badge`, `button`, `card`, `popover`, `sheet`, `slider`, `tabs`, `toggle-group`, `tooltip`. Created `ThemeProvider` (next-themes) and `ThemeToggle` with sun/moon icons, keyboard accessible, respects `prefers-reduced-motion`.

### Dynamic grid columns

`ReferenceView` and `DisagreementView` grid layouts now adapt columns based on cell selection state — when a cell is selected, the detail panel expands and metadata cards reflow.

### Description cards

Added contextual description cards to `ProjectionView` and `DisagreementView` explaining what each visualization shows. All views now follow a consistent layout: stats on the left, description on the right.

### Backend fixes

- `parquet_reader.py` and `parquet_store.py` updated for GenePT data pipeline compatibility
- `summary.py` minor fix for aggregated statistics
- `seed_precompute_runs.py` script added for local development seeding
- `test_parquet_store.py` updated to match new store interface

### Route restructure

Deleted `frontend/app/page.tsx` — the root route now redirects to `/dashboard`. Layout restructured for the `(public)` route group (landing page, to be completed on a separate branch).

## Decisions

- **Zustand over React context for selection state** — multiple unrelated components need cell selection; Zustand avoids prop drilling and unnecessary re-renders.
- **shadcn over custom components** — interview-ready polish with minimal code; all primitives are copy-pasted (no package dependency), so they're fully customizable.
- **CSS custom properties for Plotly theme** — Plotly doesn't use Tailwind classes, so theme tokens flow through `getComputedStyle()` instead.
- **Vitest over Jest** — faster, native ESM support, simpler config for a Next.js 15 project.
- **Viewport-locked flex layout** — prevents scroll bounce on demo presentations; every pixel of the viewport is used.

## Files touched

70 files changed: 8,486 insertions, 2,525 deletions.

| Area | Key files | Notes |
|---|---|---|
| Backend | `parquet_reader.py`, `parquet_store.py`, `summary.py`, `seed_precompute_runs.py` | GenePT pipeline fixes + dev seeding |
| Dashboard views | `ReferenceView`, `ProjectionView`, `DistanceView`, `DisagreementView` | Flex layout, dynamic columns, description cards |
| Filter system | `FilterSidebar/`, `MobileFilterToolbar/`, `SelectedCellsPanel/` | New 4-file-pattern components |
| Charts | `UmapScatter`, `DistanceHeatmapPlot`, chart skeletons, `UmapLoadingCanvas` | Responsive sizing, new plot types, animated loading |
| Theme | `ThemeProvider`, `ThemeToggle/`, `dashboardPlotTheme.ts`, `globals.css` | Dark/light system |
| UI primitives | `components/ui/` (8 files) | shadcn components |
| State | `useSelectionStore.ts` + test | Zustand cell selection store |
| Config | `components.json`, `vitest.config.ts`, `package.json`, `pnpm-lock.yaml` | New deps and tooling |

## Validation

```text
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm build
# Clean compilation, zero lint warnings, build succeeds

pnpm test
# Selection store tests pass

cd backend && ruff check . && pytest -v
# All tests pass
```
