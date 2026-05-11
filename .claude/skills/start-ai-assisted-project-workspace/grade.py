#!/usr/bin/env python3
"""Grade eval outputs for the start-ai-assisted-project skill.

Walks each eval x condition output directory, runs assertion checks, writes
grading.json next to the outputs dir, and prints a pass/total summary.
"""

import json
import re
import sys
from pathlib import Path

WORKSPACE = Path(__file__).parent / "iteration-1"

# Assertions that apply to every eval/condition combination.
UNIVERSAL = [
    {"text": "README.md exists at root", "kind": "file_exists", "path": "README.md"},
    {"text": "CLAUDE.md exists at root", "kind": "file_exists", "path": "CLAUDE.md"},
    {"text": "AI_WORKFLOW.md exists at root", "kind": "file_exists", "path": "AI_WORKFLOW.md"},
    {"text": "PRODUCT_VISION.md exists at root", "kind": "file_exists", "path": "PRODUCT_VISION.md"},
    {"text": ".gitignore exists at root", "kind": "file_exists", "path": ".gitignore"},
    {"text": ".editorconfig exists at root", "kind": "file_exists", "path": ".editorconfig"},
    {"text": "docs/mvp-scope.md exists", "kind": "file_exists", "path": "docs/mvp-scope.md"},
    {"text": "First ADR exists in docs/decisions/", "kind": "glob_match", "pattern": "docs/decisions/0001*.md"},
    {"text": "AGENTS.md exists (Codex)", "kind": "file_exists", "path": "AGENTS.md"},
    {"text": ".github/copilot-instructions.md exists (Copilot)", "kind": "file_exists", "path": ".github/copilot-instructions.md"},
    {"text": "No leftover {PROJECT_NAME} placeholder in any file", "kind": "no_pattern_anywhere", "needle": "{PROJECT_NAME}"},
    {"text": "No leftover {PROJECT_DESCRIPTION} placeholder in any file", "kind": "no_pattern_anywhere", "needle": "{PROJECT_DESCRIPTION}"},
    {"text": "No leftover {TODAY} placeholder in any file", "kind": "no_pattern_anywhere", "needle": "{TODAY}"},
    {"text": "No premature pyproject.toml anywhere", "kind": "no_glob_match", "pattern": "**/pyproject.toml"},
    {"text": "No premature package.json anywhere", "kind": "no_glob_match", "pattern": "**/package.json"},
    {"text": "No premature Dockerfile anywhere", "kind": "no_glob_match", "pattern": "**/Dockerfile"},
    {"text": "No premature .github/workflows/ directory", "kind": "dir_absent", "path": ".github/workflows"},
    {"text": ".gitignore whitelists .vscode/launch.json (workflow consistency)", "kind": "pattern_in_file", "path": ".gitignore", "needle": "!.vscode/launch.json"},
    {"text": "PRODUCT_VISION.md is a scaffold (no invented content)", "kind": "pattern_in_file", "path": "PRODUCT_VISION.md", "needle_regex": "(?i)(to be drafted|status.*to be|scaffold|placeholder)"},
]

# Eval-specific assertions.
EXTRAS = {
    "flux": [
        {"text": "README mentions project name 'flux'", "kind": "pattern_in_file", "path": "README.md", "needle": "flux"},
        {"text": "Monorepo: apps/api/ exists", "kind": "dir_exists", "path": "apps/api"},
        {"text": "Monorepo: apps/web/ exists", "kind": "dir_exists", "path": "apps/web"},
        {"text": "FastAPI surfaced in CLAUDE.md (user-stated stack honored)", "kind": "pattern_in_file", "path": "CLAUDE.md", "needle_regex": "(?i)fastapi"},
    ],
    "tossit": [
        {"text": "README mentions project name 'tossit'", "kind": "pattern_in_file", "path": "README.md", "needle": "tossit"},
        {"text": "Single-app: no apps/ directory", "kind": "dir_absent", "path": "apps"},
        {"text": "Single-app: no packages/ directory", "kind": "dir_absent", "path": "packages"},
        {"text": "Go surfaced in CLAUDE.md", "kind": "pattern_in_file", "path": "CLAUDE.md", "needle_regex": r"(?i)\bgo\b"},
        {"text": "Go-specific .gitignore additions (vendor/ or go.work)", "kind": "pattern_in_file", "path": ".gitignore", "needle_regex": r"vendor/|go\.work"},
    ],
    "chronicler": [
        {"text": "README mentions 'campaign-chronicler'", "kind": "pattern_in_file", "path": "README.md", "needle": "campaign-chronicler"},
        {"text": "Stack left open in CLAUDE.md (TBD / not chosen / etc.)", "kind": "pattern_in_file", "path": "CLAUDE.md", "needle_regex": r"(?i)(TBD|not chosen|to be chosen|deferred)"},
    ],
}


