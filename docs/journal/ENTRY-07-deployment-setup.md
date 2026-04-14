# ENTRY-07 — Deployment setup (CI/CD + EC2 + Vercel)

**Date:** 2026-04-14
**Type:** Infrastructure
**Branch:** `feature/deployment-setup`
**Version:** 0.6.0

---

## What I Did

Pivoted the roadmap: deployment goes before precompute. Ported the proven pattern from the sister project `ats-career-kit` (FastAPI + Nginx + systemd + Let's Encrypt on EC2, Vercel for Next.js, GitHub Actions with AWS OIDC + SSM for deploy). Wrote every infra config file this project needs to auto-deploy every merge to `main`: reverse proxy, systemd unit, EC2 bootstrap, split CI workflows, OIDC + SSM deploy workflow, plus the ADR and a 9-concept learning brief that makes the whole thing interview-defensible.

No Cursor in this packet. The configs are small, load-bearing, and easier to author by hand than to brief out.

## Files Touched

| File | Action | Notes |
|---|---|---|
| `nginx/helical-api.conf` | Created | 80→443, TLS, proxy to `127.0.0.1:8000`, security headers |
| `backend/systemd/helical-api.service` | Created | uvicorn, 2 workers, `.env` via `EnvironmentFile`, user `ubuntu` |
| `backend/scripts/setup-ec2.sh` | Created | One-shot bootstrap for fresh Ubuntu 22.04 |
| `backend/.env.example` | Created | Neon URLs + CORS JSON array + S3 opt-in |
| `.github/workflows/backend-ci.yml` | Created | Path-filtered `backend/**`, uv + ruff + mypy + alembic + pytest |
| `.github/workflows/frontend-ci.yml` | Created | Path-filtered `frontend/**`, pnpm + prisma + lint + typecheck + build |
| `.github/workflows/backend-deploy.yml` | Created | `workflow_run` on Backend CI, OIDC + SSM, post-deploy health curl |
| `.github/workflows/ci.yml` | Deleted | Superseded by split workflows |
| `docs/architecture/ADR-010-deployment.md` | Created | Decision record + ECR migration path |
| `docs/learning/PACKET-05-concepts.md` | Created | Nginx, systemd, Let's Encrypt, OIDC, SSM, uv, Vercel, CORS, workflow_run |
| `docs/build-packets/PACKET-05-deployment-setup.md` | Created | Packet spec |
| `docs/pull-requests/PR-0.6.0-deployment-setup.md` | Created | PR doc |

## Decisions

- **systemd + venv over Docker + ECR** — ~4–6 hrs faster to port from `ats-career-kit`, zero interview-story payoff for running single-cell models. Migration path to ECR is documented in ADR-010 for a post-interview weekend.
- **AWS OIDC over SSH keys or long-lived access keys** — short-lived credentials, scoped to repo + branch, no rotation. "Why OIDC?" is an interview-win answer.
- **SSM Send-Command over SSH** — no inbound port 22, no key distribution, CloudTrail audit. Same posture as `ats-career-kit`.
- **Split path-filtered CI** — replaces the combined `ci.yml`. A frontend PR shouldn't run backend tests and vice versa; lockfiles and cache keys stay clean.
- **Deploy-first, precompute-second** — flipping the original packet order. Reason: the reference pattern already exists, every future merge auto-deploys once wired, and "fully productionized from day one" is a materially stronger story than "I deployed it once, manually, an hour before the call." De-risks TLS/CORS/OIDC failure modes with 6 days of buffer.

## What I skipped on purpose

- **Docker-on-host** — adds a daemon to fail, an image to tag, an ECR repo to provision, and an SSM command to rewrite. None of it changes what a reviewer sees.
- **Blue/green deploys** — single box, `git pull + systemctl restart` is the rollback. `git reset --hard <sha>` + restart for faster recovery.
- **IaC (Terraform / CDK)** — the cloud surface is three resources (EC2 + elastic IP + IAM role). A shell script and a console click are honest tooling at this size.
- **Observability stack (CloudWatch agent, Grafana, Sentry)** — out of scope for a 10-day demo. `journalctl -u helical-api -f` covers debugging.

## Still Open

- **AWS provisioning + DNS + first manual deploy** — user does this with me walking through. Not merging PR-0.6.0 until `/health` returns 200 on the live domain and GH secrets are set, otherwise the first auto-deploy is noisy.
- **Vercel custom domain + CORS round-trip** — after Vercel deploys to `helical.manumustudio.com`, that origin goes into the EC2 `.env` under `BACKEND_CORS_ORIGINS` and the service restarts.
- **Repo public vs private** — resolved. Repo is temporarily public for the initial bootstrap, will flip private before the interview. To survive the flip without breaking the deploy pipeline, `setup-ec2.sh` clones over SSH (`git@github.com:...`) using a per-host **read-only deploy key** generated as the `ubuntu` user and registered at `/settings/keys/new`. The script sanity-checks the key before touching git to fail fast with a clear error instead of a cryptic `Permission denied (publickey)`.
- **Observability and alerting** — deliberately unstarted. Post-interview work.

## Validation

- `uv run ruff check .` / `uv run mypy --strict app/` / `uv run mypy --strict tests/` / `uv run pytest -v` — all clean locally
- `pnpm lint && pnpm typecheck && pnpm build` — all clean locally
- CI workflows lint-valid YAML (no syntax errors when GitHub parses them)

## Next Session

Provision AWS: t3.micro Ubuntu, elastic IP, IAM role with `AmazonSSMManagedInstanceCore`, GoDaddy A-record + CNAME, SSH in, run `setup-ec2.sh`, edit `.env`, start service, validate `/health`. Then wire OIDC trust + GH secrets, merge PR-0.6.0, watch first auto-deploy fire. Then Vercel.
