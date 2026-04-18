# ENTRY-14 — README rewrite and architecture diagrams

**Date:** 2026-04-18
**Type:** Documentation
**Branch:** `feature/visualization-overhaul`

---

## What I did

Rewrote the README from scratch and added three architecture diagram documents. The old README still had placeholder screenshots, an outdated Vercel URL, and internal tooling references that had no business being in a public repo.

### README overhaul

Replaced the placeholder dashboard-hero.png with an animated GIF of the landing page helix animation (floating dots → helix formation). The GIF was captured via macOS screen recording and converted with ffmpeg at 800px wide, 12fps, 80-color palette — optimized to 4.5MB to stay under GitHub's 10MB inline render limit.

Added four dashboard screenshots (reference atlas, projection, distance, disagreement) in a structured "Dashboard" section with explanatory captions for each view.

Rewrote the "What it does" section to surface ML/data-pipeline vocabulary (embedding pipeline, latent space, dimensionality reduction, model comparison) that maps to the job description requirements — without overselling experience.

Added architecture diagram (ASCII), API endpoint table, and stack table. Updated Quality row to explicitly mention pytest and GitHub Actions CI, both called out in the JD.

### Architecture diagrams

Created three ASCII diagram documents in `docs/architecture/`:

- **DIAGRAM-CI-CD.md** — full flow from pull request through backend-ci/frontend-ci, OIDC → IAM role assumption, SSM deploy to EC2, Vercel auto-deploy, health check
- **DIAGRAM-DATA-PIPELINE.md** — five-stage pipeline from raw AnnData ingestion through Geneformer/GenePT embedding, UMAP reduction, parquet serialization, and S3 storage
- **DIAGRAM-REQUEST-FLOW.md** — browser interaction through Zustand state, Zod fetch boundary, nginx, FastAPI middleware, ParquetStore (S3-first with local fallback), back to Plotly render. Includes the type-safety chain showing Pydantic ↔ Zod validation at both boundaries.

## Why

The README is the first thing Benoit (hiring manager) will see when reviewing the repo. It needed to:
1. Make an immediate visual impression (animated GIF hero)
2. Subtly address every JD requirement without being a checklist
3. Remove any trace of internal tooling or AI-assisted workflow references
4. Show the system architecture at a glance

The architecture diagrams serve double duty — they're study material for the interview (defending design decisions) and they signal engineering maturity to anyone browsing the repo.

## Files created / modified

- `README.md` — full rewrite
- `public/assets/landing-animation.gif` — new (4.5MB, converted from screen recording)
- `docs/architecture/DIAGRAM-CI-CD.md` — new
- `docs/architecture/DIAGRAM-DATA-PIPELINE.md` — new
- `docs/architecture/DIAGRAM-REQUEST-FLOW.md` — new

## Key decisions

| Decision | Rationale |
|---|---|
| GIF over static screenshot | The helix animation is the most impressive visual; static image loses the impact |
| 800px / 12fps / 80 colors | Balance between visual quality and GitHub's 10MB render limit (landed at 4.5MB) |
| ML vocabulary in "What it does" | Maps to JD requirements 5 (Nice to Have: ML/AI exposure) without overstating experience |
| pytest + GitHub Actions in stack table | JD requirement 3 explicitly asks for pytest + GH Actions; was missing before |
| Separate diagram files (not inline README) | Keeps README scannable; diagrams are deep-dive references for interview prep |
