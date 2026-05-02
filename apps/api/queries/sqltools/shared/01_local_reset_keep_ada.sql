-- @conn campfire-local

/*
Local reset - keep only the Ada seed user

Use only against the local Compose database. This resets application data while
preserving Alembic migration history and the dev seed identity:

  email: ada@campfire.test

What it does:
1. Truncates all public application tables except alembic_version, users, and
   credentials. This removes sessions, refresh tokens, email confirmation
   codes, OAuth flow state, provider links, repertoire entries, and future
   app tables.
2. Deletes every non-Ada credential and every non-Ada user.
3. Upserts Ada and Ada's dev password hash, matching apps/api/scripts/dev_seed.py.

Recommended flow:
1. Run the preview block.
2. Confirm you are connected to database=campfire and user=campfire.
3. Run the reset transaction.
4. Run the verification block.
*/

/*
Preview current table counts before reset.
*/
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.reltuples::bigint AS estimated_rows
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;

/*
Reset local data. Keep this as one transaction so a failure rolls back the
whole reset.
*/
BEGIN;

DO $$
DECLARE
  ada_id uuid := '018f0000-0000-7000-8000-000000000001';
  ada_password_hash text := '$argon2id$v=19$m=19456,t=2,p=1$WO8c3zdKufpGYC/woOXNPg$+MEKvl/kFcr1xURYss4uqLegvP9LWwfeUP0KZw0XMaM';
  tables_to_truncate text;
BEGIN
  IF current_database() <> 'campfire' OR current_user <> 'campfire' THEN
    RAISE EXCEPTION
      'Refusing local reset on database=% user=%. Expected database=campfire user=campfire.',
      current_database(),
      current_user;
  END IF;

  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
  INTO tables_to_truncate
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN ('alembic_version', 'users', 'credentials');

  IF tables_to_truncate IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || tables_to_truncate || ' RESTART IDENTITY CASCADE';
  END IF;

  DELETE FROM credentials
  WHERE user_id <> ada_id;

  DELETE FROM users
  WHERE id <> ada_id;

  INSERT INTO users (id, email, display_name, email_confirmed_at)
  VALUES (ada_id, 'ada@campfire.test', 'Ada', now())
  ON CONFLICT (email) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    email_confirmed_at = COALESCE(users.email_confirmed_at, EXCLUDED.email_confirmed_at),
    updated_at = now();

  INSERT INTO credentials (user_id, password_hash)
  VALUES (ada_id, ada_password_hash)
  ON CONFLICT (user_id) DO UPDATE
  SET
    password_hash = EXCLUDED.password_hash,
    updated_at = now();
END $$;

COMMIT;

/*
Verification after reset.
*/
SELECT
  current_database() AS database_name,
  current_user AS connected_as;

SELECT
  u.id,
  u.email,
  u.display_name,
  u.email_confirmed_at,
  (c.user_id IS NOT NULL) AS has_credentials
FROM users u
LEFT JOIN credentials c ON c.user_id = u.id
ORDER BY u.email;

SELECT
  'credentials' AS table_name,
  COUNT(*) AS row_count
FROM credentials
UNION ALL
SELECT 'email_confirmations', COUNT(*) FROM email_confirmations
UNION ALL
SELECT 'oauth_flow_states', COUNT(*) FROM oauth_flow_states
UNION ALL
SELECT 'provider_links', COUNT(*) FROM provider_links
UNION ALL
SELECT 'refresh_tokens', COUNT(*) FROM refresh_tokens
UNION ALL
SELECT 'repertoire_entries', COUNT(*) FROM repertoire_entries
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'users', COUNT(*) FROM users
ORDER BY table_name;
