from campfire_api.contexts.identity.adapters.persistence.models import (
    CredentialsRow,
    EmailConfirmationRow,
    OAuthFlowStateRow,
    ProviderLinkRow,
    RefreshTokenRow,
    SessionRow,
    UserRow,
)
from campfire_api.contexts.identity.domain.entities import (
    Credentials,
    EmailConfirmation,
    OAuthFlowState,
    ProviderLink,
    RefreshToken,
    Session,
    User,
)
from campfire_api.contexts.identity.domain.value_objects import (
    DisplayName,
    Email,
    HashedPassword,
    ProviderSubject,
    RefreshTokenId,
    SessionFamilyId,
    SessionId,
    UserId,
)


def user_from_row(row: UserRow) -> User:
    return User(
        id=UserId(row.id),
        email=Email(row.email),
        display_name=DisplayName(row.display_name),
        created_at=row.created_at,
        updated_at=row.updated_at,
        email_confirmed_at=row.email_confirmed_at,
    )


def provider_link_from_row(row: ProviderLinkRow) -> ProviderLink:
    return ProviderLink(
        id=UserId(row.id),
        user_id=UserId(row.user_id),
        provider=row.provider,
        subject=ProviderSubject(row.subject),
        email_at_link=Email(row.email_at_link),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def email_confirmation_from_row(row: EmailConfirmationRow) -> EmailConfirmation:
    return EmailConfirmation(
        id=UserId(row.id),
        user_id=UserId(row.user_id),
        email=Email(row.email),
        code_hash=row.code_hash,
        created_at=row.created_at,
        expires_at=row.expires_at,
        attempt_count=row.attempt_count,
        resend_count=row.resend_count,
        last_resent_at=row.last_resent_at,
        status=row.status,
        invalidated_reason=row.invalidated_reason,
    )


def oauth_flow_state_from_row(row: OAuthFlowStateRow) -> OAuthFlowState:
    return OAuthFlowState(
        id=UserId(row.id),
        state_token_hash=row.state_token_hash,
        pkce_verifier=row.pkce_verifier,
        nonce_hash=row.nonce_hash,
        intent=row.intent,
        return_to=row.return_to,
        created_at=row.created_at,
        expires_at=row.expires_at,
        consumed_at=row.consumed_at,
        consumed_reason=row.consumed_reason,
    )


def credentials_from_row(row: CredentialsRow) -> Credentials:
    return Credentials(
        user_id=UserId(row.user_id),
        password_hash=HashedPassword(row.password_hash),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def session_from_row(row: SessionRow) -> Session:
    return Session(
        id=SessionId(row.id),
        user_id=UserId(row.user_id),
        family_id=SessionFamilyId(row.family_id),
        access_token_fingerprint=row.access_token_fingerprint,
        access_token_expires_at=row.access_token_expires_at,
        created_at=row.created_at,
        last_seen_at=row.last_seen_at,
        revoked_at=row.revoked_at,
        revoked_reason=row.revoked_reason,
    )


def refresh_token_from_row(row: RefreshTokenRow) -> RefreshToken:
    return RefreshToken(
        id=RefreshTokenId(row.id),
        session_id=SessionId(row.session_id),
        family_id=SessionFamilyId(row.family_id),
        user_id=UserId(row.user_id),
        token_fingerprint=row.token_fingerprint,
        issued_at=row.issued_at,
        expires_at=row.expires_at,
        consumed_at=row.consumed_at,
        revoked_at=row.revoked_at,
        revoked_reason=row.revoked_reason,
    )
