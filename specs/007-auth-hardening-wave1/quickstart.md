# Quickstart: Auth Hardening Wave 1

Run these checks after implementation ships. Use local or a production-like environment with explicit `CORS_ORIGINS` and `TRUSTED_PROXIES`.

## S-1 — Google promotion deletes stale credentials

1. Register `foo@example.com` with password `StrongPass123!` and do not confirm the email.
2. Complete Google sign-in as verified `foo@example.com`.
3. Try `POST /auth/login` with `foo@example.com` and `StrongPass123!`.
4. Expected: login returns the generic invalid-credentials response, the credentials row is absent, and one promotion notice was sent.

## S-2 — Rate limits use trusted proxy IPs

1. Set `TRUSTED_PROXIES=10.0.0.0/8,127.0.0.1/32` for the test environment.
2. Send auth attempts through a trusted peer with `X-Forwarded-For: 203.0.113.10, 10.0.0.5`.
3. Exhaust the limit for `203.0.113.10`.
4. Repeat from `X-Forwarded-For: 203.0.113.11, 10.0.0.5`.
5. Expected: the second client has its own budget. With `TRUSTED_PROXIES` empty, the header is ignored.

## S-3 — Registration enumeration matrix

1. Prepare three emails: known confirmed, known unconfirmed, and unknown.
2. Submit `POST /auth/register` for all three with the same valid-length but domain-weak password.
3. Expected: all three responses have identical status codes and byte-identical bodies; no 500 is returned.

## S-4 — Refresh/logout reject hostile Origins

1. Sign in normally and keep the refresh cookie.
2. Send `POST /auth/refresh` with `Origin: https://evil.example`.
3. Send `POST /auth/logout` with `Origin: https://evil.example`.
4. Expected: both are rejected before session mutation. A later allowed refresh from an origin in `CORS_ORIGINS` still succeeds.

## S-6 — Google start is rate-limited

1. Repeatedly call `POST /auth/google/start` from the same resolved client IP.
2. Expected: the request after the configured limit returns `429` and includes `Retry-After`.

## S-7 — Production fails closed on missing HMAC keys

1. Start the API with `ENV=prod` and without `EMAIL_CONFIRMATION_HMAC_KEY`.
2. Expected: startup fails before serving traffic.
3. Repeat with `OAUTH_FLOW_HMAC_KEY` missing.
4. Start with both set.
5. Expected: startup succeeds.

## C-1 — Auth config shape

1. Call `GET /auth/config`.
2. Expected:

```json
{
  "google": { "enabled": false },
  "passwordSignUp": {
    "enabled": true,
    "requiresEmailConfirmation": true
  }
}
```

3. Toggle `EMAIL_CONFIRMATION_REQUIRED=false` in a non-production incident test.
4. Expected: `passwordSignUp.requiresEmailConfirmation` becomes `false`; frontend reads the nested field.

## Q-1 — Email confirmation writes are atomic

1. Force a failure after confirmation-row update and before `user.email_confirmed_at` update in the test harness.
2. Expected: the confirmation row and user row both remain in their pre-attempt state after rollback.

## Final Regression Commands

```bash
rtk make lint
rtk make test-unit
rtk make test-integration
rtk make openapi-snapshot
```

OpenAPI snapshot still writes to `specs/002-backend-auth-slice/contracts/openapi.json` in this wave. Q-2 relocation is Wave 2.

## Verification Results

- `rtk make lint` — passed.
- `rtk make test-unit` — passed, 150 tests selected.
- `rtk make test-integration` — passed, 64 tests.
- `rtk make openapi-snapshot` — passed; snapshot written to `specs/002-backend-auth-slice/contracts/openapi.json`.
- `rtk uv run pytest tests/contract/test_openapi_snapshot.py -q` — passed.
- `rtk npm run typecheck -- --pretty false` — passed.
- `rtk npm run build` — passed.
- 360px and 1440px manual UI check — not run yet; auth-config change is type-level and no visual surprise is expected.
