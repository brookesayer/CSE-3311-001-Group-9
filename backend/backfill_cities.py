"""
Create City rows from distinct places.city values and link places.city_id.
Safe to run multiple times. Works with SQLite and Postgres.

Usage:
  python -m backend.backfill_cities
"""
from __future__ import annotations

import re
from sqlalchemy import text
from sqlalchemy.orm import Session
from slugify import slugify

from .db import engine


def backfill() -> int:
    created = 0
    with Session(engine) as db:
        # 1) Derive city from addresses where city is missing
        addr_rows = db.execute(text("SELECT id, address FROM places WHERE (city IS NULL OR city='') AND address IS NOT NULL AND address<>''")).fetchall()
        for pid, address in addr_rows:
            # naive parse of 'Street, City, ST ZIP' -> City
            city_name = None
            if isinstance(address, str):
                parts = [p.strip() for p in address.split(',')]
                if len(parts) >= 2:
                    # Some addresses may include venue name; attempt to use the penultimate component as city
                    # e.g., "201 W Main St, Arlington, TX 76010" -> Arlington
                    city_name = parts[-2]
                    # sanitize obvious state codes
                    if re.fullmatch(r"[A-Z]{2}", city_name):
                        city_name = None
            if city_name:
                db.execute(text("UPDATE places SET city = :c WHERE id = :pid"), {"c": city_name, "pid": pid})

        # 2) Create City rows from distinct place.city
        rows = db.execute(text("SELECT DISTINCT city FROM places WHERE city IS NOT NULL AND city <> ''")).fetchall()
        for (name,) in rows:
            s = slugify(name)
            exists = db.execute(text("SELECT id FROM cities WHERE slug = :s OR name = :n"), {"s": s, "n": name}).first()
            if not exists:
                db.execute(text("INSERT INTO cities(name, state, slug) VALUES (:n, :st, :s)"), {"n": name, "st": None, "s": s})
                created += 1
        # link places.city_id where possible
        db.execute(text(
            """
            UPDATE places
            SET city_id = c.id
            FROM cities c
            WHERE places.city_id IS NULL
              AND places.city IS NOT NULL
              AND (c.slug = lower(replace(places.city, ' ', '-')) OR c.name = places.city)
            """
        ))
        db.commit()
    return created


if __name__ == "__main__":
    cnt = backfill()
    print(f"Backfill complete. Created {cnt} cities (or 0 if already present).")
