import os
import sys
import importlib
from pathlib import Path
from typing import Iterable

import pytest


@pytest.fixture()
def test_data(tmp_path: Path) -> Path:
    """Create a temporary JSON file for places data and return its path."""
    data_path = tmp_path / "places.json"
    # Default empty file; individual tests can overwrite with their own content
    data_path.write_text("[]", encoding="utf-8")
    return data_path


def _reload_app_with_env(env: dict[str, str | None]):
    # Ensure desired env (e.g., USE_DB=0) before importing app
    for k, v in env.items():
        if v is None:
            os.environ.pop(k, None)
        else:
            os.environ[k] = v
    # Reload module to pick up env-based globals
    if "backend.app" in sys.modules:
        del sys.modules["backend.app"]
    return importlib.import_module("backend.app")


@pytest.fixture()
def app_module(test_data: Path):
    """Provide the backend.app module with DATA_FILE pointed to a tmp file."""
    app_mod = _reload_app_with_env({"USE_DB": "0"})
    # Point the app's DATA_FILE to our temporary file
    app_mod.DATA_FILE = test_data
    # Ensure tests never hit the DB even if backend/.env sets USE_DB=1
    app_mod.USE_DB = False
    return app_mod


@pytest.fixture()
def client(app_module):
    from fastapi.testclient import TestClient

    return TestClient(app_module.app)
