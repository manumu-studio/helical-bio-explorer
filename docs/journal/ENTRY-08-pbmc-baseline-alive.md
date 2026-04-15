# ENTRY-08 — PBMC 3k baseline parquet + precompute_runs insert

**Date:** 2026-04-15
**Type:** Data pipeline (placeholder, to be replaced in PACKET-02b)
**Branch:** `feature/pbmc-baseline-alive`
**Version:** 0.7.0

---

## What I Did

Pivoted the packet sequence: before running real Geneformer in Colab (PACKET-02b), first got the dashboard *alive* with a real parquet artifact built from scanpy's precomputed PBMC 3k UMAP. The production API had been returning 500 "no precompute run found" since deploy because no parquet existed and no `precompute_runs` row had been inserted. This packet fixes both: writes a 2638-row × 516-col parquet (cell_id, cell_type, umap_1, umap_2, 512 zero-padded embedding columns) and inserts one row into Neon with `model_name='scanpy_baseline'`. Same filename the Geneformer output will use in PACKET-02b, so the next packet is a pure data swap.

Dispatched 10 Cursor tasks (TASK-100 through TASK-109) covering script skeleton, pinned deps, scanpy load + sanity, DataFrame assembly, local parquet write, optional S3 upload, async DB insert, README, pytest suite, and quality gate sweep. All tasks delivered. I audited the output with the code-reviewer subagent and closed six gaps the audit surfaced before shipping.

## Files Touched

