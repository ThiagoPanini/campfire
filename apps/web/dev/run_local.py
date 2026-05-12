#!/usr/bin/env python3

from pathlib import Path
import os
import shutil
import sys


ROOT = Path(__file__).resolve().parents[3]


def pnpm_command() -> list[str]:
    if shutil.which("pnpm"):
        return ["pnpm"]
    if shutil.which("npm"):
        return ["npm", "exec", "--yes", "--package", "pnpm@11.1.0", "--", "pnpm"]
    raise SystemExit("Install pnpm@11.1.0 or npm to run the web app locally.")


def main() -> None:
    os.chdir(ROOT)
    command = pnpm_command() + ["--filter", "@campfire/web", "dev", "--host", "127.0.0.1"]
    os.execvp(command[0], command)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
