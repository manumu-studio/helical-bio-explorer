# PR-0.7.0 — PBMC 3k baseline parquet + precompute_runs insert

**Branch:** `feature/pbmc-baseline-alive` → `main`
**Version:** 0.7.0
**Date:** 2026-04-15
**Packet:** PACKET-02a — PBMC Baseline Alive
**Status:** 🟡 Do not merge until the script has been run against real Neon `DATABASE_URL` and the live `/datasets/pbmc3k/geneformer` endpoint clears its 500.

---

## Summary

Unblocks the production `GET /api/v1/datasets/pbmc3k/geneformer` route (currently returning 500 *"No precompute run found"*) with a **real parquet artifact** and a **real `precompute_runs` row** in Neon. Embeddings are zero-padded 512-dim float32 placeholders — explicit, logged, documented — to be overwritten in PACKET-02b when real Geneformer output arrives from Colab. Filename (`geneformer_embeddings.parquet`) is aligned with the Geneformer target so the PACKET-02b swap is pure data, zero code changes.

This is a "ship-first, drill-later" packet: the dashboard cannot render cells until this file and DB row exist. Honesty of the placeholder is preserved via `precompute_runs.model_name='scanpy_baseline'` — nothing pretends to be Geneformer.

## What changed

| Area | File | Action | Notes |
|---|---|---|---|
| Script | `scripts/generate_pbmc_baseline_parquet.py` | Created | 2638-row × 516-col parquet; local + optional S3; async Neon insert |
| Requirements | `scripts/requirements-baseline.txt` | Created | Pinned scanpy + pyarrow + sqlalchemy[asyncio] + asyncpg + aiosqlite + boto3 |
| README | `scripts/README.md` | Created | Usage, env vars, honesty note (zero-padded placeholder) |
| Artifact | `backend/data/parquet/pbmc3k/geneformer_embeddings.parquet` | Created | ~341 KB; snappy; zero cols compress heavily; ADR-005 local fallback |
| Tests | `backend/tests/scripts/test_generate_pbmc_baseline_parquet.py` | Created | Parquet shape/column contract + async DB insert via sqlite fallback + parameters JSON assertions |
| Deps | `backend/pyproject.toml`, `backend/uv.lock` | Modified | scanpy stack + pandas-stubs + mypy overrides for untyped scientific libs |
| Gitignore | `.gitignore` | Modified | `/data/` — scanpy's default dataset cache dir, now redirected to `~/.cache/scanpy/datasets` |
| Task reports | `docs/cursor-task-reports/PACKET-02a/TASK-100..109-report.md` | Created | Gitignored, internal audit trail for all 10 Cursor tasks |

## Architecture decisions

| Decision | Why |
|---|---|
| **Zero-padded embedding columns, not omitted** | PACKET-02b overwrites the exact same file. Making the column schema stable now (`cell_id`, `cell_type`, `umap_1`, `umap_2`, `embedding_0..511`) means the parquet reader, Pydantic response models, and frontend Zod schemas never change. Provenance-is-in-the-DB (`model_name='scanpy_baseline'`) means nothing user-visible ever claims these zeros are real. |
| **scanpy UMAP as the placeholder, not random coords** | PBMC 3k's precomputed UMAP (`adata.obsm['X_umap']`) is the actual biological structure — real clusters, real cell types. A random placeholder would render a meaningless dashboard. The interview win is that the dashboard shows something biologically honest from day one; the embeddings layer just isn't the Geneformer one yet. |
| **Async engine per invocation, not `app.db.session` singleton** | The script runs outside the FastAPI process; importing the app's global engine couples it to settings bootstrapping (CORS origins, etc.). Per-invocation engine with explicit `DATABASE_URL` parsing is cleaner and lets the script run in CI with sqlite. |
| **asyncpg URL sanitization lifted out of the engine builder** | Neon's `DATABASE_URL` carries libpq-style params (`sslmode`, `channel_binding`) that asyncpg refuses. Dedicated `_prepare_asyncpg_url()` strips them, lifts `sslmode` into an `ssl.Context`, and disables the prepared-statement cache (PgBouncer transaction pooling breaks it). Documented inline; tested indirectly via the sqlite path. |
| **`--skip-db` flag for CI** | Tests and CI smoke runs don't need Neon. `--skip-db` skips the insert cleanly. `--upload-s3` is similarly opt-in so the script runs offline. |
| **Parquet write is local-first, S3 is optional** | ADR-005 — the API prefers local parquet if present, falls back to S3. The script writes `backend/data/parquet/pbmc3k/` directly so the deployed EC2 has the fallback baked in without any S3 round-trip. |

