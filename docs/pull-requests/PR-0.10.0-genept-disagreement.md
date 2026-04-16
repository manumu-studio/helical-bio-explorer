# PR-0.10.0 — GenePT disagreement infrastructure

**Branch:** `feat/genept-disagreement` → `main`
**Version:** 0.10.0 (infrastructure)
**Date:** 2026-04-16
**Status:** Ready to merge — data follows in PR-0.10.1

---

## Summary

Ships the **infrastructure** for the GenePT arm and cross-model disagreement view: a Colab-ready notebook that runs GenePT via the Helical SDK on PBMC3k + the Wilk COVID subsample, schema-regression tests gated on parquet presence, and docs. **No GenePT parquets are committed in this PR.** Real artifacts land in PR-0.10.1 after the Colab run uploads to S3 and the operator copies local fallbacks into `backend/data/parquet/`.

Scoping the PR this way keeps a portfolio repo honest: the code shipped here is end-to-end reviewable without any placeholder data that could be mistaken for real GenePT output.

## What this PR ships

| File | Action | Notes |
| --- | --- | --- |
| `notebooks/precompute_genept_disagreement.ipynb` | Added | 26-cell Colab workflow: GenePT embed → UMAP → distance → percentile-rank disagreement → in-place `distance_scores` rewrite → provenance |
| `notebooks/emit_genept_notebook.py` | Added | Stdlib-only generator for the notebook above. Single source of truth — edit the emitter, regenerate the ipynb |
| `notebooks/README.md` | Modified | New section for the GenePT notebook + explicit "data landing in 0.10.1" note |
| `notebooks/requirements-colab.txt` | Modified | Cross-reference for the third notebook |
| `frontend/components/DashboardShell/DashboardShell.tsx` | Modified | Distance and Disagreement tabs stay hidden until PR-0.10.1 |
| `backend/tests/data/test_genept_disagreement_parquet_schemas.py` | Added | Schema-regression tests for the post-run artifacts, gated on file presence |
| `backend/tests/data/test_covid_wilk_parquet_schemas.py` | Modified | GenePT file presence check is soft-skip; CellScore validates NaN or filled |
| `DEVELOPMENT_JOURNAL.md` | Modified | Entry-11 row |
| `docs/journal/ENTRY-11-genept-disagreement.md` | Added | Decisions + known gaps |
| `docs/cursor-tasks/PACKET-02d/*` | — | Tracked from earlier sprint planning |
| `docs/cursor-task-reports/PACKET-02d/*` | Added | Per-task completion reports |

## What this PR does **not** ship

- The four new GenePT parquets (`pbmc3k/genept_embeddings.parquet`, `covid_wilk/genept_embeddings.parquet`, `covid_wilk/genept_projected.parquet`, `covid_wilk/cross_model_disagreement.parquet`) — uploaded by the Colab run to S3 and copied into `backend/data/parquet/` in PR-0.10.1.
- The `distance_genept` fill on `distance_scores.parquet` — the in-place rewrite happens in the Colab notebook; the local fallback is updated in PR-0.10.1.
- The re-enablement of the **Distance** and **Disagreement** dashboard tabs — they stay hidden in this PR so the demo never renders over empty data. Re-enabled in PR-0.10.1 alongside the real artifacts.

## Architecture decisions

| Decision | Why |
| --- | --- |
| **Disagreement = `abs(percentile_rank(d_gf) − percentile_rank(d_gp))`** | Geneformer (512-dim graph-over-gene-vocabulary) and GenePT (SDK-defined dim, NLP-embedding-of-gene-descriptions) live in incomparable embedding geometries. Percentile-aligning each model within its own distribution yields a dimensionless disagreement in `[0, 1]` that the dashboard can color-code without cross-model normalization games. |
| **Rewrite `distance_scores.parquet` in place** | Keeps one API table (`/scores`) with both models side-by-side. Alternative — a sibling parquet — would force a runtime join and leak the multi-packet build history into the serving layer. Cost: the notebook is the single writer and must be idempotent. |
| **UMAP refit per model, not cross-model transform** | UMAP is per-embedding-space; projecting GenePT vectors onto a UMAP fitted on Geneformer would be geometrically meaningless. Each model gets its own UMAP basis; disagreement is computed in full embedding space and visualized on whichever UMAP the panel shows. |
| **Distance in full embedding space, Euclidean to nearest PBMC centroid** | Matches PACKET-02c's Geneformer choice so the disagreement metric is apples-to-apples. UMAP coordinates are for visualization only, not for distance math. |
| **Subsample recovered from existing `distance_scores.parquet`, not re-sampled** | The 02d disagreement join is keyed on `cell_id`. Re-sampling the upstream AnnData would silently drop/add cells; loading `cell_id` from the existing scores parquet makes the 02d → 02c dependency explicit at the data layer. |
| **D (GenePT embedding dim) read from the SDK at runtime** | GenePT's dim is SDK-version-dependent and almost certainly not 512. The notebook reads `emb.shape[1]` once, uses it everywhere, and persists it in `precompute_runs.parameters`. No hardcoded dim. |
| **Infrastructure PR before data PR** | Portfolio repo: shipping fake placeholder parquets and claiming the disagreement view works would be visible in the dashboard and catchable on inspection. Splitting into 0.10.0 (code + tests + notebook) and 0.10.1 (parquets from a real Colab run) keeps the git history honest. |

## Quality gate

```text
cd backend && uv run ruff check . \
  && uv run ruff format --check . \
  && uv run mypy --strict app/ tests/data/test_genept_disagreement_parquet_schemas.py \
  && uv run pytest -v
cd frontend && pnpm typecheck && pnpm lint && pnpm build
```

GenePT-dependent tests skip cleanly with a reason string (`pending Colab GenePT run`); they activate automatically once PR-0.10.1 lands the parquets.

## Follow-up — PR-0.10.1

1. Run `notebooks/precompute_genept_disagreement.ipynb` on Colab T4 with `DATABASE_URL`, `S3_BUCKET`, `S3_REGION`, `AWS_*` set (~45 min wall time). Cell 22 asserts embedding dim ≥ 256 and distance correlation < 0.95 — if either fails, stop and investigate.
2. Copy the five parquet files from S3 into `backend/data/parquet/` (paths in `notebooks/README.md`).
3. Re-enable Distance + Disagreement in `DashboardShell.tsx`.
4. Confirm `uv run pytest -v` picks up the now-present files and passes all three disagreement tests.
5. Ship PR-0.10.1 with wall-time + `D` + disagreement-quantile numbers in the body.
