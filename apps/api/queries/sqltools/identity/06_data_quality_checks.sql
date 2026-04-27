-- @conn campfire-local

/*
Block 2 - Suggested query: data quality checks

This query looks for situations that should not appear in a healthy identity
database.

Tables covered:
- users: should have normalized email and one row in preferences.
- credentials: should exist for users with local password login.
- preferences: should exist so /me can return the full profile.
- sessions and refresh_tokens: should preserve the single-use refresh token
  rule.

How to interpret:
- problem_count = 0 is the expected result for each row.
- problem_count > 0 does not fix anything by itself; it points to what should
  be investigated.
*/

SELECT
  'users_without_preferences' AS check_name,
  COUNT(*) AS problem_count,
  'Every user should have one preferences row so /me can return the full profile.' AS why_it_matters
FROM users u
LEFT JOIN preferences p ON p.user_id = u.id
WHERE p.user_id IS NULL

UNION ALL

SELECT
  'users_without_local_credentials',
  COUNT(*),
  'Password-created users should have local credentials; the local Google stub is a known exception.'
FROM users u
LEFT JOIN credentials c ON c.user_id = u.id
WHERE c.user_id IS NULL
  AND u.email <> 'google.member@campfire.test'

UNION ALL

SELECT
  'non_normalized_emails',
  COUNT(*),
  'Emails should be lowercase and trimmed so ux_users_email stays reliable.'
FROM users
WHERE email <> lower(email)
   OR email <> btrim(email)

UNION ALL

SELECT
  'active_sessions_without_exchangeable_refresh_token',
  COUNT(*),
  'An active session should normally have an exchangeable refresh token in the same session.'
FROM sessions s
LEFT JOIN refresh_tokens rt
  ON rt.session_id = s.id
  AND rt.consumed_at IS NULL
  AND rt.revoked_at IS NULL
  AND rt.expires_at > now()
WHERE s.revoked_at IS NULL
  AND s.access_token_expires_at > now()
  AND rt.id IS NULL

UNION ALL

SELECT
  'families_with_multiple_exchangeable_refresh_tokens',
  COUNT(*),
  'A session family should have at most one exchangeable refresh token at a time.'
FROM (
  SELECT rt.family_id
  FROM refresh_tokens rt
  WHERE rt.consumed_at IS NULL
    AND rt.revoked_at IS NULL
    AND rt.expires_at > now()
  GROUP BY rt.family_id
  HAVING COUNT(*) > 1
) families
ORDER BY check_name;

/*
Details for the most sensitive check: families with more than one exchangeable
refresh token at the same time. If this returns no rows, this case is healthy.
*/

SELECT
  u.email,
  rt.family_id,
  COUNT(*) AS exchangeable_refresh_tokens
FROM refresh_tokens rt
JOIN users u ON u.id = rt.user_id
WHERE rt.consumed_at IS NULL
  AND rt.revoked_at IS NULL
  AND rt.expires_at > now()
GROUP BY u.email, rt.family_id
HAVING COUNT(*) > 1
ORDER BY u.email, rt.family_id;
