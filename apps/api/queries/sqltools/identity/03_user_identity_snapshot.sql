-- @conn campfire-local

/*
Block 2 - Suggested query: full user identity snapshot

This query is useful when an authentication flow looks strange in the app. It
joins registration data, preferences, credentials, and session counters into a
single row for one specific email.

Edit the email in params.

How to read each table:
- users shows who the user is.
- preferences shows the musical profile linked to the user.
- credentials confirms whether local credentials exist without revealing
  password_hash.
- sessions shows how many access sessions were issued.
- refresh_tokens shows how many renewal tokens could still be used.

Note for readers who are new to this project's data model:
Campfire uses short-lived access tokens and single-use refresh tokens. So it is
normal to see multiple old sessions and refresh tokens after login, refresh, or
logout. For the current state, focus on the calculated active_* and
exchangeable_* fields.
*/

WITH params AS (
  SELECT lower(btrim('ada@campfire.test'))::text AS email
)
SELECT
  u.id,
  u.email,
  u.display_name,
  u.first_login,
  u.created_at,
  u.updated_at,
  c.user_id IS NOT NULL AS has_local_credentials,
  p.instruments,
  p.genres,
  p.context,
  p.goals,
  p.experience,
  p.updated_at AS preferences_updated_at,
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT s.id) FILTER (
    WHERE s.revoked_at IS NULL
      AND s.access_token_expires_at > now()
  ) AS active_access_sessions,
  COUNT(DISTINCT rt.id) AS total_refresh_tokens,
  COUNT(DISTINCT rt.id) FILTER (
    WHERE rt.consumed_at IS NULL
      AND rt.revoked_at IS NULL
      AND rt.expires_at > now()
  ) AS exchangeable_refresh_tokens
FROM params
JOIN users u ON u.email = params.email
LEFT JOIN credentials c ON c.user_id = u.id
LEFT JOIN preferences p ON p.user_id = u.id
LEFT JOIN sessions s ON s.user_id = u.id
LEFT JOIN refresh_tokens rt ON rt.user_id = u.id
GROUP BY
  u.id,
  u.email,
  u.display_name,
  u.first_login,
  u.created_at,
  u.updated_at,
  c.user_id,
  p.instruments,
  p.genres,
  p.context,
  p.goals,
  p.experience,
  p.updated_at;
