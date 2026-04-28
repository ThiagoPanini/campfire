**Backend changes (`apps/api/`)**:
1. `make lint` — ruff (incl. banned-imports) must pass. New adapter folders need an entry in `[tool.ruff.lint.per-file-ignores]`.
2. `make test-unit` — fast, no Docker. Architecture test must stay green (it walks all `contexts/*` automatically; banned imports are `fastapi/sqlalchemy/argon2/jose/httpx` in `domain/`+`application/`).
3. `make test-integration` — Testcontainers Postgres. Slow but mandatory before declaring done. If Docker is unavailable, set `SKIP_DB_TESTS=1` to skip — do not silently disable.
4. If routes changed: `make openapi-snapshot` and review the diff in `specs/NNN-slug/contracts/openapi.json`. The contract test fails CI on drift.
5. New error type? Add it to the `<Context>Error` hierarchy AND to `adapters/http/error_mapping.py`. Never raise `HTTPException` from a use case.
6. New env var? Add to `SettingsProvider` Protocol, `EnvSettings`, `EnvSettingsProvider`, and `.env.example`.
7. Migration? Hand-write under `apps/api/alembic/versions/00NN_<slug>.py`. Both `upgrade()` and `downgrade()`. No autogenerate without review.

**Frontend changes (`apps/web/`)**:
1. `npm run typecheck` — `tsc -b` strict, no `any`.
2. `npm run build` — full Vite build; verifies tree-shaking + asset wiring.
3. Manual quickstart: walk through `specs/NNN-slug/quickstart.md` end-to-end at 360px and 1440px. This is the gate (no automated UI tests by design — Principle IV).
4. Strings touched? EN AND PT updated in the same commit.
5. New top-level src dir? Register the alias in BOTH `vite.config.ts` and `tsconfig.json`.

**Always**:
- Mintlify docs in `docs/` updated in the same change set if user-facing or architectural (constitution Principle V).
- `quickstart.md` in `specs/NNN-slug/` matches what a fresh checkout would do.
- Use `/git-commit` skill for conventional, scoped commits (existing convention: `feat(api):`, `feat(web):`, `style(web):`, `test(api):`).
