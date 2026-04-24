from __future__ import annotations

from collections.abc import Mapping

from domain.user.models import VerifiedIdentityClaims


class ClaimsMappingError(ValueError):
    """Raised when API Gateway did not forward the required claims."""


def _to_bool(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() == "true"
    return False


def map_verified_claims(claims: Mapping[str, object]) -> VerifiedIdentityClaims:
    """Map API Gateway JWT claims into the application input model."""

    provider_subject = str(claims.get("sub") or "").strip()
    email = str(claims.get("email") or "").strip()
    email_verified = _to_bool(claims.get("email_verified"))
    provider_name = str(
        claims.get("identity_provider")
        or claims.get("provider")
        or claims.get("cognito:identity_provider")
        or "cognito"
    ).strip().lower()

    if not provider_subject:
        raise ClaimsMappingError("Missing subject claim.")

    if not email:
        raise ClaimsMappingError("Missing email claim.")

    return VerifiedIdentityClaims(
        provider_name=provider_name or "cognito",
        provider_subject=provider_subject,
        email=email.lower(),
        email_verified=email_verified,
        display_name=str(claims.get("name") or claims.get("cognito:username") or email).strip(),
    )
