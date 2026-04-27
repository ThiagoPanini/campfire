# Feature Specification: Repertoire Song Entry

**Feature Branch**: `004-repertoire-song-entry`
**Created**: 2026-04-27
**Status**: Draft
**Input**: User description: "Repertoire song entry — A user searches for a song, selects it from results, picks the instrument they play it on, and sets their proficiency level for that song — creating a linked entry on their profile. Song search draws from an external music catalog API. The same song on two different instruments can exist as two separate entries. Social sharing, group features, recommendations, and 'What to Practice' logic are out of scope for this iteration."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a song to my repertoire (Priority: P1)

A logged-in musician opens the YOUR REPERTOIRE area, searches for a song by title or artist, picks one from the results, chooses which instrument they play it on, sets a proficiency level, and confirms — the song now appears on their personal repertoire list.

**Why this priority**: This is the entire point of the slice. Without it, the feature delivers no value. It is also the smallest end-to-end loop that turns Campfire from "an app you can log into" into "an app that holds something for you." Identity (Spec 002) is already live, so this story can plug directly into the existing authenticated profile.

**Independent Test**: Sign in as an existing user with no repertoire entries; search for a known popular song (e.g., "Wonderwall"); select a result; pick an instrument from the existing 12-instrument catalog; pick a proficiency level; submit; confirm the song appears on the user's repertoire list with the chosen instrument and level.

**Acceptance Scenarios**:

1. **Given** a logged-in user with an empty repertoire, **When** they type a query of at least 2 characters into the song search field, **Then** the system shows a list of matching songs from the external music catalog with title and primary artist visible for each result.
2. **Given** the user has a list of search results on screen, **When** they pick a result, choose an instrument from the existing instrument catalog, choose a proficiency level, and confirm, **Then** the entry is saved and immediately visible on the user's repertoire list.
3. **Given** the user already has "Wonderwall — Guitar — Practicing" in their repertoire, **When** they add "Wonderwall — Piano — Learning", **Then** both entries coexist on the list as distinct items.
4. **Given** the user already has "Wonderwall — Guitar — Practicing" in their repertoire, **When** they try to add "Wonderwall — Guitar — Learning" (same song, same instrument), **Then** the system prevents the duplicate and offers to update the existing entry's proficiency instead.

---

### User Story 2 - View my repertoire (Priority: P1)

A logged-in musician opens the YOUR REPERTOIRE area and sees the songs they have already added, including the song title, primary artist, instrument, and proficiency level for each entry.

**Why this priority**: Adding without viewing is write-only and provides no perceived value. Listing is part of the same minimum viable loop and must ship together with the add flow. Marking it P1 reflects that "add" and "list" are co-dependent for this slice to be usable.

**Independent Test**: Add at least one entry through the add flow, then return to the repertoire view; verify all entries are listed with title, artist, instrument, and proficiency, and that the list reflects new additions without requiring a manual refresh.

**Acceptance Scenarios**:

1. **Given** a logged-in user with three repertoire entries, **When** they open the repertoire view, **Then** all three entries are shown with title, artist, instrument, and proficiency level.
2. **Given** a logged-in user with no repertoire entries, **When** they open the repertoire view, **Then** they see an empty-state message that invites them to add their first song.
3. **Given** a logged-in user just added a new entry, **When** the add flow completes, **Then** the new entry is visible in the repertoire view in the same session without a manual reload.

---

### User Story 3 - Remove a song from my repertoire (Priority: P2)

A logged-in musician removes an entry from their repertoire when they no longer want it tracked (e.g., they added it by mistake, or they no longer play that song).

**Why this priority**: Necessary for hygiene but not blocking the first useful demo. A user can derive value from add+list alone for an early ship; remove is the next obvious gap to close.

**Independent Test**: Add an entry, remove it, and verify it disappears from the repertoire view and does not reappear on reload.

**Acceptance Scenarios**:

1. **Given** a logged-in user viewing their repertoire with at least one entry, **When** they remove an entry and confirm, **Then** the entry is gone from the list and remains gone after a page reload.
2. **Given** a logged-in user removed an entry, **When** they search and add the same song + instrument combination again, **Then** it is treated as a fresh new entry.

