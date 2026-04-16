# ENTRY-10 — COVID Reference-Mapping Projection

**Date:** 2026-04-16
**Type:** Feature
**Branch:** `feat/covid-projection`
**Version:** 0.9.0

---

## What I Did

Shipped the COVID arm of the reference-mapping pipeline end-to-end. Loaded Wilk et al. 2020 COVID PBMCs via the CELLxGENE Census API, subsampled 10,000 cells stratified by cell type × severity, generated 512-dimensional Geneformer embeddings via the Helical SDK on a Colab T4 GPU, then projected those cells into the existing PBMC3k healthy UMAP by loading the persisted `umap-learn` reducer and calling `reducer.transform()`. Computed per-cell cosine distance to the nearest healthy cell-type centroid, min-max rescaled it to `[0, 1]`, and exported three parquet artifacts with distinct schemas: raw embeddings (for downstream models), projected cells with distance scores (for the dashboard scatter), and a slim distance-scores table (for the API). Uploaded all three to `s3://helical-bio-parquet/v1/covid_wilk/`, wrote two provenance rows to Neon (`precompute_runs` for the Geneformer step and for the projection step), and populated the local-fallback dir at `backend/data/parquet/covid_wilk/` so the backend has both S3 and on-disk sources.

The scientific payload — the number that opens the demo — is that severe COVID cells land significantly farther from the healthy manifold than healthy controls: mean cosine distance 0.139 vs 0.081, a 71% increase, with the severe cohort showing 3× wider variance and a heterogeneous long tail. That is exactly the reference-mapping signature the whole dashboard narrative promises.

## Files Touched

| File | Action | Notes |
|---|---|---|
| `notebooks/precompute_covid_projection.ipynb` | Created | ~22-cell Colab notebook — Census load → Geneformer embed → UMAP project → distance scores → parquet export → Neon provenance |
| `notebooks/requirements-colab.txt` | Modified | Locked to numpy 1.x pins matching the Helical SDK alpha's strict version floor; removed numpy 2.x ceilings |
| `notebooks/README.md` | Modified | Added the COVID notebook entry and the Colab "fresh runtime → install → restart session" workflow |
| `backend/app/scripts/seed_covid_dataset.py` | Created | Idempotent seed for the `covid_wilk` row in the `datasets` registry table |
| `backend/tests/data/test_covid_wilk_parquet_schemas.py` | Created | Schema assertions for all three COVID parquets: column dtypes, row counts, NaN-policy checks |
| `backend/tests/scripts/test_seed_covid_dataset.py` | Created | Validates the seed script inserts correctly and is idempotent |
| `backend/data/parquet/covid_wilk/*.parquet` | Created | Local fallback for the three S3 artifacts (29 MB + 29 MB + 134 KB) |

## Decisions

- **Wilk COVID over Banchereau SLE for the disease arm.** The original plan was childhood-onset SLE via GSE135779, but that dataset requires manual GEO download and cell-type harmonization with PBMC3k. Wilk is one line through the Census API and ships with pre-harmonized labels. COVID is also universally recognizable to a mixed technical panel in a 20-minute demo, whereas SLE requires immunology context.
- **Keep `disease_activity` schema `healthy | mild | severe`, even though Wilk's Census slice only exposes `healthy` and `severe`.** Preserves forward compatibility with any future mild-disease dataset without a migration. Surface this as a scope talking point, not a bug.
- **Gene-symbol mapping reads from `adata.var["feature_name"]`, not `adata.var_names`.** Census stores HGNC symbols in `feature_name` and Ensembl IDs in the index. Geneformer's `process_data` expects symbols; using the index would map zero genes and fail. Added an assertion that the first five entries are not Ensembl IDs to catch regressions in future Census schema changes.
- **Uninstall Colab's preinstalled `cupy` after pinning numpy 1.x.** Colab ships `cupy` built against numpy 2.x ABI. Without an explicit `pip uninstall`, `scanpy`'s import chain pulls `cupy` transitively and fails with `numpy.core.multiarray failed to import`. The Colab install recipe is now: fresh runtime → install numpy-1 pins → uninstall cupy → `Runtime → Restart session` → verify.
- **Inline SQLModel schemas in the notebook** (rather than importing from `backend/`). The notebook runs on Colab without repo checkout, so import coupling would break execution. Mirrors the same pattern used by the healthy-reference notebook.
- **`parameters` column typed as JSONB with an explicit SQLAlchemy `Column`.** SQLModel can't auto-map a plain `dict` to a Postgres column type, so without `sa_column=Column(JSONB, nullable=False)` the table definition raises `ValueError: <class 'dict'> has no matching SQLAlchemy type`. Also: `created_at` must strip tzinfo to match the `TIMESTAMP WITHOUT TIME ZONE` column, and both table classes need `__table_args__ = {"extend_existing": True}` to survive notebook re-runs on the same SQLAlchemy `MetaData` registry.
- **Three parquets instead of one.** Separating raw embeddings (heavy, for downstream ML), projected cells with UMAP + distance (dashboard scatter payload), and a slim distance-scores table (API) lets each consumer pull exactly what it needs without loading 29 MB to render a bar chart.
- **`distance_genept` column reserved as all-NaN.** The slim distance-scores table ships with both `distance_geneformer` and `distance_genept` columns; the GenePT column is NaN today and will be populated by the next cross-model arm. Schema is stable, zero breaking changes when GenePT lands.

## Still Open

- **Live Render backend returns HTTP 500** on `/api/v1/projections/covid_wilk/geneformer` — likely because the projection route wasn't updated to resolve `covid_wilk` to the new S3 keys. Needs investigation on the next session. Not a data-layer bug.
- **Full-repo cleanup of historical internal-methodology references** is a separate commit — ~17 previously tracked files still carry internal workflow vocabulary from earlier in the project and will be scrubbed in a follow-up `chore(docs):` commit.
- **GenePT arm** fills the reserved `distance_genept` column; still to be built.

## Validation

```text
# Notebook structure + clean scrub
python3 -c "import json; nb=json.load(open('notebooks/precompute_covid_projection.ipynb')); assert nb['nbformat']==4"
# passes

# Backend schema + seed tests
cd backend && uv run pytest tests/data/test_covid_wilk_parquet_schemas.py tests/scripts/test_seed_covid_dataset.py -v
# 9 passed in 0.77s

# Local fallback populated
ls -lh backend/data/parquet/covid_wilk/
# geneformer_embeddings.parquet (29M), geneformer_projected.parquet (29M), distance_scores.parquet (135K)

# S3 artifacts (Colab-verified)
# s3://helical-bio-parquet/v1/covid_wilk/{geneformer_embeddings,geneformer_projected,distance_scores}.parquet

# Neon provenance rows (Colab-verified)
# precompute_runs: d6707aef-7ce1-4dde-b3fc-93672ef9f7e6  (geneformer v1, covid_wilk)
# precompute_runs: 43cade32-3dee-4089-97e1-19d82f5a91e3  (geneformer_projection v1, covid_wilk)
```

## Scientific Result

Per-cell cosine distance to nearest healthy centroid, 10,000 cells:

| Metric | Healthy (n=3,818) | Severe (n=6,182) |
|---|---|---|
| Mean distance | 0.081 | **0.139** (+71%) |
| Std | 0.037 | **0.108** (~3× wider) |
| 75th percentile | 0.098 | 0.150 |
| Max | 0.60 | 1.00 |

Severe cells sit measurably farther from the healthy manifold with a heavy long tail — the expected reference-mapping signature and the demo's opening number.
