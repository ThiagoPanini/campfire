#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${AWS_WEB_IDENTITY_TOKEN_FILE:-}" ]]; then
  echo "OIDC token is unavailable. Refusing to continue without AWS_WEB_IDENTITY_TOKEN_FILE." >&2
  exit 1
fi

echo "OIDC token file detected."
