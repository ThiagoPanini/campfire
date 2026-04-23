#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck disable=SC1091
source "${ROOT_DIR}/scripts/backend-local-env.sh"

cd "${API_DIR}"
uv sync --extra dev
uv run campfire-local-auth ensure-material >/dev/null
uv run campfire-local-dynamodb wait --timeout-seconds 30 >/dev/null
make -C "${ROOT_DIR}" seed >/dev/null
uv run campfire-local-server --host "${LOCAL_API_HOST}" --port "${LOCAL_API_PORT}"
