-- @conn campfire-local

/*
Block 2 - Suggested query: one user's session families

Use this after logging in, reloading the page, or signing out of the app.

What is a "family"?
In Campfire's authentication flow, a family groups the chain of sessions and
refresh tokens that started from one login. When a refresh token is used, the
old session is revoked with reason "refreshed", and a new session is created
with the same family_id. If a refresh token is reused incorrectly, the family
may be revoked with reason "reuse_detected".

Tables used:
- users: finds the user by email.
- sessions: shows access sessions and their revocation reasons.

Calculated states:
- active_access_sessions counts sessions that are still valid now.
- refreshed_sessions shows sessions closed by normal rotation.
- signed_out_sessions shows sessions closed by logout.
- reuse_detected_sessions points to a security case worth investigating.
*/

WITH params AS (
  SELECT lower(btrim('ada@campfire.test'))::text AS email
)
SELECT
  s.family_id,
  COUNT(*) AS sessions_in_family,
  COUNT(*) FILTER (
    WHERE s.revoked_at IS NULL
      AND s.access_token_expires_at > now()
  ) AS active_access_sessions,
  COUNT(*) FILTER (WHERE s.revoked_reason = 'refreshed') AS refreshed_sessions,
  COUNT(*) FILTER (WHERE s.revoked_reason = 'signed_out') AS signed_out_sessions,
  COUNT(*) FILTER (WHERE s.revoked_reason = 'reuse_detected') AS reuse_detected_sessions,
  MIN(s.created_at) AS first_session_at,
  MAX(s.created_at) AS latest_session_at,
  MAX(s.last_seen_at) AS latest_seen_at
FROM params
JOIN users u ON u.email = params.email
JOIN sessions s ON s.user_id = u.id
GROUP BY s.family_id
ORDER BY latest_session_at DESC;

/*
Details for the same user's sessions.

This second query lists each session individually. computed_state is a
human-readable state based on the persisted columns:
- revoked: the application explicitly revoked the session.
- expired: the access token is past access_token_expires_at.
- active: the session has not been revoked and is still within its lifetime.
*/

WITH params AS (
  SELECT lower(btrim('ada@campfire.test'))::text AS email
)
SELECT
  s.id,
  s.family_id,
  s.access_token_expires_at,
  s.created_at,
  s.last_seen_at,
  s.revoked_at,
  s.revoked_reason,
  CASE
    WHEN s.revoked_at IS NOT NULL THEN 'revoked'
    WHEN s.access_token_expires_at <= now() THEN 'expired'
    ELSE 'active'
  END AS computed_state
FROM params
JOIN users u ON u.email = params.email
JOIN sessions s ON s.user_id = u.id
ORDER BY s.created_at DESC;
