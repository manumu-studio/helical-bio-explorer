# Helical Bio Explorer

> When cells go wrong, how do we see it faster?

Embed patient cells with foundation models, map them against a healthy reference, and surface the differences that matter — at single-cell resolution.

<p align="center">
  <a href="https://helical.manumustudio.com"><strong>Live Demo</strong></a> · <a href="https://api.helical.manumustudio.com/docs"><strong>API Docs</strong></a> · <a href="https://github.com/manumu-studio/helical-bio-explorer"><strong>Source Code</strong></a>
</p>

---

<p align="center">
  <img src="public/assets/landing-animation.gif" alt="Helical Bio Explorer — landing page animation" width="800" />
</p>

---

## What it does

A data processing pipeline ingests public single-cell RNA-seq data, runs it through two bio foundation models (**Geneformer** and **GenePT** via the [Helical SDK](https://github.com/helicalAI/helical)), and writes precomputed embeddings to Parquet. The embedding pipeline takes **healthy PBMC cells** as a reference baseline, then projects **COVID patient cells** ([Wilk et al.](https://www.nature.com/articles/s41591-020-0944-y) dataset from CELLxGENE Census) into that same latent space using UMAP dimensionality reduction.

The dashboard compares model outputs, quantifies per-cell divergence from healthy baseline, and surfaces where the two models agree or disagree — turning raw embeddings into interpretable biology.

## Dashboard

Four interactive views, each revealing a different dimension of how disease reshapes cell identity:

### Reference Atlas
Healthy PBMC baseline embedded with Geneformer — UMAP (Uniform Manifold Approximation and Projection) visualization of ~3,000 cells, colored by cell type.

<p align="center">
  <img src="public/assets/reference-atlas-tab-black.webp" alt="Reference Atlas — healthy PBMC baseline" width="800" />
</p>

### Projection
COVID patient cells projected into the healthy reference space. Colored dots = disease cells overlaid on the gray healthy baseline. Shows where patient cells cluster near or far from their healthy counterparts.

<p align="center">
  <img src="public/assets/projection-black.webp" alt="Projection — COVID cells mapped onto healthy reference" width="800" />
</p>

### Distance
Divergence heatmap (condition × cell type) and per-cell model agreement scatter. Quantifies how far each cell type has shifted from baseline across disease severity levels.

<p align="center">
  <img src="public/assets/distance-black.webp" alt="Distance — divergence heatmap and model agreement" width="800" />
</p>

### Disagreement
Where Geneformer and GenePT disagree on how much a cell has changed. Points far from the diagonal indicate cell populations where model architecture matters most.

<p align="center">
  <img src="public/assets/disagreement-black.webp" alt="Disagreement — cross-model comparison" width="800" />
</p>

## Architecture

```
┌─────────────────────────────────┐
│         Next.js 15 + TS         │  Vercel
│   Plotly · Tailwind v4 · Zod   │
└──────────────┬──────────────────┘
               │ REST
┌──────────────▼──────────────────┐
│        FastAPI (Python)         │  AWS EC2
│   Pydantic · Parquet · S3      │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   Embedding & Reduction Pipeline│  S3 (Parquet)
│   Geneformer · GenePT · UMAP   │
│   Model comparison · Distances  │
└─────────────────────────────────┘
```

## API

All endpoints are read-only `GET` requests with optional `cell_type` and `disease_activity` filters.

| Endpoint | Description |
|---|---|
| `GET /health` | Health check |
| `GET /api/datasets` | List all datasets |
| `GET /api/v1/embeddings/{dataset}/{model}` | UMAP embedding coordinates |
| `GET /api/v1/projections/{dataset}/{model}` | Disease cells projected into reference manifold |
| `GET /api/v1/scores/{dataset}` | Distance-to-healthy scores (both models) |
| `GET /api/v1/disagreement/{dataset}` | Cross-model disagreement per cell |
| `GET /api/v1/summary/{dataset}` | Aggregated statistics |
| `GET /api/v1/provenance/{dataset}/{model}` | Precompute run metadata |

Interactive docs at [`/docs`](https://api.helical.manumustudio.com/docs) (Swagger UI).

## Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript (strict), Tailwind CSS v4, Plotly.js, Zustand, Zod |
| **Backend** | Python 3.11, FastAPI, SQLModel, Alembic, Pydantic, Pandas, PyArrow |
| **Models** | [Helical SDK](https://github.com/helicalAI/helical) (Geneformer, GenePT) |
| **Data** | Precomputed embeddings in Parquet (S3 + local fallback), PBMC 3k + Wilk et al. COVID dataset |
| **Database** | Neon Postgres (dataset registry, precompute provenance) |
| **Infra** | Vercel (frontend), EC2 + Nginx + Let's Encrypt (API), GitHub Actions CI/CD |
| **Quality** | pytest, Husky pre-commit hooks, GitHub Actions CI, ruff + mypy (backend), ESLint + tsc (frontend) |

## Quick start

```bash
# Backend
cd backend
uv venv --python 3.11 && source .venv/bin/activate
uv sync --frozen
cp .env.example .env  # fill in Neon URLs
alembic upgrade head
python -m app.scripts.seed_datasets
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
corepack enable && pnpm install
echo 'NEXT_PUBLIC_BACKEND_URL=http://localhost:8000' > .env.local
pnpm dev
```

## Project structure

```
backend/
  app/
    api/v1/          # FastAPI route handlers
    services/        # ParquetStore, ParquetReader
    schemas/         # Pydantic request/response models
    scripts/         # Dataset seeding, precompute utilities
  tests/             # pytest suite
  data/parquet/      # Local parquet fallback

frontend/
  app/
    (public)/        # Landing page (scroll showcase)
    dashboard/       # Main dashboard with 4 analysis tabs
  components/
    AppHeader/       # Shared header (landing + dashboard)
    ReferenceView/   # Healthy PBMC atlas tab
    ProjectionView/  # COVID projection tab
    DistanceView/    # Distance heatmap + scatter tab
    DisagreementView/  # Cross-model comparison tab
    landing/         # Landing page sections
    ui/              # shadcn primitives
  lib/
    stores/          # Zustand selection store
    plotly/          # Plotly theme + hooks
    schemas/         # Zod validation schemas
```

## Architecture decisions

Key decisions are documented in [`docs/research/DECISIONS.md`](docs/research/DECISIONS.md):

- **Reference mapping over fine-tuning** — project disease into healthy space rather than retrain
- **Parquet over live inference** — precompute embeddings in Colab, serve as static artifacts
- **S3 with local fallback** — resilient reads without hard S3 dependency
- **Dual ORM** — SQLModel (backend) + Prisma (frontend) on non-overlapping tables

## Built by

[ManuMu Studio](https://manumustudio.com) — powered by [Helical AI](https://helical.bio) foundation models.

## License

MIT
