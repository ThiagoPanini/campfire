#!/usr/bin/env bash
# backup.sh — snapshot files before ai-dev-setup modifies them.
#
# Usage: ./backup.sh <file1> [<file2> ...]
#
# Creates a timestamped tarball in .ai-dev-setup/backups/<ts>/restore.tar.
# Skips files that don't exist (so callers can pass both existing and new
# targets without pre-filtering). Writes a `created-files.txt` manifest
# that rollback can use to remove files this run creates.
#
# Echoes the backup directory path on stdout (for the caller to record).

set -eu

if [[ $# -lt 1 ]]; then
  echo "usage: backup.sh <file1> [<file2> ...]" >&2
  exit 2
fi

ROOT="$(pwd)"
TS="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
BACKUP_DIR="$ROOT/.ai-dev-setup/backups/$TS"
mkdir -p "$BACKUP_DIR"

# Split args into existing (to tar) and missing (to record as future-created)
existing=()
missing=()
for f in "$@"; do
  if [[ -e "$f" ]]; then
    existing+=("$f")
  else
    missing+=("$f")
  fi
done

# Tar existing files preserving relative paths
if [[ ${#existing[@]} -gt 0 ]]; then
  tar -cf "$BACKUP_DIR/restore.tar" "${existing[@]}"
fi

# Record files that don't exist yet — rollback can remove them
if [[ ${#missing[@]} -gt 0 ]]; then
  printf '%s\n' "${missing[@]}" > "$BACKUP_DIR/created-files.txt"
fi

# Emit metadata for auditability
{
  echo "timestamp: $TS"
  echo "cwd: $ROOT"
  echo "existing:"
  for f in "${existing[@]:-}"; do [[ -n "$f" ]] && echo "  - $f"; done
  echo "created:"
  for f in "${missing[@]:-}"; do [[ -n "$f" ]] && echo "  - $f"; done
} > "$BACKUP_DIR/manifest.yaml"

echo "$BACKUP_DIR"
