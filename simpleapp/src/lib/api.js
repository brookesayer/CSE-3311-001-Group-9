// src/lib/api.js
const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || '';

function url(p) {
  return `${API_BASE}${p}`;
}

function ensureArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return [data];
  return [];
}

function derivePriceInfo(value) {
  if (value == null) {
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const info = derivePriceInfo(item);
      if (info) return info;
    }
    return null;
  }
  if (typeof value === 'object') {
    const levelCandidate = value.priceLevel ?? value.level ?? null;
    const displayCandidate = value.priceDisplay ?? value.display ?? null;
    const normalizedLevel = Number.isFinite(levelCandidate) ? Number(levelCandidate) : null;
    if (normalizedLevel && normalizedLevel > 0) {
      return {
        level: Math.round(normalizedLevel),
        display: displayCandidate ?? '$'.repeat(Math.round(normalizedLevel)),
      };
    }
    if (displayCandidate) {
      return derivePriceInfo(displayCandidate) ?? { level: null, display: String(displayCandidate) };
    }
  }
  if (typeof value === 'number') {
    const level = Number.isFinite(value) && value > 0 ? Math.round(value) : null;
    return level ? { level, display: '$'.repeat(level) } : null;
  }
  const textValue = String(value).trim();
  if (!textValue) {
    return null;
  }
  if (/^\$+$/.test(textValue)) {
    const level = textValue.length;
    return level ? { level, display: textValue } : null;
  }
  const numeric = Number(textValue);
  if (!Number.isNaN(numeric) && numeric > 0) {
    const level = Math.round(numeric);
    return { level, display: '$'.repeat(level) };
  }
  return { level: null, display: textValue };
}

function normalizePlace(place) {
  if (!place || typeof place !== 'object') return place;
  const normalized = { ...place };

  if (normalized.imageUrl == null) {
    normalized.imageUrl = normalized.image_url ?? normalized.photo_url ?? null;
  }

  const priceCandidate =
    normalized.priceDisplay ??
    normalized.price_display ??
    normalized.priceLevel ??
    normalized.price_level ??
    normalized.price ??
    null;
  const priceInfo = derivePriceInfo(priceCandidate);
  if (priceInfo) {
    normalized.priceLevel = priceInfo.level ?? null;
    normalized.priceDisplay = priceInfo.display ?? null;
  } else {
    normalized.priceLevel = Number.isFinite(normalized.priceLevel) ? Number(normalized.priceLevel) : null;
    normalized.priceDisplay = normalized.priceDisplay ?? normalized.price_display ?? null;
  }
  if (normalized.price_level == null && normalized.priceLevel != null) {
    normalized.price_level = normalized.priceLevel;
  }
  if (normalized.price == null && normalized.priceDisplay) {
    normalized.price = normalized.priceDisplay;
  }

  const mapsRaw =
    normalized.mapsUrl ??
    normalized.directionsUrl ??
    normalized.directions_url ??
    normalized.maps_url ??
    null;
  const mapLink =
    typeof mapsRaw === 'string' ? mapsRaw.trim() : mapsRaw ?? null;

  normalized.mapsUrl = mapLink || null;
  normalized.directionsUrl = normalized.mapsUrl;
  normalized.directions_url = normalized.mapsUrl;
  normalized.maps_url = normalized.mapsUrl;

  return normalized;
}

function normalizePlaces(data) {
  return ensureArray(data).map((item) => normalizePlace(item));
}

/** Fetch from backend first; fall back to /places.json in /public for dev */
export async function fetchPlaces() {
  // Try backend
  try {
    const res = await fetch(url('/api/places'), { cache: 'no-store' });
    if (!res.ok) {
      const t = await res.text();
      console.error('API /api/places failed:', res.status, t);
      throw new Error('API /api/places not OK');
    }
    const data = await res.json();
    console.info(`Loaded ${Array.isArray(data) ? data.length : 0} places from backend`);
    return normalizePlaces(data);
  } catch (err) {
    console.warn('Backend not reachable, falling back to /places.json', err);
  }

  // Fallback
  const res2 = await fetch('/places.json', { cache: 'no-store' });
  if (!res2.ok) {
    const t = await res2.text();
    console.error('Fallback /places.json failed:', res2.status, t);
    throw new Error('Failed to load places from API and /places.json');
  }
  const data2 = await res2.json();
  const normalized = normalizePlaces(data2);
  console.info(`Loaded ${normalized.length} places from /places.json`);
  return normalized;
}

/** Convenience: get a single place by id (number or string) */
export async function fetchPlaceById(id) {
  const all = await fetchPlaces();
  const numId = Number(id);
  return all.find((p) => Number(p.id) === numId);
}