def _read(path: Path) -> str:
    try:
        return path.read_text(errors="replace")
    except Exception:
        return ""


def run_check(root: Path, a: dict) -> dict:
    kind = a["kind"]
    text = a["text"]
    try:
        if kind == "file_exists":
            target = root / a["path"]
            passed = target.is_file()
            evidence = f"{a['path']} {'present' if passed else 'missing'}"
        elif kind == "dir_exists":
            target = root / a["path"]
            passed = target.is_dir()
            evidence = f"{a['path']}/ {'present' if passed else 'missing'}"
        elif kind == "dir_absent":
            target = root / a["path"]
            passed = not target.exists()
            evidence = f"{a['path']}/ {'absent (good)' if passed else 'present (should be absent)'}"
        elif kind == "glob_match":
            matches = [str(p.relative_to(root)) for p in root.glob(a["pattern"])]
            passed = len(matches) > 0
            evidence = f"matches: {matches}" if matches else f"no match for {a['pattern']}"
        elif kind == "no_glob_match":
            matches = [str(p.relative_to(root)) for p in root.glob(a["pattern"])]
            passed = len(matches) == 0
            evidence = "no match (good)" if passed else f"unexpected: {matches}"
        elif kind == "pattern_in_file":
            target = root / a["path"]
            if not target.is_file():
                passed = False
                evidence = f"{a['path']} missing"
            else:
                content = _read(target)
                if "needle" in a:
                    passed = a["needle"] in content
                    evidence = f"'{a['needle']}' {'found' if passed else 'not found'} in {a['path']}"
                else:
                    passed = bool(re.search(a["needle_regex"], content))
                    evidence = f"regex {a['needle_regex']!r} {'matched' if passed else 'did not match'} in {a['path']}"
        elif kind == "no_pattern_anywhere":
            offenders = []
            for f in root.rglob("*"):
                if f.is_file():
                    if a["needle"] in _read(f):
                        offenders.append(str(f.relative_to(root)))
            passed = not offenders
            evidence = "no occurrences (good)" if passed else f"found in: {offenders[:5]}"
        else:
            passed = False
            evidence = f"unknown check kind: {kind}"
    except Exception as e:
        passed = False
        evidence = f"error: {e}"
    return {"text": text, "passed": passed, "evidence": evidence}


def grade_run(eval_id: str, condition: str) -> dict:
    outputs = WORKSPACE / f"eval-{eval_id}" / condition / "outputs"
    if not outputs.exists():
        return {"expectations": [], "error": f"outputs dir missing: {outputs}"}
    assertions = UNIVERSAL + EXTRAS.get(eval_id, [])
    return {"expectations": [run_check(outputs, a) for a in assertions]}


def main() -> int:
    evals = ["flux", "tossit", "chronicler"]
    conditions = ["with_skill", "without_skill"]
    summary = []
    for e in evals:
        for c in conditions:
            grading = grade_run(e, c)
            target = WORKSPACE / f"eval-{e}" / c / "grading.json"
            target.write_text(json.dumps(grading, indent=2))
            if "error" in grading:
                summary.append(f"{e:12s} {c:14s} ERROR: {grading['error']}")
                continue
            passed = sum(1 for r in grading["expectations"] if r["passed"])
            total = len(grading["expectations"])
            summary.append(f"{e:12s} {c:14s} {passed:>2}/{total}")
    print("Eval         Condition      Score")
    print("-----------  -------------  -----")
    for line in summary:
        print(line)
    return 0


if __name__ == "__main__":
    sys.exit(main())
