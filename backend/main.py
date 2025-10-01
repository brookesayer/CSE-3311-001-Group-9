# backend/main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import hashlib
import json
import os
import sqlite3

APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"
DB_PATH = os.getenv("SQLITE_PATH", str(APP_DIR / "dev.db"))

app = FastAPI(title="Places API")

# CORS (dev convenience)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:3000", "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

def fetch_all_places():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
      SELECT id, name, category, description, address, lat, lon, photo_url, directions_url
      FROM places
      ORDER BY id ASC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/places")
def get_places():
    data = fetch_all_places()
    # ETag over JSON bytes for simple client caching
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    etag = hashlib.sha256(body).hexdigest()
    headers = {"ETag": etag, "Cache-Control": "no-cache"}
    return JSONResponse(content=data, headers=headers)

@app.get("/")
def root():
    return {"ok": True, "hint": "GET /api/places; images under /static/places"}
