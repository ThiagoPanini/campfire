SHELL := /usr/bin/env bash
.SHELLFLAGS := -euo pipefail -c
.DEFAULT_GOAL := help

ROOT_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
API_DIR := $(ROOT_DIR)/apps/api
LOCAL_SCRIPTS_DIR := $(ROOT_DIR)/scripts/local
CI_SCRIPTS_DIR := $(ROOT_DIR)/scripts/ci
NODE_MODULES_DIR := $(ROOT_DIR)/node_modules

.PHONY: help doctor up down reset seed run run/web ensure-node-deps token debug logs \
	lint lint/backend lint/frontend lint/infra lint/workflows \
	type type/backend type/frontend \
	test test/backend/unit test/backend/integration test/backend/contract test/frontend/unit test/e2e \
	validate/infra security docs ci \
	build/api build/web package plan apply smoke rollback clean record-deployment audit/security-posture index

##@ Local environment
help: ## Print the public command catalog.
	@awk 'BEGIN {FS = ":.*##"; section = "General"} \
		/^##@/ {section = substr($$0, 5); printf "\n%s\n", section; next} \
		/^[a-zA-Z0-9_\/-]+:.*##/ {printf "  %-24s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

doctor: ## Check local prerequisites and common failure modes.
	@"$(LOCAL_SCRIPTS_DIR)/doctor.sh"

up: ## Start LocalStack when Docker exists, otherwise Moto fallback; then seed local resources.
	@"$(LOCAL_SCRIPTS_DIR)/up.sh"

down: ## Stop the local stack and remove project-owned volumes.
	@"$(LOCAL_SCRIPTS_DIR)/down.sh"

reset: ## Tear down and recreate the local stack from scratch.
	@$(MAKE) down
	@$(MAKE) up

seed: ## Seed LocalStack resources required by the backend.
	@"$(LOCAL_SCRIPTS_DIR)/seed.sh"

run: ## Start the backend API against the local stack.
	@"$(LOCAL_SCRIPTS_DIR)/run.sh"

run/web: ensure-node-deps ## Start the frontend Vite app against the local backend.
	@npm --workspace apps/web run dev -- --host 127.0.0.1 --port 5173

ensure-node-deps:
	@if [ ! -d "$(NODE_MODULES_DIR)" ]; then \
		echo "Installing frontend dependencies with npm ci..."; \
		npm ci; \
	fi

token: ## Issue a local JWT for manual backend testing.
	@"$(LOCAL_SCRIPTS_DIR)/token.sh"

debug: ## Start the backend API under debugpy and wait for a client.
	@"$(LOCAL_SCRIPTS_DIR)/debug.sh"

logs: ## Tail LocalStack logs when Docker is present, otherwise tail Moto fallback logs.
	@if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then \
		docker compose -f docker-compose.backend.yml logs -f localstack; \
	elif [ -f "$(API_DIR)/.local/moto-server.log" ]; then \
		tail -f "$(API_DIR)/.local/moto-server.log"; \
	else \
		echo "No LocalStack or Moto logs found." >&2; \
		exit 1; \
	fi

##@ Quality gates
lint: ## Run every lint gate.
	@echo "TODO: lint aggregate is not implemented yet." >&2
	@exit 1

lint/backend: ## Lint and format-check the backend.
	@echo "TODO: lint/backend is not implemented yet." >&2
	@exit 1

lint/frontend: ## Lint the frontend workspace.
	@echo "TODO: lint/frontend is not implemented yet." >&2
	@exit 1

lint/infra: ## Lint Terraform and related infrastructure files.
	@echo "TODO: lint/infra is not implemented yet." >&2
	@exit 1

lint/workflows: ## Lint GitHub workflow definitions.
	@echo "TODO: lint/workflows is not implemented yet." >&2
	@exit 1

type: ## Run every type-checking gate.
	@echo "TODO: type aggregate is not implemented yet." >&2
	@exit 1

type/backend: ## Type-check the Python backend.
	@echo "TODO: type/backend is not implemented yet." >&2
	@exit 1

type/frontend: ## Type-check the frontend workspace.
	@echo "TODO: type/frontend is not implemented yet." >&2
	@exit 1

