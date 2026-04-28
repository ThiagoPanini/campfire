from dataclasses import dataclass
from datetime import datetime

from campfire_api.contexts.identity.domain.value_objects import SessionFamilyId, SessionId


@dataclass(frozen=True)
class SessionRevoked:
    session_id: SessionId
    reason: str
    occurred_at: datetime


@dataclass(frozen=True)
class RefreshTokenReused:
    family_id: SessionFamilyId
    occurred_at: datetime
