from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

from campfire_api.contexts.identity.domain.value_objects import Email


def validate_email(value: str) -> str:
    try:
        return Email(value).value
    except ValueError as exc:
        raise ValueError("invalid email") from exc


CampfireEmail = Annotated[str, AfterValidator(validate_email)]


class ErrorResponse(BaseModel):
    message: str


class PreferencesPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    instruments: list[str] = Field(default_factory=list)
    genres: list[str] = Field(default_factory=list)
    context: str | None = None
    goals: list[str] = Field(default_factory=list)
    experience: str | None = None


class RegisterRequest(BaseModel):
    email: CampfireEmail
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: CampfireEmail
    password: str


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: Literal["Bearer"] = "Bearer"
    expiresIn: int


class MeResponse(BaseModel):
    displayName: str
    email: CampfireEmail
    firstLogin: bool
    preferences: PreferencesPayload


class GoogleStubRequest(BaseModel):
    intent: Literal["sign-up", "sign-in"]
