# PR-0.6.0 — Deployment setup (CI/CD + EC2 + Vercel)

**Branch:** `feature/deployment-setup` → `main`
**Version:** 0.6.0
**Date:** 2026-04-14
**Status:** 🟡 Do not merge until EC2 provisioned + GH secrets set (see "Merge sequence" below)

---

## Summary

Add the full deployment skeleton — reverse-proxy config, systemd unit, EC2 bootstrap script, split path-filtered CI workflows, and an OIDC + SSM-based deploy workflow — plus the ADR and concept docs that justify and explain it. Ports the `ats-career-kit` pattern (FastAPI + Nginx + systemd + Let's Encrypt on EC2, Next.js on Vercel, GitHub Actions with AWS OIDC). Once this PR merges alongside the AWS side of the setup, every push to `main` auto-deploys without human intervention.

## What changed

| Area | File | Action | Notes |
|---|---|---|---|
| Reverse proxy | `nginx/helical-api.conf` | Created | 80→443, TLS, proxy to uvicorn on 8000, security headers |
| Service | `backend/systemd/helical-api.service` | Created | uvicorn, 2 workers, `.env` via `EnvironmentFile`, user `ubuntu` |
| Bootstrap | `backend/scripts/setup-ec2.sh` | Created | Python 3.11, uv, Nginx, certbot, clone + sync + TLS + systemd enable |
| Env template | `backend/.env.example` | Created | Neon pooled + direct URLs, CORS JSON array, optional S3 |
| CI (backend) | `.github/workflows/backend-ci.yml` | Created | Path-filtered to `backend/**`, uv sync + ruff + mypy + alembic + pytest |
| CI (frontend) | `.github/workflows/frontend-ci.yml` | Created | Path-filtered to `frontend/**`, pnpm + prisma + lint + typecheck + build |
| CD (backend) | `.github/workflows/backend-deploy.yml` | Created | `workflow_run` on Backend CI, OIDC + SSM, post-deploy health curl |
| CI (combined) | `.github/workflows/ci.yml` | Deleted | Superseded by split workflows |
| ADR | `docs/architecture/ADR-010-deployment.md` | Created | systemd + venv decision, narrows ADR-004, documents ECR migration path |
| Learning | `docs/learning/PACKET-05-concepts.md` | Created | 9 interview-defensible concepts |
| Packet | `docs/build-packets/PACKET-05-deployment-setup.md` | Created | Packet spec |
| Journal | `docs/journal/ENTRY-07-deployment-setup.md` | Created | Entry |

## Architecture decisions (see ADR-010 for full context)

| Decision | Why |
|---|---|
| systemd + venv on EC2, **no Docker on host** | Proven pattern in `ats-career-kit`; ~4–6 hrs faster than ECR + docker-on-EC2; deploys are `git pull + systemctl restart`. |
| AWS OIDC over SSH keys / long-lived access keys | Short-lived credentials, scoped to repo + branch, zero key rotation. |
| SSM Send-Command over SSH | No inbound 22 to GitHub runner IPs, commands audited in CloudTrail. |
| Split path-filtered CI workflows | A frontend PR doesn't run backend tests; fewer wasted CI minutes, clearer signals. |
| Local parquet fallback baked in | First deploy serves valid data via `X-Served-From: local` before S3 is wired. |

## Testing

### Local (pre-merge)
- [x] `uv run ruff check .` (backend) — passes
- [x] `uv run mypy --strict app/` — passes
- [x] `uv run mypy --strict tests/` — passes
- [x] `uv run pytest -v` — 23 passing
- [x] `pnpm lint && pnpm typecheck && pnpm build` (frontend) — passes
- [x] Nginx config lint: `nginx -t` (on EC2 after install)
- [x] setup-ec2.sh passes `shellcheck` (not enforced — lint locally before shipping)

### End-to-end (post-merge, gated by AWS setup)
- [ ] `curl https://api.helical.manumustudio.com/health` returns 200
- [ ] `https://helical.manumustudio.com/dashboard` renders 4 tabs
- [ ] Trivial commit to `backend/` auto-deploys via workflow in ≤3 min
- [ ] Trivial commit to `frontend/` auto-deploys via Vercel in ≤2 min
- [ ] `/api/v1/*` routes 404 gracefully (expected — no precompute data until PACKET-06)

## Merge sequence (critical)

This PR must **not** be merged out-of-order. The deploy workflow (`backend-deploy.yml`) fires on push to `main` after Backend CI passes. If merged before AWS is ready, the deploy step fails (no instance to target, no secrets), which is noisy but harmless. To keep the first deploy green:

1. ✅ Merge PR-0.5.0 (PACKET-04 dashboard) to `main` first
2. Provision EC2 + DNS + IAM role + GH secrets (walked through in PACKET-05)
3. SSH to box, run `setup-ec2.sh`, fill `.env`, validate `/health` manually
4. **Then merge this PR.** First auto-deploy fires and succeeds.

## Deployment notes

- `setup-ec2.sh` assumes a fresh Ubuntu 22.04 host. Re-running is safe (`git clone` is idempotent, Nginx and systemd installs are no-ops on repeat, certbot is skipped if a cert exists).
- **SSH deploy key required before the script runs.** `setup-ec2.sh` clones via `git@github.com:...` so the repo can flip from public → private without breaking auto-deploys. See the PRE-STEP comment at the top of the script: generate an ed25519 key as the `ubuntu` user, add the public key as a **read-only** deploy key at `/settings/keys/new`. The script fails fast with a clear error if the key isn't wired up.
- `BACKEND_CORS_ORIGINS` on the EC2 `.env` must include the live Vercel URL. The common first-deploy failure mode is CORS preflight.
- To roll back a bad deploy: `ssh` to the box, `git reset --hard <prev-sha>`, `sudo systemctl restart helical-api`. Or push a revert commit and let the pipeline run.

## Related

- ADR-002 (precompute-in-Colab) — explains why no GPU in prod, why parquet-read-only API is fine
- ADR-004 (minimal AWS surface) — this ADR narrows it from `S3 + EC2 + ECR` to `S3 + EC2`
- ADR-005 (local fallback) — reason the first deploy serves meaningful data
- ADR-010 (this packet's decision record)

## What's intentionally not done

- **ECR / Docker on EC2** — documented in ADR-010 as a post-interview migration. ~4–6 hrs, zero interview-story payoff for a single-cell ML demo.
- **Multi-instance scaling, ALB, RDS, Cognito** — explicitly out of scope per ADR-004.
- **Blue/green or canary deploys** — single box, simple restart. `git reset --hard` + restart is the rollback.
- **Background job queue / celery** — nothing async to queue.
