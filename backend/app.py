"""FastAPI backend for serving places data and static assets."""

import json
import os
from collections.abc import Mapping
from pathlib import Path
from typing import Any
from dotenv import load_dotenv

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

APP_DIR = Path(__file__).resolve().parent
load_dotenv(APP_DIR.parent / '.env', override=False)
load_dotenv(APP_DIR / '.env', override=True)

# Optional: SQLAlchemy fallback if you have a DB
USE_DB = os.getenv("USE_DB", "0") == "1"
if USE_DB:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import Session

    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
    engine = create_engine(DATABASE_URL, future=True)

DATA_DIR = APP_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)
DATA_FILE = DATA_DIR / 'places.json'

STATIC_DIR = APP_DIR / 'static'
STATIC_DIR.mkdir(exist_ok=True)
(STATIC_DIR / 'places').mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Places API")

# CORS: allow localhost dev ports without trailing slash issues
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Serve /static (images live in /static/places/)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


def _read_places_json_bytes() -> bytes:
    if DATA_FILE.exists():
        return DATA_FILE.read_bytes()
    # empty array if missing
    return b"[]"


def _resolve_image_url(raw: Any, base_url: str) -> str | None:
    if not raw:
        return None
    if isinstance(raw, (list, tuple)):
        raw = next((item for item in raw if item), None)
        if not raw:
            return None
    raw = str(raw)
    if raw.startswith(("http://", "https://")):
        return raw
    cleaned = raw.lstrip("/")
    if cleaned.startswith("static/"):
        cleaned = cleaned[len("static/"):]
    return f"{base_url}/static/{cleaned}"


def _pick_first(*values: Any) -> Any:
    for value in values:
        if value is not None and value != "":
            return value
    return None


def _normalize_price_level(raw: Any) -> tuple[int | None, str | None]:
    if raw is None:
        return None, None
    value = raw
    if isinstance(value, (list, tuple)):
        value = next((item for item in value if item), None)
        if value is None:
            return None, None
    if isinstance(value, (int, float)):
        level = int(value) if value > 0 else None
        display = '$' * level if level else None
        return level, display
    text_value = str(value).strip()
    if not text_value:
        return None, None
    if all(ch == '$' for ch in text_value):
        level = len(text_value)
        display = text_value if level else None
        return level or None, display
    try:
        numeric = float(text_value)
        level = int(numeric) if numeric > 0 else None
        display = '$' * level if level else None
        return level, display
    except ValueError:
        pass
    return None, text_value or None


def _normalize_place(place: Mapping[str, Any], base_url: str) -> dict[str, Any]:
    data = dict(place)
    image_url = _resolve_image_url(
        _pick_first(
            data.get("imageUrl"),
            data.get("image_url"),
            data.get("photo_url"),
            data.get("photoPath"),
        ),
        base_url,
    )
    price_level_raw = _pick_first(
        data.get("priceDisplay"),
        data.get("price_display"),
        data.get("priceLevel"),
        data.get("price_level"),
        data.get("price"),
    )
    price_level, price_display = _normalize_price_level(price_level_raw)
    maps_raw = _pick_first(
        data.get("mapsUrl"),
        data.get("maps_url"),
        data.get("directionsUrl"),
        data.get("directions_url"),
    )
    maps_url = None
    if maps_raw:
        candidate = str(maps_raw).strip()
        maps_url = candidate or None
    description = _pick_first(data.get("description"), data.get("short_description"))
    city = _pick_first(data.get("city"), data.get("address"))

    normalized = {
        "id": data.get("id"),
        "name": data.get("name"),
        "category": data.get("category"),
        "description": description,
        "address": data.get("address"),
        "city": city,
        "lat": data.get("lat"),
        "lon": data.get("lon"),
        "rating": data.get("rating"),
        "priceLevel": price_level,
        "priceDisplay": price_display,
        "imageUrl": image_url,
        "mapsUrl": maps_url,
        "directionsUrl": maps_url,
        "directions_url": maps_url,
    }
    # Keep any extra fields so the frontend can opt into them without backend changes.
    for key, value in data.items():
        if key not in normalized:
            normalized[key] = value
    return normalized


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/places")
def get_places(request: Request):
    """Return places enriched with absolute image URLs for the frontend."""
    base_url = str(request.base_url).rstrip("/")

    if USE_DB:
        try:
            with Session(engine) as db:  # type: ignore[misc]
                rows = db.execute(
                    text(
                        """
                        SELECT *
                        FROM places
                        ORDER BY id ASC
                        """
                    )
                ).mappings().all()
                payload = [_normalize_place(dict(row), base_url) for row in rows]
                return JSONResponse(content=payload, media_type="application/json")
        except Exception as exc:
            # Fall through to file if DB not ready; log for visibility.
            print(f"[WARN] DB read failed, falling back to file: {exc}")

    try:
        raw = json.loads(_read_places_json_bytes().decode("utf-8"))
    except Exception:
        raw = []

    if isinstance(raw, Mapping):
        raw = [raw]
    elif not isinstance(raw, list):
        raw = []

    payload = [_normalize_place(item, base_url) for item in raw]
    return JSONResponse(content=payload, media_type="application/json")


# Optional: expose the raw file as well for debugging
@app.get("/places.json")
def places_json_file():
    if DATA_FILE.exists():
        return FileResponse(DATA_FILE, media_type="application/json")
    return JSONResponse(content=[], media_type="application/json")
