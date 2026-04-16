# PR-0.9.0 — COVID reference-mapping projection + distance scores

**Branch:** `feat/covid-projection` -> `main`
**Version:** 0.9.0
**Date:** 2026-04-16
**Status:** 🟢 Data layer green — ready to merge; live backend integration follows in a subsequent PR

---

## Summary

Adds the disease arm of the reference-mapping pipeline. Loads 10,000 Wilk et al. 2020 COVID PBMCs from the CELLxGENE Census, generates real Geneformer 512-dim embeddings via the Helical SDK, projects them into the existing PBMC3k healthy UMAP using the persisted `umap-learn` reducer, and scores each cell by cosine distance to the nearest healthy cell-type centroid (min-max rescaled to `[0, 1]`). Three parquet artifacts ship to S3 plus the on-disk local fallback. Two provenance rows are recorded in Neon.

The headline scientific result: severe COVID cells land 71% farther from the healthy manifold than healthy controls on average (mean 0.139 vs 0.081), with ~3× wider variance — the reference-mapping signature the dashboard narrative is built around.

- Disease dataset: Wilk et al. 2020 COVID PBMCs via `cellxgene_census` (no GEO curation, pre-harmonized labels)
- Subsample: 10k cells, stratified by cell type × severity
- Embedder: Helical SDK `Geneformer` (v1, 512-dim output)
- Projection: `umap-learn` reducer fitted on the healthy reference, persisted in S3
- Scoring: cosine distance to nearest healthy centroid, min-max rescaled

## What changed

| Area | File | Action | Notes |
|---|---|---|---|
| Notebook | `notebooks/precompute_covid_projection.ipynb` | Created | ~22-cell Colab notebook; runs on T4 GPU in ~25–45 min |
| Notebook docs | `notebooks/README.md` | Modified | Documents the COVID notebook, env vars, and the fresh-runtime install recipe |
| Notebook deps | `notebooks/requirements-colab.txt` | Modified | Pins numpy 1.x stack to match the Helical SDK alpha's strict version floor |
| Backend seed | `backend/app/scripts/seed_covid_dataset.py` | Created | Idempotent insert of the `covid_wilk` dataset row |
| Backend tests | `backend/tests/data/test_covid_wilk_parquet_schemas.py` | Created | Schema assertions across all three COVID parquets |
| Backend tests | `backend/tests/scripts/test_seed_covid_dataset.py` | Created | Seed script insert + idempotency |
| Local fallback | `backend/data/parquet/covid_wilk/*.parquet` | Created | 3 artifacts (29 MB + 29 MB + 135 KB) baked into image per the local-fallback ADR |

## Architecture decisions

| Decision | Why |
|---|---|
| **Wilk COVID instead of Banchereau SLE** | Census API is one line vs. manual GEO curation; COVID is recognizable to a mixed audience; Wilk ships severity labels that map cleanly onto the existing `disease_activity` schema |
| **Three parquets, not one** | Raw embeddings (downstream ML), projected cells (dashboard scatter), slim distance-scores (API) — each consumer pulls exactly what it needs |
| **`distance_genept` reserved as all-NaN** | Slim table schema is stable today; the cross-model arm fills the column without any migration |
| **`disease_activity` stays `healthy \| mild \| severe`** | Wilk's Census slice only exposes `healthy` and `severe`, but the schema keeps `mild` for forward compatibility with future datasets |
| **HGNC symbols via `adata.var["feature_name"]`** | Census stores gene symbols in `feature_name`, Ensembl IDs in `var_names`. Geneformer requires symbols; using the index would map zero genes |
| **Colab install recipe includes `pip uninstall cupy`** | Colab preinstalls `cupy` built against numpy 2.x ABI; uninstalling after the numpy 1.x pin install is what keeps the import chain clean |
| **Inline SQLModel in the notebook** | Colab has no repo access, so import coupling to the backend would break. Matches the pattern used by the healthy-reference notebook |

## Testing

### Data layer ✅
- [x] `backend/tests/data/test_covid_wilk_parquet_schemas.py` — 7 tests pass
- [x] `backend/tests/scripts/test_seed_covid_dataset.py` — 2 tests pass
- [x] Total: **9 passed in 0.77s**

### Notebook execution ✅ (executed on Colab Pro this session)
- [x] All ~22 cells ran top-to-bottom on a T4 runtime
- [x] Geneformer produced `(10000, 512)` embedding matrix
- [x] UMAP projection produced `(10000, 2)` coordinates
- [x] Distance scoring produced valid `[0, 1]` range
- [x] Three parquets uploaded to `s3://helical-bio-parquet/v1/covid_wilk/`
- [x] Two `precompute_runs` rows inserted into Neon
- [x] Re-read from S3 confirmed non-zero embeddings and correct row counts

### Deferred to next PR
- [ ] Live backend `/api/v1/projections/covid_wilk/geneformer` returns 2xx (currently HTTP 500 — route wiring needs update to resolve `covid_wilk` to the new S3 keys; not a data-layer issue)
- [ ] Dashboard renders the COVID view end-to-end

## Scientific result

Per-cell cosine distance to nearest healthy centroid (10,000 cells):

| Metric | Healthy (n=3,818) | Severe (n=6,182) |
|---|---|---|
| Mean | 0.081 | **0.139** (+71%) |
| Std | 0.037 | **0.108** |
| 75th percentile | 0.098 | 0.150 |
| Max | 0.60 | 1.00 |

## Deployment notes

- **No backend code changes in this PR.** The data lands on S3 + local fallback; the projection route update is a follow-up.
- **Image build** will pick up the new `backend/data/parquet/covid_wilk/` directory automatically — the baked-at-build fallback pattern already covers it.
- **Environment**: no new env vars required; the existing `S3_BUCKET`, `AWS_REGION`, and `DATABASE_URL` secrets cover the notebook's Colab execution.

## What's intentionally not done

- **Live backend integration.** The route that resolves `/api/v1/projections/{dataset}/{model}` still needs to learn about `covid_wilk`. Follow-up PR.
- **GenePT disagreement arm.** The `distance_genept` column is reserved NaN; cross-model disagreement ships separately.
- **Dashboard COVID view.** Frontend consumes the new parquet schema in a subsequent PR.
- **Full-history cleanup of earlier internal-methodology references in tracked docs.** Ships as its own `chore(docs):` commit to keep this PR focused on the data feature.
