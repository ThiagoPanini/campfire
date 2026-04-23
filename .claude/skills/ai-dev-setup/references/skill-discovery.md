# Skill discovery

When the in-scope work includes installing reusable skills, do active discovery before shortlisting. Do not recommend skills from memory — they may have been renamed, removed, or may never have existed.

## Sources (in preference order)

1. **`find-skills` skill (local)** — if installed, it's the fastest and most accurate path. Invoke it and read its recommendations.
2. **skills.sh** — https://skills.sh/ — web-hosted index. Use via WebFetch when `find-skills` is unavailable or the user wants a broader sweep.
3. **Known registries mentioned by the user** — e.g. if they have a `skills-lock.json` referencing `anthropics/skills` or a team repo, consult those directly.
4. **Already-installed skills** — detection profile `ai_artifacts.skills_dirs` tells you what's here; never re-recommend.

Do not invent skill names. If you cannot confirm a skill via at least one of these sources, say so.

## Discovery workflow

### Step 1 — Check for `find-skills`

```bash
# Look for the skill in standard locations
ls .claude/skills/find-skills 2>/dev/null || \
ls .agents/skills/find-skills 2>/dev/null || \
ls ~/.claude/skills/find-skills 2>/dev/null
```

If found, use it and skip to Step 3.

If not found, offer to install it:

```
Decision: Install `find-skills` as a discovery helper?
Why: It makes this and future discovery passes faster and more accurate.

  Option A — Recommended: install find-skills now
  Option B: skip, use skills.sh directly this time
  Option C: defer entirely
```

### Step 2 — Query skills.sh (fallback)

Use WebFetch against https://skills.sh/ or any category index page the user points to. Look for:

- skill name, description
- source repo (GitHub org/repo)
- last-updated signal if exposed
- any declared compatibility / dependencies

If the page is JS-heavy and WebFetch returns thin content, fall back to the source repos directly (e.g. `anthropics/skills`, `wshobson/agents`, community skills indexes).

### Step 3 — Shortlist

For each category the user approved (e.g. "Python testing skills"), produce a shortlist of at most 3 candidates. Each entry must include:

- name
- source (repo / URL)
- one-line description
- why it fits THIS repo (reference the detection profile)
- conflicts or overlap with already-installed skills
- install path (managed registry? direct copy?)

**Do not auto-install anything.** Even a strong match needs explicit approval.

### Step 4 — Present using the decision block

Follow [interaction.md](interaction.md). One decision block per skill:

```
Decision: Install skill `python-design-patterns`?
Why: You have Python code and no existing design-pattern guidance skill.

  Option A — Recommended: install
    Source: wshobson/agents
    Best fit because: Python is the detected primary stack; no overlap with installed skills.
    Tradeoffs: +1 skill to maintain.

  Option B: defer
    Best fit if: you're not doing design work right now.
```

### Step 5 — Install via the correct path

- **If a skill registry is detected** (`skills-lock.json` etc.): use the registry's own CLI. Do not write into the managed skills dir directly — the lock hash will break.
- **If no registry**: copy the skill folder into the appropriate skills directory (project-scoped by default — `.claude/skills/<name>/` or `.agents/skills/<name>/` depending on the existing convention).
- **Always validate**: after install, confirm the skill appears in the available-skills list (it will show up in the next session's `<system-reminder>` listing).

### Step 6 — Record

Add a line to `.ai-dev-setup/changelog.md`:

```
2026-04-22  install skill python-design-patterns from wshobson/agents via find-skills
```

If a registry tool owns this file, let the registry record it and just note the registry invocation in the changelog instead.

## Reuse find-skills as a durable helper

If `find-skills` was installed during this run, mention in the final report that it's now available for future discovery: "Re-run skill discovery any time with `/find-skills <topic>` (or whatever its trigger is) — this avoids cold-searching skills.sh from scratch each time."

## Common mistakes to avoid

- Recommending a skill that's already in `detection.ai_artifacts.skills_dirs`.
- Recommending a skill whose source repo can't be located — silent invention.
- Skipping user approval because the skill "is obviously useful."
- Installing into the managed skills dir when a lockfile is in use.
- Overloading the shortlist with 10 skills. Three is the ceiling per category.
