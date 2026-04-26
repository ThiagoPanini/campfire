import ast
from pathlib import Path

import pytest

pytestmark = pytest.mark.unit

ROOT = Path(__file__).resolve().parents[2] / "src" / "campfire_api" / "contexts" / "identity"
BANNED = {"fastapi", "sqlalchemy", "argon2", "jose"}


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
    for base in [ROOT / "domain", ROOT / "application"]:
        for path in base.rglob("*.py"):
            bad = imported_roots(path) & BANNED
            if bad:
                offenders.append(f"{path.relative_to(ROOT)} imports {sorted(bad)}")
    assert offenders == []