## Testing

### Local (pre-merge) ✅
- [x] `uv run ruff check` (scripts + tests) — passes
- [x] `uv run ruff format --check` — passes (after format pass)
- [x] `uv run mypy` (backend, 38 files including `../scripts/generate_pbmc_baseline_parquet.py`) — passes strict
- [x] `uv run pytest` — 25 passed (full backend, including 2 new script tests)
- [x] Parquet shape test asserts `(2638, 516)`, all 512 embedding cols == 0.0, all cell types in expected louvain set
- [x] Async DB test runs against in-memory-style sqlite (`sqlite+aiosqlite:///<tmp>`), asserts `model_name`, `model_version`, `git_sha`, `output_parquet_key`, and the full `parameters` JSON payload (incl. `"superseded by PACKET-02b"` note)

### End-to-end (post-merge — MUST be done before the packet is "alive")
- [ ] Run `python scripts/generate_pbmc_baseline_parquet.py` with real Neon `DATABASE_URL` set (no `--skip-db`). Expect: one row inserted into `precompute_runs` with `model_name='scanpy_baseline'`.
- [ ] `curl https://api.helical.manumustudio.com/api/v1/datasets/pbmc3k/geneformer` — expect 200, not 500
- [ ] Dashboard renders PBMC 3k UMAP with 2638 cells colored by louvain cell type
- [ ] Header `X-Served-From: local` on the EC2 response (parquet is local, not S3)

## Deployment notes

- The parquet artifact `backend/data/parquet/pbmc3k/geneformer_embeddings.parquet` is **committed to git** — this is intentional. ADR-005 says the first deploy must serve meaningful data before S3 is wired. Size is 341 KB, well within repo-size sanity. Future Geneformer output from PACKET-02b will likely stay well under the 10 MB guard the script enforces.
- **Merge sequence:** commit 1 (this packet) stands alone. Commit 2 (ADR-010 COVID pivot + ADR-011 no-Cognito/no-MLflow in `docs/research/DECISIONS.md`) is split into its own commit per audit recommendation — same PR is fine, or merge as two separate PRs. Split exists so the packet-02a feature commit doesn't bundle unrelated scope decisions.
- **Post-merge manual step:** run the script once against production Neon (one-shot, idempotent if a row already exists because the insert is additive, not upsert). User performs; script has no credentials baked in.
- **If the first run fails:** the most likely error is `No datasets row with slug=pbmc3k` — that means `app.scripts.seed_datasets` from PACKET-01b never ran in production. Run it, then retry the parquet script.
- **S3 upload path not exercised** in this packet (no credentials were supplied during local runs). The code path exists and is type-checked, but is not proven end-to-end. That's acceptable because ADR-005's local fallback makes it non-blocking for the interview demo.

## What's intentionally not done

- **Real Geneformer embeddings** — deferred to PACKET-02b (requires Colab GPU + Helical SDK). Same parquet filename, so PACKET-02b is a pure data swap.
- **COVID arm of the demo** — deferred to PACKET-02c. This packet is PBMC 3k only, healthy reference baseline.
- **Fitted UMAP persistence** (`umap_geneformer.joblib`) — not needed until PACKET-02c projects COVID cells into the PBMC manifold.
- **S3 smoke test** — the code path is typed and guarded, but no CI test exercises `upload_to_s3`. Would need a `moto` fixture; not worth the complexity when ADR-005 makes local the primary path.

## Related

- ADR-002 (precompute-in-Colab) — this packet is the scanpy-as-placeholder step before the real Colab precompute
- ADR-005 (local parquet fallback) — this is why the parquet ships committed to git, not only on S3
- ADR-010 (COVID pivot, added in separate commit) — contextual to the packet but not scoped to it
- PACKET-02b — the follow-on that overwrites `geneformer_embeddings.parquet` with real Geneformer output
