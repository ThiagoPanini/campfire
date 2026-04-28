-- @conn campfire-local

/*
Block 2 - Suggested query: local cleanup for a test user

Use only in a local environment. This file exists to clean up users created
during manual app testing.

Why is DELETE FROM users enough?
The credentials, sessions, and refresh_tokens tables have foreign keys with ON
DELETE CASCADE to users. When the user is removed, Postgres removes dependent
rows automatically.

Recommended flow:
1. Edit the email in params.
2. Run only the preview.
3. Confirm the user is really the intended target.
4. Only then uncomment the DELETE block.
*/

WITH params AS (
  SELECT lower(btrim('someone@campfire.test'))::text AS email
)
SELECT
  u.id,
  u.email,
  u.display_name,
  u.created_at,
  COUNT(DISTINCT c.user_id) AS credentials_to_delete,
  COUNT(DISTINCT s.id) AS sessions_to_delete,
  COUNT(DISTINCT rt.id) AS refresh_tokens_to_delete
FROM params
JOIN users u ON u.email = params.email
LEFT JOIN credentials c ON c.user_id = u.id
LEFT JOIN sessions s ON s.user_id = u.id
LEFT JOIN refresh_tokens rt ON rt.user_id = u.id
GROUP BY u.id, u.email, u.display_name, u.created_at;

/*
Local DELETE. Keep this commented until you check the preview above.

WITH params AS (
  SELECT lower(btrim('someone@campfire.test'))::text AS email
)
DELETE FROM users u
USING params
WHERE u.email = params.email
RETURNING
  u.id,
  u.email,
  u.display_name;
*/
