# Data Processing Pipeline

How raw single-cell data becomes interactive dashboard visualizations.

```
┌─────────────────────────────────────────────────────────────────┐
│                     STAGE 1: Data Ingestion                     │
└─────────────────────────────────────────────────────────────────┘

  ┌───────────────────┐         ┌───────────────────┐
  │ scanpy.datasets   │         │ CELLxGENE Census  │
  │ .pbmc3k_processed │         │ Wilk et al. 2020  │
  │ (2,638 cells)     │         │ COVID PBMCs       │
  └────────┬──────────┘         └────────┬──────────┘
           │                              │
           ▼                              ▼
  ┌───────────────────┐         ┌───────────────────┐
  │  Healthy baseline │         │  Disease cohort   │
  │  AnnData (.h5ad)  │         │  AnnData (.h5ad)  │
  └────────┬──────────┘         └────────┬──────────┘
           │                              │
           └──────────────┬───────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                  STAGE 2: Embedding Generation                  │
└─────────────────────────────────────────────────────────────────┘

                          │
              ┌───────────┴───────────┐
              ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │   Geneformer     │    │     GenePT       │
    │   (Helical SDK)  │    │   (Helical SDK)  │
    │                  │    │                  │
    │  Transformer     │    │  GPT-3.5 gene   │
    │  pretrained on   │    │  descriptions → │
    │  30M cells       │    │  embeddings     │
    └────────┬─────────┘    └────────┬─────────┘
             │                       │
             │  512-dim vectors      │  1,536-dim vectors
             │                       │  (dropped post-UMAP)
             └───────────┬───────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│              STAGE 3: Dimensionality Reduction                  │
└─────────────────────────────────────────────────────────────────┘

                         │
                         ▼
               ┌──────────────────┐
               │  UMAP Projection │
               │  512/1536-dim →  │
               │  2-dim (x, y)    │
               └────────┬─────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
  ┌──────────────┐ ┌──────────┐ ┌──────────────┐
  │  Reference   │ │ Project  │ │  Distance    │
  │  embeddings  │ │ disease  │ │  scores per  │
  │  (healthy)   │ │ cells →  │ │  cell from   │
  │              │ │ healthy  │ │  healthy     │
  │              │ │ space    │ │  manifold    │
  └──────┬───────┘ └────┬─────┘ └──────┬───────┘
         │              │              │
┌────────▼──────────────▼──────────────▼──────────────────────────┐
│                 STAGE 4: Parquet Serialization                   │
└─────────────────────────────────────────────────────────────────┘

         │              │              │
         ▼              ▼              ▼
  ┌─────────────────────────────────────────────┐
  │  generate_pbmc_baseline_parquet.py           │
  │                                              │
  │  PyArrow + Snappy compression                │
  │  Size gate: fails if > 10 MB                 │
  │  Records PrecomputeRun in DB (git SHA)       │
  └──────────────────────┬──────────────────────┘
                         │
                         ▼
  ┌──────────────────────────────────────────────┐
  │  Artifact files (per dataset, per model):    │
  │                                              │
  │  {slug}/geneformer_embeddings.parquet        │
  │  {slug}/geneformer_projected.parquet         │
  │  {slug}/genept_embeddings.parquet            │
  │  {slug}/genept_projected.parquet             │
  │  {slug}/distance_scores.parquet              │
  │  {slug}/cross_model_disagreement.parquet     │
  └──────────────────────┬──────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    STAGE 5: Storage                              │
└─────────────────────────────────────────────────────────────────┘

                         │
              ┌──────────┴──────────┐
              ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐
    │    S3 Bucket     │  │  Local fallback  │
    │  helical-bio-    │  │  data/parquet/   │
    │  explorer-       │  │  {slug}/         │
    │  artifacts       │  │                  │
    │                  │  │  (dev + Docker   │
    │  Key format:     │  │   bake mode)     │
    │  v{ver}/{slug}/  │  │                  │
    │  {artifact}.parq │  │                  │
    └──────────────────┘  └──────────────────┘
```

## Reproducibility

Every parquet artifact is linked to a `PrecomputeRun` database record containing:
- **git_sha** — exact commit that generated the artifact
- **parameters** — JSON blob with sources, notes, column metadata
- **output_parquet_key** — S3 key for retrieval
- **dataset_id + model_name** — which dataset and model produced it
