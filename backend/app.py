# app.py
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from . import models, schemas, crud

app = FastAPI(title="Places API (SQLite)")

# Allow your Vite dev server and any other origins you need
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",  # widen if needed during development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .db import Base, engine, get_db
from . import models, schemas, crud

app = FastAPI(title="Places API (SQLite)")

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

# Health check
@app.get("/api/health")
def health():
    return {"status": "ok"}

# ---- Places CRUD ----

@app.post("/api/places", response_model=schemas.PlaceRead)
def create_place(payload: schemas.PlaceCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_place(db, payload)
    except Exception as e:
        # Catch unique constraint violations and return 400
        # In production you'd inspect the exception type
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/places", response_model=list[schemas.PlaceRead])
def list_places(
    q: str | None = Query(default=None, description="Simple search query"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return crud.list_places(db, q=q, skip=skip, limit=limit)

@app.get("/api/places/{place_id}", response_model=schemas.PlaceRead)
def get_place(place_id: int, db: Session = Depends(get_db)):
    place = crud.get_place(db, place_id)
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place

@app.patch("/api/places/{place_id}", response_model=schemas.PlaceRead)
def update_place(place_id: int, payload: schemas.PlaceUpdate, db: Session = Depends(get_db)):
    place = crud.update_place(db, place_id, payload)
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place

@app.delete("/api/places/{place_id}", status_code=204)
def delete_place(place_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_place(db, place_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Place not found")
    return None
