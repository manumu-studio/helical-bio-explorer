# Runtime Flow — helical-bio-explorer

**Last updated:** 2026-04-11 (Session 004)
**Status:** Architectural reference. Describes the user-facing runtime of the finished demo, not the build order.
**Source of truth for:** how requests move from browser → Next.js → FastAPI → (Neon | S3) and back.

---

## TL;DR

Two independent server paths share one database. Scientific data flows through **FastAPI + SQLModel + S3 parquet + Neon provenance**. User state flows through **Next.js API routes + Prisma + Neon saved_views**. They never cross. That's the dual-ORM bounded-context architecture (D8) in action.

```
                              ┌───────────────────────┐
                              │    User's Browser      │
                              └──────────┬────────────┘
                                         │
                                         ▼
                        ┌──────────────────────────────────┐
                        │      EC2 :80 (docker compose)     │
                        └──┬────────────────────────────┬──┘
                           │                            │
                           ▼                            ▼
               ┌────────────────────┐       ┌─────────────────────┐
               │   Next.js :3000    │       │   FastAPI :8000     │
               │   (SSR + API)      │       │   (ML data API)     │
               └─────┬────────┬─────┘       └──────────┬──────────┘
                     │        │                        │
          user-state │        │ scientific data        │ parquet
          lane       │        │ lane (proxied)         │ reads
                     │        │                        │
                     │        ▼                        ▼
                     │   ┌─────────┐            ┌───────────────┐
                     │   │ FastAPI │───────────►│   S3 bucket   │
                     │   │  :8000  │            │ (public read) │
                     │   └────┬────┘            └───────────────┘
                     │        │
                     │        │ SQLModel
                     ▼        ▼
           ┌──────────────────────────────┐
           │         Neon Postgres         │
           │  ┌────────────┐ ┌──────────┐ │
           │  │ saved_views│ │datasets  │ │
           │  │  (Prisma)  │ │precompute│ │
           │  │            │ │_runs     │ │
           │  │            │ │(SQLModel)│ │
           │  └────────────┘ └──────────┘ │
           └──────────────────────────────┘
```

**Hard rule:** Prisma never reads or writes `datasets` / `precompute_runs`. SQLModel never reads or writes `saved_views`. Each ORM owns its own migration history.

---

## Lane 1 — Scientific data (FastAPI + SQLModel + S3)

### Landing page

```
[User]
  │  GET http://<ec2-public-dns>/
  ▼
[Next.js server component — app/page.tsx]
  │  fetch via Zod wrapper
  │  GET http://backend:8000/datasets
  ▼
[FastAPI /datasets]
  │  SQLModel session
  │  SELECT * FROM datasets ORDER BY created_at
  ▼
[Neon: datasets]
  │  returns 2 rows: pbmc3k, <disease-slug>
  ▼
[FastAPI]  ─── JSON list ──►
                              [Next.js SSR]
                                │  renders:
                                │  - 1-sentence pitch
                                │  - "Start the tour" CTA
                                │  - dataset picker
                                │  - saved-views drawer toggle
                                ▼
                           [User's browser]
                              (HTML + hydration bundle)
```

**One FastAPI hit. Zero parquet reads. Sub-100ms first paint.**

---

### View 1 — "Build the healthy reference"

User clicks **Start the tour** → client nav to `/tour/1`.

```
[Next.js server component — app/tour/1/page.tsx]
  │  GET http://backend:8000/embeddings?dataset=pbmc3k&model=geneformer
  ▼
┌───────────────────────────────────────────────────────────────────┐
│  [FastAPI /embeddings]                                             │
│                                                                    │
│    1. SQLModel: fetch latest precompute_runs row for               │
│                 (pbmc3k, geneformer) — join datasets on dataset_id │
│    2. extract s3_key from the row                                  │
│    3. aiohttp GET https://helical-bio-explorer-data.s3/<s3_key>    │
│    4. pyarrow reads parquet → trim to (umap_x, umap_y, cell_type)  │
│    5. attach provenance from step 1                                │
└───────────────────────────────────────────────────────────────────┘
  ▼
  returns JSON:
  {
    points: [{x, y, cell_type}, ...2638 items],
    provenance: {
      model: "geneformer",
      version: "gf-6L-10M-i2048",
      git_sha: "a1b2c3d",
      completed_at: "2026-04-12T14:32Z"
    }
  }
  ▼
[Next.js]
  │  renders UMAP scatter (Plotly or deck.gl)
  │  colored by cell_type
  │  provenance chip in corner shows git_sha (click → full metadata panel)
  ▼
[User sees the healthy reference]
```

