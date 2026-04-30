#!/usr/bin/env bash
set -uo pipefail

url="${1:-}"
label="${2:-$url}"
attempts="${PROBE_MAX_ATTEMPTS:-12}"
sleep_seconds="${PROBE_SLEEP_SECONDS:-5}"
timeout_seconds="${PROBE_REQUEST_TIMEOUT:-5}"

if [[ -z "$url" ]]; then
  echo "::error::probe-url.sh requires a URL argument"
  exit 2
fi

if ! [[ "$attempts" =~ ^[0-9]+$ ]] || [[ "$attempts" -lt 1 ]]; then
  echo "::error::PROBE_MAX_ATTEMPTS must be a positive integer"
  exit 2
fi

if ! [[ "$sleep_seconds" =~ ^[0-9]+$ ]] || ! [[ "$timeout_seconds" =~ ^[0-9]+$ ]]; then
  echo "::error::probe sleep and timeout values must be non-negative integers"
  exit 2
fi

last_code="000"

for ((attempt = 1; attempt <= attempts; attempt++)); do
  code="$(
    curl --silent --output /dev/null \
      --max-time "$timeout_seconds" \
      --write-out "%{http_code}" \
      "$url" || true
  )"
  last_code="${code:-000}"

  if [[ "$last_code" =~ ^2[0-9][0-9]$ ]]; then
    message="${label}: healthy after ${attempt} attempt(s) (HTTP ${last_code})"
    echo "$message"
    if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
      echo "- PASS ${message}" >> "$GITHUB_STEP_SUMMARY"
    fi
    exit 0
  fi

  if [[ "$attempt" -lt "$attempts" ]]; then
    sleep "$sleep_seconds"
  fi
done

message="${label}: probe failed after ${attempts} attempt(s) (last HTTP ${last_code})"
echo "::error::${message}"
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  echo "- FAIL ${message}" >> "$GITHUB_STEP_SUMMARY"
fi
exit 1
