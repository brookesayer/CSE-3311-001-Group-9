# backend/seed_places.py

from typing import List
import time
import argparse
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from sqlalchemy import text

from db import engine, Base
from models import Place
from ai.generator import generate_places  # your AI-based generator

MAX_RETRIES = 6  # retry commits up to ~1+2+4+8+16+32s

def _retry_commit(db: Session):
    """Commit with exponential backoff if the database is locked."""
    delay = 1.0
    for attempt in range(MAX_RETRIES):
        try:
            db.commit()
            return
        except OperationalError as e:
            if "database is locked" in str(e).lower():
                db.rollback()
                print(f"[seed] database locked, retrying in {delay}s...")
                time.sleep(delay)
                delay *= 2
                continue
            raise
    raise RuntimeError("Giving up after repeated database lock errors during commit")

def seed_places(categories: List[str], city: str = "Dallas-Fort Worth, TX Metroplex", replace: bool = False) -> int:
    """
    Generate and insert places into SQLite.
    - categories: list of category names to generate
    - city: default city context (DFW by default)
    - replace: if True, wipe all existing rows first

    CHANGE: address is OPTIONAL at seed time; enrichment will fetch correct addresses
    via Google Maps APIs later.
    """
    # Ensure correct schema: if replacing, drop and recreate the table to add new columns
    if replace:
        try:
            with engine.begin() as conn:
                conn.exec_driver_sql("DROP TABLE IF EXISTS places")
        except Exception:
            pass
    Base.metadata.create_all(bind=engine)
    inserted_total = 0

    with Session(engine) as db:
        if replace:
            print("[seed] wiping all existing rows...")
            db.query(Place).delete(synchronize_session=False)
            db.commit()

        for cat in categories:
            print(f"[seed] generating: {cat} in {city}")
            items = generate_places(cat, city=city)

            db.execute(text("BEGIN IMMEDIATE"))  # start txn early to detect locks
            inserted_cat = 0

            try:
                for p in items:
                    name = (p.get("name") or "").strip()
                    if not name:
                        continue

                    address = (p.get("address") or "").strip() or None

                    # skip if exists:
                    #   if we have an address → dedupe by (name,address)
                    #   else (no address yet) → dedupe by (name, category, city) heuristics
                    if address:
                        exists = db.query(Place).filter_by(name=name, address=address).first()
                    else:
                        exists = (db.query(Place)
                                  .filter(Place.name == name)
                                  .filter(Place.category == (p.get("category") or cat))
                                  .first())
                    if exists:
                        continue

                    description = p.get("description") or p.get("short_description") or ""

                    db.add(Place(
                        name=name,
                        category=cat,  # keep category consistent with requested theme
                        description=description,
                        address=address,  # may be None; enrichment fills later
                        lat=p.get("lat"),
                        lon=p.get("lon"),
                        price_level=p.get("price"),  # may be None
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
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--categories",
        nargs="+",
        default=[
            # DFW‑tailored broad themes (aiming >30 total with fallback)
            "restaurants", "cafes", "bars", "nightlife",
            "parks", "museums", "landmarks", "outdoors",
            "family", "neighborhoods", "shopping", "arts",
        ],
        help="List of categories (themes) to seed"
    )
    parser.add_argument("--city", default="Dallas-Fort Worth, TX Metroplex", help="City/region to generate places in")
    parser.add_argument("--replace", action="store_true", help="Wipe all rows before seeding")
    args = parser.parse_args()

    seed_places(args.categories, city=args.city, replace=args.replace)
