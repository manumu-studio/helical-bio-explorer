# PR-0.10.1 operator runbook — land real GenePT data

**Purpose:** ship the data half of the GenePT disagreement feature. Executes the already-built Colab notebook, copies artifacts, flips two frontend toggles back on, opens the PR.

**Estimated time:** ~1h40m wall clock (most of it passive — Colab runs for ~45 min unattended).

**Prerequisites:**
- Google account with Colab access (T4 GPU runtime — free tier is fine).
- AWS credentials with `s3:GetObject` + `s3:ListBucket` on the target bucket.
- Local: `aws-cli`, `uv`, `pnpm`, `gh`, repo checked out on `main` with PR-0.10.0.1 already merged.

---

## Phase 0 — pre-flight (5 min)

```bash
cd ~/Documents/Manu\ Murillo\ FS\ projects/helical-bio-explorer
git checkout main && git pull
git status            # must be clean
aws sts get-caller-identity   # must print an account/arn, not an error
```

Confirm in your browser: https://helical.manumustudio.com/dashboard shows **only Geneformer** in the MODEL toggle, no `HTTP 404` banner. If not — PR-0.10.0.1 hasn't fully deployed yet, wait for Vercel.

---

## Phase 1 — Colab T4 run (~50 min, mostly passive)

### 1.1 Open the notebook on Colab

1. Go to https://colab.research.google.com.
2. **File → Upload notebook** → select `notebooks/precompute_genept_disagreement.ipynb` from the local repo.
3. **Runtime → Change runtime type → T4 GPU → Save**.
4. Confirm: top-right should say "T4" with a green checkmark once connected.

### 1.2 Set Colab secrets (🔐 side panel, not cell code)

Open the key icon in the left sidebar → add five secrets (toggle "Notebook access" on for each):

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Neon connection string (same one `backend/.env` uses) |
| `S3_BUCKET` | your S3 bucket name (check `notebooks/README.md` or previous Colab runs) |
| `S3_REGION` | e.g. `eu-north-1` |
| `AWS_ACCESS_KEY_ID` | programmatic key with S3 write |
| `AWS_SECRET_ACCESS_KEY` | corresponding secret |

### 1.3 Run all cells

**Runtime → Run all.** Watch the output log — don't walk away for the first 5 min (it's verifying SDK + data loads).

Milestones (approx):
- **Cell 2 (imports):** Helical SDK should install cleanly. If pip resolver hangs, check `notebooks/requirements-colab.txt` pin hasn't drifted.
- **Cell 4 (data load):** asserts `cell_type` exists — the notebook auto-renames `louvain → cell_type` if needed.
- **Cell 10 (GenePT embed on PBMC):** ~8 min on T4. This is the first GPU-heavy step.
- **Cell 15 (GenePT embed on COVID):** ~15–20 min on T4. The longest cell.
- **Cell 22 (verification asserts):** the critical gate — see §1.4.
- **Cell 23 (HTTP/S3 uploads):** writes 5 parquets to S3 and `precompute_runs` row to Neon.

Total wall time ~45 min on T4. If a cell fails, **stop and read the traceback before re-running** — don't blindly restart.

### 1.4 Cell 22 failure playbook

Cell 22 is the "is this real data or synthetic?" gate. It asserts:

