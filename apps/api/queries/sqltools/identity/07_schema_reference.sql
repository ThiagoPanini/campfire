-- @conn campfire-local

/*
Block 2 - Suggested query: quick identity schema reference

Use this when you need to remember which columns exist without opening the
migration or SQLAlchemy models.

Context tables:
- users: main registration record.
- credentials: local credentials, 1:1 with users.
- sessions: access token sessions.
- refresh_tokens: renewal tokens linked to sessions and users.

This query reads the Postgres catalog, not the business tables themselves.
*/

SELECT
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    'users',
    'credentials',
    'sessions',
    'refresh_tokens'
  )
ORDER BY c.table_name, c.ordinal_position;

/*
Constraints and indexes help explain the database guarantees:
- constraints validate rules such as unique email.
- indexes speed up frequent lookups, such as sessions by user_id or family_id.
*/

SELECT
  tc.table_name,
  tc.constraint_type,
  tc.constraint_name
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN (
    'users',
    'credentials',
    'sessions',
    'refresh_tokens'
  )
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

SELECT
  tablename AS table_name,
  indexname AS index_name,
  indexdef AS definition
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'credentials',
    'sessions',
    'refresh_tokens'
  )
ORDER BY tablename, indexname;
