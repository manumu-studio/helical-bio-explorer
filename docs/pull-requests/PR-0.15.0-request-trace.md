# PR-0.15.0 — Request Trace visualization
**Branch:** `feat/request-trace` → `main`
**Version:** `0.15.0`
**Date:** 2026-04-23
**Status:** ✅ Ready to merge

---

## Summary

Adds a new dashboard page at `/request-trace` that walks through exactly what happens when a user clicks the Reference tab in this app. It renders the full 23-span journey of a single `GET /api/v1/embeddings` request — 16 outbound spans from browser to database, and 7 return spans back to the Plotly render — as an interactive, keyboard-navigable story.

Each span shows:

- The environment it runs in (Frontend, Network, Backend, Database) and whether it's a data gate or a validator gate.
- The actual source file in this repository (clickable — opens the file on GitHub at the right line).
- A VS Code–style highlighted snippet of the code that executes at that step.
- A preview of the project tree, with markers on the files touched through this point in the journey.
- What the span contributes to the cumulative "Request Context" (the growing payload the request builds as it propagates).
- A data preview showing the shape and size of the data in flight.
- The ADR that justifies this design decision.
- What happens when the gate fails (HTTP status + user-visible message).

The implementation is built as a small tree of focused components rather than a single page. The main `RequestTrace` orchestrator is under 200 lines; every presentational piece (progress bar, minimap, checkpoint card, code block, file tree, context sidebar) is an independently importable 4-file component with its props in a sibling `.types.ts`. Shared configuration lives under `frontend/lib/request-trace/` and is re-exported through a single barrel.

## Files Changed

| File | Action | Notes |
|---|---|---|
| `frontend/app/request-trace/page.tsx` | Create | Next.js App Router page; mounts `AppHeader` + `RequestTrace` inside a full-height theme-aware shell. |
| `frontend/components/RequestTrace/RequestTrace.tsx` | Create | Orchestrator (194 lines): span state hook, three-column layout, global keyboard shortcuts, info-modal mount. |
| `frontend/components/RequestTrace/RequestTrace.types.ts` | Create | `RequestTraceProps` interface. |
| `frontend/components/RequestTrace/useRequestTrace.ts` | Create | Span navigation + cumulative backpack state. |
| `frontend/components/RequestTrace/index.ts` | Create | Barrel export. |
| `frontend/components/CheckpointCard/` | Create | 4-file component. Per-span detail card rendering every section in order. |
| `frontend/components/CodeBlock/` | Create | 4-file component. Themed code block wired to the custom highlighter. |
| `frontend/components/FileTreeDisplay/` | Create | 4-file component. Collapsible project tree with per-step markers. |
| `frontend/components/RequestContextDisplay/` | Create | 4-file component. Emerald sidebar showing the cumulative request payload. |
| `frontend/components/TraceMinimap/` | Create | 4-file component. Collapsible left-rail listing every span. |
| `frontend/components/TraceProgress/` | Create | 4-file component. Horizontal progress bar with hover tooltip and click-to-jump. |
| `frontend/components/RequestTraceInfo/` | Create | 4-file component. "About this trace" modal. |
| `frontend/lib/request-trace/checkpoints.ts` | Create | 23-span data model. |
| `frontend/lib/request-trace/env-config.ts` | Create | Shared constants and display helpers. |
| `frontend/lib/request-trace/file-tree.ts` | Create | Builds the project tree and markers. |
| `frontend/lib/request-trace/highlight.ts` | Create | Custom regex tokenizer for Python, TypeScript, Nginx. |
| `frontend/lib/request-trace/index.ts` | Create | Barrel exports. |
| `.gitignore` | Modify | Ignores Playwright screenshot output. |

## Architecture Decisions

| Decision | Why |
|---|---|
| Orchestrator + 4-file components instead of one monolithic file | Makes each presentational piece independently importable, testable, and reviewable. Keeps the orchestrator focused on state and layout. |
| Shared config under `lib/request-trace/env-config.ts` | Environment palettes, phase arithmetic, and the GitHub base URL are pure data/logic shared across seven components; they belong with the rest of the data model, not inside a component. |
| Custom ~150-line regex tokenizer instead of Prism/Shiki | Three languages in play (Python, TypeScript, Nginx) and a tight VS Code palette; a small tokenizer is cheaper than a third-party dependency at both build and runtime. |
| Emerald palette shared between the per-step "Added to Request Context" button and the cumulative sidebar | Creates a visual through-line from "what this step contributes" to "the accumulated payload". Clicking the button toggles the sidebar open and expands the backpack. |
| `instanceof HTMLElement` instead of `as HTMLElement \| null` in the keyboard handler | Matches the project's "no `as` casts" TypeScript standard. |
| `'use client'` only on components that actually use hooks | Keeps `CodeBlock` and `CheckpointCard` server-renderable. |

## Testing Checklist

- [x] `pnpm typecheck` — passes cleanly
- [x] `pnpm lint` — no ESLint warnings or errors
- [x] `pnpm build` — compiles successfully; `/request-trace` route is 19.6 kB / 140 kB First Load JS
- [x] Progress bar renders all 23 spans with correct colors (blue outbound, amber turnaround, orange/green return)
- [x] Clicking an inactive span jumps to that step; clicking the active span opens its GitHub file in a new tab
- [x] Hover tooltip on each span shows title + click-action hint
- [x] Prev / Next buttons navigate; `←` / `→` / Space keys navigate; `R` resets; Prev disables on step 1; Next disables on step 23
- [x] Minimap sidebar lists every span grouped outbound → turnaround → return, with collapse/expand
- [x] Request Context sidebar accumulates entries as the user advances through the trace and collapses/expands
- [x] CheckpointCard renders all sections in order (header badges, title, file link, snippet, file tree, context delta, data preview, ADR references, failure scenario)
- [x] Emerald "Added to Request Context" block toggles the sidebar and auto-expands the backpack on reveal
- [x] Info modal (`?` button) opens and closes
- [x] Outbound / Return phase pill flips correctly as the user crosses step 16 → R1
- [x] Light and dark modes both render correctly (CSS variables drive all theme-dependent styling)

## Deployment Notes

- Pure frontend change. No backend schema, no new environment variables, no database migration.
- The new route is statically rendered (`○ /request-trace` in the build output) — no server runtime cost.
- Route is reachable only via direct URL for now; wiring it into the top-level navigation is a follow-up once copy is finalized.
- Pre-existing console warning (`AppHeader` hydration mismatch on the theme-dependent logo) is unrelated to this PR and exists on every page that renders `AppHeader`. It's queued for a follow-up fix.

## Validation

```bash
$ cd frontend && pnpm typecheck
> tsc --noEmit
(exit 0)

$ cd frontend && pnpm lint
> next lint
✔ No ESLint warnings or errors

$ cd frontend && pnpm build
 ✓ Compiled successfully in 5.1s
 ✓ Generating static pages (6/6)

Route (app)                                 Size  First Load JS
├ ○ /request-trace                       19.6 kB         140 kB
```

Manual visual regression walked every box above against the running dev server at `http://localhost:3000/request-trace`. Every interaction (click, keyboard, hover, toggle, jump) behaves as specified.
