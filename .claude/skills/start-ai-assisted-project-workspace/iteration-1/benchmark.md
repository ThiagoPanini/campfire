# Iteration 1 — Benchmark report

Skill: `start-ai-assisted-project`
Date: 2026-05-11

## Quantitative results

| Eval | Condition | Pass rate | Tokens | Duration |
|---|---|---|---|---|
| flux | with_skill | **23/23 (100%)** | 46,118 | 185.8s |
| flux | without_skill | 21/23 (91%) | 25,969 | 110.6s |
| tossit | with_skill | **24/24 (100%)** | 42,467 | 112.5s |
| tossit | without_skill | 21/24 (88%) | 23,075 | 95.0s |
| chronicler | with_skill | **21/21 (100%)** | 43,309 | 101.8s |
| chronicler | without_skill | 19/21 (90%) | 24,346 | 146.0s |
| **Aggregate** | **with_skill** | **68/68 (100%)** | **43,965 avg** | **133.4s avg** |
| **Aggregate** | **without_skill** | 61/68 (89.7%) | 24,463 avg | 117.2s avg |

**Deltas (with_skill − without_skill)**:

- Pass rate: **+10.3 percentage points**
- Tokens: **+79.7%** (skill version reads SKILL.md and 12 templates)
- Wall time: **+13.8%**

## Where the skill makes a real difference

The 7 failed assertions across the 3 baselines clustered around 3 recurring gaps:

### Gap 1 — Multi-agent default (3/3 baselines failed)

Every baseline omitted `.github/copilot-instructions.md`. They produced CLAUDE.md and AGENTS.md but did not consider Copilot. The skill makes multi-agent the recommended default and creates all three instruction files.

### Gap 2 — `PRODUCT_VISION.md` discipline (3/3 baselines failed)

Every baseline invented product copy in `PRODUCT_VISION.md` instead of leaving it as an explicit "to be drafted" scaffold. The skill's Step 8 audit forbids invented content; this is one of the most load-bearing constraints — it prevents the agent from anchoring the user on imagined product framing before the user has thought it through.

### Gap 3 — Stack-aware `.gitignore` (1/1 stack-specific baseline failed)

The tossit baseline did not append Go-specific patterns to `.gitignore`. The skill's `references/stack-defaults.md` codifies this and Step 7 explicitly applies them.

## Where baselines diverged in shape (not formally graded, but observed)

These differences are not necessarily worse — they are different *interpretations* of "good foundation". Worth noting.

### ADR count: baselines produce more, smaller ADRs

| Eval | with_skill ADRs | without_skill ADRs |
|---|---|---|
| flux | 1 | 5 |
| tossit | 1 | 3 |
| chronicler | 1 | 4 |

Baselines follow Nygard-classic "one decision per ADR" — meta-ADR for ADR process + one per concrete choice. The skill uses a single `0001-project-foundation.md` covering all bootstrap decisions, with future decisions getting their own ADRs.

Trade-off: many small ADRs at bootstrap means more maintenance overhead and obscures which decisions are foundational versus incremental. The skill's "one bootstrap ADR" frames foundational decisions as a coherent set.

### Extra invented artifacts

- **flux baseline** added `docs/roadmap.md` (not in skill output). This is invented planning material before the user has written `mvp-scope.md`.
- **chronicler baseline** did NOT create the `apps/api/`, `apps/web/`, `packages/` directory placeholders despite choosing a monorepo. Resulting layout block in its README does not match the actual filesystem.

### Token cost

The skill's +79.7% token overhead comes from reading SKILL.md (220 lines) and ~12 templates per invocation. This is the "loading cost" — every invocation pays it.

For a bootstrap skill that runs once per project, this cost is irrelevant. If the skill were invoked repeatedly, the cost would matter and the skill could be optimized (e.g., inline more content in SKILL.md to avoid template reads, or use progressive disclosure more aggressively).

## Observations on individual baselines

### Tossit baseline was remarkably good

The tossit baseline subagent independently arrived at most of the skill's principles (CLAUDE.md / AGENTS.md / AI_WORKFLOW.md separation, walking-skeleton, rule-of-three, reactive tooling, no premature config, no `Makefile`/CI/Docker, `.editorconfig` with Go-tab override). It even produced a `cmd/tossit/` + `internal/` layout decision in an ADR — which the skill deliberately defers.

This suggests frontier models in 2026 have absorbed enough good-engineering patterns to bootstrap competently without a skill, when the prompt is well-framed. The skill's primary value is **consistency** (every project gets the same shape) and **discipline** (refusing to invent content the user hasn't decided yet) — not raw knowledge.

### Flux baseline over-decided

The flux baseline created 5 ADRs at bootstrap including a separate one for documentation language. The user said nothing about language; the baseline picked English and recorded it as a formal decision. The skill records language only in CLAUDE.md unless the user picks non-English.

### Chronicler baseline missed monorepo directories

The chronicler baseline wrote a `README.md` describing a monorepo layout but did NOT create the `apps/api/`, `apps/web/`, `packages/` directories. So the actual repo doesn't match the described layout. The skill explicitly materializes these with `.gitkeep` files.

## Recommended iterations on the skill

Based on these findings:

1. **No major changes needed** — the skill consistently differentiates from baseline on the 3 dimensions that matter most.
2. **Consider tightening the description** — current description is "pushy" per skill-creator guidance, and triggering is not the issue tested here (we forced it on). Could run the description-optimization loop separately.
3. **One nit worth fixing**: the skill could be slightly more explicit that `.github/copilot-instructions.md` is part of the default multi-agent set, because that's the most consistent baseline miss.

## Methodology notes

- Subagents were `general-purpose` agents with full tool access.
- Each subagent ran independently; baselines received no skill reference.
- AskUserQuestion was bypassed in eval mode — defaults were injected via the eval prompt (this is a divergence from real usage where the human is in the loop).
- Today's date (2026-05-11) was provided to subagents so ADR dates would be consistent.
- All outputs persist under `iteration-1/eval-<id>/<condition>/outputs/`.
- Per-run grading lives in `iteration-1/eval-<id>/<condition>/grading.json`.
