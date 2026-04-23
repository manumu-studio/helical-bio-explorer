# PR-0.16.0 — Pipeline Trace visualization
**Branch:** `feature/pipeline-trace` → `main`
**Version:** `0.16.0`
**Date:** 2026-04-23
**Status:** ✅ Ready to merge

---

## Summary

Adds `/pipeline-trace`, a sister page to the existing `/request-trace`. Where the runtime trace narrates the path of a single live API call, the pipeline trace narrates the **offline Colab precompute** that produces this app's parquet artifacts — 15 spans across three phases:

- **Phase 1 — PBMC reference (6 spans, steps 1–6):** Load PBMC 3k → Geneformer forward pass → write embedding parquet → fit PCA/UMAP → write coordinate parquet.
- **Phase 2 — COVID projection (6 spans, steps 7–12):** Load COVID PBMC → embed with the same Geneformer checkpoint → project into the fitted PCA/UMAP → write projected coordinates.
- **Phase 3 — GenePT disagreement (3 spans, steps 13–15):** Build GenePT embeddings from a genes × vector matrix → compute cosine disagreement vs. Geneformer → write scores parquet.

Each span shows the actual code (VS Code–style highlighted), the artifacts it emits (fed into an "Artifact Accumulator" sidebar that grows as you step), a data preview with shape + sample JSON, a design-decision callout, and the ADR that justifies the step. Three phase-color-coded progress bar segments with visible dividers. Three section headers in the minimap.

The PR also pays down a reusability debt from the runtime trace. `TraceProgress`, `TraceMinimap`, and `RequestContextDisplay` are now generic presentational components: they accept precomputed data arrays (or defaulted props) instead of importing one specific trace's constants. Two tiny per-trace `build-bars.ts` helpers produce the data arrays. `/request-trace` behavior is unchanged after the refactor — same bars, same minimap, same behavior, same routing.

## Files Changed

| File | Action | Notes |
|---|---|---|
| `frontend/app/pipeline-trace/page.tsx` | Create | Next.js App Router page; mounts `AppHeader` + `PipelineTrace` inside the same `h-screen overflow-hidden` shell used by `/request-trace`. |
| `frontend/components/PipelineTrace/PipelineTrace.tsx` | Create | Orchestrator (205 lines): state hook, keyboard shortcuts, three-column layout, info modal. |
| `frontend/components/PipelineTrace/PipelineTrace.types.ts` | Create | `PipelineTraceProps`. |
| `frontend/components/PipelineTrace/usePipelineTrace.ts` | Create | Navigation + cumulative artifact accumulator state. |
| `frontend/components/PipelineTrace/index.ts` | Create | Barrel export. |
| `frontend/components/PipelineCheckpointCard/` | Create | 4-file component (158 lines). Per-span detail card: env + phase badges, step, title, GitHub file link, snippet, artifact adds, data preview, design-decision callout, ADR references. |
| `frontend/components/PipelineTraceInfo/` | Create | 4-file component (74 lines). About-this-trace modal and its copy. |
| `frontend/lib/pipeline-trace/types.ts` | Create | `PipelineEnvironment`, `PipelinePhase`, `ArtifactEntry`, `DataPreview`, `AdrReference`, `DesignDecision`, `PipelineCheckpoint`. |
| `frontend/lib/pipeline-trace/checkpoints.ts` | Create | 15-entry data model with code, description, artifact adds, data preview, ADR refs, design decision. |
| `frontend/lib/pipeline-trace/env-config.ts` | Create | Colab / storage / database palettes; phase labels, phase spans, GitHub repo, total-step count. |
| `frontend/lib/pipeline-trace/build-bars.ts` | Create | `buildPipelineTraceBars()` + `buildPipelineTraceMinimapItems()`; phase-boundary separators live here. |
| `frontend/lib/pipeline-trace/index.ts` | Create | Barrel for the pipeline-trace library. |
| `frontend/lib/request-trace/build-bars.ts` | Create | Parallel helper for the runtime trace (extracted from the old body of `RequestTrace.tsx` as part of the reuse refactor). |
| `frontend/lib/request-trace/index.ts` | Modify | Re-export the new build-bars helpers. |
| `frontend/components/TraceProgress/TraceProgress.tsx` | Rewrite | Now purely presentational; accepts a generic `bars: TraceBar[]`. |
| `frontend/components/TraceProgress/TraceProgress.types.ts` | Rewrite | New `TraceBarSeparator`, `TraceBar` types; updated `TraceProgressProps`. |
| `frontend/components/TraceProgress/index.ts` | Modify | Export new types. |
| `frontend/components/TraceMinimap/TraceMinimap.tsx` | Rewrite | Now purely presentational; accepts `items: TraceMinimapItem[]` with optional `insertsBefore` for dividers and section headers. |
| `frontend/components/TraceMinimap/TraceMinimap.types.ts` | Rewrite | New `TraceMinimapDivider`, `TraceMinimapSectionHeader`, `TraceMinimapInsert`, `TraceMinimapItem` types; `headerLabel` + `initialSectionHeader` props. |
| `frontend/components/TraceMinimap/index.ts` | Modify | Export new types. |
| `frontend/components/RequestContextDisplay/RequestContextDisplay.tsx` | Modify | Added optional `title`, `emoji`, `tooltipText`, `emptyText` props with defaults — old call site unchanged. |
| `frontend/components/RequestContextDisplay/RequestContextDisplay.types.ts` | Modify | Renamed `BackpackEntry` → `ContextEntry`. |
| `frontend/components/RequestTrace/RequestTrace.tsx` | Modify | Calls the new `buildRequestTrace*` helpers to feed the refactored progress bar / minimap. Behavior pixel-identical. |

