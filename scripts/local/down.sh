#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck disable=SC1091
source "${ROOT_DIR}/scripts/backend-local-env.sh"

MOTO_PID_FILE="${API_DIR}/.local/moto-server.pid"
MOTO_LOG_FILE="${API_DIR}/.local/moto-server.log"

if [[ -f "${MOTO_PID_FILE}" ]]; then
  moto_pid="$(cat "${MOTO_PID_FILE}")"
  if kill -0 "${moto_pid}" >/dev/null 2>&1; then
    kill "${moto_pid}" >/dev/null 2>&1 || true
    wait "${moto_pid}" 2>/dev/null || true
    echo "Stopped Moto fallback."
  fi
  rm -f "${MOTO_PID_FILE}" "${MOTO_LOG_FILE}"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed; nothing to stop."
  exit 0
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose is not installed; nothing to stop."
  exit 0
fi

cd "${ROOT_DIR}"
docker compose -f docker-compose.backend.yml down -v --remove-orphans
