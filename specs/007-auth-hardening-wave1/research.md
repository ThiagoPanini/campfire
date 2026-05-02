# Research: Auth Hardening Wave 1

## S-1 — Stale credentials after Google promotion

**Decision**: Hard delete the existing password credential row when `CompleteGoogleSignIn` promotes an unconfirmed password account by verified Google email. Add `CredentialsRepository.delete_for_user(user_id)` to the domain port and SQLAlchemy adapter; invoke it in `CompleteGoogleSignIn` immediately after deciding the existing unconfirmed user is being promoted and before issuing the session. Send the clarified transactional notice once promotion succeeds.

**Rationale**: The maintainer clarified that promotion must hard delete the credentials row. This makes the former attacker-known password unable to authenticate, preserves legitimate refresh-token families, and models the account as Google-owned until the user later chooses a safe password-reset path.

**Alternatives considered**:
- Rotate `password_hash` to a sentinel: rejected because it preserves a misleading credential row, complicates password verification semantics, and creates a non-domain password state.
- Require explicit password reset before promotion: rejected because it interrupts the legitimate Google owner and expands Wave 1 into password-reset product work.
- Leave credentials and mark user confirmed: rejected; this is the audit vulnerability.

## S-2 — Trusted proxy client IP resolution

**Decision**: Add `TRUSTED_PROXIES` as a comma-separated CIDR env var exposed by `SettingsProvider`. Use stdlib `ipaddress` for CIDR and address matching. If the immediate peer is trusted, parse `X-Forwarded-For` plus the peer chain from right to left and choose the rightmost untrusted hop as the client IP. If the header is absent, malformed, or every hop is trusted, fall back to the immediate peer. If `TRUSTED_PROXIES` is empty, ignore `X-Forwarded-For` and use `request.client.host`.

**Rationale**: The clarified env var makes proxy trust explicit per environment. The rightmost-untrusted-hop rule avoids trusting spoofed leftmost values while still recovering the real client behind a known proxy. `ipaddress` handles IPv4, IPv6, and CIDR matching without adding dependencies.

**Alternatives considered**:
- Leftmost XFF hop whenever the header exists: rejected because untrusted clients can spoof it.
- Render-specific defaults: rejected because platform ranges can change and the setting should be explicit.
- Add a third-party CIDR parser: rejected; stdlib `ipaddress` is sufficient.

## S-3 — Registration password-rule parity

**Decision**: Move `Password(password)` validation to the top of `RegisterUser`, after the HTTP route's rate-limit check and before any user lookup branch returns. Catch the value object's `ValueError` and translate it into a domain `IdentityError`, preferably `InvalidRegistration`; reusing an existing generic registration error is acceptable if it maps identically. Map it to HTTP 400 with the same generic response body used by the duplicate/confirmation-required path so the known-confirmed, known-unconfirmed, and unknown-email matrix remains parity-clean.

**Rationale**: The domain value object stays the source of password-rule truth, but all branch paths now observe the same validation and controlled error. The `ValueError` must never propagate to FastAPI as a 500.

**Alternatives considered**:
- Validate only in Pydantic: rejected because Pydantic is a transport hint and would duplicate domain rules.
- Validate separately inside each branch: rejected because branch drift caused the finding.
- Let `ValueError` map globally: rejected because it would be too broad and could hide unrelated bugs.

## S-4 — Origin check for refresh/logout

**Decision**: Add a small FastAPI dependency in the HTTP adapter, for example `require_allowed_origin(request)`. It reads `request.app.state.settings_provider`, obtains `cors_origins`, and rejects missing or disallowed `Origin` for session-mutating cookie endpoints in production-like operation. Reuse the same dependency for `POST /auth/refresh` and `POST /auth/logout`. `GET /auth/refresh` does not exist and needs no bypass; the refresh endpoint is POST-only.

**Rationale**: Origin checking is an adapter concern and aligns with the clarified CSRF strategy: Origin header against `CORS_ORIGINS`, no Wave-1 double-submit token. Reusing one dependency keeps the policy identical for refresh and logout and ensures rejection happens before token rotation/revocation.

**Alternatives considered**:
- JS-readable double-submit CSRF token: rejected for Wave 1 by clarification and extra frontend/product surface.
- Keep the existing Authorization-header heuristic: rejected because hostile cross-origin requests can omit the header.
- Bypass refresh because it is "only rotation": rejected because rotation mutates session state and can force sign-out.

