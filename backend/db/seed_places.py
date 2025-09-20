# /app/db/seed_places.py  (in your repo: my-project/backend/db/seed_places.py)
import os
import psycopg2
from ai.generator import generate_places

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/travel_app")

def seed_places(categories: list[str]) -> int:
    """Insert AI-generated (or fallback) places. Returns count inserted."""
    inserted = 0
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            for cat in categories:
                print(f"Generating {cat}...")
                items = generate_places(cat, city="Arlington, TX")
                for p in items:
                    cur.execute(
                        """
                        INSERT INTO places (name, category, description, address, lat, lon)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT DO NOTHING
                        """,
                        (
                            p.get("name"),
                            p.get("category") or cat,
                            p.get("short_description"),
                            p.get("address"),
                            p.get("lat"),
                            p.get("lon"),
                        ),
                    )
                    inserted += 1
        conn.commit()
    return inserted
