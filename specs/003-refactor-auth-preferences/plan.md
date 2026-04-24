# Implementation Plan: Refactor Campfire Authentication and Preferences MVP

**Branch**: `003-refactor-auth-preferences` | **Date**: 2026-04-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-refactor-auth-preferences/spec.md`

**Note**: This plan intentionally supersedes the earlier admin-provisioned auth bootstrap assumption for the MVP. Public self-service email/password sign-up, email/password login, Google sign-up/login, password recovery, email verification, onboarding routing, and preferences persistence are now required product behavior.

## Summary

Refactor Campfire into a lean authentication-and-preferences MVP that preserves the recent Claude Design / Claude Code frontend screens when they match the specification, while replacing visual-only authentication behavior with functional Cognito-backed identity, durable local user resolution, preferences persistence, protected routes, redirect rules, local validation, tests, and Mintlify documentation.

Technical approach:

- Keep the existing React/Vite visual baseline for landing, sign-in, sign-up, onboarding, and home.
- Replace mock/session-only auth behavior with a real Cognito User Pool configuration supporting self-service email/password, email verification, password recovery, and Google federation.
- Use Cognito for credentials and tokens; keep the Campfire backend responsible for Campfire-owned user records, identity links, onboarding state, and preferences.
- Refactor backend user persistence from provider-subject-only lookup to normalized-email uniqueness plus identity links, preventing duplicate Campfire users for the same email.
- Store onboarding state and preferences in the existing DynamoDB-backed persistence boundary, keeping the backend modular-monolith / hexagonal shape.
- Preserve LocalStack as the local AWS plane for persistence and backend validation; use a real dev Cognito/Google configuration for end-to-end authentication validation because LocalStack Community does not provide full Cognito Hosted UI / federated identity parity.
- Update tests, OpenAPI contracts, quickstarts, and Mintlify docs so the landing -> auth -> onboarding -> home flow is auditable and repeatable.

## Technical Context

**Language/Version**:
- Backend: Python 3.12 (`apps/api`, uv + setuptools)
- Frontend: TypeScript 5.x / Node 20 LTS (`apps/web`, Vite + React 18)
- Infrastructure: Terraform 1.8.x (`infra/terraform`)
- Documentation: Mintlify docs-as-code (`docs/`)

**Primary Dependencies**:
- Backend: `aws-lambda-powertools`, `boto3`, `pydantic`, `pytest`, `moto[server]`, `PyJWT`
- Frontend: React, React Router, TanStack Query, `oidc-client-ts` today; add a Cognito-capable client library only if needed to make the existing custom email/password screens functional without storing credentials in Campfire
- Identity: Amazon Cognito User Pool with native username/password, email verification, password recovery, hosted/federated Google identity, and API Gateway JWT authorizer
- Persistence: DynamoDB single-table style via repository adapters
- Local AWS plane: LocalStack Community for DynamoDB, SSM, Secrets Manager, S3, STS, and logs; local JWT signer retained only for backend contract/integration tests, not as user-facing auth acceptance
- Frontend tests: Vitest and Playwright
- Infrastructure validation: Terraform fmt/validate; future CI targets from `002-cicd-local-env` remain relevant but are not prerequisites for this feature

**Storage**:
- Cognito stores credentials, email verification, recovery state, and federated identity metadata.
- DynamoDB stores Campfire-owned user profile, normalized email uniqueness, identity links, onboarding state, and preferences.
- LocalStack DynamoDB stores the same Campfire-owned data shape for local backend validation.
- No password, Google access token, reset code, or verification code is stored in Campfire-owned persistence.

**Testing**:
- Backend unit tests for domain/application services: user resolution, email uniqueness, identity linking, onboarding state transitions, preference validation.
- Backend integration tests against LocalStack DynamoDB for user, identity link, onboarding, and preferences repositories.
- Backend contract tests for `/me`, `/me/preferences`, and onboarding deferral endpoints.
- Frontend unit tests for auth routing, onboarding redirects, protected route behavior, logout, and error states.
- Playwright e2e tests for the functional MVP journey. Visual-only auth shortcuts may remain for isolated component tests, but MVP acceptance must include at least one real Cognito-backed dev-environment validation path.
- Terraform validation for identity, persistence, API runtime, and environment composition changes.
- Docs validation for Mintlify navigation, OpenAPI references, and updated visual palette.

**Target Platform**:
- Web SPA in modern browsers.
- Python Lambda behind API Gateway HTTP API with JWT authorizer.
- AWS dev environment for functional auth validation; future production environment follows the same Terraform modules.
- Local developer environment with LocalStack for backend/persistence and optional dev Cognito credentials for full auth flow validation.

**Project Type**: Monorepo web application with frontend, backend API, AWS infrastructure, local platform tooling, tests, and docs.

For this feature, `LocalUser` is the current implementation term for the Campfire
account entity referenced as `Campfire User` in the specification and `User` in the
constitution. The naming may be refined during implementation, but the concept is the
same.

**Performance Goals**:
- Auth redirect/routing decisions complete before protected content is displayed.
- Returning authenticated users with completed onboarding reach home within 30 seconds in e2e validation.
- New users reach onboarding within 3 minutes after successful verification or Google authentication, excluding external email-delivery delays.
- Preferences save/update responds within 2 seconds p95 in local/dev validation.
- Frontend primary interactions maintain responsive feedback within 200 ms for local state changes.

**Constraints**:
- No mocks, placeholders, or visual-only flows may satisfy MVP authentication acceptance.
- Campfire never stores or logs plaintext passwords.
- Exactly one Campfire user may exist for a normalized email.
- Google login may create a first account or link to an existing account only when the provider email is verified/trustworthy.
- Unauthenticated users must not see protected content.
- Existing implemented frontend screens are the mandatory visual and functional baseline and should be preserved when aligned with the spec.
- Keep architecture simple and incremental; no new service split unless required by Cognito triggers or Terraform composition.
- Preserve unrelated user/Claude work in the dirty worktree.

**Scale/Scope**:
- 5 primary routes: `/`, `/signin`, `/signup`, `/auth/callback`, `/onboarding`, `/app`.
- 2 required auth methods: email/password and Google.
- 1 primary authenticated API surface: `/me`, `/me/preferences`, plus minimal onboarding state mutation.
- 1 DynamoDB table extended with user, identity link, onboarding, and preferences items.
- 1 Cognito User Pool app client and Google identity provider.
- Mintlify docs updated for product, architecture, auth, local validation, and Campfire design palette.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitutional rule | Applies here? | Plan alignment |
|---|---:|---|
| I. Musical growth over vanity mechanics | Yes | Preferences are limited to musical context and do not introduce vanity metrics. PASS. |
| II. Contextualized musical identity | Indirect | This MVP does not model song capability; preferences include instruments only as initial context and must not claim song-level proficiency. PASS. |
| III. Jam sessions first-class | Indirect | Jam session features remain out of scope. Preferences may mention usual playing context without creating session aggregates. PASS. |
| IV. Explainable recommendations | N/A | No recommendations are introduced. PASS. |
| V. Private-first, small-group trust | Yes | User and preference data remain private to the authenticated account. No public profiles or discovery. PASS. |
| VI. Historical memory as product asset | Indirect | No historical session data is introduced. User/profile changes are non-destructive and auditable through tests/contracts. PASS. |
| VII. Copyright-respecting by default | N/A | No copyrighted lyrics, tabs, recordings, or music content are stored. PASS. |
| VIII. DDD / Hexagonal / Clean backend | Yes | Identity/user/preference logic stays in domain/application layers with Cognito, HTTP, and DynamoDB as adapters. PASS. |
| IX. Polished, accessible, design-systematic frontend | Yes | Existing design primitives and `DESIGN.md` are preserved; auth screens become functional without discarding the visual direction. PASS. |
| X. AWS-native infrastructure, Terraform source of truth | Yes | Cognito, Google IdP configuration, triggers, API authorizer, and DynamoDB changes are planned through Terraform. PASS. |
| XI. Docs-as-code with Mintlify | Yes | Product and technical docs, OpenAPI, and docs palette updates are in scope. PASS. |
| AI-assisted development governance | Yes | Claude-generated frontend is explicitly reviewed, preserved when aligned, and refactored through Spec-Kit artifacts. PASS. |
| Spec-driven development discipline | Yes | This plan produces research, data model, contracts, and quickstart before tasks/implementation. PASS. |

**Gate status**: PASS. No justified constitutional violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-refactor-auth-preferences/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- auth-and-preferences-api.openapi.yaml
|   |-- auth-routing.md
|   |-- cognito-auth.md
|   `-- local-validation.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md                 # Created by /speckit-tasks, not by this plan
```

### Source Code (repository root)

```text
apps/web/
|-- src/app/router.tsx                         # Preserve route map; refine redirects by onboarding state
|-- src/design/                                # Preserve Claude Design primitives and tokens
|-- src/features/auth/                         # Replace visual/mock-only auth with real Cognito client boundary
|-- src/features/me/                           # Extend /me usage to include onboarding state
|-- src/features/preferences/                  # Keep and complete preference API/client state
|-- src/routes/public/
|   |-- LandingPage.tsx                        # Preserve visual baseline
|   |-- AuthPage.tsx                           # Preserve visual baseline; make email/password functional
|   `-- AuthCallbackPage.tsx                   # Keep for Google/OIDC redirect completion
|-- src/routes/protected/
|   |-- ProtectedRoute.tsx                     # Refactor to enforce auth before render
|   |-- OnboardingPage.tsx                     # Preserve visual baseline; add load/update/defer behavior
|   `-- AppHome.tsx                            # Preserve visual baseline; add state-aware preferences action
`-- tests/
    |-- unit/                                  # Auth routing, redirects, error states
    `-- e2e/                                   # MVP flow coverage

