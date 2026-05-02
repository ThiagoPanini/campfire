class IdentityError(Exception):
    pass


class InvalidCredentials(IdentityError):
    pass


class EmailAlreadyRegistered(IdentityError):
    pass


class InvalidRegistration(IdentityError):
    pass


class OriginNotAllowed(IdentityError):
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


class GoogleSignInUnavailable(IdentityError):
    pass


class GoogleSignInFailed(IdentityError):
    pass


class ConfirmationCodeInvalid(IdentityError):
    pass


class ConfirmationCodeExpired(IdentityError):
    pass


class ConfirmationAttemptsExceeded(IdentityError):
    pass


class ConfirmationResendCooldown(IdentityError):
    def __init__(self, retry_after: int) -> None:
        super().__init__("confirmation resend cooldown")
        self.retry_after = retry_after


class EmailNotConfirmed(IdentityError):
    pass


class UnknownCatalogId(IdentityError):
    pass


class SessionRevokedError(IdentityError):
    pass
