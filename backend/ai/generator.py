# backend/ai/generator.py

import os, json, re
from typing import List, Dict

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def _fallback(category: str, region: str) -> List[Dict]:
    # deterministic stub so seeding still works without an API key
    base = [
        {"name": "Arlington Museum of Art", "address": "201 W Main St, Arlington, TX 76010", "subcategory": "Art Museum"},
        {"name": "River Legacy Park", "address": "701 NW Green Oaks Blvd, Arlington, TX 76006", "subcategory": "Urban Park"},
        {"name": "Levitt Pavilion", "address": "100 W Abram St, Arlington, TX 76010", "subcategory": "Live Music Venue"},
    ]
    return [
        {
            "name": f"{x['name']} ({category})",
            "category": category,
            "subcategory": x.get('subcategory'),
            "short_description": f"{category.title()} experience in {region}",
            "address": x["address"],   # provide address when known
            "lat": None,               # leave coords optional; enrichment may fill
            "lon": None,
        }
        for x in base
    ]

def generate_places(category: str, city: str = "Dallas-Fort Worth, TX Metroplex") -> List[Dict]:
    region = city or "Dallas-Fort Worth, TX Metroplex"

    if not OPENAI_API_KEY:
        return _fallback(category, region)

    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)

    system = (
        "You are a travel data generator. Return STRICT JSON array. "
        "Each item must have keys: name, category, subcategory, description, address, lat, lon, price. "
        "The \"category\" must be a broad theme (e.g., Dining, Nightlife, Outdoors, Culture, Family Fun). "
        "Use \"subcategory\" for the more specific spot type (e.g., Taco Stand, Craft Brewery, Sculpture Garden). "
        "Descriptions should be three sentences and realistic. "
        "Avoid national or global chains (e.g., McDonald's, Starbucks). "
        "Focus on independent, local businesses or unique regional favorites. "
        f"Always include a valid postal address within {region} (street, city, state, postal code). "
        "Latitude/longitude are optional and may be null."
    )

    user = (
        f"List 10 independent, non-chain destinations in {region} that fit the broad theme {category}. "
        "Provide both a broad category and a specific subcategory for each item. "
        "Include only local spots, not corporate franchises. "
        "Return ONLY the JSON array."
    )

    resp = client.chat.completions.create(
        model="gpt-5",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        
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
            "subcategory": item.get("subcategory") or item.get("sub_category"),
            "description": item.get("description") or item.get("short_description") or "",
            "address": item.get("address"),      # required by prompt; enrichment will verify/fix if needed
            "lat": item.get("lat"),
            "lon": item.get("lon"),
            "price": item.get("price"),          # optional; may be None
        })
    return normalized
