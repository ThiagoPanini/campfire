# Quickstart — Repertoire Song Entry

**Feature**: `003-repertoire-song-entry`
**Audience**: a developer (or AI agent) wiring the slice up locally for
the first time. Mirrors the identity slice's quickstart.

This is the path from a fresh clone to "I just added Wonderwall to my
repertoire from a real browser, against a real backend, against the
real Deezer API." It does not cover deployment.

## Prerequisites

- macOS / Linux / WSL2.
- Docker Desktop (for the Postgres container).
- `uv` ≥ 0.4 (Python package manager — same as identity slice).
- `pnpm` ≥ 9 (frontend package manager).
- Network egress to `https://api.deezer.com` (for live search). The
  fake-catalog test override does not need network.

## 1. Clone and install

```bash
git clone <repo>
cd campfire
pnpm install
(cd apps/api && uv sync)
```

## 2. Start Postgres

```bash
docker compose up -d postgres
```

Wait until `docker compose ps postgres` reports `healthy`.

## 3. Apply migrations and seed identity

```bash
cd apps/api
make migrate    # runs alembic upgrade head — applies 0000, 0001, 0002, 0003
make seed       # idempotent — re-asserts the seeded `ada@campfire.test` user
```

`make migrate` brings the new `repertoire_entries` table into being
(migration `0003_repertoire_initial`). The seed migration is the
identity-side `0002_seed_ada` — repertoire ships with no seed data
because the design's sample list is prototype fixture, not production
content.

## 4. Run the API

```bash
cd apps/api
make run        # uvicorn with --reload, listens on :8000
```

The repertoire context registers under the existing FastAPI app.
Sanity check:

```bash
curl http://localhost:8000/openapi.json | jq '.paths | keys[]'
```

Should include `/repertoire/songs/search`, `/repertoire/entries`,
`/repertoire/entries/{entry_id}`.

## 5. Run the web app

```bash
cp apps/web/.env.local.example apps/web/.env.local   # idempotent
pnpm --filter @campfire/web dev
```

The frontend reads `VITE_API_URL=http://localhost:8000` from
`.env.local`. Open `http://localhost:5173`.

### 5a. Mock-only mode (frontend without backend)

If you want to render the repertoire UI before the backend is up,
edit `.env.local`:

```
VITE_API_URL=mock://repertoire
```

The frontend short-circuits to
`apps/web/src/features/repertoire/repertoire.mock.ts` (in-memory list
+ a fixture search response derived from
`SAMPLE_SEARCH_RESULTS` in the design slice). All five flows (empty,
search, configure, list, remove) work; data does not persist across
reloads.

## 6. Walk the golden path

1. Sign in: `ada@campfire.test` / `campfire123` (the seeded user — no
   change from spec 002).
2. The home page shows the existing welcome panel. Click the
   **YOUR REPERTOIRE** tile (FR-015 — newly wired in this slice).
3. The repertoire page shows the empty state ("YOUR REPERTOIRE IS
   EMPTY").
4. Click **ADD YOUR FIRST SONG**.
5. The add-song modal opens. Type `wonderwall` (300 ms client
   debounce per FR-016 — the request fires after you stop typing).
6. Pick the first result (Oasis — Wonderwall).
7. The configure form replaces the result list. Pick **Guitar**
   from the instrument chips.
8. Pick **Practicing** from the proficiency picker.
9. Click **ADD TO REPERTOIRE**. The modal shows the saving spinner,
   then closes; a toast announces "SONG ADDED · Wonderwall · GUITAR
   · PRACTICING".
10. The repertoire list now shows one entry. Click its edit icon to
    update proficiency to **Performance-ready**; verify the row
    re-renders.
11. Click the trash icon on the entry, confirm the dialog. The list
    returns to the empty state. Reload the page — the entry stays
    gone (FR-010 hard delete).

If any step fails, see "Troubleshooting" below.

## 7. Verify the duplicate-add path (FR-008)

1. Add `Wonderwall · Guitar · Learning` (steps 4–9 above).
2. Click **ADD SONG** again, search `wonderwall`, pick the same
   result, leave **Guitar** selected, pick **Practicing**, save.
3. The frontend recognizes the response's
   `X-Repertoire-Action: updated` header and shows the design's
   "ALREADY IN YOUR LIST" affordance with an **UPDATE EXISTING**
   button. Click it (or, equivalently, the save we already
   submitted) — the existing entry's proficiency flips to
   **Practicing**, no duplicate row is created. Open the list:
   exactly one entry, level **Practicing**.
4. Optional sanity check at the DB level:

   ```bash
   docker compose exec postgres psql -U campfire -d campfire \
     -c "SELECT user_id, song_title, instrument, proficiency FROM repertoire_entries;"
   ```

   Exactly one row.

## 8. Verify the catalog-down path (FR-014)

Without restarting the backend, simulate a Deezer outage by setting
the env var to a routable-but-unreachable host:

```bash
DEEZER_BASE_URL=http://localhost:1 make run
```

In the UI, type a query in the add-song modal. The frontend shows
the spec's "search is temporarily unavailable" state. The repertoire
list still loads (FR-014 — only the search/add path degrades).

Restore the env var to `https://api.deezer.com` to recover.

## 9. Run the tests

```bash
cd apps/api
make test                 # pytest -q
make test-unit            # only unit/
make test-integration     # only integration/ — requires Docker (Testcontainers)
make test-contract        # only the OpenAPI snapshot diffs
```

The architecture test (`tests/unit/test_architecture.py`) now walks
all bounded contexts under `contexts/`; if you add an `httpx` import
in `repertoire/domain/` or `repertoire/application/`, the test fails.

## 10. Regenerate the OpenAPI snapshots

When you intentionally change the wire shape:

```bash
cd apps/api
make openapi-snapshot     # writes the FULL live document to specs/002-…/openapi.json
                          # AND extracts the repertoire-only subset to specs/003-…/openapi.json
```

Commit the regenerated files in the same change set as the code that
caused the drift. The CI snapshot tests fail otherwise.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `psycopg2 not installed` during migrate | Wrong driver | Make sure the DSN starts with `postgresql+asyncpg://`. |
| `503 song catalog unavailable` for every query | `DEEZER_BASE_URL` is wrong or no network egress | `unset DEEZER_BASE_URL` and re-run `make run`. |
| `429 too many attempts` while testing | Per-user rate limit (30 / 60 s) | Wait one minute or bump `SEARCH_RATE_LIMIT_PER_WINDOW`. |
| Empty results for known songs | Two-character minimum is enforced | Type at least 2 characters. |
| Cover art images don't load | Provider's image URL changed or 404'd | The `<img>` falls back to a CSS placeholder; the entry text fields render fine (FR-013). |
| Frontend says "session expired" mid-search | Refresh-token cookie lost (incognito, third-party-cookie blocker) | See `apps/web/.env.local.example` — fall back to `VITE_AUTH_FALLBACK=session-storage`. |
| Architecture test fails on a domain file | A banned dependency (`httpx`, `fastapi`, `sqlalchemy`, `argon2`, `jose`) was imported into `domain/` or `application/` | Move the import into an adapter; expose a Protocol port from the domain. |

## What this quickstart does NOT cover

- LocalStack — still deferred (no AWS surface in this slice).
- Terraform / production deployment — still deferred (infrastructure
  slice is later).
- A live Deezer contract test — we don't pin to their API; the spec
  covers degradation, not upstream conformance.
- Frontend automated tests — none in this slice (matches identity
  slice).
