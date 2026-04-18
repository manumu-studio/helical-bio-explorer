# CI/CD Pipeline

How code moves from pull request to production.

```
                         ┌──────────────────┐
                         │   Pull Request   │
                         │   or push main   │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                             ▼
          ┌─────────────────┐           ┌─────────────────┐
          │  backend-ci.yml │           │ frontend-ci.yml  │
          │  (backend/**)   │           │  (frontend/**)   │
          └────────┬────────┘           └────────┬─────────┘
                   │                              │
          ┌────────▼────────┐           ┌─────────▼────────┐
          │ Python 3.11     │           │ Node 20 + pnpm   │
          │ uv sync --frozen│           │ pnpm install     │
          └────────┬────────┘           │   --frozen       │
                   │                    └─────────┬────────┘
          ┌────────▼────────┐           ┌─────────▼────────┐
          │ ruff lint       │           │ prisma generate   │
          │ ruff format     │           │ pnpm lint         │
          │ mypy --strict   │           │ pnpm typecheck    │
          └────────┬────────┘           │ pnpm build        │
                   │                    └─────────┬────────┘
          ┌────────▼────────┐                     │
          │ alembic upgrade │                     │
          │   head --sql    │                     │
          │ (offline check) │                     │
          └────────┬────────┘                     │
                   │                              │
          ┌────────▼────────┐                     │
          │   pytest        │                     │
          └────────┬────────┘                     │
                   │                              │
                   ▼                              ▼
          ┌────────────────┐            ┌─────────────────┐
          │   ✅ CI pass    │            │   ✅ CI pass     │
          └────────┬───────┘            └────────┬────────┘
                   │ (main only)                 │ (main only)
                   ▼                             ▼
        ┌──────────────────┐          ┌──────────────────┐
        │ backend-deploy   │          │  Vercel auto-    │
        │     .yml         │          │  deploy (hook)   │
        └────────┬─────────┘          └────────┬─────────┘
                 │                              │
                 ▼                              ▼
        ┌──────────────────┐          ┌──────────────────┐
        │ GitHub OIDC →    │          │ Next.js build    │
        │ AWS IAM role     │          │ (standalone)     │
        │ (no SSH keys)    │          │                  │
        └────────┬─────────┘          └────────┬─────────┘
                 │                              │
                 ▼                              ▼
        ┌──────────────────┐          ┌──────────────────┐
        │ SSM Send-Command │          │ helical          │
        │ to EC2 instance  │          │ .manumustudio    │
        └────────┬─────────┘          │ .com             │
                 │                    └──────────────────┘
                 ▼
        ┌──────────────────┐
        │ On EC2:          │
        │ 1. git pull      │
        │ 2. uv sync       │
        │ 3. alembic up    │
        │ 4. ensure-prod   │
        │    -env.sh       │
        │ 5. systemctl     │
        │    restart       │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │ Health check:    │
        │ GET /health →200 │
        │                  │
        │ api.helical      │
        │ .manumustudio    │
        │ .com             │
        └──────────────────┘
```

## Key design decisions

- **OIDC auth** — no long-lived AWS credentials in GitHub Secrets; IAM role assumed per run
- **SSM over SSH** — no inbound port 22 needed; EC2 security group stays locked down
- **ensure-prod-env.sh** — idempotent script enforces CORS origins and S3 bucket on every deploy, preventing config drift
- **Offline migration check** — `alembic upgrade head --sql` in CI validates migration syntax without touching the database
- **Vercel auto-deploy** — frontend deploys via Vercel's GitHub integration, not a custom workflow
