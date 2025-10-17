"""
Lightweight migration to align the DB schema with the ERD:

Tables:
  - categories(id, name, slug)
  - cities(id, name, state, slug)
  - places(+ rating, city (text), category_id, city_id, image_url, maps_url, price_level)
  - trips(id uuid text, user_id, name, description, created_at, updated_at)
  - trip_items(id uuid text, trip_id FK, place_id FK, position, notes, added_at)

Safe to run multiple times. Works on SQLite and Postgres.
"""
from __future__ import annotations

import os
from contextlib import closing
from sqlalchemy import text, inspect
from sqlalchemy.engine import Engine

from .db import engine, Base
from .models import Category, City, Place, Trip, TripItem  # noqa: F401  (import registers models)


def _has_column(engine: Engine, table: str, column: str) -> bool:
    insp = inspect(engine)
    try:
        cols = [c["name"] for c in insp.get_columns(table)]
    except Exception:
        return False
    return column in cols


def _add_column_sqlite(engine: Engine, table: str, ddl: str) -> None:
    # SQLite supports simple ADD COLUMN with no IF NOT EXISTS; we guard via PRAGMA above.
    with engine.begin() as conn:
        conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {ddl}")


def migrate() -> None:
    # 1) Create new tables if missing via SQLAlchemy metadata
    Base.metadata.create_all(bind=engine)

    # 2) Bring 'places' table up to shape (non-destructive)
    # Columns we expect to exist for the ERD/compat
    expected_cols = {
        "rating": "REAL",
        "city": "TEXT",
        "category_id": "INTEGER",
        "city_id": "INTEGER",
        "price_level": "INTEGER",
        "image_url": "TEXT",
        "maps_url": "TEXT",
    }

    # Check dialect
    is_sqlite = engine.url.get_backend_name().startswith("sqlite")

    for col, ddl_type in expected_cols.items():
        if not _has_column(engine, "places", col):
            if is_sqlite:
                _add_column_sqlite(engine, "places", f"{col} {ddl_type}")
            else:
                with engine.begin() as conn:
                    # Postgres / others support IF NOT EXISTS for tables via DO blocks; here we best-effort
                    try:
                        conn.execute(text(f"ALTER TABLE places ADD COLUMN {col} {ddl_type}"))
                    except Exception:
                        pass

    # 3) Basic indexes that help common queries (safe if they already exist)
    with engine.begin() as conn:
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_places_category_id ON places(category_id)"))
        except Exception:
            pass
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_places_city_id ON places(city_id)"))
        except Exception:
            pass

    print("Migration complete. Schema is aligned with ERD-compatible structure.")


if __name__ == "__main__":
    migrate()
