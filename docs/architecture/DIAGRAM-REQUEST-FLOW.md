# Request Flow

How a user interaction becomes a rendered visualization.

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
└─────────────────────────────────────────────────────────────────┘

  User clicks "Projection" tab
           │
           ▼
  ┌──────────────────┐
  │  Zustand Store   │
  │  useSelection    │──── activeCellTypes: ["CD4 T", "B"]
  │  Store           │──── activeConditions: ["severe"]
  │                  │──── divergenceRange: [0.2, 0.8]
  └────────┬─────────┘
           │ state change triggers re-render
           ▼
  ┌──────────────────┐
  │ useProjection    │
  │ View (hook)      │
  │                  │
  │ useEffect →      │
  │   fetch()        │
  └────────┬─────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                      FETCH BOUNDARY                             │
│  Zod validation — no untyped data crosses this line             │
└─────────────────────────────────────────────────────────────────┘
           │
           │  GET /api/v1/projections/covid_wilk/geneformer
           │      ?sample_size=5000&seed=42
           │
           ▼
  ┌──────────────────┐
  │  fetcher.ts      │
  │                  │
  │  1. fetch(url)   │
  │  2. response.ok? │
  │  3. .json()      │
  │  4. schema       │
  │     .safeParse() │ ◄── ProjectionResponseSchema (Zod)
  │  5. X-Served-    │
  │     From header  │ ──→ source: "s3" | "local"
  └────────┬─────────┘
           │
           │  HTTPS (TLS via Let's Encrypt)
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                        NGINX                                    │
│  api.helical.manumustudio.com → localhost:8000                  │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
  ┌──────────────────┐
  │  FastAPI          │
  │                  │
  │  Middleware:     │
  │  1. RequestID    │──── X-Request-ID header (tracing)
  │  2. CORS         │──── origin regex for Vercel previews
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  Route handler   │
  │  projections.py  │
  │                  │
  │  1. Validate     │
  │     path params  │──── Pydantic model (dataset_slug, model_name)
  │  2. Resolve      │
  │     version      │──── DB query → latest PrecomputeRun
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  ParquetStore    │
  │  .read()         │
  │                  │
  │  Try S3 first    │──→ boto3 get_object (async via to_thread)
  │  Fallback local  │──→ data/parquet/{slug}/{artifact}.parquet
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  parquet_reader  │
  │                  │
  │  1. PyArrow      │
  │     read_table   │──── memory-mapped if local
  │  2. filter_table │──── pyarrow.compute masks (cell_type, condition)
  │  3. sample_table │──── random sample with fixed seed
  │  4. table_to_    │
  │     dicts()      │──── list[dict] for JSON serialization
  └────────┬─────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                    RESPONSE BOUNDARY                            │
│  Pydantic validation — no untyped data leaves the server        │
└─────────────────────────────────────────────────────────────────┘
           │
           │  ProjectionResponse (Pydantic)
           │  + X-Served-From: s3
           │
           ▼  (back to browser)

  ┌──────────────────┐
  │ useProjection    │
  │ View (cont.)     │
  │                  │
  │ Filter by        │
  │ activeCellTypes  │──── client-side filter (Zustand state)
  │                  │
  │ Group by cell    │
  │ type → Plotly    │
  │ traces           │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  UmapScatter     │
  │  (Plotly.js)     │
  │                  │
  │  - One trace per │
  │    cell type     │
  │  - Lasso select  │──→ updates Zustand selectedCellIds
  │  - Hover tooltip │──→ updates Zustand hoveredCellId
  │  - Theme-aware   │
  │    colors        │
  └──────────────────┘
```

## Type safety chain

```
  Parquet columns          Pydantic model           Zod schema
  (PyArrow schema)    →    (FastAPI response)   →   (frontend parse)
                      │                         │
                      │  Server boundary        │  Client boundary
                      │  mypy --strict          │  tsc --noEmit
                      │                         │
                      └── No `any` or `as` ─────┘
```

Data is validated at **both** boundaries — Pydantic when leaving the server, Zod when entering the client. No untyped JSON crosses either line.
