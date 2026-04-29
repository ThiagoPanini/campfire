-- @conn campfire-local

/*
Block 1 - Basic validation: all registered users

Use this query as the first look at the local Campfire database. It answers:
which users exist today, and which identity records have already been created
for each one?

Tables used:
- users: the main user record. Stores id, email, display name, and timestamps.
- credentials: local login credentials. We do not select password_hash because
  it is sensitive material and does not help visual validation.
- sessions: access sessions issued after login or refresh.
- refresh_tokens: tokens used to renew sessions. We also do not select
  fingerprints because they are derived from secrets.

How to read the calculated fields:
- has_local_credentials = true means the user can sign in with a password.
- total_sessions counts how many sessions have been issued for this user.
- active_access_sessions counts non-revoked sessions whose access token has
  not expired yet.
- exchangeable_refresh_tokens counts refresh tokens that can still be used:
  not consumed, not revoked, and not expired.
*/

SELECT
  u.id,
  u.email,
  u.display_name,
  u.created_at,
  u.updated_at,
  c.user_id IS NOT NULL AS has_local_credentials,
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT s.id) FILTER (
    WHERE s.revoked_at IS NULL
      AND s.access_token_expires_at > now()
  ) AS active_access_sessions,
  COUNT(DISTINCT rt.id) FILTER (
    WHERE rt.consumed_at IS NULL
      AND rt.revoked_at IS NULL
      AND rt.expires_at > now()
  ) AS exchangeable_refresh_tokens
FROM users u
LEFT JOIN credentials c ON c.user_id = u.id
LEFT JOIN sessions s ON s.user_id = u.id
LEFT JOIN refresh_tokens rt ON rt.user_id = u.id
GROUP BY
  u.id,
  u.email,
  u.display_name,
  u.created_at,
  u.updated_at,
  c.user_id
ORDER BY u.created_at DESC, u.email;
