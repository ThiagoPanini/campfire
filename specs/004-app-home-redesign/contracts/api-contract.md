# API Contract: Simplified Identity Surface

## Preserved Auth Endpoints

### `POST /auth/register`

Request body:

```json
{
  "email": "ada@campfire.test",
  "password": "campfire123"
}
```

Response body:

```json
{
  "displayName": "Ada",
  "email": "ada@campfire.test"
}
```

The response may include `id`, `createdAt`, or `memberSince` if the
implementation exposes them consistently. It must not include `firstLogin` or
`preferences`.

Preference fields in the request are not part of the contract and should be
rejected by the schema if strict request validation is enabled, or ignored only
as Pydantic's default extra-field behavior if that is already the project
standard. Do not intentionally support legacy preference payloads.

### `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`

Token/session behavior is unchanged.

## Changed Identity Endpoint

### `GET /me`

Response body:

```json
{
  "displayName": "Ada",
  "email": "ada@campfire.test"
}
```

Optional stable identity metadata may be added if already available:

```json
{
  "id": "018f0000-0000-7000-8000-000000000001",
  "displayName": "Ada",
  "email": "ada@campfire.test",
  "memberSince": "2026-04-26T00:00:00Z"
}
```

Forbidden fields:
- `firstLogin`
- `preferences`

## Removed Endpoint

### `/me/preferences`

No method for this path appears in OpenAPI. Runtime requests should resolve to
404 through FastAPI's normal missing-route behavior.

## OpenAPI Snapshot Expectations

The active contract snapshot must remove:
- `#/components/schemas/PreferencesPayload`
- `MeResponse.preferences`
- `MeResponse.firstLogin`
- `/me/preferences`

The snapshot must preserve:
- auth token schemas and endpoints
- `/me`
- repertoire endpoints from spec 003
