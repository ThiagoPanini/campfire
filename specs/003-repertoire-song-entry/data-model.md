# Data Model — Repertoire Slice

**Feature**: `003-repertoire-song-entry`
**Bounded context**: `repertoire`
**Engine**: PostgreSQL 16, accessed via SQLAlchemy 2.x async + asyncpg.

This document defines the persistent state for the repertoire slice. It
is the source of truth for migration `0003_repertoire_initial`. The
slice introduces **one** new table (`repertoire_entries`); no other
schema changes.

## Conventions (inherited from identity slice — no drift)

- **Primary keys**: UUID v7 via `uuid_utils` (v4 fallback). Generated
  application-side. No Postgres extensions.
- **Timestamps**: `TIMESTAMPTZ`, always UTC. Set application-side via
  the `Clock` port for testability.
- **No soft delete** — FR-010 is hard delete, matches identity's
  posture for non-session rows.
- **Constraints first** — every business rule expressible as a
  table-level constraint is one (`UNIQUE`, `CHECK`, `FOREIGN KEY`).
- **No session-scoped Postgres state** (no `LISTEN/NOTIFY`, no advisory
  locks).
- **Catalog vocabularies are validated application-side**, not by DB
  CHECKs — same posture as `preferences.instruments` in the identity
  slice. Single source of truth lives in
  `campfire_api.shared.catalogs.INSTRUMENTS` (instruments) and
  `repertoire.domain.value_objects.PROFICIENCY_LEVELS` (proficiency).

---

## Entity: RepertoireEntry

**Purpose**: ties one User to one Song (by stable external catalog ID)
with a chosen Instrument and a chosen Proficiency Level. Owned by
exactly one user. Uniquely identified by
`(user_id, song_external_id, instrument)`. Carries the catalog
metadata captured at add-time as denormalized columns (FR-013) so
that the entry remains viewable when the catalog is unreachable or
removes the song.

**Domain attributes** (entity, framework-free):

| Field | Type | Notes |
|---|---|---|
| `id` | `RepertoireEntryId` (UUID v7) | Generated application-side. |
| `user_id` | `UserId` (UUID) | Owning user. Cross-context — value-object only. |
| `song_external_id` | `SongExternalId` (str, 1–128 chars) | Stable catalog ID (FR-004). String-typed; the value happens to be numeric for Deezer but no caller assumes that. |
| `song_title` | `str` (1–256 chars) | Captured at add-time (FR-013). |
| `song_artist` | `str` (1–256 chars) | Primary artist's display name. |
| `song_album` | `str \| None` (0–256 chars) | Nullable; some catalogs omit. |
| `song_release_year` | `int \| None` | 1900–2100 sanity range; nullable when catalog omits (research R1). |
| `song_cover_art_url` | `str \| None` (0–2048 chars) | Reference only; never proxied. Nullable when catalog has no art. |
| `instrument` | `Instrument` (str, validated against `campfire_api.shared.catalogs.INSTRUMENTS`) | FR-005. |
| `proficiency` | `ProficiencyLevel` (Literal `learning` / `practicing` / `ready`) | FR-006. |
| `created_at` | `datetime` (UTC) | Set application-side via `Clock`. |
| `updated_at` | `datetime` (UTC) | Bumped on `update_proficiency` and on the duplicate-add → update path (FR-008). |

**Domain invariants** (enforced in the entity / value-object
constructors and re-checked in the use case):
- `song_external_id` non-empty after strip; ≤ 128 chars.
- `song_title` non-empty after strip; ≤ 256 chars.
- `song_artist` non-empty after strip; ≤ 256 chars.
- `instrument ∈ INSTRUMENTS`.
- `proficiency ∈ {"learning", "practicing", "ready"}`.
- `(user_id, song_external_id, instrument)` is unique within the
  repertoire of a single user (FR-007 / FR-008 / SC-005).

---

## Table `repertoire_entries`

| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES users(id) ON DELETE CASCADE` |
| `song_external_id` | `TEXT` | `NOT NULL`, `CHECK (length(song_external_id) BETWEEN 1 AND 128)` |
| `song_title` | `TEXT` | `NOT NULL`, `CHECK (length(song_title) BETWEEN 1 AND 256)` |
| `song_artist` | `TEXT` | `NOT NULL`, `CHECK (length(song_artist) BETWEEN 1 AND 256)` |
| `song_album` | `TEXT` | nullable, `CHECK (song_album IS NULL OR length(song_album) BETWEEN 1 AND 256)` |
| `song_release_year` | `INTEGER` | nullable, `CHECK (song_release_year IS NULL OR song_release_year BETWEEN 1900 AND 2100)` |
| `song_cover_art_url` | `TEXT` | nullable, `CHECK (song_cover_art_url IS NULL OR length(song_cover_art_url) BETWEEN 1 AND 2048)` |
| `instrument` | `TEXT` | `NOT NULL`, `CHECK (length(instrument) BETWEEN 1 AND 64)` |
| `proficiency` | `TEXT` | `NOT NULL`, `CHECK (proficiency IN ('learning','practicing','ready'))` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` |

