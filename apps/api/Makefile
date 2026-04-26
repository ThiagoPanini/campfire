.PHONY: run test test-unit test-integration migrate downgrade seed lint format openapi-snapshot db-reset check-aurora-extensions

run:
	uv run uvicorn campfire_api.main:app --reload --port 8000

test:
	uv run pytest

test-unit:
	uv run pytest -m unit tests/unit

test-integration:
	uv run pytest -m integration tests/integration

migrate:
	uv run alembic upgrade head

downgrade:
	uv run alembic downgrade -1

seed:
	uv run python scripts/seed.py

lint:
	uv run ruff check src tests scripts

format:
	uv run ruff format src tests scripts

openapi-snapshot:
	uv run python scripts/openapi_snapshot.py

db-reset:
	uv run alembic downgrade base
	uv run alembic upgrade head

check-aurora-extensions:
	uv run python scripts/check_aurora_extensions.py
