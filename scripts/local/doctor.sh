#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHECK_NAME=""

for arg in "$@"; do
  case "$arg" in
    --check=*)
      CHECK_NAME="${arg#--check=}"
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

check_failed=0

check_python_version() {
  local python_bin

  if command -v python3 >/dev/null 2>&1; then
    python_bin="python3"
  elif command -v python >/dev/null 2>&1; then
    python_bin="python"
  else
    return 1
  fi

  "$python_bin" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)'
}

check_node_version() {
  command -v node >/dev/null 2>&1 || return 1
  node -e 'const major = Number(process.versions.node.split(".")[0]); process.exit(major >= 20 ? 0 : 1)'
}

check_port_available() {
  python3 - <<'PY'
import socket
sock = socket.socket()
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
try:
    sock.bind(("127.0.0.1", 4566))
except OSError:
    raise SystemExit(1)
finally:
    sock.close()
PY
}

check_network_access() {
  if ! command -v curl >/dev/null 2>&1; then
    return 0
  fi

  curl --silent --show-error --fail --head --connect-timeout 3 --max-time 5 https://registry.npmjs.org/ >/dev/null &&
    curl --silent --show-error --fail --head --connect-timeout 3 --max-time 5 https://pypi.org/simple/ >/dev/null
}

check_item() {
  local name="$1"
  local remediation="$2"
  local description="$3"

  local ok=0
  case "$name" in
    docker)
      command -v docker >/dev/null 2>&1 || ok=$?
      ;;
    docker-compose)
      docker compose version >/dev/null 2>&1 || ok=$?
      ;;
    python)
      check_python_version || ok=$?
      ;;
    uv)
      command -v uv >/dev/null 2>&1 || ok=$?
      ;;
    node)
      check_node_version || ok=$?
      ;;
    make)
      command -v make >/dev/null 2>&1 || ok=$?
      ;;
    port-4566)
      check_port_available || ok=$?
      ;;
    network)
      check_network_access || ok=$?
      ;;
    *)
      echo "Unsupported prerequisite check: $name" >&2
      exit 2
      ;;
  esac

  if [[ "$ok" -eq 0 ]]; then
    echo "PASS ${name}: ${description}"
    return 0
  fi

  case "$name" in
    network)
      echo "FAIL ${name}: required network access appears unavailable. Commands that may need network access: make up (first image pull), uv sync, npm ci. Check your VPN, proxy, or firewall and retry. See ${remediation}" >&2
      ;;
    port-4566)
      echo "FAIL ${name}: port 4566 is already in use. Stop the conflicting process or container, then retry. See ${remediation}" >&2
      ;;
    *)
      echo "FAIL ${name}: ${description} is missing or does not meet the minimum version. See ${remediation}" >&2
      ;;
  esac
  return 1
}

if [[ -n "$CHECK_NAME" ]]; then
  case "$CHECK_NAME" in
    docker)
      check_item docker "https://docs.docker.com/get-docker/" "Docker"
      ;;
    docker-compose)
      check_item docker-compose "https://docs.docker.com/compose/install/" "Docker Compose v2"
      ;;
    python)
      check_item python "https://www.python.org/downloads/" "Python 3.12+"
      ;;
    uv)
      check_item uv "https://docs.astral.sh/uv/getting-started/installation/" "uv"
      ;;
    node)
      check_item node "https://nodejs.org/en/download" "Node.js 20+"
      ;;
    make)
      check_item make "https://www.gnu.org/software/make/" "GNU Make"
      ;;
    port-4566)
      check_item port-4566 "https://docs.localstack.cloud/aws/getting-started/installation/#starting-localstack-with-docker-compose" "LocalStack port 4566 availability"
      ;;
    network)
      check_item network "https://docs.localstack.cloud/aws/getting-started/installation/" "Network access for dependency and image downloads"
      ;;
    *)
      echo "Unsupported prerequisite check: $CHECK_NAME" >&2
      exit 2
      ;;
  esac
  exit $?
fi

checks=(
  "python|https://www.python.org/downloads/|Python 3.12+"
  "uv|https://docs.astral.sh/uv/getting-started/installation/|uv"
  "node|https://nodejs.org/en/download|Node.js 20+"
  "make|https://www.gnu.org/software/make/|GNU Make"
  "port-4566|https://docs.localstack.cloud/aws/getting-started/installation/#starting-localstack-with-docker-compose|LocalStack port 4566 availability"
)

for entry in "${checks[@]}"; do
  IFS="|" read -r name remediation description <<<"$entry"
  if ! check_item "$name" "$remediation" "$description"; then
    check_failed=1
  fi
done

for optional_entry in \
  "docker|https://docs.docker.com/get-docker/|Docker" \
  "docker-compose|https://docs.docker.com/compose/install/|Docker Compose v2"
do
  IFS="|" read -r name remediation description <<<"${optional_entry}"
  if check_item "$name" "$remediation" "$description" >/dev/null 2>&1; then
    echo "PASS ${name}: ${description}"
  else
    echo "WARN ${name}: ${description} missing. \`make up\` will fall back to Moto instead of LocalStack. Install via ${remediation}" >&2
  fi
done

cat <<'EOF'
INFO network: This check does not require network access. The following commands may need network access on first run: make up (image pull), uv sync, npm ci.
INFO localstack: If Docker is installed, make up uses LocalStack at http://localhost:4566.
INFO moto: If Docker is unavailable, make up starts a Moto fallback at http://localhost:4566.
EOF

exit "$check_failed"
