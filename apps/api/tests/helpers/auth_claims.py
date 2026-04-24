from __future__ import annotations

from domain.user.models import VerifiedIdentityClaims


def auth_claims(
    *,
    provider_name: str = "cognito",
    provider_subject: str = "subject-1",
    email: str = "ash@example.com",
    email_verified: bool = True,
    display_name: str = "Ash Rivera",
) -> VerifiedIdentityClaims:
    return VerifiedIdentityClaims(
        provider_name=provider_name,
        provider_subject=provider_subject,
        email=email,
        email_verified=email_verified,
        display_name=display_name,
    )
