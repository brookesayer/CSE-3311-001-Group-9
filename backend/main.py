# main.py
import os
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
def get_places():
    if not USE_DB:
        raise HTTPException(status_code=503, detail="DB mode required. Set USE_DB=1.")

    try:
        with Session(engine) as db:
            # Only query columns that actually exist in your table
            rows = db.execute(text("""
                SELECT id, name, category, description, address, lat, lon
                FROM places
                ORDER BY id ASC
            """)).mappings().all()

            # Map DB → frontend shape ("city" instead of "address")
            data = []
            for r in rows:
                d = dict(r)
                data.append({
                    "id": d["id"],
                    "name": d["name"],
                    "category": d["category"],
                    "description": d["description"],
                    "city": d["address"],   # FE expects "city"
                    "lat": d["lat"],
                    "lon": d["lon"],
                    "rating": None,
                    "priceLevel": None,
                    "imageUrl": None,
                })
            return data
    except Exception as e:
        # Fail loud so you fix the root cause (instead of silently using a file)
        raise HTTPException(status_code=500, detail=f"DB read failed: {e}")
