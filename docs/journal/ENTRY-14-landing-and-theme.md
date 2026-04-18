# Entry 14 — 2026-04-18 — Landing Page & Theme Polish

**Type:** Feature + Refactor
**Branch:** `feat/landing-and-theme`
**Version:** 0.13.0

## Summary

Built a full landing page with scroll showcase, shared header component, theme-aware dashboard screenshots, and light/dark mode polish across the entire app.

## What changed

### Shared AppHeader component
- Extracted header into `AppHeader/` — used by both landing `LandingNav` and `DashboardShell`
- Logo swaps between black/white based on resolved theme (with hydration fallback)
- Added GitHub repository icon link to header right side
- About button, theme toggle, and optional right slot (e.g. ProvenanceChip on dashboard)
- All clickable elements trigger the helix canvas animation on the landing page via `interactionHandlers` prop

### Landing page sections
- `LandingHero` — headline, eyebrow, dual CTAs, "Powered by Helical AI" badge, animated scroll-down arrow
- `FeatureShowcase` — 4 alternating cards with theme-aware screenshots (dark/light WebP)
- `HowItWorks` — 3-step pipeline explanation
- `TechBadges` — technology stack pills
- `CtaFooter` — final CTA before footer
- `LandingFooter` — 3-column footer with links
- `HeroCanvas` — procedural cell animation with radial opacity falloff near center text

### Image optimization
- Converted all PNG screenshots to WebP (~75% size reduction)
- 8 theme-aware screenshots: reference, projection, distance, disagreement × dark/light
- Helical AI logo converted to WebP
- Deleted all original PNGs

### Theme & copy polish
- `AboutPanel` converted from hardcoded dark colors to CSS variable tokens
- `button.tsx` outline variant strengthened for light mode visibility
- Capitalized "Geneformer" in all user-facing strings
- Updated headline: "See which cells went wrong. Faster than ever."
- Fixed GitHub link in footer to correct org URL
- Added 404 redirect to home page

### README rewrite
- Restructured as user-focused overview with tagline, feature descriptions, stack table, API reference, quick start, and project structure

## Files created
- `frontend/components/AppHeader/AppHeader.tsx`
- `frontend/components/AppHeader/AppHeader.types.ts`
- `frontend/components/AppHeader/index.ts`
- `frontend/app/not-found.tsx`
- `frontend/public/assets/*.webp` (11 WebP assets)

## Files modified
- `frontend/components/DashboardShell/DashboardShell.tsx`
- `frontend/components/AboutPanel/AboutPanel.tsx`
- `frontend/components/DisagreementView/DisagreementView.tsx`
- `frontend/components/DistanceView/DistanceView.tsx`
- `frontend/components/landing/LandingHero/LandingHero.tsx`
- `frontend/components/landing/FeatureShowcase/FeatureShowcase.tsx`
- `frontend/components/ui/ThemeToggle/ThemeToggle.tsx`
- `frontend/components/ui/ThemeToggle/ThemeToggle.types.ts`
- `frontend/components/ui/button.tsx`
- `frontend/lib/constants/landingCopy.ts`
- `README.md`

## Key decisions
- **Shared header over duplication** — single `AppHeader` with slot-based composition avoids drift between landing and dashboard
- **Theme-aware screenshots** — dark/light pairs ensure feature cards match the user's current theme
- **WebP conversion** — ~75% file size reduction for all screenshots with no visible quality loss
- **Radial opacity falloff** — cells near hero text fade to 25% opacity instead of uniform reduction, keeping edges vibrant
- **Conditional spread for interaction handlers** — satisfies `exactOptionalPropertyTypes` without non-null assertions
