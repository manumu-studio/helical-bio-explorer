# ENTRY-16 — Request Trace visualization
**Date:** 2026-04-23
**Type:** Feature + Refactor
**Branch:** `feat/request-trace`
**Version:** `0.15.0`

---

## What I Did

Shipped the `/request-trace` page: an interactive, 23-span walkthrough that follows a single `GET /api/v1/embeddings` call from a tab click all the way back to the Plotly render. Each span maps to real code in this repository, has a clickable GitHub file link, shows the snippet that runs at that step (with lightweight VS Code–style syntax highlighting), previews the data in flight, and lists the ADRs that justify the design.

Then I refactored the implementation. What started as a single 903-line `RequestTrace.tsx` is now a ~200-line orchestrator and seven focused sub-components, each following the project's standard 4-file pattern (`Component.tsx`, `Component.types.ts`, `index.ts`, `useComponent.ts` when needed). Shared configuration now lives in `frontend/lib/request-trace/env-config.ts` and is re-exported through the `@/lib/request-trace` barrel so every component pulls from one source.

Behavior was preserved pixel-for-pixel — including the emerald "Added to Request Context" block that lights up the cumulative backpack sidebar, the outbound/return phase pill, the turnaround divider in the span map, and the keyboard shortcuts (`←`, `→`, Space, `R`).

## Files Touched

| File | Action | Notes |
|---|---|---|
| `frontend/app/request-trace/page.tsx` | Create | Next.js route with `AppHeader` and `RequestTrace`; full-height layout, light/dark theme tokens. |
| `frontend/components/RequestTrace/RequestTrace.tsx` | Rewrite | 903 → 194 lines. Orchestrator only: state, keyboard shortcuts, three-column layout. |
| `frontend/components/RequestTrace/RequestTrace.types.ts` | Rewrite | Trimmed to `RequestTraceProps` only. |
| `frontend/components/RequestTrace/useRequestTrace.ts` | Preserved | Hook for span navigation and cumulative backpack state. |
| `frontend/components/CheckpointCard/` | Create | 4-file component. Per-span detail card: badges, title, GitHub file link, snippet, file tree, "Added to Request Context" button, data preview, ADRs, failure scenario. |
| `frontend/components/CodeBlock/` | Create | 4-file component. Lightweight custom tokenizer for Python, TypeScript, and Nginx matching VS Code Dark+/Light+. |
| `frontend/components/FileTreeDisplay/` | Create | 4-file component. Collapsible project tree with per-step markers. |
| `frontend/components/RequestContextDisplay/` | Create | 4-file component. Emerald panel showing the cumulative "Request Context" backpack, with a hover tooltip explaining the concept. |
| `frontend/components/TraceMinimap/` | Create | 4-file component. Collapsible sidebar listing every span, grouped outbound → turnaround → return. |
| `frontend/components/TraceProgress/` | Create | 4-file component. Horizontal progress bar with per-bar hover tooltip and click-to-jump. |
| `frontend/components/RequestTraceInfo/` | Create | 4-file component. "About this trace" modal triggered by the `?` button. |
| `frontend/lib/request-trace/checkpoints.ts` | Create | The 23-span data model: title, description, code, file, environment, direction, gate type, backpack adds, data preview, ADR refs, failure scenario. |
| `frontend/lib/request-trace/env-config.ts` | Create | Shared constants: `ENV_CONFIG`, `DIRECTION_LABEL`, `GATE_ICON`, `TURNAROUND_STEP`, `OUTBOUND_COUNT`, `RETURN_COUNT`, `GITHUB_REPO`, `getDisplayInfo`. |
| `frontend/lib/request-trace/file-tree.ts` | Create | Builds the project tree and per-step markers. |
| `frontend/lib/request-trace/highlight.ts` | Create | Custom regex-driven syntax highlighter (PY/TS/Nginx), no third-party dependency. |
| `frontend/lib/request-trace/index.ts` | Create | Barrel that re-exports every public symbol consumed by the component tree. |

## Decisions

- **Custom syntax highlighter instead of a library.** The three languages in play (Python, TypeScript, Nginx) and the tight VS Code color palette mean a ~150-line regex tokenizer is cheaper than pulling in Prism or Shiki at both build and runtime cost.
- **Shared config under `lib/request-trace/` rather than a shared component folder.** Environment palettes, phase arithmetic, and GitHub base URL are pure data/logic with zero rendering, so they belong alongside the checkpoints data model, not inside a component.
- **Emerald palette shared between the per-step "Added to Request Context" block and the cumulative sidebar.** Gives the user an immediate visual through-line between "what this step adds" and "the accumulated payload you'll use downstream". Clicking the block also toggles the sidebar open, and auto-expands the backpack on reveal.
- **Named the extracted sidebar `TraceMinimap` and the progress strip `TraceProgress`.** The generic names would collide with anything else that might need a minimap or a progress bar in the future.
- **Every extracted sub-component follows the 4-file pattern.** Props in `.types.ts`, component in `.tsx`, barrel in `index.ts` — consistent with the rest of the codebase and makes each piece independently importable.
- **Replaced every `as` cast with `instanceof` narrowing.** The orchestrator's keyboard guard now uses `e.target instanceof HTMLElement` instead of `e.target as HTMLElement | null`, matching the project's "no `as` casts" standard.
- **No new `'use client'` directives where hooks aren't used.** `CodeBlock` and `CheckpointCard` are stateless; only the orchestrator and the components that actually use `useState` claim the client boundary.

## Still Open

- Minimap is hidden at viewport widths below the `lg` Tailwind breakpoint (`< 1024 px`). Needs a thoughtful mobile treatment — probably a bottom sheet or a collapsing drawer rather than the desktop sidebar.
- Pre-existing hydration warning in `AppHeader`: the theme-dependent logo swaps between `logo-white.webp` and `logo-black.webp` before `next-themes` has resolved the initial theme, producing a one-frame SSR/CSR mismatch. Not introduced by this work, but visible in dev tools on any page that renders `AppHeader`. Fix is a `mounted` guard.
- No unit or integration tests yet for the new components. The visual regression pass is manual. Adding Playwright coverage for the step-navigation happy path is a good follow-up.
- The syntax highlighter supports Python, TypeScript, and Nginx only. Extending to SQL (for span 13) would round out the database checkpoint.

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

Manual visual regression walked through all 13 checklist items against `http://localhost:3000/request-trace`: 23-span progress bar with correct colors, click-to-jump, active-span GitHub link, hover tooltips, Prev/Next/Reset, keyboard shortcuts (`←`, `→`, Space, `R`), minimap collapse/expand with outbound/turnaround/return section headers, Request Context accumulation (1 → 22 entries) with collapse/expand, CheckpointCard section order, emerald button ↔ sidebar link, info modal, outbound→return phase transition across step 16. Every box ticked.
