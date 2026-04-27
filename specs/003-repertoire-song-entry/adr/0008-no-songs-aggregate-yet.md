# ADR-0008 — No songs aggregate; denormalize catalog metadata onto entries

**Status**: Accepted
**Date**: 2026-04-27
**Slice**: `003-repertoire-song-entry`
**Supersedes**: —
**Superseded by**: —

## Context

A repertoire entry references a song. The natural data-model instinct
is "one `songs` table, one row per catalog song, FK from
`repertoire_entries.song_id`." This ADR records why we are NOT doing
that in v1, and what would change our mind.

The driving requirements:

- **FR-013**: an entry must remain viewable when the catalog becomes
  unreachable or removes the song. The displayed fields (title,
  artist, album, release year, cover art URL) must persist on our
  side.
- **FR-007/FR-008**: entries are unique by
  `(user_id, song_external_id, instrument)`. Uniqueness is on the
  entry, not on the song.
- **Constitution Principle I (Narrow MVP Scope)**: the only consumers
  of "song" in scope are the entries themselves. Groups,
  jam-sessions, recommendations, "what to practice" — none of them
  exist or are scoped.

## Decision

`repertoire_entries` carries the catalog metadata as denormalized
columns: `song_external_id`, `song_title`, `song_artist`,
`song_album`, `song_release_year`, `song_cover_art_url`.

There is **no** `songs` table.

## Alternatives considered

| Option | Verdict | Reason |
|---|---|---|
| **Songs table with FK** | Rejected | Adds a join to every list query. Adds an upsert path on add. Adds the question "what happens when the catalog updates a song's title" that we don't have an answer for. Adds operational surface (re-deduplicating canonical song rows). All for a feature that doesn't exist yet. |
| **Songs table populated lazily** | Rejected | Same drawbacks; defers them by exactly one bug report. |
| **Denormalize, plus a `songs` table as a write-through cache** | Rejected | Two sources of truth means two opportunities to drift. The denormalized columns already satisfy FR-013 unaided. |
| **Denormalize (this ADR)** | Accepted | Smallest possible surface; satisfies FR-013 without joins; uniqueness is exactly where the spec wants it. |

## Consequences

**Positive**
- One table, one query plan, one set of indexes. List query is a
  single index scan.
- FR-013 is satisfied by construction: the row itself contains
  everything render-time needs.
- Catalog provider swap (ADR-0007) does not require a data
  migration — `song_external_id` is opaque to us.

**Negative**
- Storage cost grows linearly with entries, not with distinct songs.
  Per the scale section in plan.md (tens of users × tens of entries)
  this is single-digit megabytes; not a real concern at v1 scale.
- Two users with the "same" song each store the catalog metadata.
  When (if) we add a feature that needs a canonical "this song"
  (e.g., "show me everyone in my group who plays Wonderwall"), this
  ADR is the migration source — see "Trigger to revisit".

## Trigger to revisit

When a feature lands that *needs* a canonical, deduplicated "this
song" entity. Concrete signals:

- A group / sharing slice that surfaces "songs played in this
  group" with a stable identity.
- A recommendation slice that needs "users who play X also play Y".
- A "song page" route in the frontend that lives at
  `/songs/{externalId}` rather than at
  `/repertoire/entries/{id}`.

The migration path: introduce a `songs` table; backfill from
`DISTINCT song_external_id` rows in `repertoire_entries`; add a FK;
keep the denormalized columns for one release as a forward-compat
layer; drop them when the new feature is stable.

We are explicitly not implementing any of that now.
