import asyncio
import json
from app.services.gemini_service import get_client

MODEL = "gemini-3.5-flash"

_cache: dict[str, dict] = {}


def _call(city: str) -> dict:
    client = get_client()
    prompt = (
        f"List LOCAL railway stations physically located WITHIN {city} city itself "
        f"(suburban, metro, or intercity stations inside the city limits — NOT stations from other cities). "
        f"Also list child-welfare NGOs based in {city}, India. "
        f"Return ONLY valid JSON, no markdown:\n"
        f'{{"railway_stations": ['
        f'{{"name": "...", "location": "{city}", "contact": "Station Master: <name>"}},'
        f" ...up to 8 stations"
        f'], "ngos": ['
        f'{{"name": "...", "location": "{city}", "contact": "Coordinator: <name>"}},'
        f" ...up to 5 NGOs"
        f"]}}"
    )
    response = client.models.generate_content(model=MODEL, contents=prompt)
    raw = (response.text or "").strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


async def get_locations_for_city(city: str) -> dict:
    if city in _cache:
        return _cache[city]
    result = await asyncio.to_thread(_call, city)
    _cache[city] = result
    return result
