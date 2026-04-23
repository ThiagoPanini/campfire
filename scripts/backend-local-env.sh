#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="${ROOT_DIR}/apps/api"
LOCAL_ENV_FILE="${API_DIR}/.env.local"

if [[ -f "${LOCAL_ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${LOCAL_ENV_FILE}"
  set +a
fi

export APP_NAME="${APP_NAME:-campfire-api}"
export APP_ENV="${APP_ENV:-local}"
export AWS_REGION="${AWS_REGION:-us-east-1}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-campfire-local}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-campfire-local}"
export AWS_SESSION_TOKEN="${AWS_SESSION_TOKEN:-campfire-local}"
export AWS_EC2_METADATA_DISABLED="${AWS_EC2_METADATA_DISABLED:-true}"
export DYNAMODB_ENDPOINT_URL="${DYNAMODB_ENDPOINT_URL:-http://localhost:4566}"
export LOCAL_USERS_TABLE="${LOCAL_USERS_TABLE:-campfire-local-users}"
export WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:5173}"
export API_BASE_URL="${API_BASE_URL:-http://localhost:8010}"
export USER_POOL_ID="${USER_POOL_ID:-local-user-pool}"
export USER_POOL_CLIENT_ID="${USER_POOL_CLIENT_ID:-campfire-web}"
export USER_POOL_DOMAIN="${USER_POOL_DOMAIN:-localhost}"
export LOCAL_API_HOST="${LOCAL_API_HOST:-127.0.0.1}"
export LOCAL_API_PORT="${LOCAL_API_PORT:-8010}"
export LOCAL_API_ALLOW_ORIGIN="${LOCAL_API_ALLOW_ORIGIN:-*}"
export LOCAL_AUTH_ISSUER="${LOCAL_AUTH_ISSUER:-http://localhost:${LOCAL_API_PORT}}"
export LOCAL_AUTH_AUDIENCE="${LOCAL_AUTH_AUDIENCE:-${USER_POOL_CLIENT_ID}}"
export LOCAL_AUTH_KID="${LOCAL_AUTH_KID:-campfire-local-dev}"
export LOCAL_AUTH_PRIVATE_KEY_PATH="${LOCAL_AUTH_PRIVATE_KEY_PATH:-${API_DIR}/.local/auth/private-key.pem}"
export LOCAL_AUTH_JWKS_PATH="${LOCAL_AUTH_JWKS_PATH:-${API_DIR}/.local/auth/jwks.json}"
export PYTHONUNBUFFERED=1
