# backend/fetch_photos_and_links.py
# (formerly enrich_links_to_db.py logic) — now also FILLS/UPDATES address using Google Maps (Places + Reverse Geocoding)

import math
import os
import pathlib
import time
import urllib.parse
from typing import Optional, Dict, Any, List

import requests
import sqlite3
from dotenv import load_dotenv
from slugify import slugify

BACKEND_DIR = pathlib.Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR.parent / ".env")
load_dotenv(BACKEND_DIR / ".env")

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
if not API_KEY:
    raise RuntimeError("Set GOOGLE_MAPS_API_KEY in .env")

DB_PATH = os.getenv("SQLITE_PATH", str(BACKEND_DIR / "dev.db"))
IMAGES_DIR = BACKEND_DIR / "static" / "places"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_BASE = (os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")) + "/static/places"

# Tuning knobs
BIAS_RADIUS_M = 50000          # location bias radius (50 km)
PASS_DISTANCE_KM = 50.0        # max drift allowed vs existing coords
PASS_NEEDS_CITY = False        # set True if you have city/state on rows and want strict address check

# Google endpoints
FIND_PLACE_URL = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"
PHOTO_URL = "https://maps.googleapis.com/maps/api/place/photo"
REVERSE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

def ensure_schema(conn: sqlite3.Connection):
    conn.execute("""
    CREATE TABLE IF NOT EXISTS places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        address TEXT,
        lat REAL,
        lon REAL
    );
    """)
    for col in ["photo_url TEXT", "directions_url TEXT",
                "geo_source TEXT", "geo_confidence TEXT", "geo_distance_km REAL",
                "city TEXT", "state TEXT"]:
        try:
            conn.execute(f"ALTER TABLE places ADD COLUMN {col};")
        except sqlite3.OperationalError:
            pass
    conn.commit()

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(a))

def build_search_text(place: Dict[str, Any]) -> str:
    parts = [place.get("name") or ""]
    if place.get("address"): parts.append(place["address"])
    if place.get("city"): parts.append(place["city"])
    if place.get("state"): parts.append(place["state"])
    return " ".join(p for p in parts if p).strip()

def find_place_with_bias(search_text: str, bias_lat: Optional[float], bias_lon: Optional[float], country: str = "us"):
    params = {
        "input": search_text,
        "inputtype": "textquery",
        "fields": "place_id,geometry,photos,formatted_address,name",
        "key": API_KEY,
        "region": country,
    }
    if bias_lat is not None and bias_lon is not None:
        params["locationbias"] = f"circle:{BIAS_RADIUS_M}@{bias_lat},{bias_lon}"
    r = requests.get(FIND_PLACE_URL, params=params, timeout=20)
    r.raise_for_status()
    js = r.json()
    cands = js.get("candidates") or []
    return cands[0] if cands else None

def place_details_geometry(place_id: str):
    params = {"place_id": place_id, "fields": "geometry,formatted_address,name", "key": API_KEY}
    r = requests.get(PLACE_DETAILS_URL, params=params, timeout=20)
    r.raise_for_status()
    js = r.json()
    result = js.get("result") or {}
    loc = (result.get("geometry") or {}).get("location") or {}
    return {
        "lat": loc.get("lat"),
        "lon": loc.get("lng"),
        "formatted_address": result.get("formatted_address"),
        "name": result.get("name"),
    }

def reverse_geocode(lat: float, lon: float) -> Optional[str]:
    """Return formatted address from lat/lon using Google Reverse Geocoding."""
    params = {"latlng": f"{lat},{lon}", "key": API_KEY}
    r = requests.get(REVERSE_GEOCODE_URL, params=params, timeout=15)
    r.raise_for_status()
    js = r.json()
    results = js.get("results") or []
    return (results[0] or {}).get("formatted_address") if results else None

def address_likely_matches(formatted_address: Optional[str], city: Optional[str], state: Optional[str]) -> bool:
    s = (formatted_address or "").lower()
    ok_city = (not city) or (city.lower() in s)
    ok_state = (not state) or (state.lower() in s)
    return ok_city and ok_state

def google_directions_url(place: Dict[str, Any], place_id: Optional[str]) -> str:
    base = "https://www.google.com/maps/dir/?api=1"
    params = []
    if place_id:
        params.append(("destination_place_id", place_id))
    if (place.get("lat") is not None) and (place.get("lon") is not None):
        params.append(("destination", f"{place['lat']},{place['lon']}"))
    elif place.get("address"):
        params.append(("destination", place["address"]))
    elif place.get("name"):
        params.append(("destination", place["name"]))
    return base + "&" + urllib.parse.urlencode(params)

def choose_best_photo(photos: List[Dict[str, Any]]) -> Optional[str]:
    if not photos: return None
    photos_sorted = sorted(photos, key=lambda p: p.get("width", 0)*p.get("height", 0), reverse=True)
    return photos_sorted[0].get("photo_reference")

