from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, Field

from campfire_api.contexts.identity.domain.value_objects import Email


def validate_email(value: str) -> str:
    try:
        return Email(value).value
    except ValueError as exc:
        raise ValueError("invalid email") from exc


CampfireEmail = Annotated[str, AfterValidator(validate_email)]


class ErrorResponse(BaseModel):
    message: str


class RegisterRequest(BaseModel):
    email: CampfireEmail
    password: str = Field(min_length=10)


class LoginRequest(BaseModel):
    email: CampfireEmail
    password: str


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: Literal["Bearer"] = "Bearer"
    expiresIn: int


class ConfirmationRequiredResponse(BaseModel):
    status: Literal["confirmation_required"] = "confirmation_required"
    expiresInSeconds: int | None = None
    resendCooldownSeconds: int | None = None


class ConfirmResendResponse(BaseModel):
    status: Literal["accepted"] = "accepted"
    expiresInSeconds: int | None = None
    resendCooldownSeconds: int | None = None


class ConfirmRequest(BaseModel):
    email: CampfireEmail
    code: str = Field(pattern=r"^\d{6}$")


class ConfirmResendRequest(BaseModel):
    email: CampfireEmail


class MeResponse(BaseModel):
    displayName: str
    email: CampfireEmail


class GoogleStubRequest(BaseModel):
    intent: Literal["sign-up", "sign-in"]


class GoogleStartRequest(BaseModel):
    intent: Literal["sign-up", "sign-in"]
    next: str | None = None


class GoogleStartResponse(BaseModel):
    authorizeUrl: str


class GoogleConfig(BaseModel):
    enabled: bool


class PasswordSignUpConfig(BaseModel):
    enabled: bool = True
    requiresEmailConfirmation: bool


class AuthConfigResponse(BaseModel):
    google: GoogleConfig
    passwordSignUp: PasswordSignUpConfig
