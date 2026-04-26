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
