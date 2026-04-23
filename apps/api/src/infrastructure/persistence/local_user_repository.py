from __future__ import annotations

from dataclasses import asdict
from datetime import datetime
from typing import Any

from botocore.exceptions import ClientError

from domain.user.models import LocalUser, LocalUserStatus
from domain.user.repository import LocalUserRepository


def _serialize_user(user: LocalUser) -> dict[str, Any]:
    data = asdict(user)
    data["status"] = user.status.value
    data["created_at"] = user.created_at.isoformat()
    data["updated_at"] = user.updated_at.isoformat()
    data["last_login_at"] = user.last_login_at.isoformat()
    data["pk"] = f"USER#{user.user_id}"
    data["sk"] = "PROFILE"
    data["gsi1pk"] = f"IDENTITY#{user.provider_name}#{user.provider_subject}"
    data["gsi1sk"] = "PROFILE"
    return data


def _deserialize_user(item: dict[str, Any]) -> LocalUser:
    return LocalUser(
        user_id=str(item["user_id"]),
        provider_name=str(item["provider_name"]),
        provider_subject=str(item["provider_subject"]),
        email=str(item["email"]),
        email_verified=bool(item["email_verified"]),
        display_name=str(item["display_name"]),
        status=LocalUserStatus(str(item["status"])),
        created_at=datetime.fromisoformat(str(item["created_at"])),
        updated_at=datetime.fromisoformat(str(item["updated_at"])),
        last_login_at=datetime.fromisoformat(str(item["last_login_at"])),
    )


class DynamoDbLocalUserRepository(LocalUserRepository):
    """DynamoDB adapter for the local user persistence port."""

    def __init__(self, table: Any) -> None:
        self._table = table

    def get_by_provider_identity(self, provider_name: str, provider_subject: str) -> LocalUser | None:
        response = self._table.query(
            IndexName="gsi1",
            KeyConditionExpression="gsi1pk = :identity and gsi1sk = :profile",
            ExpressionAttributeValues={
                ":identity": f"IDENTITY#{provider_name}#{provider_subject}",
                ":profile": "PROFILE",
            },
            Limit=1,
        )
        items = response.get("Items", [])

        if not items:
            return None

        return _deserialize_user(items[0])

    def create(self, user: LocalUser) -> LocalUser:
        item = _serialize_user(user)
        try:
            self._table.put_item(
                Item=item,
                ConditionExpression="attribute_not_exists(pk) AND attribute_not_exists(gsi1pk)",
            )
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") != "ConditionalCheckFailedException":
                raise

            existing = self.get_by_provider_identity(user.provider_name, user.provider_subject)
            if existing is None:
                raise
            return existing

        return user

    def update(self, user: LocalUser) -> LocalUser:
        self._table.put_item(Item=_serialize_user(user))
        return user
