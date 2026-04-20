from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from campfire.infrastructure.bootstrap import Container, build_container
from campfire.main import create_app


@pytest.fixture
def container() -> Container:
    return build_container()


@pytest.fixture
def client(container: Container) -> Iterator[TestClient]:
    app = create_app()
    # Replace the lifespan-built container so tests share state with fixtures.
    with TestClient(app) as c:
        c.app.state.container = container  # type: ignore[attr-defined]
        yield c
