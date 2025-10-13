"""
Seed the database from a JSON file of places.

Usage:
  python -m backend.seed_from_json --file simpleapp/src/data/places.json --replace

Fields mapping:
  input keys: id (ignored), name, category, description, city/address, lat, lon,
              priceLevel, imageUrl, mapsUrl
  db columns: name, category, description, address, lat, lon,
              price_level, image_url, maps_url

If --replace is provided, all existing rows are wiped before inserting.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Iterable

from sqlalchemy.orm import Session

from .db import engine, Base
from .models import Place


def _iter_items(data: Any) -> Iterable[Dict[str, Any]]:
    if isinstance(data, dict):
        yield data
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                yield item


def seed_from_json(path: Path, replace: bool = False) -> int:
    Base.metadata.create_all(bind=engine)
    raw = json.loads(path.read_text(encoding="utf-8"))
    inserted = 0

    with Session(engine) as db:
        if replace:
            db.query(Place).delete(synchronize_session=False)
            db.commit()

        for item in _iter_items(raw):
            name = (item.get("name") or "").strip()
            if not name:
                continue

            # map address: honor explicit address, else use city field as provided by frontend data
            address = (item.get("address") or item.get("city") or None)
            if isinstance(address, str):
                address = address.strip() or None

            # dedupe: (name, address) when address present; else by name+category
            if address:
                exists = db.query(Place).filter_by(name=name, address=address).first()
            else:
                exists = (db.query(Place)
                          .filter(Place.name == name)
                          .filter(Place.category == (item.get("category") or None))
                          .first())
            if exists:
                continue

            p = Place(
                name=name,
                category=item.get("category"),
                description=item.get("description") or item.get("short_description") or "",
                address=address,
                lat=item.get("lat"),
                lon=item.get("lon"),
                price_level=item.get("priceLevel") or item.get("price_level") or item.get("price"),
                image_url=item.get("imageUrl") or item.get("image_url") or item.get("photo_url"),
                maps_url=item.get("mapsUrl") or item.get("maps_url") or item.get("directionsUrl") or item.get("directions_url"),
            )
            db.add(p)
            inserted += 1

        db.commit()

    return inserted


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", default=str(Path("simpleapp/src/data/places.json")), help="Path to JSON file")
    parser.add_argument("--replace", action="store_true", help="Wipe existing rows before inserting")
    args = parser.parse_args()

    json_path = Path(args.file)
    if not json_path.exists():
        raise SystemExit(f"Input file not found: {json_path}")

    count = seed_from_json(json_path, replace=args.replace)
    print(f"Inserted {count} place(s) from {json_path}")