## S-6 — Rate limit for Google start

**Decision**: Reuse the existing `InMemoryRateLimiter` instance from app state and the existing `RATE_LIMIT_PER_WINDOW` / `RATE_LIMIT_WINDOW_SECONDS` settings. Call it from `POST /auth/google/start` with the resolved `client_ip(request)` and a synthetic email-like target string `"google_start"`.

**Rationale**: This closes the unbounded row-spam finding with the smallest consistent change. Reusing the existing limiter preserves the current single-process MVP posture and avoids introducing new settings for an endpoint that can share the auth abuse budget.

**Alternatives considered**:
- Separate limiter instance with a smaller bucket: rejected for Wave 1 because it adds another policy surface and settings without a clear measured need.
- Persisted or Redis-backed limiter: rejected by the current stack and MVP scope.
- Rate-limit by OAuth intent or `next`: rejected because attacker-controlled target values would fragment the bucket.

## S-7 — Production HMAC secret validation

**Decision**: In `main.py` lifespan, when `ENV=prod`, require `EMAIL_CONFIRMATION_HMAC_KEY` and `OAUTH_FLOW_HMAC_KEY` to be set. Raise before yielding from lifespan if either is absent. Keep non-production behavior unchanged, including development fallback keys where they already exist.

**Rationale**: Lifespan already performs deployment-time configuration checks for `MAIL_BACKEND=http`; HMAC secrets are operational requirements, not domain rules. Failing before serving traffic prevents public development keys from silently protecting production flows.

**Alternatives considered**:
- Pydantic field validators: rejected because they fire while constructing settings in dev/test and would break local workflows.
- Lazy failure in `get_code_hasher` or OAuth flow creation: rejected because production could start and fail only after receiving traffic.
- Require keys in every environment: rejected because the clarified requirement preserves dev-mode behavior.

## C-1 — Auth config response shape

**Decision**: Introduce a nested Pydantic model such as `PasswordSignUpConfig(enabled: bool, requiresEmailConfirmation: bool)` and change `AuthConfigResponse` to `{ google: GoogleConfig, passwordSignUp: PasswordSignUpConfig }`. Source `requiresEmailConfirmation` from `settings.email_confirmation_required()`. Update the frontend `AuthConfig` type in `apps/web/src/features/auth/api/auth.api.ts`, OpenAPI snapshot, and Render/env docs that describe the rollback flag.

**Rationale**: The slice-006 contract already documents the nested shape and the frontend needs `requiresEmailConfirmation` for the incident rollback path. The endpoint remains public and boolean-only; it exposes no secrets or operational identifiers.

**Old-shape consumers**:
- Backend schema and router: `apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py`, `routers/config.py`.
- Frontend type/consumer: `apps/web/src/features/auth/api/auth.api.ts` and any `passwordSignUp` boolean checks.
- Contract snapshot: `specs/002-backend-auth-slice/contracts/openapi.json` via `apps/api/tests/contract/test_openapi_snapshot.py`.
- Docs/env references: `specs/006-google-auth-login-ux/contracts/auth-config.md`, `docs/identity/env-vars.mdx`, `docs/operations/render-secrets.mdx`, Render env declarations.

**Alternatives considered**:
- Change the contract to match the current boolean: rejected because it removes the documented email-confirmation capability needed by the frontend.
- Add a second top-level boolean: rejected because it creates a less coherent public shape and more drift from existing docs.

## Q-1 — Email confirmation repository commits

**Decision**: Remove `session.commit()` calls from `SqlAlchemyEmailConfirmationRepository.update()` and `.invalidate_pending_for()`. Do not restructure the use cases; `get_db_session` / `session_scope` already commits on successful request scope and rolls back on failure.

**Rationale**: The repository should participate in the adapter-owned transaction. Removing inline commits restores the unit-of-work boundary and lets a failure after confirmation-row mutation roll back both confirmation and user state.

**Alternatives considered**:
- Add an explicit UnitOfWork port now: rejected because the existing HTTP request scope is already the active boundary and no non-HTTP trigger is being added.
- Leave inline commits and compensate on later failure: rejected because compensation is more fragile than atomic rollback.
- Restructure confirmation use cases first: rejected because the audit fix is narrower and independently testable.
