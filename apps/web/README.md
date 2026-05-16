# campfire web

Frontend for the campfire project. Stack: React + TypeScript + Vite in a pnpm workspace (`@campfire/web`). See [ADR 0004](../../docs/decisions/0004-frontend-stack.md).

## Current implementation

This app currently renders a **single landing-page slice** — not the MVP flow described in [../../docs/mvp-scope.md](../../docs/mvp-scope.md).

- `src/App.tsx` mounts `src/home/Home.tsx` directly. No router.
- `src/home/Home.tsx` renders a full-bleed video poster (`public/background.mp4`, poster fallback `public/background.png`) with a top nav (brand wordmark + two non-functional `entrar` / `criar conta` links, both `href="#home"`) and an `alpha • coming soon` footer.
- `src/home/Home.css` carries the visual treatment: warm-dark canvas, monospace type, layered CRT-style overlays (scanlines, halftone, grain, tracking glitch, vignette). The video pauses when `prefers-reduced-motion: reduce` is set.
- No account creation, sign-in, repertoire CRUD, client persistence, or backend integration exists yet. `apps/api/` is still a placeholder.
- `Home.css` defines optional font-set variants under `.poster[data-fonts="a|b|c|d"]`. They are unused today (no switcher is mounted); leave them in place only while the visual direction is still being explored, and prune them once the direction is settled.

The next step implied by the current state is wiring the CTAs to real flows and starting to deliver the MVP scope.

### UI language

The landing page ships Portuguese copy (`<html lang="pt-BR">`, `entrar`, `criar conta`, meta description). There is no UI-language ADR yet — treat this as an implementation fact and raise the open question before extending PT copy to new screens. Persisted artifacts (docs, code identifiers, commits) remain English per [ADR 0002](../../docs/decisions/0002-documentation-language.md).

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
