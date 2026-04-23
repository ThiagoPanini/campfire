#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck disable=SC1091
source "${ROOT_DIR}/scripts/backend-local-env.sh"

API_URL="${API_BASE_URL}"
WEB_URL=""

while (($#)); do
  case "$1" in
    --api-url)
      API_URL="$2"
      shift 2
      ;;
    --web-url)
      WEB_URL="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

curl --silent --show-error --fail "${API_URL%/}/health" >/dev/null
curl --silent --show-error --fail "${API_URL%/}/.well-known/jwks.json" >/dev/null

if [[ -n "${WEB_URL}" ]]; then
  curl --silent --show-error --fail "${WEB_URL%/}" >/dev/null
fi

echo "Smoke probes passed."
