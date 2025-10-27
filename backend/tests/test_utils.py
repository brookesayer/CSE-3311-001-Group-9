from __future__ import annotations

from typing import Any


def test_normalize_price_level_basic():
    from backend.app import _normalize_price_level

    assert _normalize_price_level(None) == (None, None)
    assert _normalize_price_level(0) == (None, None)
    assert _normalize_price_level(2) == (2, "$$")
    assert _normalize_price_level("3") == (3, "$$$")
    assert _normalize_price_level("$$") == (2, "$$")
    # Non-numeric, non-$ string should be returned as display only
    assert _normalize_price_level("moderate") == (None, "moderate")


def test_resolve_image_url_variants():
    from backend.app import _resolve_image_url

    base = "http://testserver"
    assert _resolve_image_url(None, base) is None
    assert _resolve_image_url("", base) is None
    assert _resolve_image_url("http://example.com/img.jpg", base) == "http://example.com/img.jpg"
    assert _resolve_image_url("https://cdn/img.jpg", base) == "https://cdn/img.jpg"
    assert _resolve_image_url("places/a.jpg", base) == f"{base}/static/places/a.jpg"
    assert _resolve_image_url("/static/places/a.jpg", base) == f"{base}/static/places/a.jpg"


def test_normalize_place_merges_fields():
    from backend.app import _normalize_place

    raw: dict[str, Any] = {
        "id": 1,
        "name": "Foo",
        "price": "2",
        "photoPath": "places/x.jpg",
        "extra": 123,
    }
    out = _normalize_place(raw, base_url="http://testserver")
    assert out["priceLevel"] == 2
    assert out["priceDisplay"] == "$$"
    assert out["imageUrl"].endswith("/static/places/x.jpg")
    # Keeps extra
    assert out["extra"] == 123

