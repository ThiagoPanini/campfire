# Install / configure / validate / rollback playbook

The concrete rules for writing to the repo. Apply these to every install, regardless of category.

## Preconditions

Before any write:

1. Detection profile exists at `.ai-dev-setup/last-detection.json` (or in memory from Phase 1).
2. User has approved each decision, or approved the scope.
3. Git state known. If dirty, warn and offer to stash or create a branch.
4. Working directory ensured: `mkdir -p .ai-dev-setup/backups .ai-dev-setup` as needed.
5. `.ai-dev-setup/` is git-ignored (add an entry to `.gitignore` on first use if missing).

## Backup rules

Every file the skill modifies gets a snapshot first.

- Script: `scripts/backup.sh <file1> <file2> ...`
- Destination: `.ai-dev-setup/backups/<UTC-timestamp>/restore.tar` (single tar per install run).
- On exit with non-zero, the final report must include the exact restore command.

Backups are additive and never pruned automatically. If disk space is a concern, instruct the user to clean older ones.

## Write rules

1. **Additive merge when possible.** For JSON/TOML/YAML configs, read → modify the relevant key → write. Don't clobber the whole file.
2. **Diff-preview before non-additive writes.** If you must replace, show the user the diff (even a compact one) and ask before writing.
3. **Idempotent.** Writing the skill's result twice should produce the same file. Check for presence of your target block before adding.
4. **No implicit creation.** If a parent directory doesn't exist and creating it has implications (e.g. `.cursor/` in a non-Cursor repo), confirm first.
5. **File permissions**: keep file modes as they were. Never make executable things non-executable or vice versa by accident.
6. **Line endings and final newline**: match existing convention; default to `\n` and a trailing newline.

## Secrets handling

- Never write a secret into a committed file.
- Reference secrets via env vars: `${GITHUB_PAT_TOKEN}`, `${OPENAI_API_KEY}`, etc.
- Ensure `.env` is in `.gitignore` before adding any file that could end up loading one.

## Changelog

Every run that writes anything appends to `.ai-dev-setup/changelog.md`:

```
## 2026-04-22T14:02:11Z  (run-id: <uuid>)
Mode: bootstrap
Decisions approved: 4

Changes:
- Created AGENTS.md (was missing)
- Merged "serena" into .mcp.json (previous: [mintlify])
- Added hook entry to .claude/settings.json (SessionStart -> serena-hooks activate)

Backup: .ai-dev-setup/backups/2026-04-22T14-02-11Z/restore.tar
```

This is the single source of truth for what this skill has done over time.

## Validation

After writes, run category-specific validators or the general `scripts/validate.sh [category]`:

| Category | Validator checks |
|----------|------------------|
| ai-artifacts | File exists, under ~150 lines if always-loaded, no duplicate rules |
| mcp | `jq . <config>` passes; for stdio servers, binary on PATH |
| token-opt | `rtk gain` works (or Serena hook fires on next session start) |
| sdd | `.specify/` or chosen scaffolding exists with expected files |
| skills | Skill appears in the next session's skill listing |

Validation **must run**. A setup that "installed without errors" but doesn't actually work is worse than no setup.

## Rollback

Two levels:

### Full rollback (most common request)
```bash
# Restore every file touched in the latest run
tar -xf .ai-dev-setup/backups/<timestamp>/restore.tar -C /
```

If files were created (not modified), they are not in the tar. Include a separate `created-files.txt` manifest in the backup dir so rollback removes them:

```bash
xargs -a .ai-dev-setup/backups/<timestamp>/created-files.txt rm -f
```

### Partial rollback
User wants to keep some changes and revert others. The changelog lists per-file actions with backup locations; instruct the user on the specific file restore:

```bash
# Example: restore just .mcp.json
tar -xf .ai-dev-setup/backups/<ts>/restore.tar -C / .mcp.json
```

### When rollback isn't possible
Certain operations have side effects beyond files (e.g. running a CLI that mutates global config, installing a binary). List these in the changelog explicitly as "non-reversible via rollback" so the user knows.

## Summary contract

Every completed run produces, in order:

1. Backup tar under `.ai-dev-setup/backups/<ts>/`.
2. Changelog entry.
3. Validation report (pass/fail per category).
4. User-facing report (see [interaction.md](interaction.md)).
5. Explicit rollback instructions in the report.

If any of these is missing, the run is not complete.
