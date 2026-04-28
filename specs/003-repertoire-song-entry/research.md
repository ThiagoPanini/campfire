# Research — Repertoire Song Entry

**Feature**: `003-repertoire-song-entry`
**Phase**: 0 (outline & research)
**Status**: complete — no NEEDS CLARIFICATION markers remain in
[plan.md](./plan.md) or [spec.md](./spec.md).

This document records the technical decisions taken before design, paired
with the alternatives that were considered. ADRs that go deeper live
under [adr/](./adr/).

---

## R1. External music catalog provider

**Decision**: Deezer public Search API
(`GET https://api.deezer.com/search?q=…&index=…&limit=…`) for the v1
slice, accessed server-side from the FastAPI backend.

**Rationale**:
- No API key, no OAuth, no signed request — matches "demo-grade" budget
  and avoids a secrets-rotation story before the infrastructure slice.
- Returns title, artist (`artist.name`), album (`album.title`), release
  year (derivable via the `album.id` lookup, or via the track's
  `release_date` for some tracks; see "Release-year extraction" below),
  and cover art URL (`album.cover`, `album.cover_medium`,
  `album.cover_xl`) in the search response — covers all six FR-013
  fields.
- Stable external identifier: each track has a numeric `id` that we
  persist as `song_external_id` (string-typed; we do not assume
  numeric on our side, which keeps a future provider swap cheaper).
- Tolerates the spec's "well-known song" success criterion (SC-002):
  "Wonderwall", "Hey Jude", "Trem Bala" all return rich first pages
  empirically.

**Alternatives considered**:

| Provider | Rejected because |
|---|---|
| **MusicBrainz** | Excellent metadata, but cover art lives in a separate Cover Art Archive call, and the API requires a User-Agent and rate-limits aggressively (1 req/s). FR-013's six-field shape would need two calls per result. |
| **Spotify Web API** | Requires OAuth client credentials — a secrets-rotation story we do not yet have a place to put. Also has tighter ToS around storing metadata. |
| **Apple Music API** | Requires a developer token signed with a private key. Same secrets problem, plus the token has a finite lifetime that needs rotation. |
| **iTunes Search API** | No key, decent metadata, but the cover-art URL fields are smaller (`artworkUrl60` to `artworkUrl100`) and would force an URL-rewrite hack to get a usable display size. Solid fallback if Deezer's terms change. |
| **Last.fm** | Track search is keyed on artist + title (no opaque stable ID), which violates FR-004. |

**Migration path** (captured in ADR-0007): the `SongCatalogPort`
Protocol is the only abstraction the application depends on. Swapping
providers means writing a new adapter (e.g.,
`itunes_song_catalog.py`) and changing the dep override — no use case
or schema change. The denormalized song fields on `repertoire_entries`
become a one-time forward-compat layer: rows previously stamped with a
Deezer ID stay readable forever; new rows get the new provider's IDs.

**Release-year extraction**: Deezer returns `album.release_date` on
the track-detail endpoint but not always on `search`. Strategy: when
present in the search payload, parse the year (4-digit prefix); when
absent, leave `song_release_year` NULL. FR-013 lists release year as a
captured field but the spec is silent on what to do when the catalog
itself omits it — the data-model honors that with a nullable column.

---

## R2. Search topology — backend proxy vs. browser-direct

**Decision**: every catalog call goes through the backend at
`GET /repertoire/songs/search`. The browser never calls
`api.deezer.com` directly.

**Rationale** (full ADR at [adr/0009-search-proxied-through-backend.md](./adr/0009-search-proxied-through-backend.md)):
- **FR-001 — auth required**: `/repertoire/songs/search` enforces a
  valid bearer token via the existing `get_current_session` FastAPI
  dependency. A direct browser → Deezer call has no way to be
  "authenticated to Campfire" — there's nothing to gate.
- **FR-016 — server-side per-user rate limit + short backend cache**:
  the limiter and cache live on the backend by definition. Putting
  them in the browser is not equivalent (a sufficiently motivated
  client just disables the limiter).
- **FR-013 — stable wire schema**: the backend reshapes Deezer's
  response into our `SearchResult` DTO (only the fields we keep). If
  Deezer renames `album.cover_medium`, the change is one adapter
  edit — no frontend change.
- **CORS**: Deezer's CORS posture is permissive on `api.deezer.com`,
  but relying on third-party CORS is a fragile dependency. Server
  proxy makes the call from a controlled origin.
- **Failure isolation**: when Deezer is down, the backend returns
  `503 Service Unavailable` with `{ "message": "song catalog
  unavailable" }`. The frontend renders the spec's "search is
  temporarily unavailable" empty state without leaking provider
  identity.

**Alternative — browser-direct**: rejected. It would require either
moving the rate limiter and cache into the browser (insufficient per
FR-016) or running both a server limiter *and* a browser fetcher,
which doubles surface area without changing the failure modes.

**Cost accepted**: extra hop adds ~50–200 ms relative to a direct
call. The backend cache (60 s TTL) amortizes most of it; the SC-002
budget (2 s) absorbs the rest with margin.

