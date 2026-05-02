**Open audit findings (2026-05-01).** Future agents: read this before assuming the auth slice is "done".

**Authoritative source**: [`AUDIT.md`](../../../../../workspaces/campfire/AUDIT.md) at repo root — full evidence, recommendations, and a 3-wave action plan.

The architecture (DDD/hex, layer purity, OAuth flow, refresh rotation with family revocation, HMAC'd confirmation codes) is solid. Risks are concentrated in **auth correctness/enumeration**. Eight items are queued for a Wave 1 hardening slice (recommended before any new feature).

## Wave 1 — production-blocking before next feature

| ID | Severity | Title |
|---|---|---|
| S-1 | Critical | Google promotion of an unconfirmed account does not invalidate `Credentials` → original (potentially attacker-set) password still authenticates the legitimate user. Drop/rotate the credentials row at promotion. |
| S-2 | High | Rate limiter keys on `request.client.host` (the Render proxy IP) → all attempts share one bucket. Read `X-Forwarded-For` with a `TRUSTED_PROXIES` allow-list. |
| S-3 | High | `RegisterUser` skips domain `Password()` validation in the duplicate-confirmed branch but invokes it for unknown emails; uncaught `ValueError` → 500. Status delta enumerates account existence. Validate password once at the top. |
| S-4 | High | `/auth/refresh` (and `/auth/logout`) lack any Origin/CSRF check under prod's `SameSite=none` cookie. Cross-site fetch can rotate refresh → forced sign-out via reuse-detection. Add Origin validation. |
| S-6 | Medium | `/auth/google/start` has no rate limiter (contract specifies 429). Add `(client_ip, "google_start")` bucket. |
| S-7 | Medium | `get_code_hasher` falls back to a hardcoded HMAC key. Fail closed in `prod` if `EMAIL_CONFIRMATION_HMAC_KEY` / `OAUTH_FLOW_HMAC_KEY` unset. |
| C-1 | Medium | `/auth/config` ships `passwordSignUp: bool`; contract documents `{enabled, requiresEmailConfirmation}`. Pick one and align frontend + OpenAPI snapshot. |
| Q-1 | Medium | `email_confirmation_repository.update()` and `.invalidate_pending_for()` call `session.commit()` inline → breaks UoW. Drop the inline commits. |

## Wave 2 — quality / consistency (non-blocking)

S-8 (test fixture in prod bundle), S-9 (next= ignored on password sign-in), S-10 (no security headers), S-11 (no refresh grace window), S-13 (confirm UI can't distinguish 429 from 400), C-2 (`{message}` vs `{detail}` envelope), C-3 (cookie attribute env-driven note in contract), Q-2 (move OpenAPI snapshot out of slice 002), Q-5 (fix `test_register_rate_limit` to actually test the limiter).

## Wave 3 — defer until measured

S-5 (blocking JWKS verify), atomic resend hourly-cap, contract↔OpenAPI CI gate, mypy debt deadline, common-password blocklist single source, observability beyond logs.

## Behaviors agents must NOT pattern-match off

- `email_confirmation_repository.py`'s `session.commit()` calls — wrong, see Q-1.
- `client_ip(request)` returning `request.client.host` — wrong on Render, see S-2.
- `get_code_hasher` HMAC fallback string — dev-only convenience, see S-7.
- `seededUser` / `seededCredentials` exported from `apps/web/src/mocks/fixtures/user.ts` and imported by `auth.api.ts` — production-bundle leak, see S-8.
- `RegisterUser`'s four-branch body with `Password()` validation only on some paths — see S-3.

## Already verified to be working well

Argon2id; opaque tokens with sha256 fingerprint; refresh rotation + family revocation on reuse; PKCE+nonce+atomic state consume; partial unique index on `email_confirmations.user_id WHERE status='pending'`; CORS rejecting `*` with credentials; architecture purity test enforcing `domain/`+`application/` cleanliness; CI matrix with deploy probes; login enumeration parity (byte-identical 401s).