| File | Action | Notes |
|---|---|---|
| `scripts/generate_pbmc_baseline_parquet.py` | Created | 286 lines. argparse + logging + `load_pbmc` + `build_dataframe` + `write_parquet_local` + `upload_to_s3` + `_prepare_asyncpg_url` + `write_precompute_run` + `main` |
| `scripts/requirements-baseline.txt` | Created | Pinned scanpy, anndata, pyarrow, pandas, numpy, sqlalchemy[asyncio], asyncpg, aiosqlite, boto3 |
| `scripts/README.md` | Created | Usage, env vars, the honesty note about zero-padded placeholders |
| `backend/data/parquet/pbmc3k/geneformer_embeddings.parquet` | Created | 341 KB snappy-compressed; committed to git per ADR-005 local fallback |
| `backend/tests/scripts/test_generate_pbmc_baseline_parquet.py` | Created | Parquet shape contract + async DB insert via sqlite + parameters JSON payload assertions |
| `backend/pyproject.toml` | Modified | scanpy + anndata + pyarrow stubs; `[[tool.mypy.overrides]]` for untyped scientific libs; mypy `files` expanded to include `../scripts/...` |
| `backend/uv.lock` | Modified | Dependency lockfile refresh |
| `.gitignore` | Modified | Added `/data/` (scanpy's default dataset cache dir) |
| `docs/cursor-task-reports/PACKET-02a/TASK-100..109-report.md` | Created | 10 gitignored task reports; TASK-106 updated post-audit to flag UUID-vs-int spec deviation |
| `docs/research/DECISIONS.md` | Modified | ADR-010 COVID pivot + ADR-011 no-Cognito/no-MLflow — committed separately from this packet per audit recommendation |
| `docs/pull-requests/PR-0.7.0-pbmc-baseline-alive.md` | Created | PR doc |
| `docs/learning/PACKET-02a-concepts.md` | Created | 6 concept briefs, interview-defensible |
| `docs/learning/LEARNING-LOG.md` | Appended | Session 020 entry |
| `docs/learning/INTERVIEW-DRILLS.md` | Appended | 5 packet-end drill questions |

## Decisions

- **Ship-first, real-model-later.** User's memory says *"ship-first to lower R3 implicit bar; trade drill for shipping."* That's exactly this packet. Placeholder embeddings are honest (zero-padded, logged, DB provenance says `scanpy_baseline`), and the dashboard becoming usable tonight is worth more than waiting for Colab GPU time to deliver real Geneformer embeddings.
- **Zero columns over omitted columns.** Keeps the parquet schema stable across 02a → 02b so the Pydantic response models, Zod schemas, and API routes never need a second pass. PACKET-02b is a pure data overwrite.
- **Async engine per script invocation, not `app.db.session`.** The script runs outside the FastAPI process. Importing the app's global engine drags in settings bootstrapping (CORS origins etc.) that's irrelevant here. Per-invocation engine also lets tests use sqlite trivially — `sqlite+aiosqlite:///<tmp>` via `create_async_engine` with no monkey-patching.
- **asyncpg URL sanitization as its own function.** Neon's `DATABASE_URL` has `sslmode` and `channel_binding` that asyncpg rejects. I lifted this into `_prepare_asyncpg_url()` with a 6-line comment explaining every step (strip params, build `ssl.Context`, disable statement cache for PgBouncer). Without this comment, the code is witchcraft; with it, it's a solid 30-second interview walkthrough.
- **Scanpy cache redirected to `~/.cache/scanpy/datasets`.** Scanpy's default `datasetdir` is `./data/` relative to the current working directory, which meant `sc.datasets.pbmc3k_processed()` was writing a 23 MB `.h5ad` to the repo root. Redirected to XDG_CACHE_HOME + added `/data/` to `.gitignore` as belt-and-suspenders. Interviewer will never see that file.

## What Cursor got right

- **Concat-index bug diagnosis was real.** When I first ran the script it produced a 5276-row DataFrame instead of 2638. The cause: AnnData's `obs_names` is a string `Index`, and the zero-embedding `DataFrame` had a `RangeIndex(0, 2638)`. `pd.concat([base, emb], axis=1)` on mismatched indexes silently duplicated rows. Cursor's fix was `reset_index(drop=True)` on both frames before concat, with an inline comment naming the failure mode. Textbook pandas foot-gun — and a clean 30-second interview story.
- **asyncpg URL handling** is production-aware, not copy-pasted. `statement_cache_size=0` for PgBouncer transaction pooling is exactly the right move for Neon.
- **mypy overrides** via `[[tool.mypy.overrides]]` for `scanpy.*` / `anndata.*` / `pyarrow.*` — the right way to handle untyped scientific libs without `# type: ignore` spam scattered through the script.

## What Cursor missed (closed in audit)

1. Untracked `data/pbmc3k_processed.h5ad` (23 MB) at repo root — scanpy's dataset cache. Fixed: redirected `sc.settings.datasetdir` + added `/data/` to `.gitignore`.
2. `import pandas` shadowed inside `build_dataframe` (already imported at module level). Cleaned.
3. asyncpg URL sanitization had zero comments — not interviewer-defensible. Added 6-line explanation.
4. Pytest only asserted column names on the DB row; a regression dropping the `"superseded by PACKET-02b"` note in `parameters` JSON would pass. Extended the test to assert the full `parameters` payload.
5. TASK-106 report claimed spec match but silently changed return type `int → UUID` (the spec was wrong — `PrecomputeRun.id` is UUID — but the drift wasn't flagged). Updated the report.
6. `DECISIONS.md` edits got bundled into the feature branch. Split into a separate commit before push.

## Still Open

- **Run script against real Neon.** The whole point of the packet. User performs: `export DATABASE_URL="postgresql+asyncpg://...neon..." && python scripts/generate_pbmc_baseline_parquet.py`. Then hit the live API endpoint and confirm the 500 clears. Until this is done, PACKET-02a hasn't actually delivered its goal.
- **S3 upload path not proven end-to-end.** No credentials were set during local runs. ADR-005's local-first fallback makes this non-blocking, but worth a sanity test before interview day.
- **PACKET-02b Colab notebook** — the real Geneformer pass. GPU required. This packet's parquet filename is already aligned, so it's a pure data swap.

## Validation

- `uv run ruff check` (scripts + tests) — passes
- `uv run ruff format --check` — passes
- `uv run mypy` — 38 files, no issues
- `uv run pytest` — 25 passed, 4 warnings
- Parquet shape `(2638, 516)`, size 341 KB, all 512 embedding columns are zero, all `cell_type` values in the expected louvain set
- DB insert path verified against sqlite; Neon run pending

## Next Session

Run the script against Neon. Confirm the live API returns 200. Watch the dashboard render 2638 cells with real louvain clusters. Then dispatch PACKET-02b's Colab notebook tasks (TASK-072–076) to overwrite `geneformer_embeddings.parquet` with real Geneformer output.
