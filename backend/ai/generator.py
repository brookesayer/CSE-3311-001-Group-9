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
            "address": x["address"],
            "lat": None,
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
        "Always include latitude/longitude in decimal degrees when possible."
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
    return json.loads(arr_text)
