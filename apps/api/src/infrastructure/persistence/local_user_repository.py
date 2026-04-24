from __future__ import annotations

from dataclasses import asdict
from datetime import UTC, datetime
from typing import Any

from botocore.exceptions import ClientError

from domain.user.models import AuthenticationIdentityLink, LocalUser, LocalUserStatus, OnboardingStatus
from domain.user.repository import LocalUserRepository


def _serialize_user(user: LocalUser) -> dict[str, Any]:
    data = asdict(user)
    data["status"] = user.status.value
    data["onboarding_status"] = user.onboarding_status.value
    data["onboarding_completed_at"] = (
        user.onboarding_completed_at.isoformat() if user.onboarding_completed_at else None
    )
    data["onboarding_deferred_at"] = (
        user.onboarding_deferred_at.isoformat() if user.onboarding_deferred_at else None
    )
    data["created_at"] = user.created_at.isoformat()
    data["updated_at"] = user.updated_at.isoformat()
    data["last_login_at"] = user.last_login_at.isoformat()
    data["pk"] = f"USER#{user.user_id}"
    data["sk"] = "PROFILE"
    data["gsi1pk"] = f"EMAIL#{user.email_normalized}"
    data["gsi1sk"] = "PROFILE"
    return data


def _parse_optional_datetime(value: object) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(str(value))


def _deserialize_user(item: dict[str, Any]) -> LocalUser:
    email = str(item["email"])
    email_normalized = str(item.get("email_normalized") or email.strip().lower())
    return LocalUser(
        user_id=str(item["user_id"]),
        email=email,
        email_normalized=email_normalized,
        email_verified=bool(item["email_verified"]),
        display_name=str(item["display_name"]),
        status=LocalUserStatus(str(item["status"])),
        onboarding_status=OnboardingStatus(str(item.get("onboarding_status") or OnboardingStatus.REQUIRED.value)),
        onboarding_completed_at=_parse_optional_datetime(item.get("onboarding_completed_at")),
        onboarding_deferred_at=_parse_optional_datetime(item.get("onboarding_deferred_at")),
        created_at=datetime.fromisoformat(str(item["created_at"])),
        updated_at=datetime.fromisoformat(str(item["updated_at"])),
        last_login_at=datetime.fromisoformat(str(item["last_login_at"])),
    )


def _serialize_identity_link(link: AuthenticationIdentityLink) -> dict[str, Any]:
    data = asdict(link)
    data["linked_at"] = link.linked_at.isoformat()
    data["last_used_at"] = link.last_used_at.isoformat()
    data["pk"] = f"USER#{link.user_id}"
    data["sk"] = f"IDENTITY#{link.provider_name}#{link.provider_subject}"
    data["gsi2pk"] = f"IDENTITY#{link.provider_name}#{link.provider_subject}"
    data["gsi2sk"] = "USER"
    return data


class DynamoDbLocalUserRepository(LocalUserRepository):
    """DynamoDB adapter for the local user persistence port."""

    def __init__(self, table: Any) -> None:
        self._table = table

    def get_by_provider_identity(self, provider_name: str, provider_subject: str) -> LocalUser | None:
        response = self._table.query(
            IndexName="gsi2",
            KeyConditionExpression="gsi2pk = :identity and gsi2sk = :user",
            ExpressionAttributeValues={
                ":identity": f"IDENTITY#{provider_name}#{provider_subject}",
                ":user": "USER",
            },
            Limit=1,
        )
        items = response.get("Items", [])

        if not items:
            return None

        user_id = str(items[0]["user_id"])
        return self._get_by_user_id(user_id)

    def get_by_email(self, email_normalized: str) -> LocalUser | None:
        response = self._table.query(
            IndexName="gsi1",
            KeyConditionExpression="gsi1pk = :email and gsi1sk = :profile",
            ExpressionAttributeValues={
                ":email": f"EMAIL#{email_normalized}",
                ":profile": "PROFILE",
            },
            Limit=1,
        )
        items = response.get("Items", [])
        if not items:
            return None
        return _deserialize_user(items[0])

    def _get_by_user_id(self, user_id: str) -> LocalUser | None:
        response = self._table.get_item(Key={"pk": f"USER#{user_id}", "sk": "PROFILE"})
        item = response.get("Item")
        return _deserialize_user(item) if item else None

    def create(self, user: LocalUser) -> LocalUser:
        item = _serialize_user(user)
        try:
            self._table.put_item(
                Item=item,
                ConditionExpression="attribute_not_exists(pk)",
            )
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") != "ConditionalCheckFailedException":
                raise

            existing = self.get_by_email(user.email_normalized)
            if existing is None:
                raise
            return existing

        return user

    def create_identity_link(self, link: AuthenticationIdentityLink) -> None:
        try:
            self._table.put_item(
                Item=_serialize_identity_link(link),
                ConditionExpression="attribute_not_exists(pk) AND attribute_not_exists(sk)",
            )
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") != "ConditionalCheckFailedException":
                raise

    def update(self, user: LocalUser) -> LocalUser:
        self._table.put_item(Item=_serialize_user(user))
        return user

    def update_onboarding_state(self, user_id: str, status: OnboardingStatus) -> LocalUser:
        user = self._get_by_user_id(user_id)
        if user is None:
            raise LookupError("User not found.")
        now = datetime.now(UTC)
        updated = user.complete_onboarding(now) if status == OnboardingStatus.COMPLETED else user.defer_onboarding(now)
        return self.update(updated)
