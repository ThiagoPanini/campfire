import re
import sys
from pathlib import Path

SUPPORTED_AURORA_EXTENSIONS = {
    "aws_commons",
    "aws_lambda",
    "btree_gin",
    "btree_gist",
    "citext",
    "hstore",
    "pg_stat_statements",
    "pg_trgm",
    "plpgsql",
    "postgis",
    "uuid-ossp",
}

CREATE_EXTENSION_RE = re.compile(
    r"CREATE\s+EXTENSION(?:\s+IF\s+NOT\s+EXISTS)?\s+['\"]?([a-zA-Z0-9_-]+)", re.I
)


def main() -> int:
    versions = Path("alembic/versions")
    failures: list[str] = []
    for path in versions.glob("*.py"):
        for match in CREATE_EXTENSION_RE.finditer(path.read_text()):
            name = match.group(1)
            if name not in SUPPORTED_AURORA_EXTENSIONS:
                failures.append(f"{path}: unsupported extension {name}")
    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1
    print("Aurora extension check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