---

### User Story 4 - Update proficiency on an existing entry (Priority: P3)

A logged-in musician updates the proficiency level of an existing repertoire entry as their skill on that song progresses (e.g., from "Learning" to "Practicing").

**Why this priority**: Reflects how the feature is actually used over time, but is not required to demonstrate the loop. Can ship in a follow-up if needed.

**Independent Test**: Take an existing entry with proficiency "Learning", update it to "Practicing", and verify the change persists across reload.

**Acceptance Scenarios**:

1. **Given** an existing entry with proficiency "Learning", **When** the user changes it to "Practicing" and confirms, **Then** the new proficiency is shown in the repertoire view and persists across reload.
2. **Given** the user attempts to add a song+instrument combination that already exists, **When** they confirm, **Then** the system updates the existing entry's proficiency rather than creating a duplicate.

---

### Edge Cases

- **Search returns no results**: The user sees a clear empty-state message (e.g., "No songs found") and is not allowed to fabricate a free-text song.
- **External catalog API is unavailable or slow**: The user sees a non-blocking message that song search is temporarily unavailable, and the rest of the app continues to function. The user's existing repertoire list still loads from local data.
- **External catalog returns ambiguous duplicates** (e.g., multiple recordings of the same title by the same artist): Each result is shown with enough disambiguating metadata (e.g., album or year) so the user can pick the one they mean. The system stores the catalog's stable identifier so the user's choice is preserved.
- **External catalog song later becomes unreachable**: Existing repertoire entries continue to display the cached title, artist, and any other metadata that was captured at add-time; the entry never silently disappears from the user's list.
- **User picks an instrument they have not declared in their profile preferences**: The add still succeeds. The instrument vocabulary in the repertoire entry comes from the global 12-instrument catalog, not from the user's declared instruments — declared instruments may be used to suggest defaults but do not restrict choices.
- **User submits without choosing instrument or proficiency**: Submission is blocked with field-level validation messages.
- **Unauthenticated request**: Any attempt to add, list, update, or remove repertoire entries without a valid session is rejected.
- **Same external song id selected twice for the same instrument** (race condition / double-submit): Only one entry is created; the second submission is treated as an idempotent update or a no-op.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow only authenticated users to add, list, update, or remove repertoire entries; all repertoire data MUST be scoped to the owning user.
- **FR-002**: The system MUST provide a song search interface that accepts a free-text query of at least 2 characters and returns matching songs from an external music catalog, displaying at minimum the song title and primary artist for each result.
- **FR-003**: The system MUST return search results in a perceived-fast manner, with a visible loading indicator while results are pending and a clear empty-state message when no results match.
- **FR-004**: The system MUST persist a stable external catalog identifier for every selected song so that the same logical song can be referenced consistently across users and across sessions.
- **FR-005**: The system MUST require the user to choose an instrument from the existing shared 12-instrument catalog (the same catalog used by identity preferences) when creating a repertoire entry; free-text instruments MUST NOT be accepted.
- **FR-006**: The system MUST require the user to choose a proficiency level from a fixed, ordered set of values when creating a repertoire entry; free-text proficiency MUST NOT be accepted.
- **FR-007**: The system MUST treat a repertoire entry as uniquely identified by the combination of (owning user, song, instrument). The same song under two different instruments for the same user MUST coexist as two separate entries.
- **FR-008**: The system MUST prevent creating a duplicate entry for the same (user, song, instrument) tuple. When a user attempts to add such a duplicate, the system MUST instead update the proficiency level of the existing entry (or surface the existing entry to the user for confirmation).
- **FR-009**: The system MUST allow a user to view all of their own repertoire entries in a list, showing for each entry the song title, primary artist, instrument, and proficiency level.
- **FR-010**: The system MUST allow a user to remove any of their own repertoire entries; removal MUST only delete the link to the song, not the song catalog reference itself.
- **FR-011**: The system MUST allow a user to update the proficiency level on any of their own repertoire entries.
- **FR-012**: The system MUST NOT allow a user to read, modify, or remove another user's repertoire entries.
- **FR-013**: The system MUST cache enough catalog metadata at add-time (at minimum: title, primary artist, external identifier) so that an entry remains viewable even if the external catalog is later unreachable or removes the song.
- **FR-014**: The system MUST recover gracefully when the external catalog is unavailable: the search interface MUST surface a non-blocking error to the user, and existing repertoire viewing/removing/updating MUST continue to work.
- **FR-015**: The Home page MUST link the existing YOUR REPERTOIRE tile to this new feature, replacing its current placeholder behavior.

