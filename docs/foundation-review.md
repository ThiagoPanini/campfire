# Foundation Review

A critical pass over the repository's foundation artifacts after [PRODUCT_VISION.md](../PRODUCT_VISION.md) and [mvp-scope.md](./mvp-scope.md) were finalized on 2026-05-11. The review is opinionated and does not protect existing decisions because they were already made.

Severity legend: **critical** (foundation is broken or misleading), **should-fix** (real but non-blocking), **nice-to-have** (polish), **not-a-bug** (looked at, no change needed).

---

## README.md

**[nice-to-have]** Status section is sparser than it needs to be. — [README.md:23-25](../README.md#L23-L25)
PRODUCT_VISION.md and docs/mvp-scope.md are now real documents, not scaffolds. The README's status line could acknowledge that the foundation is set and the next step is the walking skeleton.
*Suggested change*: replace the one-line status with a short paragraph noting that vision and MVP scope are drafted, and that the next milestone is the deployed walking skeleton.

**[nice-to-have]** No mention of licensing. — [README.md (file-wide)](../README.md)
ADR 0001 explicitly defers the license decision and notes that the code defaults to "all rights reserved." The README is the public face — a reader looking at the repo has no way to know this without reading the ADR.
*Suggested change*: add one line ("License: not yet decided — see ADR 0001") so the deferral is visible at the surface.

**[not-a-bug]** All cross-references resolve (vision, MVP scope, CLAUDE.md, AI_WORKFLOW.md, AGENTS.md, copilot-instructions.md). Repository-layout block matches the actual tree.

---

## CLAUDE.md

**[should-fix]** "Don't preemptively create slash commands, sub-agents, or custom skills" is contradicted by repo state. — [CLAUDE.md:52](../CLAUDE.md#L52)
The repo contains a fully-authored custom skill at `.claude/skills/start-ai-assisted-project/` and three additional skills under `.agents/skills/` (symlinked into `.claude/skills/`). The convention as written prohibits exactly what the repo already does. Two coherent options:
- (a) Refine the convention to distinguish *authored-here* (prohibited preemptively) from *externally sourced and pinned via `skills-lock.json`* (allowed).
- (b) Move skill authoring out of this repo entirely; campfire is a music product, not a skill development repo.

**[should-fix]** No mention of `.agents/skills/` or `skills-lock.json` in the repository layout. — [CLAUDE.md:9-18](../CLAUDE.md#L9-L18)
Both exist, both are git-tracked, both are foundational to how this project's AI tooling works. The layout block omits them.
*Suggested change*: extend the layout block to include `.agents/skills/` (shared agent skills, pinned by `skills-lock.json`) and reference AI_WORKFLOW.md for detail.

**[not-a-bug]** "Each app under `apps/` is expected to expose a `dev/run_local.py`..." is forward-looking. — [CLAUDE.md:41](../CLAUDE.md#L41)
Neither `apps/api/` nor `apps/web/` contains code yet (`.gitkeep` only), so the convention is unenforceable today but coherent. Fine.

**[not-a-bug]** Project description (line 7) matches PRODUCT_VISION.md exactly. No drift.

---

## AGENTS.md

**[should-fix]** Layout block omits `.agents/skills/` and `skills-lock.json`. — [AGENTS.md:9-14](../AGENTS.md#L9-L14)
Same issue as CLAUDE.md. Since AGENTS.md is the Codex-facing condensed mirror, this absence means Codex sessions are blind to a foundational piece of the tooling.

**[not-a-bug]** Mirrors CLAUDE.md's principles and project description exactly. No drift between the two.

---

## .github/copilot-instructions.md

**[should-fix]** Layout block omits `.agents/skills/` and `skills-lock.json`. — [.github/copilot-instructions.md:9-14](../.github/copilot-instructions.md#L9-L14)
Same gap as AGENTS.md. Copilot has no view of the shared-skills layout.

**[not-a-bug]** Cross-references (`../CLAUDE.md`, `../AI_WORKFLOW.md`, `../docs/decisions/0002-documentation-language.md`) all resolve and use the correct relative path.

**[not-a-bug]** Mirrors AGENTS.md and CLAUDE.md exactly on principles, layout one-liners, language convention.

---

## AI_WORKFLOW.md

**[critical]** "No tools currently in active use" is false. — [AI_WORKFLOW.md:57](../AI_WORKFLOW.md#L57)
The repo has at least four skills committed and active:
- `enhance-prompt` (sourced from `google-labs-code/stitch-skills`)
- `git-commit` (sourced from `github/awesome-copilot`)
- `skill-creator` (sourced from `anthropics/skills`)
- `start-ai-assisted-project` (authored locally)

The "Active inventory" section is the single most load-bearing block in this document and it currently asserts the opposite of reality.
*Suggested change*: replace the placeholder with a real table listing each skill, its source, and why it was adopted.

**[critical]** `.agents/skills/` and `skills-lock.json` are entirely absent from the document. — [AI_WORKFLOW.md (file-wide)](../AI_WORKFLOW.md)
The "Categories of AI tooling" table only lists `.claude/skills/<name>/SKILL.md` as the location for skills, but the canonical path in this repo is `.agents/skills/<name>/` with `.claude/skills/` containing only symlinks. The lock file (`skills-lock.json`) that pins external skills by hash is never mentioned. A reader trying to add a skill from this document would do the wrong thing.
*Suggested change*: add `.agents/skills/` as the canonical location, explain the symlink pattern under `.claude/skills/`, and document `skills-lock.json` as the pinning mechanism for externally sourced skills.

**[should-fix]** MCPs and Hooks are said to be configured in `.claude/settings.json`, but no such file exists in the repo. — [AI_WORKFLOW.md:23-24](../AI_WORKFLOW.md#L23-L24)
What exists is `.claude/settings.local.json` (gitignored, per-developer). The committed `.claude/settings.json` has never been created. The doc gives a misleading pointer.
*Suggested change*: clarify that `.claude/settings.json` is the convention for repo-wide MCPs/hooks (when they exist) and `.claude/settings.local.json` is per-developer.

**[should-fix]** "No empty directories" claim, while still accurate, no longer captures the relevant rule. — [AI_WORKFLOW.md:33](../AI_WORKFLOW.md#L33)
`.claude/skills/` now exists with content (symlinks + the locally authored skill + the workspace), so the rule is satisfied. But `apps/api/.gitkeep` and `apps/web/.gitkeep` and `packages/.gitkeep` are empty-directory markers that the rule, read strictly, prohibits. Either the rule is `.claude/`-specific (then say so) or it should explicitly carve out `apps/` and `packages/`.

**[not-a-bug]** "Design workflow" placeholder section is appropriately deferred — vision and MVP are now drafted, so this section becoming a stub is the next move, but it can be filled when design tooling is actually picked.

---

## docs/decisions/0001-monorepo-structure.md

**[not-a-bug]** Layout, package manager choices, deferrals all match repo state. Date is absolute (2026-05-10). Frontmatter style consistent.

**[not-a-bug]** "Not yet decided" list (license, frontend stack, database, deploy provider, etc.) is honest and matches the current state of the foundation. No drift with PRODUCT_VISION.md's deliberate deferrals.

**[nice-to-have]** No mention of `.agents/skills/` as a directory in the layout, but ADR 0001 was written before that pattern entered the repo. A follow-up ADR (or an update here) documenting *why* `.agents/skills/` exists would be more honest than retrofitting this ADR.

---

## docs/decisions/0002-documentation-language.md

**[not-a-bug]** Decision is clearly stated, applies to artifacts not conversation, and matches all written documents in the repo so far.

**[not-a-bug]** Consequences acknowledge the genuine downside (author's slightly higher cognitive load when writing prose). No softening.

---

## .gitignore

**[should-fix]** `.vscode/` whitelist is broader than the convention in CLAUDE.md. — [.gitignore:29-32](../.gitignore#L29-L32)
The whitelist exempts `launch.json`, `extensions.json`, and `tasks.json`. CLAUDE.md mentions only `launch.json`. Either:
- Narrow the gitignore to only `launch.json`, or
- Broaden CLAUDE.md to acknowledge that `extensions.json` and `tasks.json` are also committed when present.

The drift is small but exactly the audit category that caught a previous issue.

**[should-fix]** `.claude/skills/start-ai-assisted-project-workspace/` is git-tracked and should almost certainly be ignored. — [.gitignore (missing rule)](../.gitignore)
This directory is the eval/benchmark workspace for the locally-authored `start-ai-assisted-project` skill. It contains ~500KB across multiple eval iterations (`eval-chronicler`, `eval-flux`, `eval-tossit`, each with `with_skill/` and `without_skill/` variants and dozens of output artifacts). None of it is campfire-related.
See the "Gaps and broader observations" section below for the full picture — this `.gitignore` finding is just one piece.

**[not-a-bug]** Python and Node ignores are reasonable defaults. `.env` ignored. `.claude/settings.local.json` ignored correctly (the file exists on disk but is not tracked).

---

## .editorconfig

**[not-a-bug]** Minimal, sensible defaults. 2-space global, 4-space Python, preserved trailing whitespace in markdown (necessary for hard line breaks). `root = true` prevents inheritance from outside the repo.

---

## Gaps and broader observations

These are not findings against a specific file — they are absences or repo-wide issues worth deciding on.

**[critical]** Skill development workspace is leaking into the product repo. — `.claude/skills/start-ai-assisted-project-workspace/`
The `start-ai-assisted-project` skill (locally authored) has its full eval workspace committed alongside campfire's foundation. ~500KB across multiple eval iterations, each containing fake "project outputs" that exactly mirror this project's structure. A reader cloning campfire would find dozens of `CLAUDE.md`, `AGENTS.md`, etc., scattered under `.claude/skills/start-ai-assisted-project-workspace/iteration-1/eval-*/`. This:
- Bloats the repo and slows tree exploration for both humans and AI agents.
- Confuses project identity (campfire is a music platform, not a skill-development repo).
- Pollutes search results — every grep for "CLAUDE.md" or "PRODUCT_VISION.md" returns dozens of false hits.

*Suggested change (pick one)*:
- (a) **Remove the workspace from the campfire repo entirely.** Skill development happens in a separate repo. Add `.claude/skills/*-workspace/` to `.gitignore`.
- (b) **Move it under a different path** like `tools/skill-dev/` and document explicitly that this repo doubles as a skill development sandbox.
- (c) **Keep it but add `.gitignore` entries for the eval output subtrees** (`eval-*/with_skill/outputs/`, `eval-*/without_skill/outputs/`) so the workspace's bulk leaves the tree.

My preference is (a). The presence of skill-development scaffolding inside the product repo is the inverse of "Reactive tooling, not proactive" — it's bringing the development of meta-tooling into a product foundation that should be tiny.

**[should-fix]** No LICENSE file. — repo root
ADR 0001 acknowledges this and defers the decision. That is a valid stance, but if the repo is ever made public (even transiently for sharing a link), the default copyright posture should be visible. Optional follow-up: a short `LICENSE` file with explicit "All rights reserved, license to be determined" content, or just a `LICENSE` note at the bottom of the README.

**[nice-to-have]** No `SECURITY.md`, `CONTRIBUTING.md`, or `CODE_OF_CONDUCT.md`. — repo root
For a solo project at this stage, all three are correctly absent. Worth noting only because the foundation feels otherwise complete and a future "should we add these?" decision is implicit.

**[not-a-bug]** No CI configuration. ADR 0001 defers CI/CD. No code exists yet to test. Correct.

**[not-a-bug]** `apps/api/.gitkeep`, `apps/web/.gitkeep`, `packages/.gitkeep` — empty-directory markers. CLAUDE.md states these apps materialize their first files in the same commit as their first runnable code, so the `.gitkeep`s are temporary structural placeholders. Coherent with the documented convention.

---

## Cross-document consistency check

All three condensed mirrors of CLAUDE.md (AGENTS.md, .github/copilot-instructions.md) agree on:
- Project description (one-liner).
- Repository layout (with the **shared omission** of `.agents/skills/` and `skills-lock.json`).
- Engineering principles (1-5, identical wording).
- Language convention.
- "What to avoid" list.

The mirrors are coherent with each other. The shared gap (missing `.agents/` directory mention) is consistent — they all fail the same way, in sync. That makes the fix tractable: a single update propagates to all three.

---

## Recommended actions, grouped by tier

### Critical — address before continuing

1. **Fix AI_WORKFLOW.md "Active inventory"** to reflect the four skills actually in use, with source and rationale. [AI_WORKFLOW.md:57](../AI_WORKFLOW.md#L57)
2. **Add `.agents/skills/` and `skills-lock.json` to AI_WORKFLOW.md's Categories table and explain the symlink/lockfile pattern.** [AI_WORKFLOW.md:17-26](../AI_WORKFLOW.md#L17-L26)
3. **Decide what to do with `.claude/skills/start-ai-assisted-project-workspace/`** (recommended: remove and gitignore). Either way, take the decision before more foundation work accretes around it.

### Should-fix — address with the critical batch if possible

4. **Reconcile CLAUDE.md's "Don't preemptively create custom skills" with the four committed skills.** Either refine the rule (authored vs. sourced) or remove the locally-authored skill from the repo. [CLAUDE.md:52](../CLAUDE.md#L52)
5. **Add `.agents/skills/` and `skills-lock.json` to the repository-layout block in CLAUDE.md, AGENTS.md, and .github/copilot-instructions.md.** Single coordinated edit across all three.
6. **Clarify in AI_WORKFLOW.md that `.claude/settings.json` is the committed convention and `.claude/settings.local.json` is the per-developer override.** Currently the doc points at a file that doesn't exist. [AI_WORKFLOW.md:23-24](../AI_WORKFLOW.md#L23-L24)
7. **Resolve the `.vscode/` whitelist drift** — either narrow `.gitignore` to `launch.json` only, or broaden CLAUDE.md to mention all three. [.gitignore:29-32](../.gitignore#L29-L32) ↔ [CLAUDE.md:41](../CLAUDE.md#L41)
8. **Tighten or carve out the "No empty directories" rule in AI_WORKFLOW.md** so it doesn't accidentally contradict the `apps/*/.gitkeep` and `packages/.gitkeep` placeholders. [AI_WORKFLOW.md:33](../AI_WORKFLOW.md#L33)

### Nice-to-have — pick up when convenient

9. **Expand README.md status** to acknowledge the foundation is complete and the walking skeleton is next. [README.md:23-25](../README.md#L23-L25)
10. **Surface the license deferral in README.md** with a one-liner pointing to ADR 0001. [README.md (new line)](../README.md)
11. **Consider a follow-up ADR** documenting the `.agents/skills/` pattern (multi-agent shared skills, externally sourced, pinned by hash). Currently this is an undocumented architectural choice.

### Not-a-bug — looked at, no change needed

12. ADR 0001 and ADR 0002 are accurate and consistent with the rest of the foundation.
13. `.editorconfig` is correct.
14. The condensed mirrors (AGENTS.md, copilot-instructions.md) are in sync with CLAUDE.md aside from the shared layout-block gap already listed.
15. Empty-directory placeholders under `apps/` and `packages/` are coherent with the documented "materialize in same commit as first code" convention.
