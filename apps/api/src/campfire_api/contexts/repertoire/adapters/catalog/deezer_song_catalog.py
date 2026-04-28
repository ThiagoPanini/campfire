from __future__ import annotations

import httpx

from campfire_api.contexts.repertoire.domain.entities import SearchResult
from campfire_api.contexts.repertoire.domain.errors import (
    SongCatalogRateLimited,
    SongCatalogUnavailable,
)

PAGE_SIZE = 10


class DeezerSongCatalog:
    def __init__(self, base_url: str = "https://api.deezer.com") -> None:
        self._base_url = base_url.rstrip("/")

    async def search(self, query: str, page: int) -> tuple[list[SearchResult], bool]:
        index = (page - 1) * PAGE_SIZE
        url = f"{self._base_url}/search"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    url, params={"q": query, "index": index, "limit": PAGE_SIZE + 1}
                )
        except httpx.TransportError as exc:
            raise SongCatalogUnavailable("transport error") from exc

        if response.status_code == 429:
            raise SongCatalogRateLimited("Deezer rate limited")
        if response.status_code >= 500:
            raise SongCatalogUnavailable(f"Deezer error {response.status_code}")

        data = response.json()
        tracks = data.get("data", [])

        has_more = len(tracks) > PAGE_SIZE
        tracks = tracks[:PAGE_SIZE]

        results = [_track_to_result(t) for t in tracks]
        return results, has_more


def _parse_year(release_date: str | None) -> int | None:
    if not release_date:
        return None
    try:
        return int(release_date[:4])
    except (ValueError, TypeError):
        return None


def _track_to_result(track: dict) -> SearchResult:
    album = track.get("album") or {}
    return SearchResult(
        external_id=str(track["id"]),
        title=track.get("title", ""),
        artist=(track.get("artist") or {}).get("name", ""),
        album=album.get("title") or None,
        release_year=_parse_year(album.get("release_date")),
        cover_art_url=album.get("cover_medium") or None,
    )
