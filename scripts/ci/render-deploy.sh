#!/usr/bin/env bash
set -uo pipefail

environment_name="${1:-}"
service_name="${2:-}"
hook_url="${HOOK_URL:-}"

if [[ -z "$environment_name" || -z "$service_name" ]]; then
  echo "::error::render-deploy.sh requires environment and service arguments"
  exit 2
fi

if [[ -z "$hook_url" ]]; then
  echo "::error::missing deploy hook for ${environment_name} ${service_name}"
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    echo "- FAIL deploy hook for ${environment_name} ${service_name}: missing hook" >> "$GITHUB_STEP_SUMMARY"
  fi
  exit 2
fi

http_code="$(
  curl --silent --show-error \
    --request POST \
    --max-time 30 \
    --output /dev/null \
    --write-out "%{http_code}" \
    "$hook_url" || true
)"
http_code="${http_code:-000}"

if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
  echo "Deploy hook for ${environment_name} ${service_name} accepted (HTTP ${http_code})."
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    echo "- PASS deploy hook for ${environment_name} ${service_name} (HTTP ${http_code})" >> "$GITHUB_STEP_SUMMARY"
  fi
  exit 0
fi

echo "::error::Deploy hook for ${environment_name} ${service_name} failed (HTTP ${http_code})."
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  echo "- FAIL deploy hook for ${environment_name} ${service_name} (HTTP ${http_code})" >> "$GITHUB_STEP_SUMMARY"
fi
exit 1