---

## R3. Songs aggregate vs. denormalize at add-time

**Decision**: no `songs` table. Each `repertoire_entries` row stores
the catalog metadata captured at add-time as denormalized columns
(`song_external_id`, `song_title`, `song_artist`, `song_album`,
`song_release_year`, `song_cover_art_url`).

**Rationale** (full ADR at [adr/0008-no-songs-aggregate-yet.md](./adr/0008-no-songs-aggregate-yet.md)):
- **FR-013 must hold even when the catalog is unreachable.** A
  separate `songs` table whose rows are populated from Deezer at
  add-time satisfies this only if every reader joins to it; a
  denormalized columnar copy on the entry achieves the same with
  zero joins.
- **No second feature consumes a "song" right now.** Groups,
  jam-sessions, recommendations, "what to practice" — none of them
  exist. Modeling a shared aggregate before a second consumer is
  YAGNI.
- **Uniqueness is per-entry**, not per-song. The `(user_id,
  song_external_id, instrument)` partial unique index is on
  `repertoire_entries`; a separate `songs` row would not change it.
- **Storage cost is trivial.** Tens of users × tens of entries each
  × ~200 bytes of song fields = single-digit megabytes. The cost of
  the *opposite* mistake — premature normalization — is a join in
  every list query.

**When to revisit**: when context #3 (e.g., groups) needs a
canonical "this song" to deduplicate across users, the denormalized
columns become the migration source for a backfill into a real
`songs` table. The `song_external_id` is already the natural key.

---

## R4. Proficiency vocabulary location

**Decision**: define `PROFICIENCY_LEVELS = frozenset({"learning",
"practicing", "ready"})` (or a `Literal` type) inside
`apps/api/src/campfire_api/contexts/repertoire/domain/value_objects.py`,
not in `identity.domain.catalogs`.

**Rationale**:
- The identity `experience` set (`beginner` / `learning` /
  `intermediate` / `advanced`) describes career length; this slice's
  proficiency describes per-song mastery. Same word, different
  semantics — colocating them invites confusion.
- The value lives next to the use cases that interpret it
  (`add_or_update_entry`, `update_proficiency`).
- Cross-context invariant 3 says cross-context references travel as
  identifier value objects; proficiency is owned solely by
  repertoire, so there is nothing to share.

**Frontend mirror**: `apps/web/src/features/repertoire/catalogs.ts`
exports the same three tokens. The labels/hints in the design
("Working out the parts", "Drilling, not yet smooth", "Can play it
in front of others") move into `apps/web/src/i18n/locales/{en,pt}.ts`.

**Wire format**: lowercase tokens (`learning` / `practicing` /
`ready`). The display labels (uppercase, hyphenated) are i18n
strings.

---

## R5. Search cache shape

**Decision**: process-local TTL+LRU cache, scoped per
`(user_id, normalized_query, page)`.

- TTL: 60 s (configurable via `SEARCH_CACHE_TTL_SECONDS`).
- Capacity: 1024 entries (configurable via
  `SEARCH_CACHE_MAX_ENTRIES`); LRU eviction.
- Implementation: a small in-process dict guarded by an asyncio lock
  + an OrderedDict for LRU; mirrors how the identity slice's auth
  rate limiter is implemented (in-process, single dev process).

**Why not Redis / Memcached**: same reason spec 002 picked an
in-process auth rate limiter — single dev process today, and adding a
shared store before a second instance exists is ceremony. The
`SearchCachePort` abstraction means a future swap to Redis is one
adapter file.

**Why scope by `user_id`**: the rate-limit budget is per user
(FR-016). If the cache key omitted `user_id`, user A could "warm" a
query and user B's call would be served out of A's quota, which
inverts the limiter's contract.

**Why normalize the query**: trailing whitespace and case differences
should hit the same cache entry. Normalization is `query.strip().lower()`;
nothing fancier is justified.

---

## R6. Pagination contract on our wire

**Decision**: expose `?page=N` (1-indexed) on
`GET /repertoire/songs/search`; respond with
`{ results, page, hasMore }`. Translate to Deezer's `index=` /
`limit=` server-side.

**Math**: Deezer's `index` is 0-based offset, `limit` is page size. We
fix `limit=10` (FR-002) and compute `index = (page - 1) * 10`.
`hasMore` is true iff Deezer returns 10 results AND
`response.next` is present.

**Why not pass Deezer's contract through**: the spec wants stable
"load more" UX; tying the wire to a specific provider's pagination
contract makes a future provider swap a public API break.

**Frontend behavior**: the design's "load more" control increments
the in-flight `page` and concatenates the `results[]` to the
already-rendered list, until `hasMore === false`.

---

## R7. Rate limiter shape

**Decision**: per-user-id rolling window — 30 requests / 60 s,
configurable.

**Rationale**:
- Same rolling-window primitive as the auth limiter
  (`apps/api/src/campfire_api/contexts/identity/adapters/rate_limiting/`),
  parameterized by a different key extractor (`user_id` here vs.
  `(ip, email)` for auth).
- 30 / 60 s comfortably absorbs the 300 ms client debounce
  (FR-016): even pathological keystroking hits the cache, not the
  upstream.
- On limit hit, the use case raises `SearchRateLimited`, which the
  HTTP error mapper translates to `429 Too Many Requests` with a
  `Retry-After` header (mirrors the auth limiter's mapping for
  `RateLimited`).

**Alternative — IP-keyed**: rejected. `/repertoire/songs/search`
requires a session, so we always have a stable `user_id`; IP
buckets a whole household together and is brittle behind NAT.

---

## R8. Cover art handling

**Decision**: store the URL only; never proxy or copy the binary.

**Rationale**:
- FR-013 explicitly says "stored as a reference (no binary copy is
  taken)".
