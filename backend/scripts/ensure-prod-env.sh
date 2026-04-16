# Idempotent prod .env enforcer. Called by backend-deploy.yml on every deploy.
# Purpose: CORS drift between setup-ec2.sh template and live .env would
# silently break the Vercel frontend. Enforces both the exact-match origin list
# and the regex that allows Vercel preview URLs.
# Runs as root under SSM; writes .env as the ubuntu owner.
#!/usr/bin/env bash
set -eu

ENV_FILE="/home/ubuntu/helical-bio-explorer/backend/.env"
CORS_LINE='BACKEND_CORS_ORIGINS=["https://helical.manumustudio.com","https://helical-bio-explorer.vercel.app"]'
REGEX_LINE='BACKEND_CORS_ORIGIN_REGEX=^https://helical-bio-explorer-[a-z0-9-]+\.vercel\.app

if [ ! -f "$ENV_FILE" ]; then
    echo "!!! $ENV_FILE missing — cannot enforce CORS."
    exit 1
fi

if grep -q '^BACKEND_CORS_ORIGINS=' "$ENV_FILE"; then
    sudo -u ubuntu sed -i "s|^BACKEND_CORS_ORIGINS=.*|$CORS_LINE|" "$ENV_FILE"
else
    echo "$CORS_LINE" | sudo -u ubuntu tee -a "$ENV_FILE" > /dev/null
fi

# Regex line contains backslashes; delete-and-append avoids sed-replacement escaping.
if grep -q '^BACKEND_CORS_ORIGIN_REGEX=' "$ENV_FILE"; then
    sudo -u ubuntu sed -i '/^BACKEND_CORS_ORIGIN_REGEX=/d' "$ENV_FILE"
fi
echo "$REGEX_LINE" | sudo -u ubuntu tee -a "$ENV_FILE" > /dev/null

echo ">>> Enforced BACKEND_CORS_ORIGINS + BACKEND_CORS_ORIGIN_REGEX in $ENV_FILE"