## Architecture Decisions

| Decision | Why |
|---|---|
| Decouple `TraceProgress` + `TraceMinimap` from any single trace's constants | One component, multiple stories. Each trace now owns a tiny `build-bars.ts` adapter; adding a third trace in the future is new data + new adapter, not new UI code. |
| Widen `RequestContextDisplay` with defaulted optional props | Same "cumulative payload" panel serves "Request Context" on the runtime page and "Artifact Accumulator" on the pipeline page — with zero changes at the existing call site. |
| Write `PipelineCheckpointCard` as a sibling of `CheckpointCard`, not a generic | The two cards render meaningfully different sections in different orders. A generic with a discriminated-union prop would hide the shape. Two focused 150–200 line siblings are more readable than one 300-line generic. |
| Phase-boundary separators in both progress bar and minimap | PBMC → COVID → GenePT is the story; the UI makes the three acts visually obvious. |
| Same shell as `/request-trace` (`AppHeader` + `h-screen overflow-hidden`) | Two sibling trace pages share one navigation metaphor; different content, identical chrome. |
| `readonly` arrays of `readonly` records for the static checkpoint data | Module-scope immutable data — the type system catches any accidental mutation inside hooks. |

## Testing Checklist

Automated (green before you open this PR):
- [x] `pnpm typecheck` — passes cleanly.
- [x] `pnpm lint` — no ESLint warnings or errors.
- [x] `pnpm build` — compiles successfully; both routes emit as `○` (static) in the build output: `/pipeline-trace` 11.5 kB / 148 kB First Load, `/request-trace` 4.93 kB / 142 kB First Load.
- [x] HTTP smoke probe against `pnpm dev`: both routes return 200 with expected content.
- [x] Every touched `.tsx` file is under 400 lines (largest: `PipelineTrace.tsx` at 205).

Manual (walk before merge, on `http://localhost:3000/pipeline-trace`):
- [ ] Progress bar renders all 15 spans in the three environment colors (Colab purple / S3-Local teal / Database emerald) with two visible phase-boundary separators between Phase 1 → Phase 2 and Phase 2 → Phase 3.
- [ ] Clicking an inactive span jumps to that step; clicking the active span opens its GitHub file in a new tab.
- [ ] Hover tooltip on each span shows the title and a click-action hint.
- [ ] Prev / Next buttons navigate; `←` / `→` / Space keys navigate; `R` resets to step 1; Prev disables on step 1; Next disables on step 15.
- [ ] Minimap lists every span grouped into the three phase sections with visible dividers; collapse/expand works.
- [ ] Artifact Accumulator sidebar grows as you advance through the trace; collapses/expands; shows the emerald palette consistent with the runtime page's "Request Context".
- [ ] `PipelineCheckpointCard` renders all sections in order: env + phase badges, step label, title, GitHub file link, code snippet, artifact adds, data preview (when present), design-decision callout, ADR references.
- [ ] Phase pill at the top flips correctly when you cross step 6 → 7 (Phase 1 → Phase 2) and step 12 → 13 (Phase 2 → Phase 3).
- [ ] Info modal (`?` button) opens and closes.
- [ ] Light and dark modes both render correctly.

Manual (regression, on `http://localhost:3000/request-trace`):
- [ ] All 23 spans still render with correct colors.
- [ ] Click-to-jump, Prev/Next, keyboard shortcuts (`←`, `→`, Space, `R`) still work.
- [ ] Minimap still shows outbound → turnaround → return section headers.
- [ ] Request Context sidebar still reads "Request Context" (not "Artifact Accumulator").
- [ ] Info modal still works.

## Deployment Notes

- Pure frontend change. No backend schema, no new environment variables, no database migration.
- Both routes are statically rendered (`○` in the build output). No server runtime cost.
- `/pipeline-trace` is reachable by direct URL only for now — wiring it into top-level navigation is a follow-up once the two traces' copy is finalized.
- The pre-existing `AppHeader` hydration warning on the theme-dependent logo is unchanged by this PR and still scheduled for a separate fix.

## Validation

```bash
$ cd frontend && pnpm typecheck
> tsc --noEmit
(exit 0)

$ cd frontend && pnpm lint
> next lint
✔ No ESLint warnings or errors

$ cd frontend && pnpm build
> next build
 ✓ Compiled successfully in 4.1s
 ✓ Generating static pages (7/7)

Route (app)                                 Size  First Load JS
├ ○ /pipeline-trace                      11.5 kB         148 kB
└ ○ /request-trace                       4.93 kB         142 kB
```

Both `/pipeline-trace` and `/request-trace` respond `200` on `pnpm dev`. Pipeline HTML contains the step 1 title "Load PBMC 3k" and three "Pipeline Trace" mentions; runtime HTML contains three "Request Trace" mentions. No dev-server console warnings on either route compile.
