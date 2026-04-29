# Data Model: App Home Redesign — Remove Onboarding & Preferences

This feature mostly removes data rather than adding new domain entities.

## Removed Entity: PreferencesProfile

**Current fields removed**:
- `user_id`
- `instruments`
- `genres`
- `context`
- `goals`
- `experience`
- `updated_at`

**Relationships removed**:
- One-to-one `preferences.user_id -> users.id`.

**Validation removed**:
- Catalog membership validation for onboarding preference fields.
- JSON array checks for preference lists.
- Preference experience enum check.

**State transition removed**:
- Updating preferences no longer flips `User.first_login` to false because
  `first_login` is removed too.

## Changed Entity: User

**Before**:
- `id`
- `email`
- `display_name`
- `first_login`
- `created_at`
- `updated_at`
- associated preferences row

**After**:
- `id`
- `email`
- `display_name`
- `created_at`
- `updated_at`

**API shape**:
- `GET /me` returns identity fields needed by the frontend. Required:
  `displayName`, `email`. Recommended if already low-risk: `id`,
  `memberSince` or `createdAt`.
- `preferences` and `firstLogin` are not present.

**Validation**:
- Existing email/display-name invariants remain.
- No first-login validation.

## Preserved Entity: Repertoire Entry

The new Home reads but does not change the repertoire model.

**Fields used by Home**:
- `id`
- `songTitle`
- `songArtist`
- `songCoverUrl`
- `instrument`
- `proficiency` (`learning` / `practicing` / `ready`)
- `createdAt`
- `updatedAt`

**Derived Home values**:
- `totalSongs`: `entries.length`
- `addedLast7Days`: count of entries where `createdAt` is within seven days of
  current client time
- `readyCount`, `practicingCount`, `learningCount`: grouped by `proficiency`
- `lastAdded`: entry with max parseable `createdAt`; fallback to first entry in
  list if needed
- `addedAgo`: display-only relative time from `createdAt`

## Persisted Storage

Preserved:
- `sessionStorage["campfire.language"]`
- `sessionStorage["campfire.accent"]`

Removed if discovered during implementation:
- Any `campfire.preferences`-style local/session storage key.
- Any local mock storage that hydrates onboarding preference state.

## Database Migration Model

Upgrade:
- Drop `preferences`.
- Drop `users.first_login`.

Downgrade:
- Recreate `preferences` with previous shape.
- Re-add `users.first_login` with a default.

No backfill or data preservation is required because the application is
undeployed.