**Indexes**:
- `repertoire_entries_pkey` on `(id)` (implicit).
- `ux_repertoire_entries_user_song_instrument` `UNIQUE` on
  `(user_id, song_external_id, instrument)` — last-line defense for
  FR-008 / SC-005 against the double-submit edge case. The
  `add_or_update_entry` use case handles the duplicate at the
  application layer via a `SELECT … FOR UPDATE`-equivalent read
  inside the request transaction; the unique index makes the race
  fail closed instead of inserting a duplicate.
- `ix_repertoire_entries_user_recent` on
  `(user_id, created_at DESC)` — supports FR-009 list rendering
  ("entries for this user, most recent first") with a single index
  scan.

**Why no DB-level CHECK on `instrument`**: identity's
`preferences.instruments` is `JSONB` without a CHECK against the
catalog set; the domain validates application-side. Mirroring that
posture keeps the catalog single-source (one `frozenset[str]`) — a
DB CHECK would have to be regenerated whenever the catalog changes,
which is not how identity manages it.

**Why no FK to a `songs` table**: there isn't one. See
[research.md §R3](./research.md#r3-songs-aggregate-vs-denormalize-at-add-time)
and [adr/0008-no-songs-aggregate-yet.md](./adr/0008-no-songs-aggregate-yet.md).

**FK `ON DELETE CASCADE`**: when a user is hard-deleted from the
identity context (no path exists for that today, but the table
should be self-consistent if it ever lands), their repertoire
entries go with them. This matches how identity's `preferences`,
`credentials`, `sessions`, and `refresh_tokens` cascade.

---

## Lifecycle

- **Create**: `add_or_update_entry` use case. The application reads
  the existing `(user_id, song_external_id, instrument)` row inside
  the request transaction. If absent → INSERT. If present → UPDATE
  `proficiency` and `updated_at`, leave `created_at` alone (FR-008).
  The unique index makes this race-safe under concurrent submit.
- **Read (list)**: `list_my_entries` use case. `SELECT … WHERE
  user_id = :uid ORDER BY created_at DESC`. Uses the helper index.
- **Update (proficiency)**: `update_proficiency` use case. Loads the
  entry, asserts `entry.user_id == auth.user_id` (FR-012); raises
  `EntryNotFound` if the row is owned by someone else (don't leak
  existence — same posture as identity slice's "user not found").
  Updates `proficiency` and `updated_at`.
- **Delete**: `remove_entry` use case. Same ownership check, then
  `DELETE`. Hard delete (FR-010); re-adding the same combo creates a
  new row with fresh `created_at` / `updated_at`.

---

## Cross-context dependencies

- **Inbound**: none. Identity does not read repertoire data.
- **Outbound**: imports `UserId` from
  `identity.domain.value_objects` only. The instrument vocabulary comes
  from `campfire_api.shared.catalogs.INSTRUMENTS`, outside any bounded
  context, so repertoire does not import identity's catalog module.
- **Adapter-level**: `repertoire/adapters/persistence/models.py`
  imports the SQLAlchemy `Base` from
  `identity/adapters/persistence/models.py`. This crosses context
  boundaries at the **adapter** layer (not domain), so the
  invariant is preserved. See plan.md "Persistence wiring" for the
  trigger that lifts `Base` into a shared module later.

---

## Migration `0003_repertoire_initial.py`

**Operations**:
1. `op.create_table('repertoire_entries', …)` with all columns and
   CHECKs above.
2. `op.create_index('ux_repertoire_entries_user_song_instrument',
   'repertoire_entries', ['user_id', 'song_external_id',
   'instrument'], unique=True)`.
3. `op.create_index('ix_repertoire_entries_user_recent',
   'repertoire_entries', ['user_id',
   sa.text('created_at DESC')])`.

**Downgrade**: drop the indexes, drop the table. Safe because
nothing references `repertoire_entries`.

**Idempotent seeds**: none. The slice does not seed sample
repertoire entries — the design's `SAMPLE_REPERTOIRE` is fixture
data for the prototype only and does not belong in the production
DB.

**Revision chain**: `down_revision = '0002_seed_ada'`,
`revision = '0003_repertoire_initial'`.

---

## Read models (in-memory, not persisted)

The `SearchResult` value object lives in
`repertoire.domain.entities` as a frozen dataclass:

| Field | Type | Source |
|---|---|---|
| `external_id` | `SongExternalId` | Deezer `track.id` (string-cast). |
| `title` | `str` | Deezer `track.title`. |
| `artist` | `str` | Deezer `track.artist.name`. |
| `album` | `str \| None` | Deezer `track.album.title`. |
| `release_year` | `int \| None` | Year prefix of `track.album.release_date` when present. |
| `cover_art_url` | `str \| None` | Deezer `track.album.cover_medium`. |

`SearchResult` is **not** an entity — it is a transient read model
the `SongCatalogPort` returns. It is shaped identically to the
denormalized columns on `RepertoireEntry` so the
`add_or_update_entry` use case can construct an entry by direct
field copy.
