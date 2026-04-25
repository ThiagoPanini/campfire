# Category: SDD (Spec-Driven Development)

Scaffolding that turns informal feature requests into specs → plans → tasks → implementation.

## Candidates

### Spec Kit (primary)
- **What**: A framework that provides templates and slash-command skills for the spec/plan/tasks workflow.
- **Signals**: `.specify/` directory, `speckit-*` skills (`speckit-specify`, `speckit-plan`, `speckit-tasks`, `speckit-implement`, `speckit-clarify`, `speckit-analyze`, `speckit-checklist`, `speckit-constitution`, `speckit-taskstoissues`, `speckit-git-*`).
- **Fit**: Projects with a roadmap, multiple features in flight, or a team that wants a consistent structure. Overkill for a repo that ships one script.
- **Compatibility**: Works standalone; shines with a project constitution and Serena MCP.

### Lightweight alternatives
When Spec Kit is too much but structure is still wanted:
- A `specs/` directory with a simple template (feature title, user story, acceptance criteria).
- An ADR directory (`docs/adr/`) for architecture decisions.
- A project `CONSTITUTION.md` describing non-negotiable rules.

These are often a good stepping stone before committing to Spec Kit.

### Constitution
A file that locks in project principles (style, architecture rules, what not to do). Pairs with any SDD flavor. Spec Kit places it at `.specify/memory/constitution.md`; ad-hoc versions live at `CONSTITUTION.md`.

## Fit criteria

| Situation | Recommendation |
|-----------|----------------|
| Solo maintainer, small repo, no roadmap | Defer SDD. Maybe a simple `ADR.md`. |
| Solo maintainer, complex repo, many features | Spec Kit if you'll use it; lightweight `specs/` + ADR otherwise |
| Multi-person team | Spec Kit usually pays off; reduces coordination cost |
| Existing `.specify/` present | Do not reinstall. Check which skills/components are missing and offer to add. |

## Install sketch

### Spec Kit
1. Back up `.specify/` if it exists (it shouldn't, but check).
2. Install via the official CLI or repo clone into `.specify/`.
3. Install the `speckit-*` skills (separate category — see [skill-discovery.md](../skill-discovery.md)).
4. If no constitution exists, offer to create one with `/speckit-constitution` (via the installed skill).
5. Validate: run `/speckit-specify` on a tiny made-up feature and confirm it produces the expected file layout.

### Constitution only (lightweight)
1. Start from a minimal template (goals, hard rules, explicit non-goals).
2. Place at `.specify/memory/constitution.md` if Spec Kit exists, else `CONSTITUTION.md` at root.
3. Reference it from `AGENTS.md` so agents consult it before making architectural changes.

## Common mistakes

- Installing Spec Kit then never using the skills (all surface, no leverage).
- Duplicating constitution rules into `AGENTS.md` instead of linking.
- Creating `specs/` and `plans/` folders manually when Spec Kit is already installed (conflicts with `.specify/` structure).
- Using SDD on a repo that has literally no features yet — spec the first feature with a prompt, adopt SDD at feature 2 or 3.

## Integration with other categories

- **Skills**: `speckit-*` companion skills only make sense when the framework itself is installed.
- **MCP**: Serena MCP is a natural complement — `speckit-implement` benefits from symbol-aware navigation.
- **AI artifacts**: Reference the SDD workflow in `AGENTS.md` ("before implementing, inspect relevant spec/plan/task artifacts if they exist").
