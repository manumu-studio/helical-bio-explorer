# ADR-010 — Deployment: systemd + venv on EC2, Vercel for frontend, no Docker-on-host (for now)

## Status

Accepted — 2026-04-14. Supersedes the "Docker Compose on EC2, image from ECR" line in ADR-004's Stack table.

## Context

The demo must be reachable at a real HTTPS URL before the Helical R2 interview on 2026-04-20. Time to ship is the binding constraint.

An adjacent production project (`ats-career-kit`, same stack: FastAPI + Next.js + Neon + GoDaddy DNS) already runs a proven deployment pattern: Nginx + systemd + Let's Encrypt on EC2, GitHub Actions with AWS OIDC + SSM Send-Command driving pulls, no SSH keys. Porting that pattern is hours of work; re-inventing a Docker/ECR pipeline under the same clock is 4–6 extra hours without any interview-story payoff for a single-cell ML demo.

The S3 ↔ ECR machinery described in ADR-004 was always an aspiration, not a constraint. Nothing elsewhere in the codebase depends on the image being delivered via ECR.

## Decision

**Backend deploys to EC2 with systemd + uv venv.** No Docker on the host. No ECR.

- **Host:** single `t3.micro` Ubuntu 22.04, one elastic IP, security group for 22/80/443.
- **Runtime:** `uv sync --frozen` installs deps into `.venv/`; systemd unit `helical-api.service` runs `uvicorn app.main:app --workers 2` on `127.0.0.1:8000`.
- **Edge:** Nginx reverse-proxy at `api.helical.manumustudio.com`, TLS via Let's Encrypt (certbot --nginx), port 80 → 301 redirect.
- **Deploy:** GitHub Actions `backend-deploy.yml` uses OIDC → assumes a scoped IAM role → `aws ssm send-command` runs `git pull && uv sync && alembic upgrade head && systemctl restart` on the instance, then curls `/health`.
- **Secrets:** `DATABASE_URL`, `DIRECT_URL`, `BACKEND_CORS_ORIGINS` in `/home/ubuntu/helical-bio-explorer/backend/.env` (600, not committed). GH Actions only holds `AWS_ROLE_ARN`, `AWS_REGION`, `EC2_INSTANCE_ID`, `EC2_HOST`.

**Frontend deploys to Vercel** at `helical.manumustudio.com` via the standard GitHub integration. `NEXT_PUBLIC_BACKEND_URL=https://api.helical.manumustudio.com` is set per-environment in Vercel; the backend's `BACKEND_CORS_ORIGINS` echoes the Vercel domain.

**Precompute ships as static parquet** (per ADR-002). The image/host does not run inference. Local fallback (ADR-005) is baked into the repo, so the first deploy serves a working API even before S3 is wired.

## Consequences

- **Faster first deploy** — no Dockerfile iteration, no ECR auth on the host, no compose file.
- **Simpler deploy loop** — a bad commit is `git reset --hard <prev>` + `systemctl restart`, not a container rebuild. Rollback is one SSM command.
- **Python env reproducibility is load-bearing on `uv.lock`** — `uv sync --frozen` is the reproducibility guarantee. Stays honest.
- **CORS becomes a real object** — the backend now has a named cross-origin client (Vercel), not `*`. `BACKEND_CORS_ORIGINS` must echo the live Vercel domain.
- **Mixed-content trap closed** — Vercel serves HTTPS, the backend serves HTTPS, no browser block.
- **No horizontal scaling path.** Acceptable — the demo is a single box. If scale is ever required, the next step is ASG + ALB, which is a different ADR.

## The ECR/Docker migration path (deferred, documented)

If the backend ever moves to Docker-on-EC2 with ECR, the delta is bounded:

1. Enable Docker on the host (`apt install docker.io`; add `ubuntu` to the `docker` group).
2. Create the ECR repo; attach an IAM instance profile with `ecr:GetAuthorizationToken` + `BatchGetImage` + `GetDownloadUrlForLayer`.
3. Extend `backend-deploy.yml` to: `docker build → aws ecr login → docker push → SSM (docker pull + docker run --rm)`.
4. Replace `helical-api.service` with a `docker run` wrapper (or compose unit).
5. Move `.env` to a Docker `--env-file` mount; keep Neon URLs server-side only.

The reverse-proxy, DNS, TLS, OIDC trust policy, and post-deploy health check are unchanged. Nothing in the application code changes.

Estimated cost: 4–6 hours. Intentionally not doing this now because the interview clock is the binding constraint, not the container story.

## Related ADRs

- ADR-002 — Precompute-in-Colab, static parquet at runtime (explains why no GPU in prod).
- ADR-004 — Minimal AWS surface (the S3/EC2/ECR triad — this ADR narrows it to S3/EC2, ECR deferred).
- ADR-005 — Local parquet fallback (the reason the first deploy still serves valid data).