### Key Entities *(include if feature involves data)*

- **Song** (catalog reference): Represents an identified piece of music as known to the external music catalog. Key attributes: stable external identifier, title, primary artist, optional disambiguating metadata captured at add-time (e.g., album, release year). A Song is *not* a free-text blob — it is always backed by a catalog entry. Songs are shared across users (the same song can be referenced by many users' repertoires).
- **Instrument**: A value from the shared 12-instrument catalog already used by identity preferences. Not user-defined.
- **Proficiency Level**: A value from a fixed ordered set used to express how comfortably the user plays a particular song on a particular instrument. Distinct from the "experience level" already captured in identity preferences (which describes the player's overall career, not per-song skill).
- **Repertoire Entry**: The link that ties one User to one Song with a chosen Instrument and a chosen Proficiency Level. Owned by exactly one user. Uniquely identified by (user, song, instrument). Carries created-at and updated-at timestamps. Two entries for the same (user, song) but different instruments are valid and distinct.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A logged-in user can add their first song to their repertoire — from opening the feature to seeing the new entry in their list — in under 60 seconds, including search and selection.
- **SC-002**: At least 90% of search queries that name a real, well-known song return a usable result in the first page within 2 seconds of the user finishing typing.
- **SC-003**: When the external catalog is unavailable, 100% of users can still view, update, and remove their existing repertoire entries; only the search/add path degrades.
- **SC-004**: No user is ever able to read, modify, or remove a repertoire entry that does not belong to them. (Verified by automated authorization tests covering all entry-mutating and entry-reading paths.)
- **SC-005**: Zero duplicate (user, song, instrument) entries exist in the system at any time, verified by a uniqueness constraint and by automated tests covering the duplicate-add and concurrent-add paths.
- **SC-006**: An existing repertoire entry remains visible to its owner with title, artist, instrument, and proficiency for at least 12 months after the originating song becomes unreachable in the external catalog (i.e., locally cached display fields prevent silent disappearance).

## Assumptions

- **Authentication is reused**: This feature relies on the existing identity context (Spec 002) for sign-in, sessions, and user identity. No new auth flows are introduced.
- **Instrument vocabulary is reused**: The shared 12-instrument catalog already used by identity preferences is the single source of truth for instrument values; this feature does not introduce a new instrument list or extend the existing one.
- **Proficiency scale (default)**: A 3-tier ordered scale — *Learning* / *Practicing* / *Performance-ready* — is assumed for this iteration. This is intentionally distinct from the identity "experience level" scale, which describes career length rather than per-song skill. The exact labels and tier count can be revisited during `/speckit.clarify` before planning.
- **External catalog**: Search is backed by a single reputable external music catalog API. The specific provider is an implementation choice for the planning phase, not a product decision; the spec only requires that selected songs carry a stable external identifier and that catalog outages do not break existing repertoire data.
- **One owner per entry**: A repertoire entry is private to its owning user. No sharing, visibility, or follower mechanics are introduced in this slice.
- **Bounded context**: This feature establishes a new "Repertoire" bounded context alongside the existing Identity context. Cross-context coupling is limited to (a) reading the authenticated user's identity for ownership and (b) reusing the shared instrument catalog.
- **Out of scope for this slice**: Social sharing, group features, recommendations, "What to Practice" logic, song-level notes, practice logs, time-spent tracking, tags/playlists, importing from external services, and bulk add. These belong to later iterations.
- **Architecture continuity**: This feature follows the existing monorepo conventions (React/TypeScript frontend, FastAPI Python backend, Hexagonal/DDD per bounded context) established by Specs 001 and 002. Concrete tech choices live in the plan, not the spec.
- **Localization**: The interface continues to support the existing English and Portuguese locales already present in the frontend; no new locales are added.
