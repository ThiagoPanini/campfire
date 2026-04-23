#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck disable=SC1091
source "${ROOT_DIR}/scripts/backend-local-env.sh"

cd "${API_DIR}"
uv sync --extra dev >/dev/null 2>&1
uv run campfire-local-auth issue "$@"
