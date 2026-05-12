# campfire web

Frontend for the campfire MVP.

## Run locally

From the repository root:

```bash
pnpm install
pnpm dev:web
```

Then open the URL printed by Vite, usually `http://127.0.0.1:5173`.

## Useful commands

```bash
pnpm build:web
pnpm preview:web
```

If `pnpm` is not installed:

```bash
npm install -g pnpm@11.1.0
```

The current frontend stores demo accounts and repertoire entries in `localStorage` so the MVP interaction can be tested before API integration.
