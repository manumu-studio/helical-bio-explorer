# ENTRY-11 — GenePT + cross-model disagreement infrastructure

**Date:** 2026-04-16
**Type:** Feature (infrastructure)
**Branch:** `feat/genept-disagreement`
**Version:** 0.10.0 (data in 0.10.1)

---

## What I did

Built the end-to-end infrastructure for the GenePT arm and cross-model disagreement view without shipping any GenePT parquets. The Colab notebook (`notebooks/precompute_genept_disagreement.ipynb`, generated from `notebooks/emit_genept_notebook.py`) runs the full pipeline: load PBMC3k + recover the Wilk COVID subsample by `cell_id` from the existing `distance_scores.parquet`, GenePT-embed both via the Helical SDK with dim `D` read from the SDK (no hardcoded dim), refit UMAP in GenePT space, score Euclidean distance to nearest PBMC cell-type centroid in full embedding space, percentile-rank Geneformer vs GenePT distances within each model, and export `abs(rank_gf − rank_gp)` as per-cell `disagreement`. The notebook also rewrites `distance_scores.parquet` in place to fill `distance_genept` and writes two `precompute_runs` rows for provenance.

Schema-regression tests for the post-run artifacts are in `backend/tests/data/test_genept_disagreement_parquet_schemas.py` and are **gated on file presence via `@pytest.mark.skipif`**, so CI stays green against the pre-Colab repo state and lights up automatically when PR-0.10.1 lands the real parquets.

## Why infrastructure-only in this PR

The earlier build iteration committed four synthetic GenePT parquets (64-dim Gaussian embeddings, `distance_genept ≈ 0.97 × distance_geneformer`, max disagreement 0.149 on `[0,1]`). They passed the schema tests but: (a) dim 64 is not realistic GenePT output (SDK emits a much higher-D vector), (b) the pearson-0.99 distance correlation guaranteed a visually degenerate Disagreement tab, and (c) the PR body claimed real data without disclosure. Splitting into **0.10.0 (code + tests + notebook) + 0.10.1 (real Colab output)** keeps the portfolio repo honest and makes the Colab run a required, verifiable step before the demo goes live.

## Decisions

- **Percentile-rank disagreement** keeps the metric dimensionless across incomparable embedding geometries.
- **In-place rewrite of `distance_scores.parquet`** keeps one API table for both models — the notebook is the single, idempotent writer.
- **UMAP refit per model** — cross-model UMAP transforms would be geometrically meaningless.
- **Distance in full embedding space** (not UMAP) — matches PACKET-02c precedent.
- **Subsample recovered from existing scores, not re-sampled** — makes the 02d → 02c dependency explicit at the data layer.
- **D read from the Helical SDK at runtime** — never hardcoded, persisted in `precompute_runs.parameters`.
- **Tabs stay hidden** until data lands — the dashboard should never render over empty state.

## Files touched

| File | Action | Notes |
| --- | --- | --- |
| `notebooks/precompute_genept_disagreement.ipynb` | Created | 26 cells, Colab T4, ~45 min wall time |
| `notebooks/emit_genept_notebook.py` | Created | Stdlib-only generator; edit here, regenerate ipynb |
| `notebooks/README.md` | Modified | GenePT notebook section + data-landing-in-0.10.1 note |
| `notebooks/requirements-colab.txt` | Modified | Cross-reference |
| `frontend/components/DashboardShell/DashboardShell.tsx` | Modified | Distance + Disagreement tabs stay hidden until 0.10.1 |
| `backend/tests/data/test_genept_disagreement_parquet_schemas.py` | Created | Skip-if-missing schema regression |
| `backend/tests/data/test_covid_wilk_parquet_schemas.py` | Modified | Soft-skip for GenePT files; CellScore accepts NaN-or-filled `distance_genept` |
| `DEVELOPMENT_JOURNAL.md` | Modified | Entry-11 row |

## Known gaps (closed in PR-0.10.1)

- Real Colab run against Helical GenePT + S3 upload + local-fallback copy has not yet happened. The notebook is wired for it: cell 22 re-reads every artifact and asserts embedding dim ≥ 256, distance pearson < 0.95, no-NaN on `distance_genept` / `disagreement` / `distance_to_healthy`, and prints the top-5 highest-disagreement cells for the interview narrative. Cell 23 asserts HTTP 200 + non-empty bodies against the local backend.
- Distance and Disagreement dashboard tabs stay hidden until 0.10.1.

## Validation

```text
cd backend && uv run ruff check . \
  && uv run ruff format --check . \
  && uv run mypy --strict app/ tests/data/test_genept_disagreement_parquet_schemas.py \
  && uv run pytest -v
cd frontend && pnpm typecheck && pnpm lint && pnpm build
```

All green; GenePT-dependent tests skip with a reason string until real data lands.
