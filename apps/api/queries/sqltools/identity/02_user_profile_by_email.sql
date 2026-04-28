-- @conn campfire-local

/*
Block 1 - Basic validation: one specific user's profile

Edit only the email inside params. The rest of the query resolves the user's id
and shows the current identity profile stored for that account.

Google stub emails:
- sign-in button on the sign-in screen uses ada@campfire.test.
- sign-up button on the sign-up screen creates/uses google.member@campfire.test.

Tables used:
- users: contains the normalized email. The application stores email in
  lowercase, so this query normalizes the provided value with lower(btrim(...)).
- credentials: confirms whether local credentials exist without exposing the
  password hash.
*/

WITH params AS (
  SELECT lower(btrim('google.member@campfire.test'))::text AS email
)
SELECT
  u.id AS user_id,
  u.email,
  u.display_name,
  u.created_at,
  u.updated_at,
  c.user_id IS NOT NULL AS has_local_credentials
FROM params
JOIN users u ON u.email = params.email
LEFT JOIN credentials c ON c.user_id = u.id;
