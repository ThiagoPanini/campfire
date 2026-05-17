# campfire web

Frontend for the campfire project. Stack: React + TypeScript + Vite + `react-router-dom` in a pnpm workspace (`@campfire/web`). See [ADR 0004](../../docs/decisions/0004-frontend-stack.md) and [ADR 0006](../../docs/decisions/0006-frontend-routing.md). Visual system: [DESIGN.md](../../DESIGN.md).

## Current implementation

This app currently covers the **pre-auth shape** of the MVP described in [../../docs/mvp-scope.md](../../docs/mvp-scope.md). No backend exists yet; the auth client is a stub.

- `src/main.tsx` wraps the app in `BrowserRouter`. `src/App.tsx` defines the routes.
- `src/home/Home.tsx` — the video poster (`public/background.mp4`, fallback `public/background.png`) with a top nav (brand wordmark, `entrar` and `criar conta` links pointing at `/signin` and `/signup`). `src/home/Home.css` carries the warm-dark canvas, monospace type, and CRT overlays (scanlines, halftone, grain, tracking glitch, vignette); the video pauses on `prefers-reduced-motion: reduce`.
- `src/signup/SignUp.tsx`, `src/signup/SignUpConfirm.tsx`, `src/signin/SignIn.tsx` — modal overlays mounted **on top of `Home`** by `App.tsx`. Email+password form with strength meter, 6-digit OTP confirm step (resend cooldown + 15 min expiry), sign-in form, and a Google OAuth stub button. `Esc` and backdrop click close the modal back to `/`.
- `src/auth/client.ts` — **stubbed** auth client. `sleep()`-based fakes for `signUpWithEmail`, `signInWithEmail`, `verifyCode` (accepts `123456`, rejects `000000` as expired), `resendCode`, and `signInWithGoogle` (rejects with an alert). To be replaced when the FastAPI backend lands.
- `src/app/Placeholder.tsx` — the `/app` route, a "painel de controle (tbd)" stub that successful sign-in / verification navigates to. This is where the repertoire screen will be built next.
- `src/ui/` — shipped primitives: `Brand`, `Button` (primary/outline/ghost), `CodeBoxes`, `Field`, `FooterHairline`, `GhostLink`, `Modal` (+ `ModalBadge`), `Nav`, `PageColumn`, `StrengthMeter`, `tokens.css`. Reuse these before adding new ones.

`apps/api/` is still an empty placeholder. The next step is replacing the stub auth client with a real backend and starting to flesh out the `/app` repertoire screen.

### UI language

UI copy ships in Brazilian Portuguese per [ADR 0005](../../docs/decisions/0005-ui-language.md) (`<html lang="pt-BR">`, `entrar`, `criar conta`, etc.). No i18n framework — copy is inline in components. Persisted artifacts (docs, code identifiers, commits) remain English per [ADR 0002](../../docs/decisions/0002-documentation-language.md).

## Run locally

From the repository root:

```bash
pnpm install
pnpm dev:web
```

Then open the URL printed by Vite, usually `http://127.0.0.1:5173`.

VS Code users can also launch via the "Run web locally" debug configuration, which runs [dev/run_local.py](./dev/run_local.py).

## Useful commands

```bash
pnpm build:web     # tsc -b && vite build
pnpm preview:web   # preview the production build
```

If `pnpm` is not installed:

```bash
npm install -g pnpm@11.1.0
```
