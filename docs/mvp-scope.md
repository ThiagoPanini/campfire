# MVP Scope

The single end-to-end flow campfire's first deployment delivers. Everything not listed here is explicitly deferred. Product context: [../PRODUCT_VISION.md](../PRODUCT_VISION.md).

## Implementation status (as of 2026-05-16)

This document specifies the **intended** MVP flow. None of it is implemented yet. The only runnable code today is a landing-page slice in [apps/web/src/home/Home.tsx](../apps/web/src/home/Home.tsx) — a video-poster hero with non-functional `entrar` / `criar conta` CTAs. There is no backend, no account creation, no repertoire, and no persistence. The CTAs currently link to `#home` rather than to real flows.

The immediate next milestone implied by this state is wiring those CTAs to actual account creation and sign-in, then exposing the repertoire view below.

## MVP goal

A real human visits the deployed URL, creates an account, and maintains a personal repertoire of songs that persists across sessions.

This is the walking skeleton. It proves the full delivery pipeline — frontend, backend, persistence, deploy — works end-to-end against a real user, with no friends, jams, recordings, or AI in the loop.

## The single flow

1. A new user opens the deployed URL.
2. The user signs up (email + password) and is signed in.
3. The user lands on their (empty) repertoire view.
4. The user adds a song: **title**, **artist**, **instrument**. The song appears in the list.
5. The user can repeat step 4 for any number of songs.
6. The user can **edit** any entry (any field).
7. The user can **delete** any entry.
8. The user signs out, signs in again on the same or another device, and sees the same repertoire.

The flow is single-user. Each account has exactly one personal repertoire. No other user can see it.

## Success criterion

A real human (the author, then one trusted friend) can use the publicly deployed URL to complete every step above on a fresh account, without intervention from the developer.

This is binary: the walking skeleton either works for an external user or it doesn't.

## In scope

- Account creation (email + password) and sign-in.
- **Email verification at sign-up** (one-time code sent to the address, confirmed before the account becomes usable). Added 2026-05-16 during sign-up shape; protects against typos and stops trivially-fake addresses without committing to a full email/identity backend.
- **Google OAuth as an alternative sign-up/sign-in path** alongside email+password. Added 2026-05-16; the email+password path remains the primary, OAuth is the quieter shortcut. Reduces friction for friends invited into the platform.
- One personal repertoire per account.
- Repertoire entries with three required fields: title, artist, instrument.
- Full CRUD on repertoire entries (add, view, edit, delete).
- Persistence across sessions and devices for the same account.
- A publicly reachable deployed URL.

## Out of scope

The following features from the product vision are explicitly deferred. The MVP is not under-scoped if it omits these — it is correctly scoped.

- Friend graph and any concept of "other users."
- Jam sessions, in-jam interactions, suggestion algorithms.
- Song requests between users.
- Recordings (audio capture, upload, playback).
- Social interaction around recordings (reactions, comments, discovery).
- AI evaluation of recordings.
- Public profiles or discoverability of any kind.
- Search across other users' content (none exists to search).

The following operational features are also out of scope for the MVP and will be revisited when concrete need arises:

- Password reset / forgot-password flow.
- OAuth providers beyond Google (Apple, GitHub, etc.).
- Sorting, filtering, pagination, tagging, or categorization within a repertoire.
- Bulk import/export of repertoire entries.
- Analytics, telemetry, error reporting beyond what the deploy provider exposes by default.
- Native mobile applications (responsive web is sufficient for now).
- Internationalization (the UI ships PT-BR per [ADR 0005](./decisions/0005-ui-language.md); a second language is post-MVP).

## Open questions

- **Instrument field shape.** Free-text input, or a selection from a fixed list? Free-text is simpler to ship; a fixed list keeps the data tidy and aligns the field with future filtering. Defaulting to free-text in the absence of a decision.
- **Account recovery.** Without password reset, a forgotten password means a lost account. For the author + one friend this is acceptable; before broader sharing it likely is not. Flagging here so the deferral is conscious.
