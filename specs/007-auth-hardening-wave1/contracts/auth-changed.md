# Contract: Existing Auth Endpoint Hardening

**Findings**: S-2, S-3, S-4, Q-1

## Client IP Resolution for Auth Rate Limits

All auth endpoints that call `client_ip(request)` use this adapter-level rule:

1. If `TRUSTED_PROXIES` is empty or the immediate peer is not trusted, ignore `X-Forwarded-For` and use `request.client.host`.
2. If the immediate peer is trusted and `X-Forwarded-For` is present, parse the chain from right to left and select the rightmost untrusted hop.
3. If the header is absent, malformed, or every hop is trusted, fall back to `request.client.host`.

`TRUSTED_PROXIES` is a comma-separated env var of CIDR blocks or individual IPs. CIDR matching uses stdlib `ipaddress`; no new dependency is introduced.

## `POST /auth/register`

Registration keeps the no-enumeration duplicate behavior and adds password-rule parity.

### Domain Password Failure

For a password that passes transport validation but fails domain `Password()` rules, known-confirmed, known-unconfirmed, and unknown email submissions must return the same status code and byte-identical body.

```json
{ "detail": "invalid email or password" }
```

The implementation may map this through the existing error envelope if the current API still standardizes on `message`, but all three matrix cases must remain byte-identical and controlled. `ValueError` from the value object must never propagate to the framework.

## `POST /auth/refresh`

Adds Origin protection before any refresh-token mutation.

### Rejected Origin

If `Origin` is absent from `CORS_ORIGINS`, reject before token consume/rotation/revocation.

```json
{ "detail": "forbidden origin" }
```

### Allowed Origin

Existing refresh rotation behavior and refresh cookie attributes remain unchanged.

## `POST /auth/logout`

Reuses the same Origin dependency as refresh. A rejected request must not revoke the current session or refresh-token family.

## Email Confirmation Repository Writes

`SqlAlchemyEmailConfirmationRepository.update()` and `.invalidate_pending_for()` must not call `session.commit()`. The existing request/session scope owns commit and rollback for confirmation flows.
