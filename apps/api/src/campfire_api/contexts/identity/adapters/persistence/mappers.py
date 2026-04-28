from campfire_api.contexts.identity.adapters.persistence.models import (
    CredentialsRow,
    RefreshTokenRow,
    SessionRow,
    UserRow,
)
from campfire_api.contexts.identity.domain.entities import Credentials, RefreshToken, Session, User
from campfire_api.contexts.identity.domain.value_objects import (
    DisplayName,
    Email,
    HashedPassword,
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
