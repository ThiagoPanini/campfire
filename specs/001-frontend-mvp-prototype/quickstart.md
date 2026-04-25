# Quickstart: Campfire Frontend MVP Prototype

## Prerequisites

- Node.js 24 LTS
- npm, pnpm, or equivalent package manager

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open the local Vite URL and verify:

- `/` renders the landing page.
- `/signin` accepts seeded credentials.
- `/signup` routes valid mock sign-up to onboarding.
- `/onboarding` redirects to `/` when opened without a mock session.
- `/home` redirects to `/` when opened without a mock session.

## Seeded Mock Account

Use the seeded account documented in implementation docs, expected to follow this shape:

```text
Email: ada@campfire.test
Password: campfire123
```

## Expected Journeys

### First-Time User

1. Open `/`.
2. Click `ENTER CAMPFIRE`.
3. Submit a valid sign-up email/password.
4. Pick any onboarding preferences or none.
5. Click `START TRACKING`.
6. Confirm `/home` shows the new mock display name and first-login member panel.

### Returning User

1. Open `/`.
2. Click `SIGN IN`.
3. Submit seeded credentials.
4. Confirm `/home` shows the returning-user member panel.

### Google Simulation

1. Open `/signup`.
2. Click `CONTINUE WITH GOOGLE`.
3. Confirm route is `/onboarding`.
4. Repeat from `/signin` and confirm route is `/home`.

### Refresh Behavior

1. Select a non-default language and accent.
2. Sign up or sign in.
3. Refresh the browser.
4. Confirm route/user/preferences reset to landing while language and accent remain selected.

## Manual Acceptance Checklist

For this prototype slice, automated tests are deferred by constitution Principle IV. Before considering the slice done, manually verify:

- Landing → sign-up → onboarding → home.
- Landing → sign-in → home.
- Invalid auth form states.
- Protected route redirects.
- Language/accent propagation.
- 360 px and 1440 px viewport checks with no horizontal scroll.
- Reduced-motion behavior.
- No auth/storage/analytics network calls during documented journeys.

### Network Verification Method

Use browser DevTools while running the local Vite app:

1. Open the Network panel and enable `Preserve log`.
2. Filter requests by `fetch`, `xhr`, `beacon`, `websocket`, and `other`.
3. Clear the log before each documented journey.
4. Complete the first-time, returning, Google simulation, refresh, protected-route, language, and accent journeys.
5. Confirm no requests target authentication, storage, analytics, OAuth, or remote persistence endpoints. Static local Vite/module/font requests are acceptable during local development; any application data/auth request is a failure for this prototype.

Add automated tests later when behavior stabilizes, a regression appears, or another slice depends on the frontend behavior.

## Mintlify Docs

Implementation must add:

```text
docs.json
docs/overview.mdx
docs/frontend/campfire-mvp-prototype.mdx
```

The feature page must describe:

- Chosen frontend stack.
- Local run workflow.
- Route map.
- Mock session model.
- Authoritative Claude design artifacts.
- Component/screen structure and state boundaries.
