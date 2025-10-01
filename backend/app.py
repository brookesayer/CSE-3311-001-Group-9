# backend/app.py  (FastAPI backend) — fixes CORS + guarantees JSON at /api/places

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
import json
import os

# Optional: SQLAlchemy fallback if you have a DB
USE_DB = os.getenv("USE_DB", "0") == "1"
if USE_DB:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import Session
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
    engine = create_engine(DATABASE_URL, future=True)

APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
DATA_FILE = DATA_DIR / "places.json"

STATIC_DIR = APP_DIR / "static"
STATIC_DIR.mkdir(exist_ok=True)
(STATIC_DIR / "places").mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Places API")

# ✅ CORS: no trailing slashes on origins, allow localhost & 127.0.0.1
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


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/places")
def get_places():
    """
    Always returns JSON. If USE_DB=1 and DB has a 'places' table, read from DB.
    Otherwise serve data/places.json. Never return HTML (prevents “Unexpected token '<'”).
    """
    if USE_DB:
        try:
            with Session(engine) as db:
                rows = db.execute(text("""
                    SELECT id, name, category, description, address, lat, lon,
                           photo_url, directions_url
                    FROM places
                    ORDER BY id ASC
                """)).mappings().all()
                return JSONResponse(content=list(map(dict, rows)))
        except Exception as e:
            # fall through to file if DB not ready
            print(f"[WARN] DB read failed, falling back to file: {e}")

    # File fallback
    try:
        data = json.loads(_read_places_json_bytes().decode("utf-8"))
    except Exception:
        data = []
    return JSONResponse(content=data, media_type="application/json")


# Optional: expose the raw file as well for debugging
@app.get("/places.json")
def places_json_file():
    if DATA_FILE.exists():
        return FileResponse(DATA_FILE, media_type="application/json")
    return JSONResponse(content=[], media_type="application/json")