test: ## Run the local backend and frontend unit test flow.
	@"$(LOCAL_SCRIPTS_DIR)/test.sh"

test/backend/unit: ## Run backend tests that do not require LocalStack.
	@cd "$(API_DIR)" && uv run --extra dev pytest -q tests/integration/test_get_or_bootstrap_local_user.py tests/integration/test_auth_failures.py tests/unit

test/backend/integration: ## Run backend integration tests against LocalStack.
	@$(MAKE) up
	@cd "$(API_DIR)" && uv run --extra dev pytest -q tests/integration/test_dynamodb_local_user_repository.py tests/integration/test_localstack_bootstrap.py

test/backend/contract: ## Run backend contract tests.
	@$(MAKE) up
	@cd "$(API_DIR)" && uv run --extra dev pytest -q tests/contract

test/frontend/unit: ## Run frontend unit tests.
	@npm --workspace apps/web run test

test/e2e: ## Run frontend end-to-end tests.
	@$(MAKE) up
	@npm --workspace apps/web run test:e2e

validate/infra: ## Validate Terraform configuration.
	@echo "TODO: validate/infra is not implemented yet." >&2
	@exit 1

security: ## Run security and vulnerability checks.
	@echo "TODO: security is not implemented yet." >&2
	@exit 1

docs: ## Build documentation and validate links.
	@echo "TODO: docs is not implemented yet." >&2
	@exit 1

ci: ## Run the local equivalent of the PR gate.
	@echo "TODO: ci is not implemented yet." >&2
	@exit 1

##@ Build and release
build/api: ## Build the backend deployable artifact.
	@echo "TODO: build/api is not implemented yet." >&2
	@exit 1

build/web: ## Build the frontend deployable artifact.
	@echo "TODO: build/web is not implemented yet." >&2
	@exit 1

package: ## Build every release artifact.
	@echo "TODO: package is not implemented yet." >&2
	@exit 1

plan: ## Create a Terraform plan for ENV=<env>.
	@echo "TODO: plan is not implemented yet." >&2
	@exit 1

apply: ## Apply PLAN=<path> to ENV=<env>.
	@echo "TODO: apply is not implemented yet." >&2
	@exit 1

smoke: ## Run post-deploy smoke probes for ENV=<env>.
	@"$(LOCAL_SCRIPTS_DIR)/smoke.sh"

rollback: ## Roll back ENV=<env> to TO=<artifact_key>.
	@echo "TODO: rollback is not implemented yet." >&2
	@exit 1

##@ Operational
clean: ## Remove local build outputs and caches.
	@rm -rf "$(ROOT_DIR)/dist" "$(ROOT_DIR)/node_modules" "$(ROOT_DIR)/.mypy_cache" "$(ROOT_DIR)/.pytest_cache" "$(ROOT_DIR)/.serena"
	@rm -rf "$(API_DIR)/.local" "$(API_DIR)/.pytest_cache" "$(API_DIR)/.ruff_cache" "$(API_DIR)/.venv"
	@rm -rf "$(ROOT_DIR)/apps/web/node_modules" "$(ROOT_DIR)/apps/web/.vite" "$(ROOT_DIR)/apps/web/dist" "$(ROOT_DIR)/apps/web/test-results" "$(ROOT_DIR)/apps/web/playwright-report" "$(ROOT_DIR)/apps/web/coverage" "$(ROOT_DIR)/apps/web/tsconfig.tsbuildinfo"
	@rm -rf "$(ROOT_DIR)/infra/terraform/environments/dev/.terraform"
	@find "$(ROOT_DIR)" -type d -name "__pycache__" -prune -exec rm -rf {} +

record-deployment: ## Append a deployment record.
	@"$(CI_SCRIPTS_DIR)/emit-deployment-record.sh"

audit/security-posture: ## Audit workflow and secret posture.
	@echo "TODO: audit/security-posture is not implemented yet." >&2
	@exit 1

index: ## Print a generated index of commands and workflow surfaces.
	@echo "TODO: index is not implemented yet." >&2
	@exit 1
