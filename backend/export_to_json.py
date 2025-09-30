# backend/export_to_json.py
import json
import argparse
from sqlalchemy.orm import Session
from .db import engine, Base
from .models import Place
import os



def export_json(out_path: str, include_defaults: bool = True) -> int:
    """Dump all rows from places into a JSON array for the frontend."""
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    Base.metadata.create_all(bind=engine)  # ensures table exists

    with Session(engine) as db:
        rows = db.query(Place).order_by(Place.id).all()

        data = []
        for r in rows:
            # Map DB → frontend fields.
            item = {
                "id": r.id,
                "name": r.name,
                "category": r.category,
                "city": r.address,          # frontend uses "city"; DB uses "address"
                "description": r.description,
                "lat": r.lat,
                "lon": r.lon,
            }

            if include_defaults:
                # Frontend sample uses these; if your DB doesn’t have them,
                # emit safe defaults so the UI/filters don't break.
                item.setdefault("rating", None)
                item.setdefault("priceLevel", None)
                item.setdefault("imageUrl", None)

            data.append(item)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Wrote {len(data)} places to {out_path}")
    return len(data)

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--out", default="../data.json", help="Path to write JSON (relative to backend/)")
    p.add_argument("--no-defaults", action="store_true", help="Do not add rating/priceLevel/imageUrl placeholders")
    args = p.parse_args()
    export_json(args.out, include_defaults=not args.no_defaults)
#"Downloads\simpleapp\simpleapp\src\data\places.json"