# PR — v0.13.0 Landing Page & Theme Polish

**Branch:** `feat/landing-and-theme`
**Date:** 2026-04-18

## Summary

- Full landing page with scroll showcase, procedural canvas animation, and theme-aware dashboard screenshots
- Shared `AppHeader` component eliminates header duplication between landing and dashboard
- WebP image optimization (~75% size savings), light/dark mode polish, README rewrite

## What was built

### Landing page (7 sections)
1. **LandingHero** — animated headline ("See which cells went wrong. Faster than ever."), dual CTAs, "Powered by Helical AI" badge, procedural cell canvas with radial opacity falloff, scroll-down indicator
2. **FeatureShowcase** — 4 alternating cards with theme-aware WebP screenshots for each dashboard tab
3. **HowItWorks** — 3-step pipeline (Load → Embed → Compare)
4. **TechBadges** — technology stack display
5. **CtaFooter** — final call-to-action
6. **LandingFooter** — links, branding, copyright
7. **LandingNav** — scroll-aware transparent → solid header with backdrop blur

### Shared AppHeader
- Used by both `LandingNav` and `DashboardShell`
- Theme-aware logo (black on light, white on dark) with hydration fallback
- GitHub icon link, theme toggle, about button, optional right slot
- Landing page elements trigger helix canvas animation via `interactionHandlers` prop

### Image optimization
All screenshots converted PNG → WebP:
| Asset | PNG | WebP | Savings |
|---|---|---|---|
| reference-atlas (×2) | ~770 KB | ~160 KB | 79% |
| projection (×2) | ~880 KB | ~172 KB | 80% |
| distance (×2) | ~245 KB | ~64 KB | 74% |
| disagreement (×2) | ~700 KB | ~132 KB | 81% |

### Polish
- `AboutPanel` uses CSS variable tokens (works in both themes)
- Outline button variant strengthened for light mode
- "Geneformer" capitalized in all UI strings
- GitHub footer link corrected to `manumu-studio` org
- 404 page redirects to home
- README rewritten with feature descriptions, API table, stack table

## Architecture decisions

- **Slot composition** — `AppHeader` uses `rightSlot`, `onAboutOpen`, and `interactionHandlers` props instead of conditional rendering, keeping the component generic
- **Conditional spread pattern** — `{...(interactionHandlers && { onMouseEnter: ... })}` satisfies TypeScript's `exactOptionalPropertyTypes` without `as` assertions
- **Theme fallback chain** — `resolvedTheme ?? theme ?? "dark"` prevents white-on-white logo flash during hydration

## Testing

- [ ] Landing page renders all 7 sections in dark mode
- [ ] Landing page renders all 7 sections in light mode
- [ ] Theme toggle switches all screenshots and logo correctly
- [ ] All clickable landing elements trigger helix animation
- [ ] About modal opens from landing page and dashboard
- [ ] 404 paths redirect to home
- [ ] Dashboard header still shows ProvenanceChip and all controls
- [ ] GitHub icon visible and links correctly on both pages

## Deployment notes

- No backend changes
- New static assets in `frontend/public/assets/` must be committed (previously untracked)
- Logo files must be on `main` for production (cherry-picked separately if needed)
