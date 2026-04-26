from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: Literal["Bearer"] = "Bearer"
    expiresIn: int


class MeResponse(BaseModel):
    displayName: str
    email: EmailStr
    firstLogin: bool
    preferences: PreferencesPayload


class GoogleStubRequest(BaseModel):
    intent: Literal["sign-up", "sign-in"]