- `D ≥ 256` (GenePT embedding dim must be real, not the D=64 Gaussian we saw in session 031's audit)
- `pearson(distance_geneformer, distance_genept) < 0.95` (models must disagree somewhere, otherwise percentile-rank disagreement collapses to zero everywhere)
- No NaNs in any produced column

If it aborts:

| Failure | Likely cause | Quick check |
| --- | --- | --- |
| `AssertionError: D=64` or similar | Placeholder/fallback SDK code path fired (rare) — means `helical` didn't install properly. Check cell 2 output. | `helical.__version__` in a scratch cell — must be ≥ the pinned version in `requirements-colab.txt`. |
| `AssertionError: pearson=0.99` | Embeddings collapsed or one model silently failed. | In a scratch cell: `emb_pbmc.std()`, `emb_cov.std()` — both should be > 0.1. A near-zero std means collapse. |
| `NaN in distance_genept` | Subsample `cell_id` mismatch between 02c and 02d data | Check the cell_id join cell — some cells may have been dropped between runs. |

**Do not skip cell 22.** It exists specifically to prevent shipping fake-looking data — which is what happened last time and why we're doing this run.

### 1.5 On success: the 5 S3 objects

Once cell 23 succeeds, the S3 bucket should have (paths may differ slightly — confirm against cell 23 log output):

```
s3://<bucket>/parquet/pbmc3k/genept_embeddings.parquet
s3://<bucket>/parquet/covid_wilk/genept_embeddings.parquet
s3://<bucket>/parquet/covid_wilk/genept_projected.parquet
s3://<bucket>/parquet/covid_wilk/cross_model_disagreement.parquet
s3://<bucket>/parquet/covid_wilk/distance_scores.parquet   # REWRITTEN in-place
```

**Write down three numbers from cell 22 output** — you'll paste them into the PR body:

- `D` (GenePT embedding dim)
- `pearson(d_gf, d_gp)`
- `disagreement` p50, p90, p99

Also note: **Colab wall time** (Runtime → View resources, or eyeball it).

---

## Phase 2 — pull artifacts local (10 min)

```bash
cd ~/Documents/Manu\ Murillo\ FS\ projects/helical-bio-explorer
git checkout -b feat/genept-data

# Replace <bucket> with your S3_BUCKET value
BUCKET=<bucket>

aws s3 cp s3://$BUCKET/parquet/pbmc3k/genept_embeddings.parquet \
  backend/data/parquet/pbmc3k/genept_embeddings.parquet

aws s3 cp s3://$BUCKET/parquet/covid_wilk/genept_embeddings.parquet \
  backend/data/parquet/covid_wilk/genept_embeddings.parquet

aws s3 cp s3://$BUCKET/parquet/covid_wilk/genept_projected.parquet \
  backend/data/parquet/covid_wilk/genept_projected.parquet

aws s3 cp s3://$BUCKET/parquet/covid_wilk/cross_model_disagreement.parquet \
  backend/data/parquet/covid_wilk/cross_model_disagreement.parquet

# This one OVERWRITES the current file — the GenePT run rewrites it in place
aws s3 cp s3://$BUCKET/parquet/covid_wilk/distance_scores.parquet \
  backend/data/parquet/covid_wilk/distance_scores.parquet

git status    # should show 5 parquet files changed/added
```

**Sanity-check one file in Python** before proceeding:

```bash
cd backend
uv run python -c "
import pyarrow.parquet as pq
t = pq.read_table('data/parquet/covid_wilk/cross_model_disagreement.parquet')
print('rows:', t.num_rows, 'cols:', t.column_names)
import pandas as pd
df = t.to_pandas()
print(df['disagreement'].describe())
"
```

Expect: `rows` should match the COVID subsample size (check session 031 for the exact count), `disagreement` should have a non-trivial spread (std > 0.05).

---

## Phase 3 — flip the two toggles back on (5 min)

### 3.1 `frontend/components/DashboardShell/DashboardShell.tsx`

Restore the 4-tab array (currently 2 tabs):

```tsx
// Remove the "re-enable in PR-0.10.1" comment and restore:
const TABS: { id: DashboardTabId; label: string }[] = [
  { id: "reference", label: "Reference" },
  { id: "projection", label: "Projection" },
  { id: "distance", label: "Distance" },
  { id: "disagreement", label: "Disagreement" },
];
```

### 3.2 `frontend/components/FilterPanel/FilterPanel.tsx`

Restore the 2-model array (currently 1 model):

```tsx
// Remove the "re-enable in PR-0.10.1" comment and restore:
const MODELS = [
  { id: "geneformer", label: "Geneformer" },
  { id: "genept", label: "GenePT" },
] as const;
```

---

## Phase 4 — quality gate (15 min)

```bash
# Backend
cd backend
uv run ruff check . \
  && uv run ruff format --check . \
  && uv run mypy --strict app/ tests/data/test_genept_disagreement_parquet_schemas.py \
  && uv run pytest -v

# Frontend
cd ../frontend
pnpm typecheck && pnpm lint && pnpm build
```

**Must pass:**
- Backend: **40 passed, 0 skipped** (the 5 previously-skipped GenePT tests now activate).
- Frontend: typecheck/lint/build all green, `/dashboard` bundle size within reason.

**Optional but recommended — live smoke test against local backend:**

```bash
cd backend && uv run uvicorn app.main:app --reload &
# In another tab:
cd frontend && pnpm dev
# Open http://localhost:3000/dashboard — click all 4 tabs, toggle Geneformer/GenePT, confirm no errors.
```

---

## Phase 5 — commit, push, open PR (10 min)

```bash
git add backend/data/parquet/ \
        frontend/components/DashboardShell/DashboardShell.tsx \
        frontend/components/FilterPanel/FilterPanel.tsx \
        docs/pull-requests/PR-0.10.1-runbook.md   # optional — if you want the runbook in the PR

git commit -m "$(cat <<'EOF'
feat(disagreement): land real GenePT parquets and re-enable 4-tab dashboard

Completes the GenePT arm: 5 parquets produced by the Colab T4 run of notebooks/precompute_genept_disagreement.ipynb.

- Re-enables Distance + Disagreement tabs in DashboardShell (reverts the PR-0.10.0 trim).
- Re-enables GenePT in the FilterPanel MODEL toggle (reverts the PR-0.10.0.1 trim).
- All 5 previously-skipped schema-regression tests now activate and pass.
EOF
)"

git push -u origin feat/genept-data
```

### PR body template — fill in the 3 bracketed values from cell 22

```markdown
# PR-0.10.1 — GenePT disagreement: real data

**Branch:** `feat/genept-data` → `main`
**Version:** 0.10.1
**Date:** 2026-04-16

## Summary

Lands the 5 parquets produced by the Colab T4 run of `notebooks/precompute_genept_disagreement.ipynb` and re-enables the Distance + Disagreement tabs plus the GenePT MODEL toggle. Completes the GenePT arm of the cross-model disagreement feature.

## Real numbers from the Colab run

- **GenePT embedding dim (D):** `[fill from cell 22]`
- **Colab T4 wall time:** `[fill]` min
- **pearson(distance_geneformer, distance_genept):** `[fill]` (must be < 0.95 by cell-22 invariant)
- **Disagreement quantiles on the COVID subsample:**
  - p50: `[fill]`
  - p90: `[fill]`
  - p99: `[fill]`

## What this PR ships

| File | Action |
| --- | --- |
| `backend/data/parquet/pbmc3k/genept_embeddings.parquet` | Added |
| `backend/data/parquet/covid_wilk/genept_embeddings.parquet` | Added |
| `backend/data/parquet/covid_wilk/genept_projected.parquet` | Added |
| `backend/data/parquet/covid_wilk/cross_model_disagreement.parquet` | Added |
| `backend/data/parquet/covid_wilk/distance_scores.parquet` | Modified (in-place `distance_genept` fill) |
| `frontend/components/DashboardShell/DashboardShell.tsx` | Reverted — 4 tabs restored |
| `frontend/components/FilterPanel/FilterPanel.tsx` | Reverted — GenePT toggle restored |

## Quality gate

All 40 backend tests pass (5 previously-skipped GenePT schema tests now active). Frontend typecheck, lint, build all green.

## Verification

Production dashboard after merge + Vercel redeploy must show:
- 4 tabs: Reference / Projection / Distance / Disagreement
- MODEL toggle: Geneformer / GenePT
- Disagreement tab: UMAP colored by disagreement score, with top-disagreement cells highlighted
- No `HTTP 404` in DevTools Network for any tab/model combination

## Related

- **PR-0.10.0** — shipped infrastructure (notebook, emitter, tests).
- **PR-0.10.0.1** — hot-fix that hid the GenePT toggle until this PR landed.
```

```bash
gh pr create --title "feat(disagreement): land real GenePT data" --body-file docs/pull-requests/PR-0.10.1.md
```

---

## Phase 6 — post-merge verification (5 min)

1. Wait for Vercel to redeploy `main`.
2. Hard-reload https://helical.manumustudio.com/dashboard.
3. Click through all 4 tabs × 2 models.
4. Confirm: Disagreement UMAP colored by disagreement score, no errors in DevTools.
5. Close session with **`close session`** — I'll write session 033.

---

## Rollback path (if the merge breaks prod)

```bash
git checkout main && git pull
git revert <merge-commit-sha>
git push
```

This reverts to the 2-tab / 1-model state (the PR-0.10.0.1 post state). Parquets stay on disk but are simply unused until the frontend re-enables them.
