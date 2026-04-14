#!/usr/bin/env bash
# End-to-end smoke: build and run both services, curl /health and home page, tear down.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker not found. Install Docker Desktop (or Colima) and retry." >&2
  exit 1
fi

cleanup() {
  docker compose down --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "==> docker compose up --build"
docker compose up --build -d

echo "==> wait for backend"
for i in $(seq 1 30); do
  if curl -sf "http://localhost:8000/health" >/dev/null 2>&1; then
    break
  fi
  if [[ "$i" -eq 30 ]]; then
    echo "error: backend /health did not become ready" >&2
    docker compose logs backend >&2 || true
    exit 1
  fi
  sleep 1
done

echo "==> curl backend /health"
curl -sf "http://localhost:8000/health" | grep -q '"status":"ok"' || {
  echo "error: unexpected /health body" >&2
  exit 1
}

echo "==> seed datasets (idempotent upsert)"
docker compose exec -T backend python -m app.scripts.seed_datasets

echo "==> curl backend /api/datasets (expect pbmc3k)"
DATASETS_RESPONSE="$(curl -fsS http://localhost:8000/api/datasets)"
echo "$DATASETS_RESPONSE"
if ! echo "$DATASETS_RESPONSE" | grep -q '"slug":"pbmc3k"'; then
  echo "error: /api/datasets did not return pbmc3k" >&2
  exit 1
fi

echo "==> wait for frontend"
for i in $(seq 1 60); do
  if curl -sf "http://localhost:3000" >/dev/null 2>&1; then
    break
  fi
  if [[ "$i" -eq 60 ]]; then
    echo "error: frontend did not become ready" >&2
    docker compose logs frontend >&2 || true
    exit 1
  fi
  sleep 1
done

echo "==> curl frontend / (expect redirect to /dashboard)"
REDIR_HEADERS="$(curl -sI "http://localhost:3000/" | tr -d '\r')"
echo "$REDIR_HEADERS"
echo "$REDIR_HEADERS" | grep -qi "^location:.*/dashboard" || {
  echo "error: expected / to redirect to /dashboard" >&2
  exit 1
}

echo "==> curl frontend /dashboard (expect HTTP 200)"
curl -sf -o /dev/null "http://localhost:3000/dashboard" || {
  echo "error: /dashboard did not return 200" >&2
  docker compose logs frontend >&2 || true
  exit 1
}

echo "==> OK — compose E2E smoke passed"
exit 0
