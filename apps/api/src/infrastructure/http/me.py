from __future__ import annotations

from collections.abc import Mapping

from application.user_context.service import GetOrBootstrapLocalUser, InvalidIdentityClaimsError
from infrastructure.auth.claims import ClaimsMappingError, map_verified_claims


def me_response(claims_payload: Mapping[str, object], use_case: GetOrBootstrapLocalUser) -> dict[str, object]:
    """Resolve the authenticated Campfire bootstrap identity response."""

    try:
        claims = map_verified_claims(claims_payload)
        result = use_case.execute(claims)
    except (ClaimsMappingError, InvalidIdentityClaimsError) as error:
        raise PermissionError(str(error)) from error

    return result.to_response()
