"""HTTP request/response schemas. Intentionally separate from application DTOs."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    version: str


class RegisterRepertoireEntryRequest(BaseModel):
    song_title: str = Field(min_length=1)
    song_artist: str = Field(min_length=1)
    instrument: str = Field(min_length=1)
    proficiency: int = Field(ge=0, le=10)


class RepertoireEntryResponse(BaseModel):
    entry_id: UUID
    user_id: UUID
    song_id: UUID
    song_title: str
    song_artist: str
    instrument: str
    proficiency: int
    proficiency_label: str


class SongSearchItemResponse(BaseModel):
    title: str
    artist: str
    source: str
    external_id: str | None = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    display_name: str