---

### View 2 — "Project sick cells onto the reference"

User clicks **Next** → `/tour/2`.

```
[Next.js]
  │  GET /embeddings?dataset=<disease-slug>&model=geneformer&overlay_on=pbmc3k
  ▼
[FastAPI /embeddings]
  │  same code path as view 1, but returns TWO layers
  │  - base:    healthy pbmc3k embedding (grey, faded)
  │  - overlay: diseased embedding (colored by subtype)
  ▼
[Next.js]
  │  draws both layers on same axes
  │  user sees: "this blob of sick T cells drifted to the edge of the healthy cluster"
```

**Important:** the overlay is a visual composition on the frontend. Both parquet files are fetched server-side and returned in one response. No alignment math at runtime — any transformation was precomputed in Colab.

---

### View 3 — "Measure divergence"

```
[Next.js]
  │  GET /divergence?reference=pbmc3k&query=<disease-slug>&model=geneformer
  ▼
[FastAPI /divergence]
  │  reads divergence.parquet (precomputed: per-cell-type distance stats)
  │  joins provenance from precompute_runs
  ▼
  returns JSON:
  {
    per_cell_type: [
      {cell_type: "CD14+ Monocyte", median_dist: 0.42, p95_dist: 0.71},
      {cell_type: "B cell",         median_dist: 0.08, p95_dist: 0.15},
      ...
    ],
    provenance: { ... }
  }
  ▼
[Next.js]
  │  horizontal bar chart
  │  "these cell types drifted the most in the diseased state"
```

---

### View 4 — "Where the two models disagree"

```
[Next.js server component]
  │  Promise.all([
  │    fetch("/embeddings?dataset=<disease>&model=geneformer"),
  │    fetch("/embeddings?dataset=<disease>&model=genept")
  │  ])
  ▼
[FastAPI]  ──parallel──►  [S3: 2 parquet files]
  │
  │  returns 2 independent embedding sets
  ▼
[Next.js]
  │  side-by-side UMAPs
  │  highlights cells where cluster assignments disagree
  │  "GenePT calls these T cells; Geneformer calls them NK cells"
```

**Narrative climax.** The "two lenses on the same biology" moment the demo was built to show.

---

## Lane 2 — User state (Next.js API routes + Prisma)

### Saving a view

User clicks **Save this view** on any tour page.

```
[Next.js client component]
  │  POST /api/views
  │  body: { name: "My COVID monocyte view", filters: {...current ui state} }
  ▼
[Next.js API route — app/api/views/route.ts]
  │  1. read session_token from httpOnly cookie (set on first visit if missing)
  │  2. Zod.parse the request body
  │  3. Prisma client
  │     await db.savedView.create({
  │       data: { sessionToken, name, filters, note: null }
  │     })
  ▼
[Neon: saved_views]
  │  INSERT ... RETURNING id, created_at
  ▼
[Next.js API route]
  │  returns {id, createdAt}
  ▼
[Next.js client]
  │  optimistic update → drawer shows the new row
```

### Listing saved views

```
[User opens drawer]
  │  GET /api/views   (Next.js API route)
  ▼
[Prisma]
  │  SELECT * FROM saved_views WHERE session_token = $1 ORDER BY created_at DESC
  ▼
[Neon]  ──► [Next.js]  ──► drawer populates
```

### Loading a saved view

```
[User clicks a saved-view row]
  │  drawer pulls {filters} from local state (already fetched)
  │  client-side nav applies filters to current tour page
  │  no network call — pure state hydration
```

---

## Why the two lanes never cross

