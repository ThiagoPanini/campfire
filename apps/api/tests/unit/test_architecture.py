import ast
from pathlib import Path

import pytest

pytestmark = pytest.mark.unit

CONTEXTS_ROOT = Path(__file__).resolve().parents[2] / "src" / "campfire_api" / "contexts"
BANNED = {"fastapi", "sqlalchemy", "argon2", "jose", "httpx"}


def imported_roots(path: Path) -> set[str]:
    tree = ast.parse(path.read_text())
    roots: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            roots.update(alias.name.split(".", 1)[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            roots.add(node.module.split(".", 1)[0])
    return roots


def test_domain_and_application_have_no_infrastructure_imports() -> None:
    offenders = []
    for context_dir in CONTEXTS_ROOT.iterdir():
        if not context_dir.is_dir():
            continue
        for layer in ["domain", "application"]:
            layer_dir = context_dir / layer
            if not layer_dir.exists():
                continue
            for path in layer_dir.rglob("*.py"):
                bad = imported_roots(path) & BANNED
                if bad:
                    offenders.append(f"{path.relative_to(CONTEXTS_ROOT)} imports {sorted(bad)}")
    assert offenders == []