apps/api/
|-- src/domain/user/                           # Refactor LocalUser into email-unique user + identity links
|-- src/domain/preferences/                    # Keep simple preferences; align values with MVP copy
|-- src/application/user_context/              # Resolve/create user by verified email and identity link
|-- src/application/preferences/               # Save/get preferences and onboarding completion
|-- src/infrastructure/auth/                   # Claims mapping; Cognito trigger helpers if implemented here
|-- src/infrastructure/http/                   # /me, /me/preferences, onboarding deferral contracts
|-- src/infrastructure/persistence/            # DynamoDB adapters for user, identity link, onboarding, preferences
|-- src/main/                                  # Lambda/local server routing
`-- tests/
    |-- unit/
    |-- integration/
    |-- contract/
    `-- e2e/

infra/terraform/
|-- modules/identity/                          # Enable self-service signup, Google IdP, recovery, triggers
|-- modules/persistence/                       # Add email and identity access patterns as needed
|-- modules/api_runtime/                       # Keep JWT authorizer; add trigger/runtime permissions if needed
`-- environments/dev/                          # Wire Google client secret via managed secret/SSM, no committed secret

docs/
|-- docs.json                                  # Update Mintlify palette to Campfire design colors
|-- introduction.mdx                           # Update MVP description
|-- concepts/
|   |-- architecture.mdx                       # Update auth/preferences architecture
|   `-- auth-bootstrap.mdx                     # Replace admin-only language with MVP auth flow or supersede page
|-- guides/
|   |-- auth-and-onboarding.mdx                # New product/technical guide
|   `-- platform/local-environment.mdx         # Update validation steps for LocalStack + real dev Cognito
`-- openapi.yaml                               # Mirror final API contract when implementation lands
```

**Structure Decision**: Keep the existing monorepo and modular-monolith backend. Preserve the implemented frontend screens as product baseline, but move auth behavior behind a real Cognito client boundary instead of the current local mock/session shortcut. Extend the existing single DynamoDB table and repository pattern rather than introducing a relational database or additional backend service. Add only the minimum Cognito trigger/runtime code required to prevent duplicate identities and link trusted Google logins safely.

## Current Implementation Review

| Area | Preserve | Refactor | Remove or defer |
|---|---|---|---|
| Landing page | Preserve the dark typographic Claude Design page and entry CTAs. | Ensure CTAs route to real auth states. | Do not add broad marketing sections. |
| Sign-in/sign-up pages | Preserve visual layout, Google button, email/password fields, mode swap. | Replace `beginSignIn()` mock behavior with real email/password, Google redirect, verification, recovery, and friendly errors. | Remove any acceptance path where form fields do not affect authentication. |
| Auth session | Preserve centralized `features/auth` boundary. | Replace `campfire.mock.session` as the main app session source with real Cognito token/session handling. Local tokens remain only for backend tests. | Do not rely on dev-mode mock sessions for MVP acceptance. |
| Protected routing | Preserve `ProtectedRoute` as router boundary. | Add onboarding-state-aware redirects and avoid rendering protected content while auth/user state is unknown. | Remove stale `/app/me` bootstrap page assumptions except as redirect compatibility. |
| Onboarding page | Preserve implemented preference UI where accessible and aligned. | Load existing preferences, save updates, mark onboarding complete, and persist explicit deferral. | Keep repertoire/groups/recommendations out of onboarding. |
| Home page | Preserve implemented initial authenticated home. | Use `/me` onboarding/preference state and expose logout/update preferences. | Remove placeholder routes or copy that imply unavailable product areas. |
| Backend `/me` | Preserve API Gateway JWT claim mapping and local user bootstrap boundary. | Resolve by provider identity first, then verified normalized email; create identity link; return onboarding state. | Remove provider-subject-only uniqueness as the sole identity rule. |
| Preferences backend | Preserve current domain/application/infrastructure shape. | Attach preferences to authenticated user, support update/read, and mark onboarding complete on save. | Remove unsupported preference values that pull scope toward full repertoire. |
| Terraform identity | Preserve Cognito and JWT authorizer direction. | Enable public sign-up, Google provider, email verification, password recovery, account-link trigger, managed secrets. | Remove `allow_admin_create_user_only = true` for this MVP. |
| Local validation | Preserve LocalStack, Makefile, local server, and local JWT signer for backend adapter tests. | Document that real auth flow validation uses dev Cognito because LocalStack Community lacks full Cognito/Google parity. | Do not call local mock auth a complete MVP auth test. |
| Docs | Preserve Mintlify and architecture docs. | Update admin-only auth language, OpenAPI, quickstarts, and palette (`#E8813A`, dark theme). | Remove or mark superseded references to pre-provisioned-only users. |
| Process files | Preserve `AGENTS.md` and Copilot instructions unless direction changes. | Update only the active Spec-Kit plan pointer. | No broader process rewrite is required now. |

## Post-Design Constitution Check

Phase 0 and Phase 1 artifacts preserve the pre-design gate result:

- `research.md` keeps credentials in Cognito, protects single-email identity, and avoids custom password storage.
- `data-model.md` keeps domain/application concepts independent from Cognito, HTTP, and DynamoDB adapters.
- `contracts/auth-and-preferences-api.openapi.yaml` defines edge behavior before implementation.
- `contracts/auth-routing.md` preserves the polished frontend baseline while making protected routing explicit.
- `contracts/cognito-auth.md` keeps identity AWS-native and Terraform-governed.
- `contracts/local-validation.md` prevents local mocks from being mistaken for MVP auth acceptance.
- `quickstart.md` defines repeatable local/dev validation and documentation expectations.

**Post-design gate status**: PASS. No new constitutional violations were introduced by the design artifacts.

## Complexity Tracking

No constitutional violations. The only added complexity is a Cognito account-linking trigger, which is required to satisfy the "single account per email" and "Google links to existing trusted email" requirements while keeping credentials managed by Cognito.
