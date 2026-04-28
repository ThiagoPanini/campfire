# SQLTools validation queries

Local SQL snippets for validating Campfire API behavior against the development
PostgreSQL database.

These files are intentionally outside `src/campfire_api/`. They are developer
and operator aids, not application code, domain logic, adapters, or tests.

## Layout

```text
queries/sqltools/
├── shared/      # database-wide checks
└── identity/    # checks owned by the identity bounded context
```

Add future contexts as sibling directories, for example
`queries/sqltools/jam_session/`.

## SQLTools connection

Each query starts with:

```sql
-- @conn campfire-local
```

Create a SQLTools connection with that exact name and point it at the Compose
database:

```text
host=localhost
port=5432
database=campfire
username=campfire
password=campfire
```

## Conventions

- Keep files read-only unless the file name clearly says `cleanup` or `reset`.
- Prefer one scenario per file.
- Put editable values in a top `params` CTE.
- Never select password hashes or full token fingerprints unless the scenario
  specifically needs to validate that secret material is not exposed.
