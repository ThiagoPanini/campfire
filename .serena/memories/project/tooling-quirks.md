**Friction points worth knowing before they bite you.**

**Serena `project.yml` says `languages: [bash]`** — Serena's symbolic tools (`find_symbol`, `get_symbols_overview`, `find_referencing_symbols`, `replace_symbol_body`) will NOT work for Python or TypeScript files until this is fixed to `[python, typescript, bash]` (or one of those is set as primary). Until then, fall back to `search_for_pattern` and `Grep`/`Read`.

**Two `__init__.py` placeholders** at `apps/api/src/campfire_api/contexts/identity/__init__.py` and `…/repertoire/__init__.py` — DO NOT add re-exports there. Cross-context imports must go through `domain/value_objects.py` (UserId only) per architecture invariant 3.

**ruff banned-imports** is repo-wide; whitelisting an adapter folder requires editing `[tool.ruff.lint.per-file-ignores]` in `pyproject.toml`. New adapters that touch `sqlalchemy/fastapi/argon2/jose/httpx` will fail `make lint` until added.

**Architecture test** (`apps/api/tests/unit/test_architecture.py`) auto-walks all `contexts/*/` — adding a new context requires NO test edit; adding a new banned import means editing the `BANNED` set.

**OpenAPI snapshot test** compares full app output. Adding a router silently breaks it until you run `make openapi-snapshot`.

**Testcontainers** require Docker. CI/local without Docker: `SKIP_DB_TESTS=1 make test` or use `TEST_BACKEND=compose` with the running compose Postgres.

**Frontend path aliases** must be kept in sync between `apps/web/vite.config.ts` and `apps/web/tsconfig.json`. tsc compiles fine but Vite resolution fails (or vice versa) when they drift.

**EN/PT i18n drift**: `translate(language)` does NOT fall back; missing keys produce `undefined`. Always add both locales together.

**`AGENTS.md` is rewritten by `/speckit.plan`** — its `<!-- SPECKIT START --> … <!-- SPECKIT END -->` markers are load-bearing. Don't hand-edit the block; the plan command owns it. `CLAUDE.md` is a symlink to `AGENTS.md`.

**Mintlify MCP entry in `.mcp.json`** is currently a placeholder (`_note` field flags this). Replace with a real config once `npx mint-mcp add <siteId>` is run.

**No CI configured yet** — visible CI signals are `make lint` + `make test` + `npm run build` locally. Adding GitHub Actions is a constitution-mandated build-order step (sequence: FE → BE → LocalStack → Terraform → GHA).
