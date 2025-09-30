# backend/seed_places.py
from typing import List
import time
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from .db import engine, Base
from .models import Place
from .ai.generator import generate_places  # your existing generator

MAX_RETRIES = 6  # ~1+2+4+8+16+32s backoff worst case

def _retry_commit(db: Session):
    delay = 1.0
    for attempt in range(MAX_RETRIES):
        try:
            db.commit()
            return
        except OperationalError as e:
            # only retry lock/busy situations
            if "database is locked" in str(e).lower() or "database is busy" in str(e).lower():
                db.rollback()
                time.sleep(delay)
                delay *= 2
                continue
            raise  # other OperationalError -> bubble up
    raise RuntimeError("Giving up after repeated database lock errors during commit")

def seed_places(categories: List[str], city: str = "Arlington, TX") -> int:
    """
    Generates places per category and inserts into SQLite.
    De-dupes on (name, address). Commits per-category with retries.
    """
    Base.metadata.create_all(bind=engine)
    inserted_total = 0

    with Session(engine) as db:
        for cat in categories:
            print(f"[seed] generating: {cat} in {city}")
            items = generate_places(cat, city=city)

            # start a write txn early; fail fast if another writer is holding a lock
            db.execute(text("BEGIN IMMEDIATE"))
            inserted_cat = 0
            try:
                for p in items:
                    name = (p.get("name") or "").strip()
                    address = (p.get("address") or "").strip()
                    if not name or not address:
                        continue

                    exists = db.query(Place).filter_by(name=name, address=address).first()
                    if exists:
                        continue

                    db.add(Place(
                        name=name,
                        category=p.get("category") or cat,
                        description=p.get("short_description"),
                        address=address,
                        lat=p.get("lat"),
                        lon=p.get("lon"),
                    ))
                    inserted_cat += 1

                _retry_commit(db)
                inserted_total += inserted_cat
                print(f"[seed] {cat}: inserted {inserted_cat}")
            except Exception:
                db.rollback()
                raise

    print(f"[seed] inserted {inserted_total} new rows total")
    return inserted_total

if __name__ == "__main__":
    seed_places(["restaurants", "parks", "museums"])
