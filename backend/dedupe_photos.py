"""
Deduplicate photos used by places and fix DB references.

What it does
- Scans `backend/static/places/` for duplicate images (by SHA-256 hash).
- Chooses a canonical file per duplicate set and updates DB `image_url`/`photo_url`
  to point to the canonical path (relative: `places/<file>`).
- Optionally deletes redundant duplicate files from disk.

Usage
  python -m backend.dedupe_photos --dry-run          # preview changes
  python -m backend.dedupe_photos --delete-files     # update DB and remove dup files
  python -m backend.dedupe_photos --static-dir <dir> # override static directory
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
from typing import Dict, List, Tuple

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

# Support running both as a module and as a script
try:
    from db import engine
except Exception:  # pragma: no cover - fallback when run as module
    from .db import engine


SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def sha256_file(p: Path, chunk_size: int = 1024 * 1024) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        while True:
            b = f.read(chunk_size)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def list_images(static_dir: Path) -> List[Path]:
    return [p for p in static_dir.iterdir() if p.is_file() and p.suffix.lower() in SUPPORTED_EXTS]


def canonicalize_rel(url: str | None) -> str | None:
    if not url:
        return None
    s = str(url).strip()
    if not s:
        return None
    # ignore remote URLs
    if s.startswith("http://") or s.startswith("https://"):
        return None
    s = s.lstrip("/")
    if s.startswith("static/"):
        s = s[len("static/"):]
    if not s.startswith("places/"):
        # treat bare filename as in places/
        if "/" not in s:
            s = f"places/{s}"
    return s


def detect_duplicate_files(static_dir: Path) -> Tuple[Dict[str, Path], Dict[str, str]]:
    """Return (canonical_by_hash, dup_rel_to_canonical_rel).
    canonical_by_hash: content_hash -> Path (kept file path)
    dup_rel_to_canonical_rel: rel_path -> rel_path (duplicate -> canonical)
    """
    files = list_images(static_dir)
    by_hash: Dict[str, List[Path]] = {}
    for p in files:
        try:
            h = sha256_file(p)
        except Exception:
            continue
        by_hash.setdefault(h, []).append(p)

    canonical_by_hash: Dict[str, Path] = {}
    mapping: Dict[str, str] = {}

    for h, paths in by_hash.items():
        if not paths:
            continue
        # pick canonical by lexicographic path (stable, deterministic)
        canon = sorted(paths, key=lambda x: x.name.lower())[0]
        canonical_by_hash[h] = canon
        canon_rel = f"places/{canon.name}"
        # others map to canonical
        for p in paths:
            if p == canon:
                continue
            dup_rel = f"places/{p.name}"
            mapping[dup_rel] = canon_rel

    return canonical_by_hash, mapping


def dedupe_photos(static_dir: Path, delete_files: bool = False, dry_run: bool = False) -> Tuple[int, int]:
    """Update DB image paths to canonical files and optionally delete duplicates.

    Returns (rows_updated, files_deleted)
    """
    _, dup_to_canon = detect_duplicate_files(static_dir)
    if not dup_to_canon:
        return (0, 0)

    rows_updated = 0
    files_deleted = 0

    with Session(engine) as db:
        insp = inspect(engine)
        cols = {c["name"] for c in insp.get_columns("places")}
        has_photo_url = "photo_url" in cols
        # load refs
        sel_cols = ["id", "image_url"] + (["photo_url"] if has_photo_url else [])
        rows = db.execute(text(f"SELECT {', '.join(sel_cols)} FROM places ORDER BY id"))
        rows = [dict(r) for r in rows.mappings().all()]

        for r in rows:
            updates: Dict[str, str] = {}
            img_rel = canonicalize_rel(r.get("image_url"))
            if img_rel and img_rel in dup_to_canon and dup_to_canon[img_rel] != img_rel:
                updates["image_url"] = dup_to_canon[img_rel]

            if has_photo_url:
                photo_rel = canonicalize_rel(r.get("photo_url"))
                if photo_rel and photo_rel in dup_to_canon and dup_to_canon[photo_rel] != photo_rel:
                    updates["photo_url"] = dup_to_canon[photo_rel]

            if updates and not dry_run:
                set_clause = ", ".join(f"{k} = :{k}" for k in updates.keys())
                params = dict(updates)
                params["id"] = r["id"]
                db.execute(text(f"UPDATE places SET {set_clause} WHERE id = :id"), params)
                rows_updated += 1

        if not dry_run and rows_updated:
            db.commit()

    if delete_files and not dry_run:
        # remove duplicate files from disk
        for dup_rel, canon_rel in dup_to_canon.items():
            if dup_rel == canon_rel:
                continue
            dup_path = static_dir / Path(dup_rel).name
            try:
                if dup_path.exists():
                    dup_path.unlink()
                    files_deleted += 1
            except Exception:
                pass

    return rows_updated, files_deleted


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Deduplicate static place photos and fix DB references")
    parser.add_argument("--static-dir", default=str((Path(__file__).resolve().parent / "static" / "places")), help="Path to the places static dir")
    parser.add_argument("--delete-files", action="store_true", help="Remove duplicate files after updating DB")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    args = parser.parse_args()

    static_dir = Path(args.static_dir).resolve()
    if not static_dir.exists():
        raise SystemExit(f"Static dir not found: {static_dir}")

    updated, deleted = dedupe_photos(static_dir, delete_files=args.delete_files, dry_run=args.dry_run)
    if args.dry_run:
        print(f"[dry-run] Would update {updated} rows and delete {deleted} files")
    else:
        print(f"Updated {updated} rows and deleted {deleted} files")

