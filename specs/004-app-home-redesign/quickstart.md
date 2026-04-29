# Quickstart: Validate App Home Redesign Planning Scope

This feature plan does not implement code. Use this checklist when the
implementation agent finishes the slice.

## Frontend

```bash
npm run typecheck
npm run build
```

Manual walkthrough:

1. Start the existing web/API dev environment.
2. Visit `/` while signed out; confirm landing still renders.
3. Sign up with a new account; confirm the next route is `/home`.
4. Sign out, then sign in; confirm the next route is `/home`.
5. Refresh `/home`; confirm session refresh still hydrates the user.
6. Visit `/repertoire`; confirm existing repertoire behavior still works.
7. Visit `/onboarding` while signed out; confirm redirect to `/`.
8. Visit `/onboarding` while signed in; confirm redirect to `/home`.
9. Check Home with zero entries and with at least one entry.
10. Resize to desktop, ~980px, and ~560px widths; confirm the Home layout does
    not overlap and CTAs remain usable.

Final frontend search:

```bash
rg -n -i "onboarding|preferences|preferenceSummary|firstLogin|authMode|savePreferences|updatePreferences|/me/preferences" apps/web/src
```

Expected result: no active source references except the explicit stale
`/onboarding` redirect helper in `apps/web/src/app/router/routes.ts` and
`apps/web/src/app/App.tsx`, plus intentional display-setting wording if
implementation has explicitly kept it out of user-facing preference copy.
Repertoire `instrument` references are allowed.

## Backend

```bash
cd apps/api
uv run pytest
```

Also run existing lint/type commands if available in the repository workflow.

Validate API behavior:

1. Run migrations to head on a fresh database.
2. Run migrations from previous head to new head on a database containing old
   preference rows.
3. Call `GET /me`; confirm no `preferences` and no `firstLogin`.
4. Call `/me/preferences`; confirm 404.
5. Inspect OpenAPI; confirm `/me/preferences` and `PreferencesPayload` are
   absent.

Final backend search:

```bash
rg -n "Preferences|preferences|firstLogin|first_login|/me/preferences|UpdatePreferences" apps/api/src apps/api/tests
```

Expected result: no active identity preference implementation or tests. Migration
files may contain intentional historical/drop references.

## Repository Docs and Contracts

```bash
rg -n -i "onboarding|preferences|firstLogin|/me/preferences" docs specs apps
```

Classify remaining hits:
- Allowed: historical specs, Claude design artifacts, migration history, this
  feature's spec/plan/research/contracts.
- Not allowed: current product docs, active app/API source, mocks, current
  OpenAPI snapshots, tests asserting old behavior.
