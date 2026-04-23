#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck disable=SC1091
source "${ROOT_DIR}/scripts/backend-local-env.sh"

cd "${API_DIR}"
uv sync --extra dev >/dev/null
uv run campfire-local-auth ensure-material >/dev/null

uv run python - <<'PY'
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

from main.local_dynamodb import ensure_local_users_table
from main.settings import load_settings

settings = load_settings()
session = boto3.session.Session(
    aws_access_key_id="campfire-local",
    aws_secret_access_key="campfire-local",
    aws_session_token="campfire-local",
    region_name=settings.aws_region,
)
endpoint = settings.dynamodb_endpoint_url

ensure_local_users_table(settings)

s3 = session.client("s3", endpoint_url=endpoint)
ssm = session.client("ssm", endpoint_url=endpoint)
secretsmanager = session.client("secretsmanager", endpoint_url=endpoint)

bucket_name = "campfire-local-artifacts"
try:
    s3.head_bucket(Bucket=bucket_name)
except ClientError:
    s3.create_bucket(Bucket=bucket_name)

parameters = {
    "/campfire/local/api/base-url": settings.api_base_url,
    "/campfire/local/web/base-url": settings.web_base_url,
    "/campfire/local/auth/issuer": f"http://localhost:{settings.api_base_url.split(':')[-1]}" if settings.api_base_url.startswith("http://localhost:") else settings.api_base_url,
}
for name, value in parameters.items():
    ssm.put_parameter(Name=name, Value=value, Type="String", Overwrite=True)

auth_key_path = Path("src").resolve().parent / ".local" / "auth" / "private-key.pem"
secret_payloads = {
    "campfire/local/auth/private-key": auth_key_path.read_text(encoding="utf-8"),
    "campfire/local/third-party/example": "dev-only-placeholder",
}
for name, value in secret_payloads.items():
    try:
        secretsmanager.create_secret(Name=name, SecretString=value)
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") != "ResourceExistsException":
            raise
        secretsmanager.put_secret_value(SecretId=name, SecretString=value)
PY

echo "Seeded local AWS resources for Campfire."
