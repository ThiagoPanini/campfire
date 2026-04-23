from __future__ import annotations

import argparse
from os import getenv
from time import monotonic, sleep

import boto3
from botocore.exceptions import ClientError

from main.settings import Settings, load_settings


def _build_dynamodb_resource(settings: Settings):
    if not settings.dynamodb_endpoint_url:
        raise RuntimeError("DYNAMODB_ENDPOINT_URL is required for local DynamoDB commands.")

    return boto3.resource(
        "dynamodb",
        endpoint_url=settings.dynamodb_endpoint_url,
        region_name=settings.aws_region,
    )


def wait_for_dynamodb(settings: Settings, *, timeout_seconds: float = 30.0) -> None:
    """Wait until the configured local DynamoDB endpoint can be reached."""

    deadline = monotonic() + timeout_seconds
    last_error: Exception | None = None

    while monotonic() < deadline:
        try:
            _build_dynamodb_resource(settings).meta.client.list_tables(Limit=1)
            return
        except Exception as error:  # pragma: no cover - exercised through polling
            last_error = error
            sleep(0.5)

    raise RuntimeError(f"Timed out waiting for DynamoDB at {settings.dynamodb_endpoint_url}.") from last_error


def ensure_local_users_table(settings: Settings, *, reset: bool = False) -> None:
    """Create the local users table used by the backend if it does not already exist."""

    resource = _build_dynamodb_resource(settings)
    client = resource.meta.client
    table_name = settings.local_users_table

    if reset:
        try:
            client.delete_table(TableName=table_name)
            resource.Table(table_name).wait_until_not_exists()
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") != "ResourceNotFoundException":
                raise

    try:
        client.describe_table(TableName=table_name)
        return
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") != "ResourceNotFoundException":
            raise

    try:
        resource.create_table(
            TableName=table_name,
            BillingMode="PAY_PER_REQUEST",
            KeySchema=[
                {"AttributeName": "pk", "KeyType": "HASH"},
                {"AttributeName": "sk", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "pk", "AttributeType": "S"},
                {"AttributeName": "sk", "AttributeType": "S"},
                {"AttributeName": "gsi1pk", "AttributeType": "S"},
                {"AttributeName": "gsi1sk", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "gsi1",
                    "KeySchema": [
                        {"AttributeName": "gsi1pk", "KeyType": "HASH"},
                        {"AttributeName": "gsi1sk", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
        )
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") != "ResourceInUseException":
            raise

    resource.Table(table_name).wait_until_exists()


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage the Campfire local DynamoDB table.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    wait_parser = subparsers.add_parser("wait", help="Wait until the local DynamoDB endpoint is reachable.")
    wait_parser.add_argument(
        "--timeout-seconds",
        type=float,
        default=float(getenv("LOCAL_DYNAMODB_WAIT_TIMEOUT_SECONDS", "30")),
        help="Maximum wait time before failing.",
    )

    ensure_parser = subparsers.add_parser("ensure-table", help="Create the Campfire local users table if missing.")
    ensure_parser.add_argument("--reset", action="store_true", help="Delete and recreate the table before use.")
    return parser


def main() -> None:
    """CLI entry point for local DynamoDB utilities."""

    parser = _build_parser()
    args = parser.parse_args()
    settings = load_settings()

    if args.command == "wait":
        wait_for_dynamodb(settings, timeout_seconds=args.timeout_seconds)
        print(settings.dynamodb_endpoint_url)
        return

    if args.command == "ensure-table":
        ensure_local_users_table(settings, reset=args.reset)
        print(settings.local_users_table)
        return

    parser.error(f"Unsupported command: {args.command}")


if __name__ == "__main__":
    main()
