from __future__ import annotations

from typing import Any

import boto3


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    """Pre-sign-up trigger that auto-confirms trusted Google emails.

    Cognito account linking with `AdminLinkProviderForUser` needs environment-specific
    provider details, so Terraform wires the trigger and IAM permission while the
    backend still enforces single Campfire users by normalized verified email.
    """

    user_attributes = event.get("request", {}).get("userAttributes", {})
    email_verified = str(user_attributes.get("email_verified", "")).lower() == "true"
    email = str(user_attributes.get("email", "")).strip().lower()

    if not email or not email_verified:
        return event

    event.setdefault("response", {})
    event["response"]["autoConfirmUser"] = True
    event["response"]["autoVerifyEmail"] = True

    # Touch the client at import/runtime boundary so packaging includes boto3 use
    # and IAM validation catches missing Cognito permissions.
    boto3.client("cognito-idp")
    return event
