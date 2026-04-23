// Data model for the 23-checkpoint request trace simulation.

export type Environment = "frontend" | "network" | "backend" | "database";
export type Direction = "outbound" | "return";
export type GateType = "data" | "validator";

export interface BackpackEntry {
  readonly key: string;
  readonly value: string;
}

export interface FailureScenario {
  readonly code: number | null;
  readonly message: string;
}

export interface DataPreview {
  readonly label: string;
  readonly shape: string;
  readonly sampleJson: string;
  readonly sizeNote: string;
}

export interface AdrReference {
  readonly id: string;
  readonly title: string;
  readonly relevance: string;
}

export interface Checkpoint {
  readonly step: number;
  readonly file: string | null;
  readonly environment: Environment;
  readonly direction: Direction;
  readonly gateType: GateType;
  readonly title: string;
  readonly description: string;
  readonly code: string;
  readonly codeLanguage: "typescript" | "python" | "nginx" | "none";
  readonly backpackAdds: readonly BackpackEntry[];
  readonly onFailure: FailureScenario;
  readonly dataPreview: DataPreview | null;
  readonly adrReferences: readonly AdrReference[];
}

export const CHECKPOINTS: readonly Checkpoint[] = [
  // ─── OUTBOUND: Frontend [1-5] ───────────────────────────────────────
  {
    step: 1,
    file: "frontend/app/dashboard/page.tsx",
    environment: "frontend",
    direction: "outbound",
    gateType: "data",
    title: "Tab clicked — React knows where to go",
    description:
      "The user clicks the Reference tab. React updates state to 'reference', which tells the app which view component to render.",
    code: `const [activeTab, setActiveTab] = useState<DashboardTabId>("reference");
// ...
onTabChange={setActiveTab}
// ...
{activeTab === "reference" ? (
  <ReferenceView ... />
) : null}`,
    codeLanguage: "typescript",
    backpackAdds: [{ key: "tab", value: "reference" }],
    onFailure: { code: null, message: "Nothing happens — wrong tab or no tab selected" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-007", title: "Engineering Standards", relevance: "4-file component pattern: each view lives in its own folder with .tsx, .types.ts, index.ts, and a custom hook. Named exports only — default exports reserved for Next.js framework files." },
    ],
  },
  {
    step: 2,
    file: "frontend/components/ReferenceView/ReferenceView.tsx",
    environment: "frontend",
    direction: "outbound",
    gateType: "validator",
    title: "Component mounts — triggers data fetch",
    description:
      "ReferenceView mounts and immediately calls the useReferenceView hook. This is a validator gate: the component doesn't add data, it just makes sure the hook runs.",
    code: `export function ReferenceView({ onSourceChange, modelName, onModelNameChange }: ReferenceViewProps) {
  const { setModelName, viewState, data, cellTypes, filteredCells, cellTypeCount } =
    useReferenceView(onSourceChange, modelName, onModelNameChange);`,
    codeLanguage: "typescript",
    backpackAdds: [],
    onFailure: { code: null, message: "Component fails to render — React error boundary catches it" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-007", title: "Engineering Standards", relevance: "The hook pattern: component delegates state and side effects to useReferenceView — keeps the .tsx file declarative, the hook testable in isolation." },
    ],
  },
  {
    step: 3,
    file: "frontend/components/ReferenceView/useReferenceView.ts",
    environment: "frontend",
    direction: "outbound",
    gateType: "data",
    title: "Hook decides what to fetch",
    description:
      "The useEffect inside the hook fires. It knows it needs embeddings for pbmc3k with the geneformer model, sampled at 5000 rows. It builds the parameters.",
    code: `useEffect(() => {
  let cancelled = false;
  async function load() {
    setViewState({ status: "loading" });
    try {
      const base = getClientBackendBaseUrl();
      const url = \`\${base}/api/v1/embeddings/pbmc3k/\${modelName}?sample_size=5000\`;
      const result = await fetchJsonOrNotFound(url, EmbeddingResponseSchema);`,
    codeLanguage: "typescript",
    backpackAdds: [
      { key: "dataset", value: "pbmc3k" },
      { key: "model", value: "geneformer" },
      { key: "sampleSize", value: "5000" },
    ],
    onFailure: { code: null, message: "Hook throws — UI shows error state" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-008", title: "JSON over Raw Parquet", relevance: "The hook fetches JSON, not raw parquet bytes. Server parses parquet and returns typed JSON so the frontend can validate with Zod — no apache-arrow dependency on the client." },
    ],
  },
  {
    step: 4,
    file: "frontend/lib/fetchJson.ts",
    environment: "frontend",
    direction: "outbound",
    gateType: "data",
    title: "fetchJson builds the full request",
    description:
      "fetchJsonOrNotFound receives the URL string and a Zod schema. It calls the native fetch() API with cache: 'no-store' to always get fresh data.",
    code: `export async function fetchJsonOrNotFound<TSchema extends z.ZodTypeAny>(
  url: string,
  schema: TSchema,
): Promise<FetchJsonResult<z.infer<TSchema>>> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (error: unknown) {
    throw new FetchError("Network request failed", { cause: error });
  }`,
    codeLanguage: "typescript",
    backpackAdds: [
      { key: "url", value: "/api/v1/embeddings/pbmc3k/geneformer?sample_size=5000" },
    ],
    onFailure: { code: null, message: "Network error — fetch throws FetchError" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-007", title: "Engineering Standards", relevance: "Zod at every fetch boundary — the schema parameter ensures response.json() is parsed, not cast. Zero `as Type` assertions on external data." },
    ],
  },
  {
    step: 5,
    file: "frontend/lib/backend-url.ts",
    environment: "frontend",
    direction: "outbound",
    gateType: "data",
    title: "Base URL resolved from environment",
    description:
      "getClientBackendBaseUrl() reads the NEXT_PUBLIC_BACKEND_URL environment variable. In production this points to the API domain. Falls back to localhost:8000 for development.",
    code: `export function getClientBackendBaseUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (fromPublic !== undefined && fromPublic.length > 0) {
    return fromPublic.replace(/\\/$/, "");
  }
  return "http://localhost:8000";
}`,
    codeLanguage: "typescript",
    backpackAdds: [
      { key: "baseUrl", value: "https://api.helical.manumustudio.com" },
    ],
    onFailure: { code: null, message: "Env var missing — falls back to localhost (breaks in production)" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-007", title: "Engineering Standards", relevance: "Secrets flow through a single typed gate per side — lib/env.ts on the frontend, app/core/settings.py on the backend. Both fail fast if required variables are missing." },
      { id: "ADR-010", title: "Deployment", relevance: "Split deploy: frontend on Vercel at helical.manumustudio.com, backend on EC2 at api.helical.manumustudio.com. This env var bridges the two domains." },
    ],
  },

  // ─── OUTBOUND: Network [6-7] ───────────────────────────────────────
  {
    step: 6,
    file: null,
    environment: "network",
    direction: "outbound",
    gateType: "validator",
    title: "Request leaves the browser",
    description:
      "The browser sends an HTTPS GET request over the internet. The click is now outside our code — it's traveling through DNS, TCP handshake, and TLS encryption to reach the server.",
    code: `GET /api/v1/embeddings/pbmc3k/geneformer?sample_size=5000 HTTP/1.1
Host: api.helical.manumustudio.com
Accept: application/json`,
    codeLanguage: "none",
    backpackAdds: [],
    onFailure: { code: null, message: "DNS failure or timeout — browser shows network error" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-010", title: "Deployment", relevance: "HTTPS everywhere closes the mixed-content trap — Vercel serves HTTPS, the backend serves HTTPS via Let's Encrypt. No browser block." },
    ],
  },
  {
    step: 7,
    file: "nginx/helical-api.conf",
    environment: "network",
    direction: "outbound",
    gateType: "validator",
    title: "Nginx terminates SSL — HTTPS becomes HTTP",
    description:
      "Nginx listens on port 443 (encrypted). It decrypts the request using the SSL certificate, then forwards plain HTTP to FastAPI on port 8000. The click passes through but Nginx doesn't add data.",
    code: `server {
    listen 443 ssl;
    server_name api.helical.manumustudio.com;

    ssl_certificate     /etc/letsencrypt/live/.../fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/.../privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`,
    codeLanguage: "nginx",
    backpackAdds: [],
    onFailure: { code: 502, message: "502 Bad Gateway — Nginx can't reach FastAPI" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-010", title: "Deployment", relevance: "systemd + Nginx on a single t3.micro EC2 — no Docker on the host. Nginx terminates TLS via Let's Encrypt certbot, proxies to uvicorn on 127.0.0.1:8000. Chosen over Docker/ECR to ship faster under interview deadline." },
    ],
  },

  // ─── OUTBOUND: Backend [8-16] ──────────────────────────────────────
  {
    step: 8,
    file: "backend/app/main.py",
    environment: "backend",
    direction: "outbound",
    gateType: "validator",
    title: "FastAPI receives the request — CORS check",
    description:
      "FastAPI's CORS middleware checks: is the request coming from an allowed origin? If the frontend domain isn't in the allow list, the request is blocked before any route handler runs.",
    code: `app = FastAPI(title="helical-bio-explorer", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_origin_regex=settings.backend_cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestIDMiddleware)`,
    codeLanguage: "python",
    backpackAdds: [],
    onFailure: { code: 403, message: "403 Forbidden — CORS blocks the request" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-010", title: "Deployment", relevance: "CORS is a real object now — the backend has a named cross-origin client (Vercel domain), not a wildcard '*'. BACKEND_CORS_ORIGINS must echo the live Vercel domain." },
    ],
  },
  {
    step: 9,
    file: "backend/app/core/middleware.py",
    environment: "backend",
    direction: "outbound",
    gateType: "data",
    title: "Middleware stamps a request ID",
    description:
      "RequestIDMiddleware generates a UUID and attaches it as an X-Request-ID header. This ID follows the request through every log line — if something breaks, you can trace it.",
    code: `class RequestIDMiddleware:
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id: str | None = None
        for key, value in raw_headers:
            if key.lower() == b"x-request-id":
                request_id = value.decode("latin-1")
                break
        if request_id is None:
            request_id = str(uuid.uuid4())`,
    codeLanguage: "python",
    backpackAdds: [{ key: "requestId", value: "a3f1-...-uuid" }],
    onFailure: { code: null, message: "Middleware never fails — it always generates an ID" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-007", title: "Engineering Standards", relevance: "Observability by default — every request gets a traceable UUID. If something breaks downstream, this ID links the error to the exact request in logs." },
    ],
  },
  {
    step: 10,
    file: "backend/app/api/v1/embeddings.py",
    environment: "backend",
    direction: "outbound",
    gateType: "data",
    title: "Route handler extracts path parameters",
    description:
      "The route /embeddings/{dataset_slug}/{model_name} matches. FastAPI extracts dataset_slug='pbmc3k', model_name='geneformer', and sample_size=5000 from the URL.",
    code: `@router.get("/embeddings/{dataset_slug}/{model_name}",
             response_model=EmbeddingResponse)
async def get_embeddings(
    dataset_slug: str,
    model_name: ModelName,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_session)],
    store: Annotated[ParquetStore, Depends(get_parquet_store)],
    cell_type: str | None = None,
    sample_size: int = 5000,
    seed: int = 42,
) -> EmbeddingResponse:`,
    codeLanguage: "python",
    backpackAdds: [
      { key: "dataset_slug", value: "pbmc3k" },
      { key: "model_name", value: "geneformer" },
      { key: "sample_size", value: "5000" },
    ],
    onFailure: { code: 422, message: "422 Validation Error — invalid path or query params" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-007", title: "Engineering Standards", relevance: "Thin routers: the handler extracts params and delegates to a service function. No business logic lives in a @router.get — keeps handlers testable and services reusable." },
      { id: "ADR-008", title: "JSON over Raw Parquet", relevance: "The route serves JSON, not raw parquet bytes. FastAPI reads parquet via PyArrow server-side, strips embedding columns, and returns typed JSON matching Pydantic schemas." },
    ],
  },
  {
    step: 11,
    file: "backend/app/api/v1/schemas.py",
    environment: "backend",
    direction: "outbound",
    gateType: "validator",
    title: "Pydantic validates parameter types",
    description:
      "Pydantic checks that the extracted values are the right types: model_name must be a valid ModelName, sample_size must be an integer. This is a gate — no data added, just a type check ticket.\n\n💡 Design decision: Dual validation — Pydantic on the backend, Zod on the frontend (span 21). Both sides enforce the same contract independently. If either schema changes, the other breaks at parse time — no silent data corruption across the network boundary.",
    code: `class CellPoint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cell_id: str
    cell_type: str
    umap_1: float
    umap_2: float

class EmbeddingResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dataset: str
    model: str
    total_cells: int
    sampled: int
    source: Literal["s3", "local"]
    cells: list[CellPoint]`,
    codeLanguage: "python",
    backpackAdds: [],
    onFailure: { code: 422, message: "422 Validation Error — wrong types for parameters" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-007", title: "Engineering Standards", relevance: "Pydantic v2 at every boundary — request bodies, response bodies, and path/query params are all validated by typed models. Missing or malformed input fails fast with a 422, never reaches business logic." },
    ],
  },
  {
    step: 12,
    file: "backend/app/services/version_resolver.py",
    environment: "database",
    direction: "outbound",
    gateType: "data",
    title: "Version resolver asks DB: which parquet file?",
    description:
      "resolve_latest_version() queries the database: 'for pbmc3k, what is the most recent precompute run?' The DB returns the S3 key pointing to the parquet file.",
    code: `async def resolve_latest_version(dataset_slug: str, db: AsyncSession) -> str:
    dataset_result = await db.exec(
        select(Dataset).where(Dataset.slug == dataset_slug)
    )
    dataset = dataset_result.first()
    if dataset is None or dataset.id is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    run_result = await db.exec(
        select(PrecomputeRun)
        .where(PrecomputeRun.dataset_id == dataset.id)
        .order_by(desc(PrecomputeRun.created_at))
        .limit(1)
    )`,
    codeLanguage: "python",
    backpackAdds: [
      { key: "parquetKey", value: "v1/pbmc3k/geneformer_embeddings.parquet" },
    ],
    onFailure: { code: 404, message: "404 Not Found — dataset doesn't exist in database" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-002", title: "Precompute-in-Colab", relevance: "The precompute_runs table is the provenance log — every parquet artifact traces back to a specific notebook run with model version, parameters, and git SHA. This query is how the runtime finds the right artifact." },
      { id: "ADR-003", title: "Dual-ORM Bounded Contexts", relevance: "SQLModel owns datasets and precompute_runs tables. Prisma (frontend) never touches these — each ORM has strict, non-overlapping ownership." },
    ],
  },
  {
    step: 13,
    file: "backend/app/db/session.py",
    environment: "database",
    direction: "outbound",
    gateType: "validator",
    title: "Database connection opens",
    description:
      "get_session() yields an async database session to Neon Postgres. This is a validator gate: either the connection works or it doesn't. No data added to the backpack.",
    code: `async def get_session() -> AsyncIterator[SQLModelAsyncSession]:
    """Yield a request-scoped async ORM session."""

    async with async_session_maker() as session:
        yield session`,
    codeLanguage: "python",
    backpackAdds: [],
    onFailure: { code: 500, message: "500 Internal Server Error — can't connect to database" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-003", title: "Dual-ORM Bounded Contexts", relevance: "One Neon Postgres database, two non-overlapping ownership domains. SQLModel connects via Neon's built-in pooler — zero-ops managed Postgres with serverless scaling." },
    ],
  },
  {
    step: 14,
    file: "backend/app/db/models.py",
    environment: "database",
    direction: "outbound",
    gateType: "data",
    title: "ORM returns the precompute run record",
    description:
      "The PrecomputeRun model maps to the precompute_runs table. The query returns a row with the output_parquet_key — this is the S3 address of the file we need.",
    code: `class PrecomputeRun(SQLModel, table=True):
    __tablename__ = "precompute_runs"

    id: UUID | None = Field(default_factory=uuid4, primary_key=True)
    dataset_id: UUID = Field(foreign_key="datasets.id", index=True)
    model_name: str
    model_version: str
    output_parquet_key: str
    git_sha: str = Field(min_length=7, max_length=40)
    created_at: datetime
    dataset: Dataset | None = Relationship(back_populates="precompute_runs")`,
    codeLanguage: "python",
    backpackAdds: [
      { key: "s3Key", value: "v1/pbmc3k/geneformer_embeddings.parquet" },
    ],
    onFailure: { code: 404, message: "404 — no precompute run found for this dataset" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-002", title: "Precompute-in-Colab", relevance: "The ORM row carries output_parquet_key and git_sha — full provenance. Every byte the user sees is traceable to a specific precompute run. Changing a model requires a new notebook run, forcing provenance to stay honest." },
      { id: "ADR-003", title: "Dual-ORM Bounded Contexts", relevance: "PrecomputeRun is a SQLModel table — Prisma never reads or writes it. Schema migrations are independent per service (Alembic on Python, Prisma Migrate on TypeScript)." },
    ],
  },
  {
    step: 15,
    file: "backend/app/services/parquet_store.py",
    environment: "backend",
    direction: "outbound",
    gateType: "data",
    title: "Parquet downloaded from S3 into server RAM",
    description:
      "ParquetStore.read() uses the S3 key to download the parquet file. The raw bytes are held in server memory. If S3 fails, it falls back to a local copy.\n\n💡 Design decision: S3 with local fallback — the API never goes down. One failure triggers immediate fallback, no retry loop. The X-Served-From header tells the frontend which source was used, so you always know where your data came from.",
    code: `async def read(self, version, dataset_slug, artifact_type):
    key = self._s3_key(version, dataset_slug, artifact_type)

    if self._bucket is not None:
        try:
            data = await asyncio.to_thread(self._read_s3_sync, key)
            return data, "s3"
        except (ClientError, BotoCoreError) as exc:
            logger.warning("S3 read failed for %s; falling back to local", key)

    local_path = self._local_path(dataset_slug, artifact_type)
    if not local_path.exists():
        raise FileNotFoundError(f"Parquet not found in S3 or locally")

    return local_path, "local"`,
    codeLanguage: "python",
    backpackAdds: [
      { key: "parquetBytes", value: "~6 MB raw parquet in RAM" },
      { key: "source", value: "s3" },
    ],
    onFailure: { code: 500, message: "500 — S3 download failed and no local fallback" },
    adrReferences: [
      { id: "ADR-005", title: "Local Parquet Fallback", relevance: "S3 first, local fallback on any error — one failure triggers fallback immediately, no retry. X-Served-From header tells the frontend which source was used, surfaced in the provenance chip." },
      { id: "ADR-004", title: "Minimal AWS Surface", relevance: "One public-read S3 bucket for parquet artifacts — cheaper and simpler than signed URLs. The data itself is already public (PBMC 3k, CC BY 4.0)." },
    ],
    dataPreview: {
      label: "Raw parquet in server memory",
      shape: "~2,638 rows × ~15 columns (all original columns from the Colab notebook)",
      sampleJson: "",
      sizeNote: "~6 MB compressed parquet → the full file sits in RAM before any filtering happens",
    },
  },
  {
    step: 16,
    file: "backend/app/services/parquet_reader.py",
    environment: "backend",
    direction: "outbound",
    gateType: "data",
    title: "PyArrow reads, filters, and samples 5000 cells",
    description:
      "This is the heaviest checkpoint. PyArrow opens the parquet, optionally filters by cell_type, randomly samples 5000 rows, and picks only the columns needed: cell_id, cell_type, umap_1, umap_2.\n\n💡 Design decision: Precompute over live inference — Geneformer/GenePT ran offline in Colab with GPU. At runtime, the server just reads static parquet. No GPU, no cold start, no model loading. What took ~30 seconds in Colab is instant here.\n\n💡 Design decision: PyArrow over Pandas — PyArrow reads only the columns needed (zero-copy), samples 5,000 rows from a 276k-cell dataset, and strips embedding columns. A ~50 MB parquet becomes a ~500 KB JSON response. Pandas would load everything into memory first.",
    code: `def read_parquet_table(data: bytes | Path) -> pa.Table:
    if isinstance(data, Path):
        return pq.read_table(data, memory_map=True)
    return pq.read_table(io.BytesIO(data))

def sample_table(table, sample_size, seed=42):
    total_rows = table.num_rows
    if sample_size <= 0 or sample_size >= total_rows:
        return table, total_rows

    rng = random.Random(seed)
    indices = sorted(rng.sample(range(total_rows), k=sample_size))
    taken = table.take(pa.array(indices))
    return taken, total_rows`,
    codeLanguage: "python",
    backpackAdds: [
      { key: "cells", value: "5000 rows × [cell_id, cell_type, umap_1, umap_2]" },
      { key: "totalCells", value: "2638" },
    ],
    onFailure: { code: 500, message: "500 — corrupt parquet file or PyArrow read failure" },
    adrReferences: [
      { id: "ADR-002", title: "Precompute-in-Colab", relevance: "All model inference ran offline in Colab with GPU. At runtime, the server just reads static parquet — no GPU, no cold-start latency, no model loading. The backend is architecturally a read-mostly data API." },
      { id: "ADR-008", title: "JSON over Raw Parquet", relevance: "Server-side sampling: 276k-cell disease datasets are sampled to ~5,000 rows here, keeping JSON payloads under 500 KB. Embedding columns are stripped — only UMAP coordinates and metadata cross the wire." },
    ],
    dataPreview: {
      label: "After PyArrow filters and samples — this is what becomes JSON",
      shape: "2,638 rows × 4 columns (cell_id, cell_type, umap_1, umap_2)",
      sampleJson: `{
  "cell_id": "AAACATACAACCAC-1",
  "cell_type": "CD4 T",
  "umap_1": 3.4218,
  "umap_2": -1.8734
}`,
      sizeNote: "4 fields × 2,638 rows = 10,552 values → ~350 KB as JSON. Small enough for one HTTP response — no pagination, no streaming, no chunking needed.",
    },
  },

  // ─── RETURN: Backend [17] ──────────────────────────────────────────
  {
    step: 17,
    file: "backend/app/api/v1/embeddings.py",
    environment: "backend",
    direction: "return",
    gateType: "validator",
    title: "Pydantic validates the response shape",
    description:
      "Before sending the response, Pydantic checks every CellPoint has the right fields and types. If the backend code built the response wrong, this catches it. Validator gate — no new data.\n\n💡 Design decision: Dual validation — this is the backend half. Pydantic validates the response shape before it leaves. The frontend's Zod schema (span 21) mirrors this exact structure. Both sides enforce the contract independently — if the backend changes a field, Zod catches it. If the frontend expects a new field, Pydantic won't send it.",
    code: `cells = [CellPoint.model_validate(row) for row in rows]

response.headers["X-Served-From"] = source
return EmbeddingResponse(
    dataset=dataset_slug,
    model=model_name,
    total_cells=total_cells,
    sampled=sampled_table.num_rows,
    source=source,
    cells=cells,
)`,
    codeLanguage: "python",
    backpackAdds: [],
    onFailure: { code: 500, message: "500 Internal Server Error — response shape doesn't match schema" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-007", title: "Engineering Standards", relevance: "Pydantic validates both input AND output. Response bodies are frozen BaseModel subclasses — if the backend code builds a malformed response, Pydantic catches it before serialization." },
      { id: "ADR-008", title: "JSON over Raw Parquet", relevance: "The response matches a strict Pydantic schema (EmbeddingResponse) — typed JSON that the frontend's Zod schema mirrors. End-to-end type safety across the network boundary." },
    ],
  },

  // ─── RETURN: Network [18-19] ───────────────────────────────────────
  {
    step: 18,
    file: null,
    environment: "network",
    direction: "return",
    gateType: "validator",
    title: "JSON response leaves FastAPI",
    description:
      "FastAPI serializes the EmbeddingResponse to JSON and sends it as an HTTP response. The data is now a JSON string traveling back through the network.",
    code: `HTTP/1.1 200 OK
Content-Type: application/json
X-Request-ID: a3f1-...-uuid
X-Served-From: s3

{"dataset":"pbmc3k","model":"geneformer","total_cells":2638,"sampled":2638,"source":"s3","cells":[...]}`,
    codeLanguage: "none",
    backpackAdds: [],
    onFailure: { code: null, message: "Serialization error — unlikely but would be 500" },
    adrReferences: [
      { id: "ADR-008", title: "JSON over Raw Parquet", relevance: "~350 KB JSON payload fits in a single HTTP response — no pagination, no streaming. The trade-off: server bears the ~50 ms parsing cost, but the frontend gets Zod-validatable typed data." },
    ],
    dataPreview: {
      label: "The actual JSON traveling over the network",
      shape: "One JSON object with metadata + cells array",
      sampleJson: `{
  "dataset": "pbmc3k",
  "model": "geneformer",
  "total_cells": 2638,
  "sampled": 2638,
  "source": "s3",
  "cells": [
    { "cell_id": "AAACATACAACCAC-1", "cell_type": "CD4 T", "umap_1": 3.42, "umap_2": -1.87 },
    { "cell_id": "AAACATTGAGCTAC-1", "cell_type": "B", "umap_1": -5.11, "umap_2": 2.34 },
    ...2,636 more cells
  ]
}`,
      sizeNote: "~350 KB JSON payload — fits easily in a single HTTP response. No pagination needed.",
    },
  },
  {
    step: 19,
    file: "nginx/helical-api.conf",
    environment: "network",
    direction: "return",
    gateType: "validator",
    title: "Nginx encrypts the response — HTTP becomes HTTPS",
    description:
      "The reverse of checkpoint 7. Nginx takes the plain HTTP response from FastAPI and wraps it in HTTPS encryption before sending it to the browser.",
    code: `location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}`,
    codeLanguage: "nginx",
    backpackAdds: [],
    onFailure: { code: null, message: "Connection reset — response lost in transit" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-010", title: "Deployment", relevance: "Same Nginx reverse proxy handles both directions. The TLS termination is symmetric — encrypts outbound responses just as it decrypts inbound requests." },
    ],
  },

  // ─── RETURN: Frontend [20-23] ──────────────────────────────────────
  {
    step: 20,
    file: "frontend/lib/fetchJson.ts",
    environment: "frontend",
    direction: "return",
    gateType: "validator",
    title: "fetchJson receives and parses the response",
    description:
      "Back in the browser. fetchJsonOrNotFound checks the HTTP status, parses the JSON body, and runs Zod schema validation. If anything is wrong, it throws.",
    code: `const source = parseServedFromHeader(response.headers.get("X-Served-From"));

if (response.status === 404) {
  return { status: "not_found" };
}
if (!response.ok) {
  throw new FetchError(\`HTTP \${String(response.status)}\`);
}

let json: unknown;
try {
  json = await response.json();
} catch (error: unknown) {
  throw new FetchError("Response body is not valid JSON", { cause: error });
}`,
    codeLanguage: "typescript",
    backpackAdds: [],
    onFailure: { code: null, message: "FetchError thrown — non-200 status or invalid JSON" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-007", title: "Engineering Standards", relevance: "The frontend's defense layer — HTTP status check, JSON parse, and Zod validation in sequence. Any failure throws a typed FetchError, never silently passes bad data to components." },
    ],
  },
  {
    step: 21,
    file: "frontend/lib/schemas/embeddings.ts",
    environment: "frontend",
    direction: "return",
    gateType: "validator",
    title: "Zod validates every field — never trust external data",
    description:
      "The Zod schema checks the JSON matches exactly what the frontend expects: dataset is a string, cells is an array of CellPoint objects, each with cell_id, cell_type, umap_1, umap_2. This is the frontend's defense: even if the backend sends garbage, Zod catches it.\n\n💡 Design decision: Dual validation — this is the frontend half. Zod mirrors the backend's Pydantic schema field-for-field: CellPointSchema matches CellPoint, EmbeddingResponseSchema matches EmbeddingResponse. End-to-end type safety across the network boundary — no `as Type` assertions, no trust.",
    code: `export const CellPointSchema = z.object({
  cell_id: z.string(),
  cell_type: z.string(),
  umap_1: z.number(),
  umap_2: z.number(),
});

export const EmbeddingResponseSchema = z.object({
  dataset: z.string(),
  model: z.string(),
  total_cells: z.number(),
  sampled: z.number(),
  source: z.enum(["s3", "local"]),
  cells: z.array(CellPointSchema),
});`,
    codeLanguage: "typescript",
    backpackAdds: [],
    onFailure: { code: null, message: "Zod parse error — UI shows error state, bad data never reaches components" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-007", title: "Engineering Standards", relevance: "Zod mirrors the backend's Pydantic schema — CellPointSchema matches CellPoint, EmbeddingResponseSchema matches EmbeddingResponse. End-to-end type safety: if either side changes the contract, the other breaks at compile/parse time." },
    ],
  },
  {
    step: 22,
    file: "frontend/components/ReferenceView/useReferenceView.ts",
    environment: "frontend",
    direction: "return",
    gateType: "data",
    title: "Hook stores validated data in React state",
    description:
      "The validated data is stored in viewState with status 'ready'. React triggers a re-render — the component now has everything it needs to display.",
    code: `setViewState({
  status: "ready",
  data: result.data,
  source: result.source,
});
reportSource(result.source);`,
    codeLanguage: "typescript",
    backpackAdds: [
      { key: "viewState", value: "ready" },
      { key: "reactData", value: "{ cells, totalCells, sampled, source }" },
    ],
    onFailure: { code: null, message: "setState fails — React error boundary" },
    dataPreview: null,
    adrReferences: [
      { id: "ADR-007", title: "Engineering Standards", relevance: "Hook stores Zod-validated data in React state — the component receives typed, validated data. The hook pattern separates state management from rendering, keeping both testable." },
    ],
  },
  {
    step: 23,
    file: "frontend/components/UmapScatter/UmapScatter.tsx",
    environment: "frontend",
    direction: "return",
    gateType: "data",
    title: "Plotly renders the scatter plot — journey complete",
    description:
      "Plotly takes the cell data, maps umap_1 to X, umap_2 to Y, colors by cell_type, and renders an interactive scatter plot. The user sees the embedding. One click, 23 files, journey complete.",
    code: `<Plot
  data={traces}
  layout={layout}
  config={config}
  style={plotStyle}
  useResizeHandler
  onSelected={(ev) => {
    const pts = ev?.points;
    // ...selection handling
  }}
/>`,
    codeLanguage: "typescript",
    backpackAdds: [
      { key: "rendered", value: "Interactive UMAP scatter plot with 5000 cells" },
    ],
    onFailure: { code: null, message: "Plotly render error — blank chart" },
    dataPreview: {
      label: "What Plotly receives to render",
      shape: "Array of traces — one trace per cell type, each with x[], y[], text[]",
      sampleJson: `{
  "type": "scattergl",
  "mode": "markers",
  "name": "CD4 T",
  "x": [3.42, 1.87, 4.12, ...],
  "y": [-1.87, 0.54, -2.33, ...],
  "text": ["AAACATAC...", "AAACATTG...", ...]
}`,
      sizeNote: "Same ~350 KB data, reorganized from rows to columns (x[], y[]) for Plotly's trace format",
    },
    adrReferences: [
      { id: "ADR-009", title: "Plotly.js for Visualization", relevance: "react-plotly.js handles 5–10k points with hover, zoom, pan, and lasso select out of the box. ~3 MB bundle is acceptable for a demo prioritizing interactivity. If 100k+ points were needed, deck.gl would be the upgrade path — but server-side sampling at 5k makes this unnecessary." },
      { id: "ADR-001", title: "Reference Mapping over Model Comparison", relevance: "This scatter plot IS the reference mapping — a healthy PBMC atlas where each dot is a cell, colored by type. This view is step 1 of the four-step scientific workflow the entire demo is built around." },
    ],
  },
] as const;
