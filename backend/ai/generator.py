# backend/ai/generator.py

import os, json, re
from typing import List, Dict

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def _fallback(category: str, city: str) -> List[Dict]:
    # deterministic stub so seeding still works without an API key
    base = [
        {"name": "Arlington Museum of Art", "address": "201 W Main St, Arlington, TX 76010"},
        {"name": "River Legacy Park", "address": "701 NW Green Oaks Blvd, Arlington, TX 76006"},
        {"name": "Levitt Pavilion", "address": "100 W Abram St, Arlington, TX 76010"},
    ]
    return [
        {
            "name": f"{x['name']} ({category})",
            "category": category,
            "short_description": f"{category.title()} spot in {city}",
            "address": x["address"],   # provide address when known
            "lat": None,               # leave coords optional; enrichment may fill
            "lon": None,
        }
        for x in base
    ]

def generate_places(category: str, city: str = "Arlington, TX") -> List[Dict]:
    if not OPENAI_API_KEY:
        return _fallback(category, city)

    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)

    system = (
        "You are a travel data generator. Return STRICT JSON array. "
        "Each item must have keys: name, category, description, address, lat, lon. "
        "Descriptions should be short and realistic. "
        "Avoid national or global chains (e.g., McDonald's, Starbucks). "
        "Focus on independent, local businesses or unique regional favorites. "
        "Always include a valid postal address (street, city, state, postal code). "
        "Latitude/longitude are optional and may be null."
    )

    user = (
        f"List 10 independent, non-chain {category} in {city}. "
        "Include only local spots, not corporate franchises. "
        "Return ONLY the JSON array."
    )

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
    )

    content = resp.choices[0].message.content

    # try to extract an array
    m = re.search(r"\[\s*{.*}\s*\]", content, flags=re.S)
    arr_text = m.group(0) if m else content
    data = json.loads(arr_text)

    # normalize: ensure keys exist; allow lat/lon to be None
    normalized: List[Dict] = []
    for item in data:
        normalized.append({
            "name": item.get("name"),
            "category": item.get("category") or category,
            "description": item.get("description") or item.get("short_description") or "",
            "address": item.get("address"),      # required by prompt; enrichment will verify/fix if needed
            "lat": item.get("lat"),
            "lon": item.get("lon"),
        })
    return normalized