def download_place_photo(photo_ref: str, outfile: pathlib.Path, maxwidth: int = 1600) -> bool:
    params = {"maxwidth": str(maxwidth), "photo_reference": photo_ref, "key": API_KEY}
    with requests.get(PHOTO_URL, params=params, timeout=60, stream=True, allow_redirects=True) as r:
        r.raise_for_status()
        if "image" not in (r.headers.get("Content-Type","").lower()): return False
        with open(outfile, "wb") as f:
            for chunk in r.iter_content(8192):
                if chunk: f.write(chunk)
    return True

def safe_filename(name: str, pid: int) -> str:
    return f"{slugify(name or f'place-{pid}')}.jpg"

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)

    rows = conn.execute("""
        SELECT id, name, address, city, state, lat, lon, photo_url, directions_url
        FROM places
        ORDER BY id ASC
    """).fetchall()
    if not rows:
        print("No rows in places. Insert places first, then re-run.")
        return

    updated = 0
    for row in rows:
        place = dict(row)
        bias_lat, bias_lon = place.get("lat"), place.get("lon")
        search_text = build_search_text(place)

        candidate = None
        try:
            candidate = find_place_with_bias(search_text, bias_lat, bias_lon, country="us")
        except Exception as e:
            print(f"[WARN] FindPlace failed for '{place['name']}': {e}")

        place_id = candidate.get("place_id") if candidate else None

        # Precise geometry + formatted address from Place Details
        det = {}
        if place_id:
            try:
                det = place_details_geometry(place_id)
            except Exception as e:
                print(f"[WARN] Place Details failed for {place_id}: {e}")

        lat_g, lon_g = det.get("lat"), det.get("lon")
        addr_g = det.get("formatted_address") or (candidate or {}).get("formatted_address") or ""

        # If we still don't have an address but we have lat/lon → reverse geocode
        if not addr_g and (place.get("lat") is not None and place.get("lon") is not None):
            try:
                addr_rev = reverse_geocode(place["lat"], place["lon"])
                if addr_rev:
                    addr_g = addr_rev
            except Exception as e:
                print(f"[WARN] Reverse geocode failed for {place['name']}: {e}")

        # Verify drift if we will update coords
        ok_city_state = address_likely_matches(addr_g, place.get("city"), place.get("state")) if PASS_NEEDS_CITY else True
        ok_distance = True
        dkm = None
        if (place.get("lat") is not None and place.get("lon") is not None and
            lat_g is not None and lon_g is not None):
            dkm = haversine_km(place["lat"], place["lon"], lat_g, lon_g)
            ok_distance = dkm <= PASS_DISTANCE_KM

        # Update coords if verified
        if (lat_g is not None and lon_g is not None and ok_city_state and ok_distance):
            conn.execute("""
                UPDATE places
                SET lat = ?, lon = ?, geo_source = ?, geo_confidence = ?, geo_distance_km = ?
                WHERE id = ?
            """, (lat_g, lon_g, "google_places_details", "verified", dkm, place["id"]))
            place["lat"], place["lon"] = lat_g, lon_g
        else:
            if dkm is not None:
                conn.execute("""
                    UPDATE places
                    SET geo_confidence = ?, geo_distance_km = ?
                    WHERE id = ?
                """, ("original_or_unverified", dkm, place["id"]))

        # ADDRESS: write/refresh formatted_address if present
        if addr_g and addr_g != (place.get("address") or ""):
            conn.execute("""
                UPDATE places
                SET address = ?
                WHERE id = ?
            """, (addr_g, place["id"]))
            place["address"] = addr_g

        # Build unique directions URL using place_id (preferable)
        new_dir = google_directions_url(place, place_id)

        # Photo
        photo_url = place.get("photo_url")
        if not photo_url and candidate:
            photo_ref = choose_best_photo(candidate.get("photos") or [])
            if photo_ref:
                out = IMAGES_DIR / safe_filename(place["name"], place["id"])
                if out.exists():
                    stem, i = out.stem, 1
                    while out.exists():
                        out = IMAGES_DIR / f"{stem}-{i}.jpg"; i += 1
                try:
                    if download_place_photo(photo_ref, out):
                        photo_url = f"{PUBLIC_BASE}/{out.name}"
                except Exception as e:
                    print(f"[WARN] photo download failed for {place['name']}: {e}")

        # Write URL updates
        if (photo_url and photo_url != place.get("photo_url")) or (new_dir != place.get("directions_url")):
            conn.execute("""
                UPDATE places
                SET photo_url = COALESCE(?, photo_url),
                    directions_url = ?
                WHERE id = ?
            """, (photo_url, new_dir, place["id"]))
            updated += 1

        # be polite with API quotas
        time.sleep(0.25)

    conn.commit()
    conn.close()
    print(f"Done. Updated {updated} place(s).")

if __name__ == "__main__":
    main()
