# ENTRY-17 — Pipeline Trace visualization
**Date:** 2026-04-23
**Type:** Feature + Refactor
**Branch:** `feature/pipeline-trace`
**Version:** `0.16.0`

---

## What I Did

Shipped `/pipeline-trace`, a sister page to `/request-trace`. Where the request trace explains the live runtime path of a single API call, the pipeline trace explains the **offline precompute** — how raw public datasets become the parquet artifacts this app serves. 15 spans across three phases:

1. **PBMC reference (6 spans, steps 1–6):** Load scanpy's PBMC 3k, wrap it with Helical's `GeneformerConfig`, run the forward pass to get 512-d cell embeddings, attach them to the AnnData object, write the embedding parquet, fit PCA + UMAP, and write the coordinate parquet.
2. **COVID projection (6 spans, steps 7–12):** Load public COVID PBMC, embed it with the same Geneformer checkpoint, project the new embeddings into the fitted PCA/UMAP space (not a re-fit), write the projected coordinates.
3. **GenePT disagreement (3 spans, steps 13–15):** Pull a genes × GenePT vector matrix, build per-cell GenePT embeddings by weighting gene vectors with expression, compute cosine disagreement vs. Geneformer on the same cells, write the scores parquet.

Every span shows the actual code that runs at that step, the artifacts it produces (appended to a running "Artifact Accumulator" sidebar that mirrors the "Request Context" sidebar on the runtime page), a data preview (shape + a small sample JSON blob), and the ADR it implements. Three phases, three color-coded progress-bar segments with visible dividers between them, three section headers in the minimap.

Alongside building the new page, I paid down a debt from the request-trace work. The `TraceProgress` bar and the `TraceMinimap` sidebar had been written assuming they'd only ever render one data model. I pulled the domain-specific lookups out of those components and into two tiny helper functions per trace (`build-bars.ts` under each `lib/*-trace/` folder). The components now accept a generic array of precomputed bars/items. Same behavior on the existing page, and the pipeline page drops right in.

Same thing for the context sidebar. `RequestContextDisplay` gained four optional presentation props (title, emoji, tooltip, empty-state copy) with defaults matching its old hard-coded "Request Context" wording. The runtime page still reads "Request Context", the pipeline page reads "Artifact Accumulator" — one component, two labels.

Only one piece was genuinely new: `PipelineCheckpointCard`. The two traces' cards render different stuff (the runtime card has a gate type + failure scenario + file tree; the pipeline card has a phase badge + design-decision callout + artifact adds) so squishing them into one generic card would have hidden the shape from readers. Better to have two focused components than one overloaded one.

## Files Touched

