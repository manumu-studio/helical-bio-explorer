// The 15 checkpoints of the offline precompute pipeline — from raw public datasets
// to the versioned parquet artifacts the runtime API serves. Three phases:
// Phase 1 (PBMC reference), Phase 2 (COVID projection), Phase 3 (GenePT disagreement).

import type { PipelineCheckpoint } from "./types";

export const PIPELINE_CHECKPOINTS: readonly PipelineCheckpoint[] = [
  // ─── PHASE 1 — PBMC REFERENCE [1-6] ───────────────────────────────────
  {
    step: 1,
    phase: "pbmc-reference",
    file: "notebooks/precompute_pbmc_mvp.ipynb",
    environment: "colab",
    title: "Load PBMC 3k dataset via scanpy",
    description:
      "scanpy loads the pre-processed PBMC 3k dataset from 10x Genomics. 2,638 cells with 13,714 genes — a standard healthy blood reference atlas used across the single-cell community.",
    code: `import scanpy as sc

adata = sc.datasets.pbmc3k_processed()
print(f"Loaded {adata.n_obs} cells, {adata.n_vars} genes")
# → 2,638 cells, 13,714 genes`,
    codeLanguage: "python",
    artifactAdds: [
      { key: "adata", value: "AnnData: 2,638 cells × 13,714 genes" },
    ],
    dataPreview: {
      label: "In-memory AnnData",
      shape: "2,638 rows × 13,714 columns",
      sampleJson: "",
      sizeNote: "~140 MB in memory as sparse matrix",
    },
    adrReferences: [
      {
        id: "ADR-002",
        title: "Precompute-in-Colab",
        relevance:
          "Public CC BY 4.0 dataset. No data licensing risk. scanpy loads directly from the 10x Genomics server — no local copies needed.",
      },
    ],
    designDecision: null,
  },
  {
    step: 2,
    phase: "pbmc-reference",
    file: "notebooks/precompute_pbmc_mvp.ipynb",
    environment: "colab",
    title: "Geneformer tokenizes gene expression",
    description:
      "The Helical SDK's Geneformer model tokenizes each cell's gene expression profile. Genes are ranked by expression level and encoded as tokens — the same tokenization strategy used by the original Geneformer paper.",
    code: `from helical.models.geneformer import Geneformer, GeneformerConfig

geneformer_config = GeneformerConfig(batch_size=32)
geneformer = Geneformer(configurer=geneformer_config)

dataset = geneformer.process_data(adata)`,
    codeLanguage: "python",
    artifactAdds: [
      { key: "dataset", value: "Tokenized dataset ready for GPU inference" },
    ],
    dataPreview: null,
    adrReferences: [
      {
        id: "ADR-002",
        title: "Precompute-in-Colab",
        relevance:
          "Helical SDK wraps Geneformer with a clean Python API. Three lines replace 200+ lines of manual tokenization, model loading, and batch handling.",
      },
    ],
    designDecision: null,
  },
  {
    step: 3,
    phase: "pbmc-reference",
    file: "notebooks/precompute_pbmc_mvp.ipynb",
    environment: "colab",
    title: "GPU inference — 512-dim embeddings per cell",
    description:
      "Geneformer runs forward inference on a Colab T4 GPU. Each cell becomes a 512-dimensional embedding vector — a learned representation of its transcriptomic state.",
    code: `embeddings = geneformer.get_embeddings(dataset)
print(f"Embeddings shape: {embeddings.shape}")
# → (2638, 512)`,
    codeLanguage: "python",
    artifactAdds: [
      { key: "embeddings", value: "ndarray (2,638 × 512) — 512-dim per cell" },
    ],
    dataPreview: {
      label: "Geneformer embeddings (float32)",
      shape: "2,638 × 512 float32",
      sampleJson: `[
  [0.0421, -0.1893, 0.3342, ...],  # cell 0
  [-0.0214, 0.2871, -0.0998, ...], # cell 1
  [0.1104, -0.0523, 0.1987, ...],  # cell 2
]`,
      sizeNote: "~5.4 MB in memory",
    },
    adrReferences: [
      {
        id: "ADR-002",
        title: "Precompute-in-Colab",
        relevance:
          "GPU inference takes ~15 seconds for 2,638 cells. CPU would take ~10 minutes. This is why the pipeline runs on Colab, not on the deployed t3.micro.",
      },
    ],
    designDecision: {
      title: "Precompute over live inference",
      explanation:
        "What takes ~30 seconds on a Colab T4 GPU would be impossible on the deployed t3.micro EC2 (no GPU). By precomputing, the runtime API just reads static files — no model loading, no cold start, instant responses.",
    },
  },
  {
    step: 4,
    phase: "pbmc-reference",
    file: "notebooks/precompute_pbmc_mvp.ipynb",
    environment: "colab",
    title: "UMAP reduces 512 dims to 2D coordinates",
    description:
      "UMAP (Uniform Manifold Approximation and Projection) reduces the 512-dimensional embeddings to 2D coordinates for visualization. The fitted UMAP reducer is saved as a joblib file so disease cells can be projected into this same space later without re-fitting.",
    code: `import umap
import joblib

reducer = umap.UMAP(n_components=2, metric="cosine", random_state=42)
coords = reducer.fit_transform(embeddings)

# Save reducer for downstream projection (Phase 2)
joblib.dump(reducer, "pbmc_umap_reducer.joblib")`,
    codeLanguage: "python",
    artifactAdds: [
      { key: "umap_coords", value: "ndarray (2,638 × 2) — x,y per cell" },
      { key: "umap_reducer", value: "Fitted UMAP transform saved as joblib" },
    ],
    dataPreview: {
      label: "UMAP 2D coordinates",
      shape: "2,638 × 2 float32 (umap_1, umap_2)",
      sampleJson: "",
      sizeNote: "~21 KB — just two floats per cell",
    },
    adrReferences: [
      {
        id: "ADR-002",
        title: "Precompute-in-Colab",
        relevance:
          "UMAP coordinates are precomputed, not computed at request time. The frontend receives ready-to-plot (x, y) pairs.",
      },
    ],
    designDecision: {
      title: "Save UMAP reducer as joblib",
      explanation:
        "Phase 2 needs to project disease cells into the same 2D space as the healthy reference. Saving the fitted reducer avoids re-training and guarantees the reference manifold stays fixed.",
    },
  },
  {
    step: 5,
    phase: "pbmc-reference",
    file: "notebooks/precompute_pbmc_mvp.ipynb",
    environment: "storage",
    title: "PyArrow writes parquet + S3 upload",
    description:
      "PyArrow writes the embeddings + UMAP coordinates into a typed, compressed parquet file. boto3 uploads it to S3 under a versioned key. A local copy is also saved for ADR-005 fallback.",
    code: `import pyarrow as pa
import pyarrow.parquet as pq
import boto3

table = pa.Table.from_pydict({
    "cell_id": cell_ids,
    "cell_type": cell_types,
    "umap_1": coords[:, 0],
    "umap_2": coords[:, 1],
    **{f"embedding_{i}": embeddings[:, i] for i in range(512)},
})

pq.write_table(table, "geneformer_embeddings.parquet")

s3 = boto3.client("s3")
s3.upload_file("geneformer_embeddings.parquet",
               "helical-bio-explorer",
               "v1/pbmc3k/geneformer_embeddings.parquet")`,
    codeLanguage: "python",
    artifactAdds: [
      {
        key: "s3://helical-bio-explorer",
        value: "v1/pbmc3k/geneformer_embeddings.parquet (~6 MB)",
      },
      {
        key: "local fallback",
        value: "backend/data/parquet/pbmc3k/geneformer_embeddings.parquet",
      },
    ],
    dataPreview: {
      label: "Parquet schema",
      shape:
        "2,638 rows × 516 columns (cell_id, cell_type, umap_1, umap_2, embedding_0..511)",
      sampleJson: "",
      sizeNote: "~6 MB compressed parquet with snappy",
    },
    adrReferences: [
      {
        id: "ADR-004",
        title: "Minimal AWS Surface",
        relevance:
          "One public-read S3 bucket. No signed URLs needed — the data itself is public (CC BY 4.0).",
      },
    ],
    designDecision: {
      title: "Parquet over CSV/JSON",
      explanation:
        "Columnar format with typed schema and snappy compression. PyArrow reads only the columns needed at runtime (zero-copy). A 6 MB parquet holds 516 columns; as JSON it would be ~50 MB.",
    },
  },
  {
    step: 6,
    phase: "pbmc-reference",
    file: "backend/app/db/models.py",
    environment: "database",
    title: "Provenance row inserted into Postgres",
    description:
      "A provenance row is inserted into the precompute_runs table in Neon Postgres. It records the model name, version, parameters, output S3 key, and the git SHA of the notebook that generated it. Every artifact is traceable.",
    code: `from app.db.models import PrecomputeRun

run = PrecomputeRun(
    dataset_id=pbmc3k_dataset.id,
    model_name="geneformer",
    model_version="v1",
    parameters={"embedding_dim": 512, "max_input_genes": 2048},
    output_parquet_key="v1/pbmc3k/geneformer_embeddings.parquet",
    git_sha=current_git_sha,
)
session.add(run)
await session.commit()`,
    codeLanguage: "python",
    artifactAdds: [
      {
        key: "precompute_runs row",
        value: "model=geneformer, version=v1, sha=828d1c7",
      },
    ],
    dataPreview: null,
    adrReferences: [
      {
        id: "ADR-003",
        title: "Dual-ORM Bounded Contexts",
        relevance:
          "SQLModel owns the precompute_runs table. Prisma (frontend) never touches it. Each ORM has strict non-overlapping ownership.",
      },
    ],
    designDecision: {
      title: "Provenance in Postgres",
      explanation:
        "Every parquet artifact traces back to a specific notebook run with model version, parameters, and git SHA. If embeddings look wrong, the provenance row tells you exactly what generated them.",
    },
  },

  // ─── PHASE 2 — COVID PROJECTION [7-12] ────────────────────────────────
  {
    step: 7,
    phase: "covid-projection",
    file: "notebooks/precompute_covid_projection.ipynb",
    environment: "colab",
    title: "Load Wilk COVID cells via CELLxGENE Census API",
    description:
      "The CELLxGENE Census API downloads the Wilk et al. 2020 COVID dataset — peripheral blood from COVID patients at varying disease severity. A stratified subsample reduces ~44k cells to ~10k while preserving cell-type proportions.",
    code: `import cellxgene_census

with cellxgene_census.open_soma() as census:
    adata_covid = cellxgene_census.get_anndata(
        census,
        organism="Homo sapiens",
        obs_value_filter="dataset_id == 'wilk_2020'",
    )

# Stratified subsample to ~10k cells (seed=42)
sc.pp.subsample(adata_covid, n_obs=10000, random_state=42)`,
    codeLanguage: "python",
    artifactAdds: [
      {
        key: "adata_covid",
        value: "AnnData: ~10,000 COVID cells (stratified from ~44k)",
      },
    ],
    dataPreview: {
      label: "Subsampled COVID AnnData",
      shape: "~10,000 rows × ~33,000 columns",
      sampleJson: "",
      sizeNote: "Stratified subsample preserves cell-type proportions",
    },
    adrReferences: [
      {
        id: "ADR-002",
        title: "Precompute-in-Colab",
        relevance:
          "CELLxGENE Census provides a standardized API to access published single-cell datasets. No manual download or format conversion needed.",
      },
    ],
    designDecision: null,
  },
  {
    step: 8,
    phase: "covid-projection",
    file: "notebooks/precompute_covid_projection.ipynb",
    environment: "colab",
    title: "Harmonize cell types to PBMC 3k vocabulary",
    description:
      "Different datasets use different cell-type naming conventions. An explicit mapping dict translates Wilk's ontology terms to the 8-class PBMC 3k vocabulary. This is a manual step — no fuzzy matching.",
    code: `CELL_TYPE_MAP = {
    "CD4-positive, alpha-beta T cell": "CD4 T",
    "CD8-positive, alpha-beta T cell": "CD8 T",
    "classical monocyte": "CD14+ Monocytes",
    "non-classical monocyte": "FCGR3A+ Monocytes",
    "B cell": "B",
    "natural killer cell": "NK",
    "dendritic cell": "Dendritic",
    "megakaryocyte": "Megakaryocytes",
}

adata_covid.obs["cell_type"] = (
    adata_covid.obs["cell_type_ontology_term_id"]
    .map(CELL_TYPE_MAP)
)`,
    codeLanguage: "python",
    artifactAdds: [
      {
        key: "harmonized_types",
        value: "8-class vocabulary matching PBMC 3k reference",
      },
    ],
    dataPreview: null,
    adrReferences: [
      {
        id: "ADR-002",
        title: "Precompute-in-Colab",
        relevance:
          "Explicit mapping ensures reproducibility. If a cell type doesn't map, it's flagged, not silently dropped.",
      },
    ],
    designDecision: {
      title: "Explicit mapping, not fuzzy matching",
      explanation:
        "Different datasets use different ontologies for the same cell types. A manual dict is brittle but transparent — every mapping is visible and reviewable. Fuzzy matching would introduce silent errors.",
    },
  },
  {
    step: 9,
    phase: "covid-projection",
    file: "notebooks/precompute_covid_projection.ipynb",
    environment: "colab",
    title: "Geneformer embeds COVID cells",
    description:
      "The same Geneformer model from Phase 1 processes the COVID cells. Same tokenization, same weights, same 512-dim output. Reusing the model ensures the embeddings live in the same vector space as the healthy reference.",
    code: `covid_dataset = geneformer.process_data(adata_covid)
covid_embeddings = geneformer.get_embeddings(covid_dataset)
print(f"COVID embeddings: {covid_embeddings.shape}")
# → (~10000, 512)`,
    codeLanguage: "python",
    artifactAdds: [
      {
        key: "covid_embeddings",
        value: "ndarray (~10,000 × 512) — same space as PBMC reference",
      },
    ],
    dataPreview: {
      label: "COVID Geneformer embeddings",
      shape: "~10,000 × 512 float32",
      sampleJson: "",
      sizeNote: "~20 MB in memory",
    },
    adrReferences: [
      {
        id: "ADR-002",
        title: "Precompute-in-Colab",
        relevance:
          "Same model, same weights, same embedding space. This is what makes projection meaningful — both datasets are represented in the same coordinate system.",
      },
    ],
    designDecision: null,
  },
  {
    step: 10,
    phase: "covid-projection",
    file: "notebooks/precompute_covid_projection.ipynb",
    environment: "colab",
    title: "UMAP transform projects into reference space (no re-fit)",
    description:
      "The UMAP reducer saved from Phase 1 projects COVID embeddings into the healthy reference's 2D space. Critically, this uses transform() not fit_transform() — the reference manifold stays fixed, and disease cells are placed relative to it.",
    code: `import joblib

reducer = joblib.load("pbmc_umap_reducer.joblib")
covid_coords = reducer.transform(covid_embeddings)
# COVID cells now have (umap_1, umap_2) in the PBMC reference space`,
    codeLanguage: "python",
    artifactAdds: [
      {
        key: "covid_umap_coords",
        value: "ndarray (~10,000 × 2) — projected into PBMC reference space",
      },
    ],
    dataPreview: {
      label: "Projected UMAP coordinates",
      shape: "~10,000 × 2 float32 (umap_1, umap_2)",
      sampleJson: "",
      sizeNote:
        "Coordinates in the SAME space as the PBMC reference scatter plot",
    },
    adrReferences: [
      {
        id: "ADR-002",
        title: "Precompute-in-Colab",
        relevance:
          "Projection preserves the reference manifold. Disease cells appear relative to healthy cells, making drift visible.",
      },
    ],
    designDecision: {
      title: "Transform, not re-fit",
      explanation:
        "fit_transform() would create a new manifold mixing healthy and disease cells — losing the reference frame. transform() keeps the healthy atlas fixed and places disease cells relative to it. This is how tools like Symphony and scArches work.",
    },
  },
  {
    step: 11,
    phase: "covid-projection",
    file: "notebooks/precompute_covid_projection.ipynb",
    environment: "colab",
    title: "Cosine distance to nearest healthy centroid",
    description:
      "For each COVID cell, compute the cosine distance to the nearest healthy centroid of the same cell type. This measures how far each disease cell has drifted from 'normal' — the core metric the dashboard visualizes.",
    code: `from sklearn.metrics.pairwise import cosine_distances

# Compute centroid per cell type from PBMC reference
centroids = {}
for ct in adata.obs["cell_type"].unique():
    mask = adata.obs["cell_type"] == ct
    centroids[ct] = embeddings[mask].mean(axis=0)

# Distance from each COVID cell to its matching centroid
distances = []
for i, ct in enumerate(covid_cell_types):
    dist = cosine_distances(
        covid_embeddings[i:i+1],
        centroids[ct].reshape(1, -1)
    )[0, 0]
    distances.append(dist)`,
    codeLanguage: "python",
    artifactAdds: [
      {
        key: "distance_geneformer",
        value:
          "float per cell — cosine distance to nearest healthy centroid",
      },
    ],
    dataPreview: null,
    adrReferences: [
      {
        id: "ADR-002",
        title: "Precompute-in-Colab",
        relevance:
          "Distance scoring is the bridge between embeddings and biological interpretation. A high distance means the cell's transcriptomic state has shifted significantly from the healthy reference.",
      },
    ],
    designDecision: {
      title: "Cosine distance",
      explanation:
        "Matches the metric used by reference-mapping tools in the literature (Symphony, scArches). Cosine distance is scale-invariant — it measures the angle between vectors, not the magnitude. This matters because embedding dimensions can have wildly different scales.",
    },
  },
  {
    step: 12,
    phase: "covid-projection",
    file: "notebooks/precompute_covid_projection.ipynb",
    environment: "storage",
    title: "Export 3 parquets + S3 upload + provenance",
    description:
      "Three parquet files are exported: raw COVID embeddings, projected coordinates with distance scores, and a distance_scores summary. All uploaded to S3 with local fallbacks. Two provenance rows inserted.",
    code: `# 1. COVID embeddings
pq.write_table(covid_embeddings_table,
               "geneformer_embeddings.parquet")

# 2. Projected with distances
pq.write_table(projected_table,
               "geneformer_projected.parquet")

# 3. Distance scores (to be extended in Phase 3)
pq.write_table(distance_table,
               "distance_scores.parquet")

# Upload all to S3 under v1/covid_wilk/
for f in ["geneformer_embeddings", "geneformer_projected", "distance_scores"]:
    s3.upload_file(f"{f}.parquet", BUCKET, f"v1/covid_wilk/{f}.parquet")`,
    codeLanguage: "python",
    artifactAdds: [
      {
        key: "s3://covid_wilk/geneformer_embeddings",
        value: "~10k cells with 512-dim embeddings",
      },
      {
        key: "s3://covid_wilk/geneformer_projected",
        value: "~10k cells with UMAP coords + distance",
      },
      {
        key: "s3://covid_wilk/distance_scores",
        value:
          "distance_geneformer per cell (distance_genept = NaN, filled in Phase 3)",
      },
    ],
    dataPreview: {
      label: "Exported parquets",
      shape: "3 parquet files, ~30 MB total",
      sampleJson: "",
      sizeNote:
        "distance_scores.parquet has a placeholder NaN column for GenePT — Phase 3 fills it",
    },
    adrReferences: [
      {
        id: "ADR-004",
        title: "Minimal AWS Surface",
        relevance:
          "S3 first, local fallback on error. Three artifacts, one S3 bucket, two provenance rows.",
      },
      {
        id: "ADR-005",
        title: "Local Parquet Fallback",
        relevance:
          "Every S3 artifact has a backend/data/parquet/ local twin so the API works even when S3 is unreachable.",
      },
    ],
    designDecision: null,
  },

  // ─── PHASE 3 — GENEPT DISAGREEMENT [13-15] ────────────────────────────
  {
    step: 13,
    phase: "genept-disagreement",
    file: "notebooks/precompute_genept_disagreement.ipynb",
    environment: "colab",
    title: "GenePT embeds PBMC + COVID cells",
    description:
      "A second foundation model — GenePT — processes both the PBMC reference and COVID cells. GenePT uses a different architecture (GPT-based vs transformer-based), producing different embedding dimensions. Running both models enables cross-model comparison.",
    code: `from helical.models.genept import GenePT, GenePTConfig

genept_config = GenePTConfig(batch_size=32)
genept = GenePT(configurer=genept_config)

# Embed PBMC reference
pbmc_dataset_gp = genept.process_data(adata)
pbmc_embeddings_gp = genept.get_embeddings(pbmc_dataset_gp)

# Embed COVID cells
covid_dataset_gp = genept.process_data(adata_covid)
covid_embeddings_gp = genept.get_embeddings(covid_dataset_gp)`,
    codeLanguage: "python",
    artifactAdds: [
      {
        key: "pbmc_embeddings_genept",
        value: "ndarray (2,638 × D) — GenePT space",
      },
      {
        key: "covid_embeddings_genept",
        value: "ndarray (~10,000 × D) — GenePT space",
      },
    ],
    dataPreview: {
      label: "Dual-model embeddings",
      shape:
        "Two embedding matrices — PBMC (2,638 × D) + COVID (~10,000 × D)",
      sampleJson: "",
      sizeNote: "D determined by GenePT architecture, not hardcoded",
    },
    adrReferences: [
      {
        id: "ADR-001",
        title: "Reference Mapping over Model Comparison",
        relevance:
          "Two models on the same data. If both agree a cell is abnormal, confidence is high. If they disagree, that's the signal the Disagreement tab visualizes.",
      },
    ],
    designDecision: null,
  },
  {
    step: 14,
    phase: "genept-disagreement",
    file: "notebooks/precompute_genept_disagreement.ipynb",
    environment: "colab",
    title: "Compute GenePT distances + percentile-rank disagreement",
    description:
      "GenePT distances are computed the same way as Geneformer (cosine to nearest centroid). Then both models' distances are percentile-ranked and the absolute difference gives the disagreement score — how much the two models disagree about each cell's abnormality.",
    code: `from scipy.stats import rankdata

# Percentile-rank each model's distances
pct_gf = rankdata(distances_geneformer) / len(distances_geneformer)
pct_gp = rankdata(distances_genept) / len(distances_genept)

# Disagreement = absolute difference in percentile ranks
disagreement = np.abs(pct_gf - pct_gp)

# High disagreement = models disagree about this cell's abnormality
print(f"Mean disagreement: {disagreement.mean():.3f}")
print(f"Max disagreement: {disagreement.max():.3f}")`,
    codeLanguage: "python",
    artifactAdds: [
      {
        key: "disagreement",
        value:
          "float per cell — abs(percentile_geneformer - percentile_genept)",
      },
    ],
    dataPreview: null,
    adrReferences: [
      {
        id: "ADR-001",
        title: "Reference Mapping over Model Comparison",
        relevance:
          "Disagreement is the most interesting signal in the demo. High-disagreement cells are where one model sees abnormality and the other doesn't — these are biologically interesting cases worth investigating.",
      },
    ],
    designDecision: {
      title: "Percentile-rank disagreement",
      explanation:
        "Geneformer and GenePT produce distances on different scales. Raw difference would be meaningless. Percentile-ranking normalizes both to [0, 1] before comparing — a cell at the 90th percentile in Geneformer distance but the 30th in GenePT has 0.6 disagreement regardless of absolute scale.",
    },
  },
  {
    step: 15,
    phase: "genept-disagreement",
    file: "notebooks/precompute_genept_disagreement.ipynb",
    environment: "storage",
    title: "Export disagreement parquet + rewrite distance_scores + provenance",
    description:
      "The final export: cross_model_disagreement.parquet (the critical artifact the Disagreement tab reads), plus rewriting distance_scores.parquet to fill the previously-NaN distance_genept column. GenePT embedding parquets also exported for both datasets.",
    code: `# Cross-model disagreement — the critical artifact
disagreement_table = pa.Table.from_pydict({
    "cell_id": cell_ids,
    "cell_type": cell_types,
    "disease_activity": disease_activities,
    "distance_geneformer": distances_gf,
    "distance_genept": distances_gp,
    "disagreement": disagreement_scores,
})
pq.write_table(disagreement_table,
               "cross_model_disagreement.parquet")

# Rewrite distance_scores with filled GenePT column
# ... (replaces NaN with actual values)

# Upload all to S3
for f in artifacts:
    s3.upload_file(f, BUCKET, f"v1/covid_wilk/{f}")`,
    codeLanguage: "python",
    artifactAdds: [
      {
        key: "s3://covid_wilk/cross_model_disagreement",
        value: "The artifact the Disagreement tab reads",
      },
      {
        key: "s3://covid_wilk/distance_scores (rewritten)",
        value: "distance_genept column now filled (was NaN)",
      },
      {
        key: "s3://pbmc3k/genept_embeddings",
        value: "PBMC reference in GenePT space",
      },
      {
        key: "s3://covid_wilk/genept_embeddings",
        value: "COVID cells in GenePT space",
      },
    ],
    dataPreview: {
      label: "Final pipeline artifacts",
      shape: "cross_model_disagreement: ~10,000 rows × 6 columns",
      sampleJson: "",
      sizeNote:
        "Final artifact count: 8 parquets across 2 datasets, 6 provenance rows total",
    },
    adrReferences: [
      {
        id: "ADR-002",
        title: "Precompute-in-Colab",
        relevance:
          "Pipeline complete. 3 notebooks, 8 artifacts, 6 provenance rows.",
      },
      {
        id: "ADR-004",
        title: "Minimal AWS Surface",
        relevance:
          "One S3 bucket, public-read, versioned keys. No signed URLs, no IAM complexity.",
      },
      {
        id: "ADR-005",
        title: "Local Parquet Fallback",
        relevance:
          "Every artifact traceable to a git SHA, with a local fallback copy.",
      },
    ],
    designDecision: null,
  },
];
