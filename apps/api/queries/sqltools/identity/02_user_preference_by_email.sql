-- @conn campfire-local

/*
Block 1 - Basic validation: one specific user's preferences

Edit only the email inside params. The rest of the query resolves the user's
id and fetches the matching row from preferences.

Google stub emails:
- sign-in button on the sign-in screen uses ada@campfire.test.
- sign-up button on the sign-up screen creates/uses google.member@campfire.test.

Tables used:
- users: contains the normalized email. The application stores email in
  lowercase, so this query normalizes the provided value with lower(btrim(...)).
- preferences: contains the musical choices used by the frontend through /me.

Important preferences fields:
- instruments, genres, and goals are JSONB text arrays.
- context is a single musical context category, for example "friends".
- experience accepts only: beginner, learning, intermediate, or advanced.
- updated_at helps confirm whether PATCH /me/preferences was actually saved.

If this query returns no rows:
- the provided email may not exist in users; or
- the user exists, but the preferences row was not created. That should be
  investigated because the normal flow creates preferences with the user.
*/

WITH params AS (
  SELECT lower(btrim('google.member@campfire.test'))::text AS email
)
SELECT
  u.id AS user_id,
  u.email,
  u.display_name,
  p.instruments,
  p.genres,
  p.context,
  p.goals,
  p.experience,
  p.updated_at AS preferences_updated_at
FROM params
JOIN users u ON u.email = params.email
JOIN preferences p ON p.user_id = u.id;