| File | Action | Notes |
|---|---|---|
| `frontend/app/pipeline-trace/page.tsx` | Create | Next.js App Router page (23 lines); mounts `AppHeader` + `PipelineTrace` inside the same full-height theme shell the runtime trace uses. |
| `frontend/components/PipelineTrace/` | Create | 4-file component. Orchestrator at 205 lines — state hook, keyboard shortcuts (`←`, `→`, Space, `R`), three-column layout, info modal. |
| `frontend/components/PipelineCheckpointCard/` | Create | 4-file component (158 lines). Per-span detail: env badge, phase badge, step number, title, GitHub file link, code snippet, artifact adds, data preview (when present), design-decision callout, ADR references. |
| `frontend/components/PipelineTraceInfo/` | Create | 4-file component (74 lines) plus a small `pipelineTraceInfoCopy.ts` for the modal copy and highlight list. |
| `frontend/lib/pipeline-trace/types.ts` | Create | `PipelineEnvironment`, `PipelinePhase`, `ArtifactEntry`, `DataPreview`, `AdrReference`, `DesignDecision`, `PipelineCheckpoint`. |
| `frontend/lib/pipeline-trace/checkpoints.ts` | Create | The 15-span data model: code, description, artifact adds, data preview, ADR refs, design decision. |
| `frontend/lib/pipeline-trace/env-config.ts` | Create | Colab / storage / database color palettes, phase labels, phase spans, pipeline GitHub repo constant, total-steps constant. |
| `frontend/lib/pipeline-trace/build-bars.ts` | Create | `buildPipelineTraceBars()` + `buildPipelineTraceMinimapItems()`. Phase-boundary separators live here, not in the component. |
| `frontend/lib/pipeline-trace/index.ts` | Create | Barrel re-export for the whole trace module. |
| `frontend/lib/request-trace/build-bars.ts` | Create | Parallel helper for the runtime trace, extracted from the old `RequestTrace.tsx` body during the reuse refactor. |
| `frontend/lib/request-trace/index.ts` | Modify | Re-export the new helpers. |
| `frontend/components/TraceProgress/TraceProgress.tsx` | Rewrite | Now purely presentational. Accepts a generic `bars: TraceBar[]`. No more direct imports of any trace's constants. |
| `frontend/components/TraceProgress/TraceProgress.types.ts` | Rewrite | `TraceBarSeparator`, `TraceBar`, updated `TraceProgressProps`. |
| `frontend/components/TraceProgress/index.ts` | Modify | Export new types. |
| `frontend/components/TraceMinimap/TraceMinimap.tsx` | Rewrite | Now purely presentational. Accepts `items: TraceMinimapItem[]` with optional `insertsBefore` for dividers and section headers. |
| `frontend/components/TraceMinimap/TraceMinimap.types.ts` | Rewrite | `TraceMinimapDivider`, `TraceMinimapSectionHeader`, `TraceMinimapInsert`, `TraceMinimapItem`, plus `headerLabel` / `initialSectionHeader` props. |
| `frontend/components/TraceMinimap/index.ts` | Modify | Export new types. |
| `frontend/components/RequestContextDisplay/RequestContextDisplay.tsx` | Modify | Added optional `title`, `emoji`, `tooltipText`, `emptyText` props with defaults. Old call site unchanged. |
| `frontend/components/RequestContextDisplay/RequestContextDisplay.types.ts` | Modify | Renamed `BackpackEntry` → `ContextEntry`; the old name was too specific once the component serves two stories. |
| `frontend/components/RequestTrace/RequestTrace.tsx` | Modify | Calls the new `buildRequestTrace*` helpers to feed the refactored progress bar and minimap. Behavior pixel-identical to before. |

## Decisions

- **Pushed trace-specific wiring out of shared components into `build-bars.ts` helpers.** The progress bar and the minimap should know how to draw bars and list items — not how to look up a direction label or a gate icon. Each trace now owns a tiny adapter file that produces the generic `TraceBar[]` / `TraceMinimapItem[]` the components render. Adding a third trace would be a new adapter file, not new UI code.
- **Widened `RequestContextDisplay` with defaulted optional props rather than forking it.** The "accumulated payload" panel is the same pattern in both stories (grow over time, collapse/expand, emerald palette) — only the wording differs. Optional title/emoji/tooltip props with defaults preserve the runtime page's exact text while letting the pipeline page read "Artifact Accumulator".
- **Kept `PipelineCheckpointCard` separate from `CheckpointCard`.** They render different sections in different orders. A generic card with a discriminated-union prop would be harder to follow than two sibling components.
- **Three phase-boundary breaks.** PBMC → COVID is a change of subject (we load a new dataset). COVID → GenePT is a change of method (we stop using Geneformer, start using GenePT). Making those breaks visible in both the progress bar and the minimap is the whole point — the story of the pipeline *is* the three phases.
- **Same page shell as `/request-trace`.** Two sibling trace pages share one navigation metaphor. Different content, identical chrome.
- **Precomputed pipeline, not a live one.** The code this page narrates ran in Colab — the app serves its outputs as static parquet. The trace is honest about that: every span is labeled Colab / storage / database; no span claims a live API call it doesn't make.

## Still Open

- Mobile treatment for the minimap is unchanged: hidden below `lg` on both traces. A bottom-sheet or slide-over would serve mobile better and should be done for both pages at once.
- No automated tests for the traces yet. The validation is manual click-through on both pages. A Playwright happy-path test per page would be cheap insurance.
- `AppHeader`'s pre-existing theme-dependent logo hydration warning is still present — it predates this work and should get its `mounted` guard at some point.
- The artifact accumulator has no "diff highlight" animation when it grows. Not essential — but a two-line transition could make it feel more alive.

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

Both `/pipeline-trace` and `/request-trace` serve a clean `200` over HTTP against a local dev server. Spot-checked the HTML: the pipeline page includes the step 1 title "Load PBMC 3k" and three "Pipeline Trace" mentions; the runtime page still shows its "Request Trace" heading. Final interactive walkthrough (15 spans × keyboard + mouse + info modal + artifact accumulator) goes in the PR review checklist.
