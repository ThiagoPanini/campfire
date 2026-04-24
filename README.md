# Campfire

Campfire is a pre-launch music hub for small groups of friends who meet for amateur jam sessions. The repository is a compact monorepo with a React/Vite frontend, a Python Lambda-style backend, Terraform-managed AWS infrastructure, Mintlify documentation, and Spec-Kit artifacts that describe feature work before implementation.

## Current Status

The active MVP slice is **`003-refactor-auth-preferences`** — real Cognito email/password and Google authentication, onboarding preferences, and the returning-user home flow. See `specs/003-refactor-auth-preferences/` for the full spec, plan, contracts, and tasks.

**MVP scope (implemented):**
1. **Landing** — public entry, sign-up CTA, sign-in nav link.
2. **Authentication** — Cognito email/password sign-up/sign-in, email verification, Google OAuth redirect, single Campfire account per verified email.
3. **Onboarding** — preferences capture (instrument, genre, play context, goals, experience), save or defer before home.
4. **Home** — returning user enters directly with completed or deferred onboarding; update preferences; sign out.

**Real auth is required.** There is no mock-session acceptance path in the MVP. The local backend (`make run`) supports testing with LocalStack and `amazon-cognito-identity-js`; end-to-end acceptance requires a configured Cognito user pool (dev or staging).

**LocalStack boundary:** LocalStack provides DynamoDB and SSM locally. Cognito flows are real; there is no Cognito emulator in the local stack.

## Repository Layout

| Path | Purpose |
| --- | --- |
| `apps/web` | React + Vite frontend |
| `apps/api` | Python backend with Lambda handler and local HTTP adapter |
| `apps/shared/contracts` | Implementation-facing API contracts |
| `infra/terraform` | AWS infrastructure modules and environment composition |
| `docs` | Mintlify documentation |
| `specs` | Spec-Kit feature specs, plans, contracts, and tasks |
| `scripts/local` | Canonical local developer command helpers used by `make` |
| `scripts/ci` | CI and release helper scripts |
| `.agents` | Versioned agent skills and AI-development assets |

## Local Development

Use the root `Makefile` for local work:

```bash
make doctor
make up
make run
make test
make down
```

Useful focused commands:

```bash
make run/web
make debug
make token
make smoke
make clean
```

LocalStack runs on `http://localhost:4566` and is seeded by `make seed`. If Docker is unavailable, `make up` starts the Moto fallback on the same endpoint so the backend can still run locally.

See the canonical guide in `docs/guides/platform/local-environment.mdx`.

## Documentation

Mintlify docs live under `docs/`.

- Start at `docs/introduction.mdx`
- Local platform guide: `docs/guides/platform/local-environment.mdx`
- LocalStack service contract: `docs/guides/platform/localstack-services.mdx`
- API overview: `docs/api-reference/introduction.mdx`
- ADR index: `docs/adr/README.md`

The OpenAPI contract is authored in the spec and mirrored for docs generation at `docs/openapi.yaml`. Treat `specs/*/contracts` as design artifacts and `apps/shared/contracts` as implementation-facing copies.

## Agent Workflow

Follow `AGENTS.md` for repository-specific agent rules. Keep durable decisions in docs, ADRs, specs, or focused skills rather than repeating them in chat.
