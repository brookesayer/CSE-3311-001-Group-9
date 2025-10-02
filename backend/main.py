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
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
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
# main.py
from fastapi.staticfiles import StaticFiles

STATIC_DIR = pathlib.Path(__file__).with_name("static").resolve()
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
