class IdentityError(Exception):
    pass


class InvalidCredentials(IdentityError):
    pass


class EmailAlreadyRegistered(IdentityError):
    pass


class RefreshTokenInvalid(IdentityError):
    pass


class RefreshTokenReused(IdentityError):
    pass


class RateLimited(IdentityError):
    def __init__(self, retry_after: int) -> None:
        super().__init__("rate limited")
        self.retry_after = retry_after


class GoogleStubDisabled(IdentityError):
    pass


class UnknownCatalogId(IdentityError):
    pass


class SessionRevokedError(IdentityError):
    pass
