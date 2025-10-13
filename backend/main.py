# main.py
import os
import pathlib
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USE_DB = os.getenv("USE_DB", "0") == "1"
from pathlib import Path as _Path
_project_root = _Path(__file__).resolve().parent.parent
_default_sqlite_url = f"sqlite:///{(_project_root / 'dev.db').as_posix()}"
_env_url = os.getenv("DATABASE_URL", "")
if _env_url and ("postgres" in _env_url) and ("@db:" in _env_url) and os.getenv("USE_DOCKER_DB", "0") != "1":
    DATABASE_URL = _default_sqlite_url
else:
    DATABASE_URL = _env_url or _default_sqlite_url
engine = create_engine(DATABASE_URL, future=True)

@app.middleware("http")
async def debug_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers["X-Use-DB"] = "1" if USE_DB else "0"
    resp.headers["Cache-Control"] = "no-store"
    return resp

@app.get("/api/places")
def get_places(request: Request):
    base = str(request.base_url).rstrip("/")
    with Session(engine) as db:
        rows = db.execute(text("""
            SELECT id, name, category, description, address, lat, lon,
                   price_level, image_url, maps_url
            FROM places
            ORDER BY id ASC
        """)).mappings().all()

        return [
            {
                "id": r["id"],
                "name": r["name"],
                "category": r["category"],
                "description": r["description"],
                "city": r["address"],
                "lat": r["lat"],
                "lon": r["lon"],
                "priceLevel": r["price_level"],
                # 👇 build full static URL
                "imageUrl": f"{base}/static/{r['image_url']}" if r["image_url"] else None,
                "mapsUrl": r["maps_url"],
            }
            for r in rows
        ]

@app.get("/api/places/{place_id}")
def get_place(place_id: int, request: Request):
    base = str(request.base_url).rstrip("/")
    with Session(engine) as db:
        row = db.execute(text("""
            SELECT id, name, category, description, address, lat, lon,
                   price_level, image_url, maps_url
            FROM places
            WHERE id = :pid
        """), {"pid": place_id}).mappings().first()
        if not row:
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        return {
            "id": row["id"],
            "name": row["name"],
            "category": row["category"],
            "description": row["description"],
            "city": row["address"],
            "lat": row["lat"],
            "lon": row["lon"],
            "priceLevel": row["price_level"],
            "imageUrl": f"{base}/static/{row['image_url']}" if row["image_url"] else None,
            "mapsUrl": row["maps_url"],
        }
# main.py
from fastapi.staticfiles import StaticFiles

STATIC_DIR = pathlib.Path(__file__).with_name("static").resolve()
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
