#!/usr/bin/env bash
set -uo pipefail

if [[ "$#" -eq 0 ]]; then
  echo "::error::preflight-secrets.sh requires at least one variable name"
  exit 2
fi

missing=()
for name in "$@"; do
  value="${!name:-}"
  if [[ -z "$value" ]]; then
    missing+=("$name")
  fi
done

if [[ "${#missing[@]}" -eq 0 ]]; then
  echo "All required ${PREFLIGHT_ENVIRONMENT:-environment} values are present."
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    echo "- PASS ${PREFLIGHT_ENVIRONMENT:-environment} preflight values present" >> "$GITHUB_STEP_SUMMARY"
  fi
  exit 0
fi

missing_csv="$(printf "%s, " "${missing[@]}")"
missing_csv="${missing_csv%, }"
if [[ "${PREFLIGHT_ENVIRONMENT:-}" == "production" ]]; then
  echo "::error::Production is not yet configured. Missing required: ${missing_csv}. See ${PREFLIGHT_DOCS_LINK:-docs/backend/ops/cicd.mdx#provisioning-production} for setup instructions."
else
  echo "::error::Missing required ${PREFLIGHT_ENVIRONMENT:-environment} values: ${missing_csv}."
fi

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  echo "- FAIL missing ${PREFLIGHT_ENVIRONMENT:-environment} values: ${missing_csv}" >> "$GITHUB_STEP_SUMMARY"
fi
exit 1
