from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SearchResultResponse(BaseModel):
    external_id: str = Field(alias="externalId")
    title: str
    artist: str
    album: str | None = None
    release_year: int | None = Field(default=None, alias="releaseYear")
    cover_art_url: str | None = Field(default=None, alias="coverArtUrl")

    model_config = {"populate_by_name": True}


class SearchResponse(BaseModel):
    results: list[SearchResultResponse]
    page: int
    has_more: bool = Field(alias="hasMore")

    model_config = {"populate_by_name": True}


class EntryResponse(BaseModel):
    id: UUID
    song_external_id: str = Field(alias="songExternalId")
    song_title: str = Field(alias="songTitle")
    song_artist: str = Field(alias="songArtist")
    song_album: str | None = Field(default=None, alias="songAlbum")
    song_release_year: int | None = Field(default=None, alias="songReleaseYear")
    song_cover_art_url: str | None = Field(default=None, alias="songCoverArtUrl")
    instrument: str
    proficiency: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = {"populate_by_name": True}


class EntryListResponse(BaseModel):
    entries: list[EntryResponse]


class EntryCreateRequest(BaseModel):
    song_external_id: str = Field(alias="songExternalId")
    song_title: str = Field(alias="songTitle")
    song_artist: str = Field(alias="songArtist")
    song_album: str | None = Field(default=None, alias="songAlbum")
    song_release_year: int | None = Field(default=None, alias="songReleaseYear")
    song_cover_art_url: str | None = Field(default=None, alias="songCoverArtUrl")
    instrument: str
    proficiency: str

    model_config = {"populate_by_name": True}


class EntryUpdateRequest(BaseModel):
    proficiency: str


class ErrorResponse(BaseModel):
    message: str
