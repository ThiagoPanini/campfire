-- @conn campfire-local

SELECT
  current_database() AS database_name,
  current_user AS connected_as,
  inet_server_addr() AS server_address,
  inet_server_port() AS server_port,
  version() AS postgres_version;

SELECT
  version_num AS alembic_revision
FROM alembic_version;

SELECT
  table_schema,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
