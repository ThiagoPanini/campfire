#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
declare -a targets=(
  "test/backend/unit"
  "test/backend/integration"
  "test/backend/contract"
  "test/frontend/unit"
)

for target in "${targets[@]}"; do
  if make -C "${ROOT_DIR}" "${target}"; then
    echo "PASS ${target}"
  else
    echo "FAIL ${target}" >&2
    exit 1
  fi
done