| Property | Lane 1 (Science) | Lane 2 (User state) |
|---|---|---|
| Owner | FastAPI + SQLModel | Next.js + Prisma |
| Tables | `datasets`, `precompute_runs` | `saved_views` |
| Data size | MB-sized parquet blobs (on S3) | KB-sized filter JSON |
| Read latency target | < 200ms parquet + join | < 50ms pure Neon |
| Failure mode | S3 404 → 502 to client | Prisma timeout → 500 to client |
| Consumer | Tour pages (server components) | Drawer (client component) |
| Mutation frequency | Read-only at runtime | CRUD per user action |
| Provenance attached | **Always** (`git_sha`, `model_version`) | **Never** (it's UI state) |

The tradeoffs are so different that forcing them through one ORM would be cargo-culting. Two lanes = right tool per concern.

---

## What the architecture guarantees (and doesn't)

### ✅ Guarantees

- **Provenance on every scientific response.** Every `/embeddings` and `/divergence` response carries the exact `git_sha`, `model_version`, and `completed_at` of the Colab run that produced it. No ambiguity about which run the user is looking at.
- **Demo can't hang on Geneformer.** No live model inference in the hot path. Worst case is an S3 404, which surfaces as a clean typed error, not a timeout.
- **Dual-ORM isolation.** A broken Prisma migration cannot corrupt `datasets` or `precompute_runs`. A broken Alembic migration cannot corrupt `saved_views`.
- **Bounded blast radius.** If the science API goes down, saved views still work. If Neon is hot-swapped, the frontend re-fetches cleanly.

### ❌ Does NOT guarantee

- **Real-time scientific interactivity.** You cannot "change the model parameters and rerun" at demo time. Every embedding is frozen at Colab precompute time. That's the cost of avoiding live inference, and it's the right cost.
- **Multi-user sync.** Saved views are scoped to an anonymous cookie. Two browsers = two sessions. Intentional — no auth theater.
- **Fresh data.** The disease dataset is whatever was last precomputed and pushed. No streaming ingest. This is a demo, not a product.

---

## Live-demo failure playbook

Things that could go wrong during the actual interview demo, and what the user sees:

| Failure | User experience | Recovery |
|---|---|---|
| S3 bucket returns 403 | FastAPI returns `{error: "parquet unavailable", request_id}` → Next.js shows inline error banner on the tour page | Fall back to a cached local parquet copy in `backend/data/` (ship one for insurance) |
| Neon connection drops | FastAPI `/datasets` returns 500 → Next.js shows "metadata unavailable" landing page | Neon auto-reconnects; reload fixes it |
| FastAPI container crashes | Next.js server component catches the fetch error → renders an error page with `X-Request-ID` | `docker compose restart backend` on the EC2 box |
| Prisma migration drift | `/api/views` returns 500 on first POST | Pre-migrate Neon before the demo (part of deploy checklist) |
| Colab run wrote wrong `git_sha` | Provenance chip shows the wrong commit | Non-fatal, cosmetic — fix in next precompute run |
| EC2 public DNS changes | Demo URL 404s | AWS elastic IP or keep the instance running; this is a demo-day operational issue, not an architecture issue |

The single load-bearing mitigation is **ship a local parquet copy as a fallback** — one-line change in `FastAPI /embeddings` that checks `backend/data/<key>` if S3 fails. Worth the ~50 MB in the Docker image.

---

## How this diagram maps to the build packets

| Packet | What it adds to this flow |
|---|---|
| **01a** | The outer box boots. `/health` only. No lanes yet. |
| **01b** | Both ORMs are wired. `/datasets` (lane 1) and `/api/views` (lane 2) work. No parquet, no ML. |
| **02**  | Colab notebook produces the first parquet files. S3 bucket is populated. `precompute_runs` is written for the first time. |
| **03**  | Lane 1 goes live. `/embeddings` and `/divergence` work end-to-end. Views 1–3 render real UMAPs. |
| **04**  | Lane 2 goes live. Saved-views drawer works. View 4 (disagreement) ships. |
| **05**  | EC2 + ECR deploy. Public demo URL exists. Local-parquet fallback baked in. |

---

## Related documents

- [`docs/research/DECISIONS.md`](../research/DECISIONS.md) — architectural decisions this flow implements (D3, D6, D8, D9)
- [`docs/research/DEMO-FOUNDATION.md`](../research/DEMO-FOUNDATION.md) — the 4-step reference-mapping paradigm that defines the 4 tour views
- [`docs/build-packets/PACKET-01a-foundation-skeleton.md`](../build-packets/PACKET-01a-foundation-skeleton.md) — the first packet that builds the outer box of this diagram
