-- @conn campfire-local

/*
Block 2 - Suggested query: refresh token state

Use this when validating login, SPA reload, or logout.

Project context:
Campfire refresh tokens are opaque and single-use. The refresh_tokens table
does not store the plain token; it stores only token_fingerprint, which should
not be selected in routine validation queries. The operational state lives in
consumed_at, revoked_at, and expires_at.

Tables used:
- users: finds the user by email.
- refresh_tokens: records issuance, consumption, expiration, and revocation.

How to read computed_state:
- exchangeable: the token can still be exchanged for a new session.
- consumed: the token was already used in a normal rotation.
- revoked: the token was invalidated by logout, refresh, or reuse detection.
- expired: the token is past expires_at.
*/

WITH params AS (
  SELECT lower(btrim('ada@campfire.test'))::text AS email
)
SELECT
  rt.id,
  rt.session_id,
  rt.family_id,
  rt.issued_at,
  rt.expires_at,
  rt.consumed_at,
  rt.revoked_at,
  rt.revoked_reason,
  CASE
    WHEN rt.revoked_at IS NOT NULL THEN 'revoked'
    WHEN rt.consumed_at IS NOT NULL THEN 'consumed'
    WHEN rt.expires_at <= now() THEN 'expired'
    ELSE 'exchangeable'
  END AS computed_state
FROM params
JOIN users u ON u.email = params.email
JOIN refresh_tokens rt ON rt.user_id = u.id
ORDER BY rt.issued_at DESC;

/*
Summary by family.

This summary helps show the full rotation chain. Under normal conditions, an
active family should have at most one exchangeable refresh token at a time.
*/

WITH params AS (
  SELECT lower(btrim('ada@campfire.test'))::text AS email
)
SELECT
  rt.family_id,
  COUNT(*) AS tokens_in_family,
  COUNT(*) FILTER (
    WHERE rt.consumed_at IS NULL
      AND rt.revoked_at IS NULL
      AND rt.expires_at > now()
  ) AS exchangeable_tokens,
  COUNT(*) FILTER (WHERE rt.consumed_at IS NOT NULL) AS consumed_tokens,
  COUNT(*) FILTER (WHERE rt.revoked_reason = 'refreshed') AS refreshed_tokens,
  COUNT(*) FILTER (WHERE rt.revoked_reason = 'signed_out') AS signed_out_tokens,
  COUNT(*) FILTER (WHERE rt.revoked_reason = 'reuse_detected') AS reuse_detected_tokens,
  MIN(rt.issued_at) AS first_issued_at,
  MAX(rt.issued_at) AS latest_issued_at,
  MAX(rt.expires_at) AS latest_expires_at
FROM params
JOIN users u ON u.email = params.email
JOIN refresh_tokens rt ON rt.user_id = u.id
GROUP BY rt.family_id
ORDER BY latest_issued_at DESC;
