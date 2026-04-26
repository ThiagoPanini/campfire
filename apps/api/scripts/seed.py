import subprocess


def main() -> None:
    subprocess.run(["uv", "run", "alembic", "upgrade", "head"], check=True)
    print("Seed migration applied")


if __name__ == "__main__":
    main()
