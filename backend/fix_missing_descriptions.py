# backend/fix_missing_descriptions.py
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from db import engine, Base
from models import Place

def synthesize_description(p: Place) -> str:
    # Simple, safe default you can customize
    parts = []
    if p.category: parts.append(p.category.title())
    parts.append(p.name)
    if p.address: parts.append(f"in {p.address}")
    # Example: "Restaurants · Joe's Diner in Arlington, TX"
    return " · ".join(parts[:-1]) + (f" {parts[-1]}" if len(parts) > 1 else "")

def run():
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        # Find rows with NULL or empty/whitespace description
        q = db.query(Place).filter(
            or_(
                Place.description.is_(None),
                func.trim(Place.description) == ""
            )
        )
        rows = q.all()
        print(f"Found {len(rows)} places with missing descriptions")

        updated = 0
        for p in rows:
            p.description = synthesize_description(p)
            updated += 1

        db.commit()
        print(f"✅ Backfilled {updated} descriptions")

if __name__ == "__main__":
    run()
