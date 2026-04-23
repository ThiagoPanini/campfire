#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck disable=SC1091
source "${ROOT_DIR}/scripts/backend-local-env.sh"

cd "${API_DIR}"
uv sync --extra dev >/dev/null
uv run campfire-local-auth ensure-material >/dev/null

echo "Debugger ready: attach to ${LOCAL_API_HOST}:5678"
exec uv run python -m debugpy --listen 0.0.0.0:5678 --wait-for-client -m main.local_server --host "${LOCAL_API_HOST}" --port "${LOCAL_API_PORT}"
