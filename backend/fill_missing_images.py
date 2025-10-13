"""Populate missing place images by matching static files."""

import argparse
import sqlite3
from pathlib import Path
import os
from typing import Iterable, Optional

from slugify import slugify

BACKEND_DIR = Path(__file__).resolve().parent
# Default DB path: project root dev.db, unless SQLITE_PATH or DATABASE_URL provided
_project_db = BACKEND_DIR.parent / "dev.db"
_env_sqlite = os.getenv("SQLITE_PATH")
_env_dburl = os.getenv("DATABASE_URL", "")

def _db_from_url(url: str) -> Path | None:
    try:
        if url.startswith("sqlite:///"):
            # strip prefix and convert POSIX path to OS path
            p = url.replace("sqlite:///", "", 1)
            return Path(p)
    except Exception:
        pass
    return None

DEFAULT_DB = Path(_env_sqlite) if _env_sqlite else (_db_from_url(_env_dburl) or _project_db)
STATIC_DIR = BACKEND_DIR / "static" / "places"

SUPPORTED_EXTS = [".jpg", ".jpeg", ".png", ".webp"]


def find_candidate_files(name: str) -> Iterable[Path]:
    """Yield static image files whose slug matches the place name."""
    if not name:
        return []
    slug = slugify(name)
    for ext in SUPPORTED_EXTS:
        candidate = STATIC_DIR / f"{slug}{ext}"
        if candidate.exists():
            yield candidate


def fill_missing_images(db_path: Path, dry_run: bool = False) -> int:
    """Set image_url/photo_url fields for rows missing both."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    rows = conn.execute(
        """
        SELECT id, name, image_url, photo_url
        FROM places
        WHERE (image_url IS NULL OR image_url = '')
          AND (photo_url IS NULL OR photo_url = '')
        ORDER BY id
        """
    ).fetchall()

    updated = 0
    for row in rows:
        name = row["name"] or ""
        matches = list(find_candidate_files(name))
        if not matches:
            continue

        rel_path = Path("places") / matches[0].name
        print(f"[fill] id={row['id']} -> {rel_path}")

        if dry_run:
            continue

        conn.execute(
            """
            UPDATE places
            SET image_url = ?, photo_url = ?
            WHERE id = ?
            """,
            (str(rel_path), str(rel_path), row["id"]),
        )
        updated += 1

    if not dry_run and updated:
        conn.commit()
    conn.close()
    return updated


def main(argv: Optional[Iterable[str]] = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB, help="Path to SQLite database")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without updating the DB")
    args = parser.parse_args(argv)

    if not STATIC_DIR.exists():
        raise SystemExit(f"Static directory not found: {STATIC_DIR}")

    updated = fill_missing_images(args.db, dry_run=args.dry_run)
    if args.dry_run:
        print(f"[fill] would update {updated} rows")
    else:
        print(f"[fill] updated {updated} rows")


if __name__ == "__main__":
    main()
