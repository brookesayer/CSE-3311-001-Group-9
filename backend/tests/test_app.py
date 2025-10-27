from __future__ import annotations

import json
from pathlib import Path


def write_places(data_file: Path, items: list[dict]):
    data_file.write_text(json.dumps(items), encoding="utf-8")


def test_health_returns_ok(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


def test_places_empty_when_no_data(client):
    resp = client.get("/api/places")
    assert resp.status_code == 200
    assert resp.json() == []


def test_places_returns_normalized_image_url(app_module, client, test_data: Path):
    # Relative path should be served under /static/
    write_places(
        test_data,
        [
            {
                "id": 1,
                "name": "Foo",
                "city": "Dallas",
                "rating": 4.5,
                "imageUrl": "places/foo.jpg",
            }
        ],
    )
    # Inject the updated data file
    app_module.DATA_FILE = test_data

    resp = client.get("/api/places")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    # Base URL from TestClient is http://testserver
    assert items[0]["imageUrl"].endswith("/static/places/foo.jpg")


def test_places_filter_and_sort(app_module, client, test_data: Path):
    write_places(
        test_data,
        [
            {"id": 1, "name": "B", "city": "Dallas", "rating": 4, "imageUrl": None},
            {"id": 2, "name": "A", "city": "Arlington", "rating": 5, "imageUrl": None},
            {"id": 3, "name": "C", "city": "Dallas", "rating": 3, "imageUrl": None},
        ],
    )
    app_module.DATA_FILE = test_data

    # Filter by city
    r1 = client.get("/api/places", params={"city": "Dallas"})
    assert r1.status_code == 200
    items = r1.json()
    assert [p["id"] for p in items] == [1, 3]

    # Sort by rating desc
    r2 = client.get("/api/places", params={"sort": "rating", "order": "desc"})
    assert r2.status_code == 200
    items2 = r2.json()
    assert [p["id"] for p in items2] == [2, 1, 3]


def test_get_place_by_id_found_and_not_found(app_module, client, test_data: Path):
    write_places(
        test_data,
        [
            {"id": 10, "name": "X", "city": "Plano", "imageUrl": None},
        ],
    )
    app_module.DATA_FILE = test_data

    ok = client.get("/api/places/10")
    assert ok.status_code == 200
    assert ok.json()["name"] == "X"

    not_found = client.get("/api/places/999")
    assert not_found.status_code == 404


def test_db_failure_falls_back_to_file_on_list(app_module, client, test_data: Path):
    # Arrange file data
    write_places(
        test_data,
        [
            {"id": 101, "name": "FF", "city": "Nowhere", "imageUrl": None},
        ],
    )
    app_module.DATA_FILE = test_data

    # Force DB mode and inject a failing Session
    app_module.USE_DB = True

    class _FailCtx:
        def __enter__(self):
            raise RuntimeError("simulated db down")
        def __exit__(self, exc_type, exc, tb):
            return False

    app_module.Session = lambda engine: _FailCtx()  # type: ignore[attr-defined]

    resp = client.get("/api/places")
    assert resp.status_code == 200
    data = resp.json()
    assert [p["id"] for p in data] == [101]


def test_db_failure_falls_back_to_file_on_detail(app_module, client, test_data: Path):
    write_places(test_data, [{"id": 202, "name": "YY", "city": "X", "imageUrl": None}])
    app_module.DATA_FILE = test_data

    app_module.USE_DB = True

    class _FailCtx:
        def __enter__(self):
            raise RuntimeError("simulated db down")
        def __exit__(self, exc_type, exc, tb):
            return False

    app_module.Session = lambda engine: _FailCtx()  # type: ignore[attr-defined]

    ok = client.get("/api/places/202")
    assert ok.status_code == 200
    assert ok.json()["name"] == "YY"


def test_malformed_json_returns_empty_list(app_module, client, test_data: Path):
    # Write invalid JSON
    test_data.write_text("{ this is not: json }", encoding="utf-8")
    app_module.DATA_FILE = test_data

    r = client.get("/api/places")
    assert r.status_code == 200
    assert r.json() == []
