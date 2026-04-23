#!/usr/bin/env bash
set -euo pipefail

WEB_BASE_URL="${1:?web base url required}"
API_BASE_URL="${2:?api base url required}"

start_epoch="$(date +%s)"
health_status="$(curl -sS -o /tmp/campfire-health.json -w "%{http_code}" "${API_BASE_URL}/health")"
end_epoch="$(date +%s)"
duration_seconds="$((end_epoch - start_epoch))"

if [[ "${health_status}" != "200" ]]; then
  echo "Health check failed with status ${health_status}"
  cat /tmp/campfire-health.json
  exit 1
fi

echo "health_duration_seconds=${duration_seconds}"
echo "web_base_url=${WEB_BASE_URL}"
echo "api_base_url=${API_BASE_URL}"
echo "Smoke validation passed for ${API_BASE_URL}/health"
