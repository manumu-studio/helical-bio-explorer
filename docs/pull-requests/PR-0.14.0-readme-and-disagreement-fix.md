# PR — v0.14.0 README, Architecture Docs & Disagreement Fix

**Branch:** `feature/visualization-overhaul`
**Date:** 2026-04-23

## Summary

- Full README rewrite with animated GIF hero, dashboard screenshots, API table, and architecture overview
- Three architecture diagram documents (CI/CD, data pipeline, request flow)
- Disagreement tab refactored from combined score to dual-axis (Geneformer vs GenePT) per Benoit's R2 interview feedback

## What was built

### README rewrite
- Animated GIF hero showing landing page helix animation (800px, 12fps, 80 colors, ~4.5MB)
- Four dashboard screenshots with captions (reference atlas, projection, distance, disagreement)
- "What it does" section surfaces ML/data-pipeline vocabulary mapped to JD requirements
- Stack table with pytest + GitHub Actions (JD requirement 3)
- API endpoint reference table
- Quick start instructions

### Architecture diagrams (`docs/architecture/`)
- **DIAGRAM-CI-CD.md** — PR → backend-ci/frontend-ci → OIDC/IAM → SSM deploy → EC2 + Vercel
- **DIAGRAM-DATA-PIPELINE.md** — AnnData → Geneformer/GenePT embedding → UMAP → parquet → S3
- **DIAGRAM-REQUEST-FLOW.md** — browser → Zustand → Zod fetch → nginx → FastAPI → ParquetStore → Plotly

### Disagreement tab dual-axis refactor
Based on Benoit's R2 feedback ("I would have expected to see a binary label — one is the distance of GPT and one is the distance of Geneformer"):
- X-axis: Geneformer distance to healthy (was: averaged distance)
- Y-axis: GenePT distance to healthy (was: disagreement score)
- Updated title, axis labels, hover template, and explanatory text
- Diagonal = models agree, off-diagonal = models disagree

## Architecture decisions

- **GIF over static screenshot** — helix animation is the strongest visual; static loses impact
- **Separate diagram files** — keeps README scannable; diagrams are deep-dive references
- **Raw distances over derived score** — Benoit explicitly expected each model's distance plotted independently

## Testing

- [ ] README renders correctly on GitHub (GIF plays, images load, tables format)
- [ ] Architecture diagrams display correctly as markdown
- [ ] Disagreement tab shows Geneformer distance on X, GenePT distance on Y
- [ ] Hover tooltip shows "GF dist" and "GenePT dist" labels
- [ ] Cells along diagonal visually confirm model agreement
- [ ] "What you're seeing" text explains the diagonal interpretation
- [ ] All other tabs unaffected (reference, projection, distance)

## Deployment notes

- No backend changes
- `public/assets/landing-animation.gif` (~4.5MB) must be committed
- DisagreementView change is frontend-only — no API contract change
