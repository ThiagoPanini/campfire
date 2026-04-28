# Campfire API

FastAPI backend for the Campfire identity slice.

```bash
uv sync
docker compose up -d postgres
make migrate
make seed
make run
```

Health checks:

```bash
curl http://localhost:8000/healthz
curl http://localhost:8000/readyz
```

Local database validation queries for SQLTools live in
[`queries/sqltools/`](queries/sqltools/README.md). They are grouped by
bounded context, with shared database checks in `queries/sqltools/shared/`.
