# ADR-0007 — External music catalog provider

**Status**: Accepted
**Date**: 2026-04-27
**Slice**: `003-repertoire-song-entry`
**Supersedes**: —
**Superseded by**: —

## Context

Spec 003 requires a song search backed by an external music catalog
(FR-002). The catalog must:

- Return at minimum title and primary artist (FR-002).
- Carry a stable external identifier we can persist (FR-004).
- Provide title, artist, album, release year, and cover art URL at
  add-time (FR-013).
- Be reachable without an OAuth credential rotation story (this slice
  has no secrets infrastructure yet — the infrastructure slice is
  later in the build sequence per constitution Principle II).
- Tolerate paginated `?index=&limit=10`-style access (FR-002).

## Decision

Use the **Deezer public Search API** at
`GET https://api.deezer.com/search?q=…&index=…&limit=…` for v1.

The whole integration lives behind a `SongCatalogPort` Protocol in
`repertoire.domain.ports`. The implementation
(`DeezerSongCatalog`) is the only file that imports `httpx` and the
only file that mentions Deezer.

## Alternatives considered

| Provider | Verdict | Reason |
|---|---|---|
| **MusicBrainz** | Rejected | Cover art lives in a separate Cover Art Archive call. Tight 1 req/s limit. FR-013's six-field payload would need two upstream calls per result. |
| **Spotify Web API** | Rejected | Requires OAuth client credentials; needs a secrets-rotation story we don't have. ToS friction around metadata storage. |
| **Apple Music API** | Rejected | Developer token signed with a private key; rotation problem. |
| **iTunes Search API** | Rejected (kept as fallback) | No key, decent metadata, but cover-art URLs are small (`artworkUrl60`–`100`) and require URL rewriting. Solid fallback if Deezer's terms change. |
| **Last.fm** | Rejected | Track search is keyed on `artist + title`, no opaque stable ID. Violates FR-004. |
| **Build our own** | Rejected | YAGNI; not in scope. |

## Consequences

**Positive**
- Zero secrets surface — no API key, no OAuth flow.
- One upstream call per search page; CPU and memory profile is
  trivial for the dev-machine target.
- Provider-agnostic shape on our wire (we expose `SearchResult`, not
  Deezer's response). Swapping providers is one adapter file.

**Negative**
- We're tied to a public free service whose ToS may change. Mitigated
  by the port abstraction and the documented fallback (iTunes Search).
- Release year sometimes absent from search payloads. Mitigated by
  making `song_release_year` nullable (data-model.md).
- No SLA. The frontend's "search temporarily unavailable" state and
  the spec's FR-014 are load-bearing.

## Migration plan if Deezer is no longer viable

1. Implement a sibling adapter (`itunes_song_catalog.py`) against the
   chosen replacement.
2. Update the FastAPI dep override in `repertoire/adapters/http/deps.py`
   and the `SettingsProvider` env var contract.
3. Existing rows in `repertoire_entries` keep their Deezer-stamped
   `song_external_id` forever — they remain readable because all
   render-time fields are denormalized on the row (FR-013). New rows
   get the new provider's IDs.
4. No domain or use-case changes.