- FR-013 also says "when the URL becomes unreachable the entry MUST
  still render its textual fields without error" — the frontend's
  `<img>` falls back to a CSS placeholder via an `onerror` handler;
  the backend takes no action when an image 404s because it never
  loaded the image in the first place.
- Saves a substantial storage and egress problem we do not yet have
  an answer for (S3? CloudFront? — both deferred to the
  infrastructure slice).

**Display sizing**: the design uses 40–120 px square thumbnails. We
persist Deezer's `album.cover_medium` (250 px) which sizes down
cleanly without the 56-px `album.cover` looking blurry on retina.

---

## R9. UUID generation, timestamp policy

**Decision**: reuse `new_uuid()` from
`identity.domain.value_objects` (UUID v7 via `uuid_utils`, fallback
v4) for `RepertoireEntryId`. All timestamps are TIMESTAMPTZ UTC, set
application-side via the `Clock` port.

**Rationale**: this slice does not get to re-litigate ADR-004 (UUID
v7 + TIMESTAMPTZ + no Postgres extensions). Reuse keeps a single
ID-generation entry point per process and a single time source per
context.

**Cross-context import note**: `new_uuid` is currently a free function
in `identity.domain.value_objects`. Importing it from the repertoire
domain would technically violate cross-context invariant 3 (which
restricts cross-context imports to identifier value objects). We
sidestep this by **redefining a local `new_uuid`** in
`repertoire.domain.value_objects` (one-line wrapper around
`uuid_utils.uuid7` with the same v4 fallback). This is duplication of
~5 lines, judged cheaper than lifting a `shared/ids.py` package
preemptively. When context #3 lands, that lift becomes the right call.

---

## R10. Testing budget

**Decision**:
- **Unit**: use-case tests against fake repositories + a fake
  `SongCatalogPort` (`fake_song_catalog.py`). One test per use case;
  cover the happy path, the duplicate-becomes-update path
  (FR-008), the cross-user denial (FR-012), the catalog-unavailable
  path (FR-014), and the rate-limit path (FR-016).
- **Integration**: Testcontainers Postgres + the FastAPI app with
  the Deezer adapter overridden by `fake_song_catalog`. End-to-end
  add → list → update → remove. One test for FR-012 / SC-004
  (cross-user attempts return 404, not 403, to avoid leaking entry
  existence — same posture identity uses for "user not found").
- **Contract**: one OpenAPI snapshot diff
  (`tests/contract/test_repertoire_openapi_snapshot.py`).
- **Architecture**: the existing test is *extended* (one-line `ROOT`
  change + `httpx` added to `BANNED`); no new file.

**Out**: no live-Deezer contract test (we'd be testing their API,
not ours), no load test (no SC drives it), no frontend automated
tests (matches identity slice — a manual quickstart is the gate).

---

## R11. Frontend mock fallback

**Decision**: the frontend's repertoire feature reads `VITE_API_URL`
exactly like the auth slice. When `VITE_API_URL` is set to a sentinel
like `mock://repertoire`, the API module short-circuits to a tiny
`repertoire.mock.ts` (in-memory list, fake search returning a fixed
result set from the design samples). This satisfies constitution
Principle II ("frontend → backend → LocalStack → Terraform"): the
frontend slice is demonstrable on its own before the backend ships.

**Rationale**: the auth slice already wires a real client; copying
that pattern is cheaper than a new mocking framework. The mock is
~50 lines and lives in the slice itself, not as a separate package.

---

## Open questions resolved during research

- **Should the duplicate-add path return 200 (update) or 409
  (conflict)?** → 200 with `X-Repertoire-Action: updated`, per
  FR-008 ("MUST instead update the proficiency level"). The
  design's "duplicate error" screen is a UX hint surfaced from the
  frontend store, not a 4xx response.
- **Does FR-016's "short-lived in-memory cache" need to be shared
  across processes?** → No, see R5 above. Single-process for v1
  matches the auth-limiter precedent.
- **What status code for an unowned-entry mutation?** → `404 Not
  Found`. Identity uses the same posture (don't leak existence). The
  spec is silent; FR-012 only requires denial.

No NEEDS CLARIFICATION markers remain.
