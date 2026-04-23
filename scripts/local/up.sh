#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck disable=SC1091
source "${ROOT_DIR}/scripts/backend-local-env.sh"

MOTO_PID_FILE="${API_DIR}/.local/moto-server.pid"
MOTO_LOG_FILE="${API_DIR}/.local/moto-server.log"
LOCALSTACK_AUTH_FILE="${HOME}/.localstack/auth.json"

load_localstack_auth() {
  if [[ -n "${LOCALSTACK_AUTH_TOKEN:-}" ]]; then
    export LOCALSTACK_DOCKER_IMAGE="${LOCALSTACK_DOCKER_IMAGE:-localstack/localstack-pro:latest}"
    return
  fi

  if [[ ! -f "${LOCALSTACK_AUTH_FILE}" ]]; then
    return
  fi

  local token=""
  token="$(
    python3 - "${LOCALSTACK_AUTH_FILE}" <<'PY'
import json
import sys
from pathlib import Path

data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
print(data.get("LOCALSTACK_AUTH_TOKEN", ""))
PY
  )"

  if [[ -n "${token}" ]]; then
    export LOCALSTACK_AUTH_TOKEN="${token}"
    export LOCALSTACK_DOCKER_IMAGE="${LOCALSTACK_DOCKER_IMAGE:-localstack/localstack-pro:latest}"
  fi
}

docker_available() {
  command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1
}

localstack_health_url="${DYNAMODB_ENDPOINT_URL%/}/_localstack/health"

emulator_ready() {
  (
    cd "${API_DIR}"
    uv run campfire-local-dynamodb wait --timeout-seconds 1 >/dev/null 2>&1
  )
}

start_moto() {
  mkdir -p "$(dirname "${MOTO_PID_FILE}")"

  if [[ -f "${MOTO_PID_FILE}" ]]; then
    existing_pid="$(cat "${MOTO_PID_FILE}")"
    if kill -0 "${existing_pid}" >/dev/null 2>&1; then
      echo "Moto is already running at ${DYNAMODB_ENDPOINT_URL}."
      return
    fi
    rm -f "${MOTO_PID_FILE}"
  fi

  mapfile -t endpoint_parts < <(
    python3 - <<'PY'
from os import environ
from urllib.parse import urlparse

parsed = urlparse(environ["DYNAMODB_ENDPOINT_URL"])
print(parsed.hostname or "127.0.0.1")
print(parsed.port or (443 if parsed.scheme == "https" else 80))
PY
  )
  local host="${endpoint_parts[0]}"
  local port="${endpoint_parts[1]}"

  setsid bash -lc "cd '${API_DIR}' && exec uv run moto_server -H '${host}' -p '${port}'" >"${MOTO_LOG_FILE}" 2>&1 < /dev/null &
  echo "$!" >"${MOTO_PID_FILE}"
}

"${ROOT_DIR}/scripts/local/doctor.sh" --check=uv >/dev/null
"${ROOT_DIR}/scripts/local/doctor.sh" --check=python >/dev/null
"${ROOT_DIR}/scripts/local/doctor.sh" --check=port-4566 >/dev/null 2>&1 || {
  if curl --silent --fail "${localstack_health_url}" >/dev/null 2>&1; then
    echo "LocalStack is already responding at ${DYNAMODB_ENDPOINT_URL}."
    make -C "${ROOT_DIR}" seed
    exit 0
  fi

  (
    cd "${API_DIR}"
    uv sync --extra dev >/dev/null
  )

  if emulator_ready; then
    echo "Local AWS emulator is already responding at ${DYNAMODB_ENDPOINT_URL}."
    make -C "${ROOT_DIR}" seed
    exit 0
  fi

  echo "Port 4566 is already in use by another process." >&2
  exit 1
}

(
  cd "${API_DIR}"
  uv sync --extra dev >/dev/null
)

if docker_available; then
  load_localstack_auth
  cd "${ROOT_DIR}"
  docker compose -f docker-compose.backend.yml up -d localstack

  deadline=$((SECONDS + 60))
  while (( SECONDS < deadline )); do
    if curl --silent --fail "${localstack_health_url}" >/tmp/campfire-localstack-health.json 2>/dev/null; then
      if python3 - <<'PY'
import json
from pathlib import Path

payload = json.loads(Path("/tmp/campfire-localstack-health.json").read_text(encoding="utf-8"))
services = payload.get("services", {})
required = {"dynamodb", "sts", "ssm", "secretsmanager", "s3", "logs"}
healthy_states = {"running", "available"}
raise SystemExit(0 if all(services.get(name) in healthy_states for name in required) else 1)
PY
      then
        rm -f /tmp/campfire-localstack-health.json
        make -C "${ROOT_DIR}" seed
        echo "LocalStack is ready at ${DYNAMODB_ENDPOINT_URL}"
        exit 0
      fi
    fi
    sleep 2
  done

  rm -f /tmp/campfire-localstack-health.json
  echo "Timed out waiting for LocalStack services to report healthy at ${DYNAMODB_ENDPOINT_URL}. Re-run 'make up' after checking docker compose logs." >&2
  exit 1
fi

start_moto

deadline=$((SECONDS + 60))
while (( SECONDS < deadline )); do
  if emulator_ready; then
    make -C "${ROOT_DIR}" seed
    echo "Moto fallback is ready at ${DYNAMODB_ENDPOINT_URL}"
    exit 0
  fi
  sleep 2
done

echo "Timed out waiting for Moto to report ready at ${DYNAMODB_ENDPOINT_URL}. Check ${MOTO_LOG_FILE}." >&2
exit 1
