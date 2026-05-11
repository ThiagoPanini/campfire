# MVP scope

The first runnable version of `tossit` does the smallest useful thing end to end.

## In scope

- A `tossit` binary, invokable as `git tossit` from any git repository.
- Default behaviour with zero flags:
  1. Detect the configured remote (default: `origin`).
  2. If the working tree is clean, exit 0 with a message and do nothing.
  3. Otherwise, stage all changes (tracked + untracked, excluding gitignored).
  4. Create a commit on a new local branch named `junk/<user>/<UTC-timestamp>` with a WIP message containing the source branch and timestamp.
  5. Push that branch to the remote.
  6. Restore the user to their original branch with a clean working tree.
- Flags:
  - `-m, --message <hint>` — append a hint to the generated WIP message.
  - `--branch <name>` — override the generated junk branch name.
  - `--remote <name>` — override the default remote.
  - `--dry-run` — print the plan, do nothing.
  - `-h, --help`, `--version`.

## Explicitly out of scope for the MVP

- Garbage collection of old junk branches.
- Listing or restoring previously tossed branches (a future `git tossit list` / `git tossit restore`).
- Config-file support. Defaults are hard-coded; everything is overridable by flag.
- Shell completions.
- Installer scripts, Homebrew tap, package-manager releases.
- Windows-specific path handling beyond what the standard library handles for free.

## Definition of done

- `go build ./cmd/tossit` produces a working binary on Linux and macOS.
- The MVP flow works against a real local repo with a real remote (a throwaway GitHub repo is fine).
- A handful of unit tests cover the non-shell-out parts (message formatting, branch-name generation, flag parsing).
- The README's usage examples all work as documented.
