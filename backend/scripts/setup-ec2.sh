#!/usr/bin/env bash
# One-time bootstrap for the helical-bio-explorer backend on a fresh Ubuntu 22.04 EC2 instance.
# Assumes: user `ubuntu`, home `/home/ubuntu`, a public elastic IP already attached,
# and DNS A-record for api.helical.manumustudio.com already pointing at it.
#
# PRE-STEP (SSH deploy key — so the repo can flip private later without breaking auto-deploy):
#   On the EC2 box as the `ubuntu` user:
#     ssh-keygen -t ed25519 -C "helical-ec2-deploy" -f ~/.ssh/id_ed25519 -N ""
#     cat ~/.ssh/id_ed25519.pub
#   Copy the public key and add it at:
#     https://github.com/manumu-studio/helical-bio-explorer/settings/keys/new
#     Title: "helical-ec2-deploy", Allow write access: UNCHECKED (read-only is enough for pulls).
#   Then verify:
#     ssh -T git@github.com   # expect "Hi manumu-studio/helical-bio-explorer! You've successfully authenticated..."
#
# Usage (on the EC2 box, after `ssh ubuntu@<elastic-ip>` and the deploy-key step):
#   curl -fsSL https://raw.githubusercontent.com/manumu-studio/helical-bio-explorer/main/backend/scripts/setup-ec2.sh -o setup-ec2.sh
#   chmod +x setup-ec2.sh
#   ./setup-ec2.sh

set -euo pipefail

REPO_URL="git@github.com:manumu-studio/helical-bio-explorer.git"
REPO_DIR="/home/ubuntu/helical-bio-explorer"
DOMAIN="api.helical.manumustudio.com"

echo "=== Helical Bio Explorer EC2 bootstrap ==="

# --- System packages ------------------------------------------------------
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y \
    python3.11 python3.11-venv python3.11-dev \
    build-essential git curl \
    nginx certbot python3-certbot-nginx

# --- uv (fast Python package manager) -------------------------------------
# Installed under ~/.local/bin/uv; add to PATH for this session and future logins.
if ! command -v uv >/dev/null 2>&1; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
    if ! grep -q 'HOME/.local/bin' "$HOME/.bashrc"; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
    fi
fi

# --- Known hosts (so non-interactive git pulls don't prompt) --------------
mkdir -p ~/.ssh
chmod 700 ~/.ssh
if ! grep -q "github.com" ~/.ssh/known_hosts 2>/dev/null; then
    ssh-keyscan -t ed25519,rsa github.com >> ~/.ssh/known_hosts
fi

# --- SSH deploy key sanity check ------------------------------------------
# Fail fast if the deploy key hasn't been added at GitHub yet — otherwise
# the error shows up three steps later as a confusing "Permission denied (publickey)".
if ! ssh -o BatchMode=yes -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "!!! SSH to github.com failed."
    echo "    Did you add ~/.ssh/id_ed25519.pub as a deploy key on the repo?"
    echo "    See the PRE-STEP comment at the top of this script. Aborting."
    exit 1
fi

# --- Clone repo -----------------------------------------------------------
if [ ! -d "$REPO_DIR" ]; then
    git clone "$REPO_URL" "$REPO_DIR"
fi

# --- Backend venv + deps --------------------------------------------------
cd "$REPO_DIR/backend"
uv venv --python 3.11
# shellcheck source=/dev/null
source .venv/bin/activate
uv sync --frozen

# --- .env template (operator edits by hand after this script) -------------
if [ ! -f .env ]; then
    cat > .env <<'ENVEOF'
# helical-bio-explorer backend runtime env — DO NOT COMMIT.
# Fill in real values before starting the service.

ENV=prod
LOG_LEVEL=INFO

# Neon Postgres — get both URLs from the Neon console (pooled vs direct).
DATABASE_URL=postgresql+asyncpg://USER:PASS@HOST/DB?sslmode=require
DIRECT_URL=postgresql://USER:PASS@HOST/DB?sslmode=require

# Frontend origins allowed to hit this API (JSON array — pydantic-settings parses it).
BACKEND_CORS_ORIGINS=["https://helical.manumustudio.com"]

# Parquet storage — leave S3_BUCKET unset to rely on the local fallback baked into the repo.
# S3_BUCKET=helical-bio-explorer-artifacts
# S3_REGION=us-east-1
PARQUET_LOCAL_FALLBACK_DIR=/home/ubuntu/helical-bio-explorer/backend/data/parquet
ENVEOF
    echo ">>> Wrote .env template at $REPO_DIR/backend/.env — edit it before starting the service."
fi

# --- Nginx site -----------------------------------------------------------
sudo cp "$REPO_DIR/nginx/helical-api.conf" /etc/nginx/sites-available/helical-api.conf
sudo ln -sf /etc/nginx/sites-available/helical-api.conf /etc/nginx/sites-enabled/helical-api.conf
sudo rm -f /etc/nginx/sites-enabled/default

# Certbot rewrites this config with real cert paths; until the cert exists we can't
# let Nginx listen on 443 pointing at files that aren't there. Comment the TLS block
# just for the first reload, restore after certbot runs.
sudo sed -i.bak 's|listen 443 ssl;|#listen 443 ssl;|' /etc/nginx/sites-enabled/helical-api.conf || true
sudo nginx -t && sudo systemctl reload nginx

# --- TLS via Let's Encrypt -----------------------------------------------
# Requires the A-record for $DOMAIN to already resolve to this host.
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m ops@manumustudio.com || {
    echo "!!! certbot failed — is DNS for $DOMAIN pointing here yet?"
    echo "    Re-run: sudo certbot --nginx -d $DOMAIN"
}

# --- Systemd unit --------------------------------------------------------
sudo cp "$REPO_DIR/backend/systemd/helical-api.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable helical-api

# --- Migrations ----------------------------------------------------------
# Skipped here because .env isn't populated yet. Run after editing .env:
#   cd $REPO_DIR/backend && source .venv/bin/activate && alembic upgrade head

echo ""
echo "=== Setup complete. Next steps ==="
echo "1. Edit $REPO_DIR/backend/.env with real Neon URLs + CORS origin."
echo "2. cd $REPO_DIR/backend && source .venv/bin/activate && alembic upgrade head"
echo "3. sudo systemctl start helical-api"
echo "4. curl https://$DOMAIN/health  # expect 200"
echo "5. sudo journalctl -u helical-api -f  # watch logs"
