# Campfire API

FastAPI backend for Campfire identity and repertoire slices.

## Local setup

```bash
uv sync
docker compose up -d postgres
make migrate
make seed
make run
```

`make migrate` applies schema migrations. `make seed` is optional local/dev data
only; it creates or updates `ada@campfire.test` after the schema exists.

Health checks:

```bash
curl http://localhost:8000/healthz
curl http://localhost:8000/readyz
```

## Database workflow

SQLAlchemy models describe the desired Python mapping. They do not change
PostgreSQL tables by themselves. Alembic migrations are the versioned changes
that move the real database schema.

Common flow:

1. Edit a SQLAlchemy model.
2. Generate a migration: `make migration name="add status to repertoire entries"`.
3. Review the generated file in `alembic/versions/`.
4. Apply it locally: `make migrate`.
5. Check schema drift: `make db-check`.
6. Run tests.
7. Commit the model change and migration together.

Useful commands:

```bash
make migration name="add status to repertoire entries"
make migration-empty name="manual data fix"
make db-current
make db-history
make db-heads
make db-check
make migrate
make downgrade
make db-reset
make seed
```

Every ORM model module must be imported in `alembic/env.py` before
`target_metadata = Base.metadata`. If a new persistence context is added, add it
to that explicit registry so Alembic autogenerate can see its tables.

Local database validation queries for SQLTools live in
[`queries/sqltools/`](queries/sqltools/README.md). They are grouped by
bounded context, with shared database checks in `queries/sqltools/shared/`.
