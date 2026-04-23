# Interaction patterns

How to present decisions to the user. The goal is minimum cognitive load and clean, auditable choices.

## Decision block format

Every decision the skill puts in front of the user follows the same shape:

```
Decision <N>: <short title in one line>
Why it matters: <one sentence — the concrete consequence, not generic hand-waving>

  Option A — Recommended: <tool/approach>
    Best fit because: <reason tied to THIS repo's detection profile>
    Tradeoffs: <honest cost — maintenance, tokens, setup friction>

  Option B: <alternative>
    Best fit if: <the priority under which B wins>
    Tradeoffs: ...

  Option C — Defer: skip for now
    Best fit if: <the case where adding anything is premature>
    Tradeoffs: <what you lose by waiting>

Your call? (A / B / C / custom)
```

Always offer a **defer** option. It's often the right answer and users should feel free to take it without friction.

## Batching

- Group related decisions (e.g. all MCP servers together) so the user can reason about them in context.
- Cap each batch at ~5 decisions. If there are more, split into rounds and do the highest-leverage round first.
- Never present a decision that depends on a later decision's outcome — order them.

## How "recommended" is chosen

The recommended option should be driven by the detection profile plus the decision framework, not by popularity. The "Best fit because" line must reference something concrete from the profile:

> Best fit because: this repo already has `AGENTS.md` and Copilot instructions, so an agent-agnostic MCP config (Option A) avoids splitting configuration across three files.

Not:

> Best fit because: it's the most popular option.

## When to skip the decision UI

- **Audit mode**: do not ask for decisions. Produce a written recommendation document and stop.
- **The user has already decided**: if they said "install Serena", don't re-ask "do you want Serena?". Still surface *sub-decisions* (e.g. project-scoped vs. user-scoped config) when they're meaningful.
- **Idempotent, reversible, no-surprise**: minor edits like adding a single well-known line to `.gitignore` can be announced rather than voted on.

## When to stop and confirm mid-install

Even after the decision batch, pause for confirmation if you encounter:

- A file you're about to touch that wasn't in the detection profile (something changed since detect ran).
- A non-additive change (overwrite, delete, restructure) where the diff exceeds what the original decision implied.
- A dependency on a secret or credential not previously discussed.

Short confirmation is fine: "About to overwrite `.mcp.json` — existing servers: [mintlify]. New file will have: [mintlify, serena, github]. Proceed?"

## Presenting the final report

One report at the end, structured like this:

```
## Installed

- <file>: <what changed>, backup at <path>
- <file>: ...

## Deferred (explicitly, with reason)

- <tool>: <why we skipped>
- ...

## Post-install actions needed from you

- <e.g. `rtk gh auth login` to complete GitHub MCP setup>

## Rollback

To undo everything from this run: `tar -xf .ai-dev-setup/backups/<ts>/restore.tar -C /`
Changelog: `.ai-dev-setup/changelog.md`
```

No emojis. No celebration. Just the facts.
