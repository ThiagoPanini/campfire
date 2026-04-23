from __future__ import annotations

import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
DOCTOR = ROOT / "scripts" / "local" / "doctor.sh"


def _run_check(name: str, *, path: str) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["PATH"] = path
    return subprocess.run(
        ["/bin/bash", str(DOCTOR), f"--check={name}"],
        cwd=ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )


def test_doctor_reports_missing_uv_with_remediation() -> None:
    result = _run_check("uv", path="/usr/bin:/bin")

    assert result.returncode != 0
    assert "FAIL uv" in result.stderr
    assert "https://docs.astral.sh/uv/getting-started/installation/" in result.stderr


def test_doctor_reports_missing_make_with_remediation() -> None:
    result = _run_check("make", path="/tmp")

    assert result.returncode != 0
    assert "FAIL make" in result.stderr
    assert "https://www.gnu.org/software/make/" in result.stderr
