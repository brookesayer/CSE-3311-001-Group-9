# backend/seed_places.py

from typing import List, Optional
import time
import argparse
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from sqlalchemy import text

from .db import engine, Base
from .models import Place, Category, City
from slugify import slugify
from .ai.generator import generate_places  # your AI-based generator

MAX_RETRIES = 6  # retry commits up to ~1+2+4+8+16+32s


def _retry_commit(db: Session):
    """Commit with exponential backoff if the database is locked."""
    delay = 1.0
    for _ in range(MAX_RETRIES):
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


def seed_places(
    categories: List[str],
    city: str = "Dallas-Fort Worth, TX Metroplex",
    replace: bool = False,
    cities: Optional[List[str]] = None,
) -> int:
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

        # Determine which cities to generate. If a list is provided, use it.
        # If the provided city string looks like the DFW metro label, expand to major sub-cities.
        if cities and len(cities) > 0:
            city_list = cities
        else:
            metro = (city or "").lower()
            if "dallas-fort worth" in metro or "dfw" in metro:
                city_list = [
                    "Dallas, TX",
                    "Fort Worth, TX",
                    "Arlington, TX",
                    "Plano, TX",
                    "Irving, TX",
                    "Frisco, TX",
                ]
            else:
                city_list = [city or "Dallas, TX"]

        # Create Category lookups once
        cat_cache: dict[str, Category] = {}
        for cat in categories:
            cat_slug = slugify(cat)
            cat_rec = db.query(Category).filter(Category.slug == cat_slug).first()
            if not cat_rec:
                cat_rec = Category(name=cat, slug=cat_slug)
                db.add(cat_rec)
                db.flush()
            cat_cache[cat] = cat_rec

        for city_name in city_list:
            # Ensure the City lookup exists
            city_rec = None
            if city_name:
                city_slug = slugify(city_name)
                city_rec = db.query(City).filter(City.slug == city_slug).first()
                if not city_rec:
                    city_rec = City(name=city_name, state=None, slug=city_slug)
                    db.add(city_rec)
                    _retry_commit(db)

            for cat in categories:
                print(f"[seed] generating: {cat} in {city_name}")
                items = generate_places(cat, city=city_name)

                db.execute(text("BEGIN IMMEDIATE"))  # start txn early to detect locks
                inserted_cat = 0
                try:
                    cat_rec = cat_cache[cat]
                    for p in items:
                        name = (p.get("name") or "").strip()
                        if not name:
                            continue

                        address = (p.get("address") or "").strip() or None

                        # skip if exists:
                        #   if we have an address -> dedupe by (name,address)
                        #   else (no address yet) -> dedupe by (name, category)
                        if address:
                            exists = db.query(Place).filter_by(name=name, address=address).first()
                        else:
                            exists = (
                                db.query(Place)
                                .filter(Place.name == name)
                                .filter(Place.category == (p.get("category") or cat))
                                .first()
                            )
                        if exists:
                            continue

                        description = p.get("description") or p.get("short_description") or ""

                        db.add(
                            Place(
                                name=name,
                                category=cat,  # legacy text column kept for compatibility
                                description=description,
                                address=address,  # may be None; enrichment fills later
                                lat=p.get("lat"),
                                lon=p.get("lon"),
                                rating=p.get("rating"),
                                price_level=p.get("price"),  # may be None
                                image_url=p.get("imageUrl") or p.get("image_url"),
                                maps_url=p.get("mapsUrl") or p.get("maps_url"),
                                category_id=cat_rec.id if cat_rec else None,
                                city=city_name or None,
                                city_id=city_rec.id if city_rec else None,
                            )
                        )
                        inserted_cat += 1

                    _retry_commit(db)
                    inserted_total += inserted_cat
                    print(f"[seed] {cat} @ {city_name}: inserted {inserted_cat}")
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
            # DFW-tailored broad themes (aiming >30 total with fallback)
            "restaurants",
            "cafes",
            "bars",
            "nightlife",
            "parks",
            "museums",
            "landmarks",
            "outdoors",
            "family",
            "neighborhoods",
            "shopping",
            "arts",
        ],
        help="List of categories (themes) to seed",
    )
    parser.add_argument(
        "--city",
        default="Dallas-Fort Worth, TX Metroplex",
        help="City/region to generate places in. If set to a DFW metro label, it will expand to major sub-cities unless --cities is provided.",
    )
    parser.add_argument(
        "--cities",
        nargs="*",
        help="Optional explicit list of cities to generate (e.g., --cities 'Dallas, TX' 'Fort Worth, TX' 'Arlington, TX')",
    )
    parser.add_argument("--replace", action="store_true", help="Wipe all rows before seeding")
    args = parser.parse_args()

    seed_places(args.categories, city=args.city, replace=args.replace, cities=args.cities)

