# Product vision

## What `tossit` is

A single-binary git extension that turns "I need to drop what I'm doing right now" into a safe, recoverable, remote-backed operation. One command — `git tossit` — captures every dirty thing in the working tree, commits it with a sensible WIP message, and pushes it to a personal junk branch on the configured remote.

## Who it is for

Developers who:

- Context-switch frequently between branches, PR reviews, and incidents.
- Trust local stashes less than remote branches (because laptops die, repos get re-cloned, stashes get pruned).
- Want a single muscle-memory command rather than a five-step shell incantation.

## What it is not

- **Not a replacement for proper commits.** WIP commits made by `tossit` are intentionally ugly and meant to be rebased, squashed, or thrown away.
- **Not a backup system.** It pushes to a remote you already own; it does not manage retention, encryption, or off-site replication.
- **Not a workflow framework.** It does not enforce branch naming, code review, or any team conventions beyond the junk-branch namespace.

## Design pillars

1. **One command, zero ceremony.** The default path takes zero arguments and never asks questions.
2. **Idempotent and safe.** Running `tossit` on a clean tree is a no-op. It never rewrites history on branches other than its own.
3. **Transparent.** Every action it takes is something you could have typed yourself; the tool just sequences them. `--dry-run` always reveals the exact plan.
4. **Single binary, no runtime.** Distribute as a static Go binary. No config files required for the default path.

## Out of scope (for now)

- Garbage-collecting old junk branches.
- Syncing junk branches between machines beyond what `git fetch` already does.
- Integrations with hosting providers (GitHub, GitLab) beyond plain `git push`.
- A TUI or interactive mode.
