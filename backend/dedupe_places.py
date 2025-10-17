"""
Remove duplicate places from the database.

Heuristics:
- Primary dedupe key: lower(trim(name)) + lower(trim(address)) when address is present.
- Secondary dedupe key: lower(trim(name)) + lower(trim(category)) when address is empty/NULL.

Within each duplicate group, keep the record that has the "most data" (more non-null fields),
breaking ties by the lowest id. Optionally merge data from the duplicates into the kept row
to avoid losing details (description, lat/lon, price_level, image_url, maps_url, address).

Usage:
  python -m backend.dedupe_places            # apply changes
  python -m backend.dedupe_places --dry-run   # preview only
"""
from __future__ import annotations

import argparse
from typing import Any, Dict, Iterable, List, Tuple

from sqlalchemy import text
from sqlalchemy.orm import Session

# Support running both as a module (python -m backend.dedupe_places)
# and as a script (python backend/dedupe_places.py)
try:  # absolute import when executed as a script
    from .db import engine
except Exception:  # fallback for package-style execution
    from .db import engine


FIELDS_TO_CONSIDER = [
    "description",
    "address",
    "lat",
    "lon",
    "price_level",
    "image_url",
    "maps_url",
]


def _norm(value: Any) -> str | None:
    if value is None:
        return None
    s = str(value).strip().lower()
    return s or None


def _group_key(row: Dict[str, Any]) -> Tuple[str, str | None, str | None]:
    name = _norm(row.get("name"))
    address = _norm(row.get("address"))
    category = _norm(row.get("category"))
    if address:
        return ("name_addr", name, address)
    return ("name_cat", name, category)


def _score_row(row: Dict[str, Any]) -> int:
    score = 0
    for f in FIELDS_TO_CONSIDER:
        v = row.get(f)
        if v is not None and str(v).strip() != "":
            score += 1
    return score


def _choose_keep(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    # Keep the one with the most filled fields, break ties by smallest id
    best = None
    best_score = -1
    for r in rows:
        sc = _score_row(r)
        if sc > best_score:
            best = r
            best_score = sc
        elif sc == best_score and best is not None and (r.get("id") or 10**9) < (best.get("id") or 10**9):
            best = r
    return best or rows[0]


def _merge_into_keep(keep: Dict[str, Any], others: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
    merged = dict(keep)
    for o in others:
        for f in FIELDS_TO_CONSIDER:
            if merged.get(f) is None or str(merged.get(f)).strip() == "":
                val = o.get(f)
                if val is not None and str(val).strip() != "":
                    merged[f] = val
    return merged


def dedupe(dry_run: bool = False) -> Tuple[int, int]:
    removed = 0
    groups = 0
    with Session(engine) as db:
        rows = db.execute(text("SELECT * FROM places ORDER BY id ASC")).mappings().all()
        if not rows:
            return (0, 0)

        # build groups
        buckets: Dict[Tuple[str, str | None, str | None], List[Dict[str, Any]]] = {}
        for r in rows:
            key = _group_key(r)
            buckets.setdefault(key, []).append(dict(r))

        for key, items in buckets.items():
            if len(items) <= 1:
                continue
            groups += 1

            keep = _choose_keep(items)
            to_delete = [r for r in items if r["id"] != keep["id"]]

            merged = _merge_into_keep(keep, to_delete)

            if dry_run:
                print(f"[dry-run] group={key} keep id={keep['id']} delete={[r['id'] for r in to_delete]}")
                continue

            # Apply merge then delete the rest in a transaction
            set_parts = []
            params: Dict[str, Any] = {"keep_id": keep["id"]}
            for f in FIELDS_TO_CONSIDER:
                if merged.get(f) != keep.get(f):
                    set_parts.append(f"{f} = :{f}")
                    params[f] = merged.get(f)
            if set_parts:
                db.execute(text(f"UPDATE places SET {', '.join(set_parts)} WHERE id = :keep_id"), params)

            if to_delete:
                # Build a parameterized IN clause safely
                id_params = {f"id{i}": r["id"] for i, r in enumerate(to_delete)}
                in_clause = ", ".join(f":{k}" for k in id_params.keys())
                db.execute(text(f"DELETE FROM places WHERE id IN ({in_clause})"), id_params)
                removed += len(to_delete)

        if not dry_run:
            db.commit()

    return (groups, removed)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Remove duplicate places from DB")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change without writing")
    args = parser.parse_args()

    groups, removed = dedupe(dry_run=args.dry_run)
    if args.dry_run:
        print(f"[dry-run] Duplicate groups: {groups}; Rows that would be removed: {removed}")
    else:
        print(f"Deduped groups: {groups}; Removed rows: {removed}")
