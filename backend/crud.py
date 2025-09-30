# backend/crud.py
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, and_
from . import models, schemas

def create_place(db: Session, data: schemas.PlaceCreate) -> models.Place:
    # idempotent: return existing (name, address) instead of error
    stmt = select(models.Place).where(
        and_(models.Place.name == data.name, models.Place.address == data.address)
    )
    exists = db.execute(stmt).scalars().first()
    if exists:
        return exists

    place = models.Place(**data.model_dump())
    db.add(place)
    db.commit()
    db.refresh(place)
    return place

def get_place(db: Session, place_id: int) -> Optional[models.Place]:
    return db.get(models.Place, place_id)

def list_places(db: Session, q: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[models.Place]:
    stmt = select(models.Place)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                models.Place.name.ilike(like),
                models.Place.address.ilike(like),
                models.Place.category.ilike(like),
                models.Place.description.ilike(like),
            )
        )
    stmt = stmt.offset(skip).limit(limit)
    return list(db.execute(stmt).scalars())

def update_place(db: Session, place_id: int, data: schemas.PlaceUpdate) -> Optional[models.Place]:
    place = db.get(models.Place, place_id)
    if not place:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(place, k, v)
    db.commit()
    db.refresh(place)
    return place

def delete_place(db: Session, place_id: int) -> bool:
    place = db.get(models.Place, place_id)
    if not place:
        return False
    db.delete(place)
    db.commit()
    return True
