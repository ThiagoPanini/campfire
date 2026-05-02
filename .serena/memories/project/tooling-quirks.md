**Friction points worth knowing before they bite you.**

**Serena `project.yml` says `languages: [bash]`** — Serena's symbolic tools (`find_symbol`, `get_symbols_overview`, `find_referencing_symbols`, `replace_symbol_body`) will NOT work for Python or TypeScript files until this is fixed to `[python, typescript, bash]` (or one of those is set as primary). Until then, fall back to `search_for_pattern` and `Grep`/`Read`.

**Two `__init__.py` placeholders** at `apps/api/src/campfire_api/contexts/identity/__init__.py` and `…/repertoire/__init__.py` — DO NOT add re-exports there. Cross-context imports must go through `domain/value_objects.py` (UserId only) per architecture invariant 3.

**ruff banned-imports** is repo-wide; whitelisting an adapter folder requires editing `[tool.ruff.lint.per-file-ignores]` in `pyproject.toml`. New adapters that touch `sqlalchemy/fastapi/argon2/jose/httpx/google` will fail `make lint` until added. The architecture test bans `google` alongside the rest in `domain/`+`application/`.

**Architecture test** (`apps/api/tests/unit/test_architecture.py`) auto-walks all `contexts/*/` — adding a new context requires NO test edit; adding a new banned import means editing the `BANNED` set.

**OpenAPI snapshot lives in slice 002, not in the active slice.** The contract test at `apps/api/tests/contract/test_openapi_snapshot.py` compares the full app's OpenAPI against `specs/002-backend-auth-slice/contracts/openapi.json`. Slice 006 added new endpoints by regenerating that file in slice 002's folder. New routers silently break this test until you run `make openapi-snapshot`. Cleanup tracked in AUDIT.md (Q-2).

**Testcontainers** require Docker. CI/local without Docker: `SKIP_DB_TESTS=1 make test` or use `TEST_BACKEND=compose` with the running compose Postgres.

**Frontend path aliases** must be kept in sync between `apps/web/vite.config.ts` and `apps/web/tsconfig.json`. tsc compiles fine but Vite resolution fails (or vice versa) when they drift.

**EN/PT i18n drift**: `translate(language)` does NOT fall back; missing keys produce `undefined`. Always add both locales together. `npm run check:i18n` script exists; wire it into your pre-commit if you keep forgetting.

**`AGENTS.md` is rewritten by `/speckit.plan`** — its `<!-- SPECKIT START --> … <!-- SPECKIT END -->` markers are load-bearing. Don't hand-edit the block; the plan command owns it. `CLAUDE.md` is a symlink to `AGENTS.md`.

**Mintlify MCP entry in `.mcp.json`** is currently a placeholder (`_note` field flags this). Replace with a real config once `npx mint-mcp add <siteId>` is run.

**CI is wired up** (`.github/workflows/ci.yml`). Frontend typecheck+build, backend lint/mypy/unit/integration/contract/migrations, branch policy, env-example validation, docs nav, secrets scan, deploy probes for develop and prod, automated promotion PRs. Render uses `autoDeployTrigger: off` + GitHub Actions deploy hooks. Mypy is currently `continue-on-error: true` — non-blocking until backend type cleanup completes.

**Email confirmation repo commits inline**: `email_confirmation_repository.update()` and `.invalidate_pending_for()` call `self.session.commit()` directly, breaking the UoW boundary owned by `session_scope`. Tracked as AUDIT.md Q-1; until fixed, downstream failures after a confirmation update can leave inconsistent state. Don't model new repos after this one — see `session_repository.py`/`refresh_token_repository.py` for the correct `flush()`-only pattern.

**Rate limiter uses `request.client.host`, not `X-Forwarded-For`** ([deps.py](apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py#L160-L161)). On Render, that's the proxy IP — every login/register/confirm attempt collapses to one bucket per deployment. Tracked as AUDIT.md S-2; treat the limiter as best-effort until fixed.

**HMAC fallback strings**: `get_code_hasher` falls back to `"dev-email-confirmation-key"` when `EMAIL_CONFIRMATION_HMAC_KEY` is unset. Fine for local dev; dangerous if it ever ships to prod with the env var unset. Tracked as AUDIT.md S-7. Don't add similar fallbacks for `OAUTH_FLOW_HMAC_KEY` — fail closed in prod instead.

**Test fixture in production bundle**: `apps/web/src/mocks/fixtures/user.ts` exports `seededUser` (real seed creds) and is imported transitively by `auth.api.ts` (`seededCredentials`). `SignInForm` defaults the email field to `ada@campfire.test`. Tracked as AUDIT.md S-8; until fixed, treat any new test fixtures the same way the audit recommends — gate behind `import.meta.env.DEV` or move to `__tests__/`.

**Error envelope shape**: backend returns `{"message": "…"}`; the contract MDs document `{"detail": "…"}`. Frontend `request<T>` tolerates both. The OpenAPI snapshot ships `message`. Tracked as AUDIT.md C-2 — when you change error shapes, regenerate the snapshot AND update all four `specs/006-google-auth-login-ux/contracts/auth-*.md` files in the same change.

**`/auth/config` shape mismatch**: backend returns `passwordSignUp: bool`; `auth-config.md` documents an object with `enabled` and `requiresEmailConfirmation`. Frontend matches the (incorrect) backend. Tracked as AUDIT.md C-1.
