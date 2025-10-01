// src/lib/api.js
const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || '';

function url(p) {
  return `${API_BASE}${p}`;
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
    console.info(`Loaded ${data.length} places from backend`);
    return data;
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
  console.info(`Loaded ${data2.length} places from /places.json`);
  return data2;
}

/** Convenience: get a single place by id (number or string) */
export async function fetchPlaceById(id) {
  const all = await fetchPlaces();
  const numId = Number(id);
  return all.find(p => Number(p.id) === numId);
}
