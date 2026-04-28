import json
from pathlib import Path

from campfire_api.main import create_app


def main() -> None:
    app = create_app()
    snapshot = Path("../../specs/002-backend-auth-slice/contracts/openapi.json").resolve()
    snapshot.write_text(json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n")
    print(f"Wrote {snapshot}")


if __name__ == "__main__":
    main()
