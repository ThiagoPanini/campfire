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


class RepertoireEntryResponse(BaseModel):
    entry_id: UUID
    user_id: UUID
    song_id: UUID
    song_title: str
    song_artist: str
    instrument: str


class PossibleSongResponse(BaseModel):
    song_id: UUID
    song_title: str
    song_artist: str
    supporters: dict[UUID, list[str]]


class PossibleRepertoireRequest(BaseModel):
    present_user_ids: list[UUID] = Field(min_length=1)


class UserResponse(BaseModel):
    id: UUID
    email: str
    display_name: str
