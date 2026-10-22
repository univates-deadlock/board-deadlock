#!/usr/bin/env bash
set -Eeuo pipefail

deploy_sha="${1:?Expected the commit verified by CI}"
[[ "$deploy_sha" =~ ^[0-9a-f]{40}$ ]]
cd "$HOME/board-deadlock"

report_failure() {
  local exit_code=$?
  echo "::error::Remote deployment failed (exit code: $exit_code)"
  sudo -n docker compose ps || true
  sudo -n docker compose logs --no-color --tail 60 api frontend || true
  exit "$exit_code"
}
trap report_failure ERR

test -f docker-compose.yml
test -s .env
test -s api/.env
command -v git
command -v docker
sudo -n docker compose version

# Preserve local configuration and refuse to overwrite tracked changes.
[[ "$(git branch --show-current)" == main ]]
git diff --quiet
git diff --cached --quiet
git fetch origin main

# A newer push may have arrived while this CI run was finishing.
if [[ "$(git rev-parse FETCH_HEAD)" != "$deploy_sha" ]]; then
  echo 'Skipping outdated deployment: origin/main has a newer commit.'
  exit 0
fi

git merge --ff-only "$deploy_sha"
[[ "$(git rev-parse HEAD)" == "$deploy_sha" ]]

sudo -n docker compose config --quiet
sudo -n docker compose up -d --build --wait --wait-timeout 180
sudo -n docker compose ps
echo "Deployment completed: $deploy_sha"
