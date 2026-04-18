"""Domain-level exceptions. Interfaces translate these to HTTP at the edge."""


class DomainError(Exception):
    """Base class for all domain-level errors."""


class NotAuthorizedUserError(DomainError):
    """Raised when a user is not in the authorized access list."""


class UserNotFoundError(DomainError):
    pass


class SongNotFoundError(DomainError):
    pass


class DuplicateRepertoireEntryError(DomainError):
    """Same (user, song, instrument) triple declared twice."""
