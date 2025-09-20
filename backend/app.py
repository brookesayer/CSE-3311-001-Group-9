import os
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, Text, Float, create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/travel_app")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 5})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

class PlaceORM(Base):
    __tablename__ = "places"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    category = Column(Text)
    description = Column(Text)
    address = Column(Text)
    lat = Column(Float)
    lon = Column(Float)

class PlaceIn(BaseModel):
    name: str = Field(..., max_length=512)
    category: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class PlaceOut(PlaceIn):
    id: int

app = FastAPI(title="Travel App API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok"}

@app.get("/places", response_model=List[PlaceOut])
def list_places(
    category: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    session = SessionLocal()
    try:
        query = session.query(PlaceORM)
        if category:
            query = query.filter(PlaceORM.category.ilike(f"%{category}%"))
        if q:
            like = f"%{q}%"
            query = query.filter(
                (PlaceORM.name.ilike(like))
                | (PlaceORM.description.ilike(like))
                | (PlaceORM.address.ilike(like))
            )
        rows = query.limit(limit).all()
        return [
            PlaceOut(
                id=r.id, name=r.name, category=r.category, description=r.description,
                address=r.address, lat=r.lat, lon=r.lon
            )
            for r in rows
        ]
    finally:
        session.close()

@app.post("/places", response_model=PlaceOut, status_code=201)
def create_place(place: PlaceIn):
    session = SessionLocal()
    try:
        obj = PlaceORM(**place.dict())
        session.add(obj)
        session.commit()
        session.refresh(obj)
        return PlaceOut(**obj.__dict__)
    finally:
        session.close()

@app.post("/seed/arlington")
def seed_arlington(categories: List[str] = ["parks", "coffee shops", "restaurants"]):
    try:
        from db.seed_places import seed_places as do_seed  # import on-demand
        inserted = do_seed(categories)
        return {"status": "ok", "inserted": inserted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
