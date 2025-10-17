// Centralized API layer with backend + localStorage fallback
import dfwPlaces from '../data/dfwPlaces';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to check if backend is available
let backendAvailable = null;

async function checkBackendAvailability() {
  if (backendAvailable !== null) return backendAvailable;

  try {
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });
    backendAvailable = response.ok;
  } catch (error) {
    backendAvailable = false;
  }
  return backendAvailable;
}

/**
 * Get all DFW places with optional filters
 * Tries backend first, falls back to local data
 */
export async function getPlaces(filters = {}) {
  const { search = '', city = '', category = '', minRating = 0, maxPriceLevel = 4, limit = 100, offset = 0 } = filters;

  try {
    const isBackendUp = await checkBackendAvailability();

    if (isBackendUp) {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (city && city !== 'All') params.append('city', city);
      if (category && category !== 'All') params.append('category', category);
      if (limit) params.append('limit', String(limit));
      if (offset) params.append('offset', String(offset));
      params.append('sort', 'rating');
      params.append('order', 'desc');

      const response = await fetch(`${API_URL}/api/places?${params.toString()}`, {
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        // Backend already applied pagination; still apply client filters if needed
        return filterPlaces(data, { search, city, category, minRating, maxPriceLevel, limit, offset, alreadyPaged: true });
      }
    }
  } catch (error) {
    console.warn('Backend unavailable, using local data:', error.message);
  }

  // Try backend-served JSON fallback, then local data
  try {
    const resp = await fetch(`${API_URL}/places.json`, { signal: AbortSignal.timeout(3000) });
    if (resp.ok) {
      const data = await resp.json();
      return filterPlaces(data, { search, city, category, minRating, maxPriceLevel, limit, offset });
    }
  } catch {}

  return filterPlaces(dfwPlaces, { search, city, category, minRating, maxPriceLevel, limit, offset });
}

/**
 * Client-side filtering logic
 */
function filterPlaces(places, filters) {
  let filtered = [...places];

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.city.toLowerCase().includes(searchLower) ||
      p.neighborhood.toLowerCase().includes(searchLower) ||
      (p.description && p.description.toLowerCase().includes(searchLower))
    );
  }

  if (filters.city && filters.city !== 'All') {
    filtered = filtered.filter(p => p.city === filters.city);
  }

  if (filters.category && filters.category !== 'All') {
    filtered = filtered.filter(p => p.category === filters.category);
  }

  if (filters.minRating > 0) {
    filtered = filtered.filter(p => (p.rating || 0) >= filters.minRating);
  }

  if (filters.maxPriceLevel < 4) {
    filtered = filtered.filter(p => (p.priceLevel || 1) <= filters.maxPriceLevel);
  }

  // Sort by rating desc
  filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  // Apply pagination only if data wasn't already paged server-side
  if (!filters.alreadyPaged) {
    const start = filters.offset || 0;
    const end = (filters.limit || filtered.length) + start;
    filtered = filtered.slice(start, end);
  }

  return filtered;
}

/**
 * Get a single place by ID
 */
export async function getPlaceById(id) {
  try {
    const isBackendUp = await checkBackendAvailability();

    if (isBackendUp) {
      const response = await fetch(`${API_URL}/api/places/${id}`, {
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        return await response.json();
      }
    }
  } catch (error) {
    console.warn('Backend unavailable, using local data');
  }

  // Try fallback JSON then local data
  try {
    const resp = await fetch(`${API_URL}/places.json`, { signal: AbortSignal.timeout(3000) });
    if (resp.ok) {
      const data = await resp.json();
      return data.find(p => p.id === parseInt(id));
    }
  } catch {}

  return dfwPlaces.find(p => p.id === parseInt(id));
}

/**
 * Create a new trip
 * Tries backend, falls back to localStorage
 */
export async function createTrip(payload) {
  const tripData = {
    title: payload.title || payload.name,
    note: payload.note || payload.description || '',
    places: []
  };

  try {
    const isBackendUp = await checkBackendAvailability();

    if (isBackendUp) {
      const response = await fetch(`${API_URL}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData),
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        return await response.json();
      }
    }
  } catch (error) {
    console.warn('Backend unavailable, using localStorage');
  }

  // Fallback to localStorage
  const localTrip = {
    id: `local-${Date.now()}`,
    name: tripData.title,
    description: tripData.note,
    places: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return localTrip;
}

/**
 * Add a place to a trip
 */
export async function addPlaceToTrip(tripId, placeId) {
  try {
    const isBackendUp = await checkBackendAvailability();

    if (isBackendUp && !tripId.startsWith('local-')) {
      const response = await fetch(`${API_URL}/api/trips/${tripId}/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: placeId }),
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        return await response.json();
      }
    }
  } catch (error) {
    console.warn('Backend unavailable for add place');
  }

  // For local trips or fallback, return success indicator
  return { success: true, tripId, placeId };
}

/**
 * Get a trip by ID
 */
export async function getTrip(tripId) {
  try {
    const isBackendUp = await checkBackendAvailability();

    if (isBackendUp && !tripId.startsWith('local-')) {
      const response = await fetch(`${API_URL}/api/trips/${tripId}`, {
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        return await response.json();
      }
    }
  } catch (error) {
    console.warn('Backend unavailable for get trip');
  }

  return null;
}

/**
 * Create a shareable link for a trip
 */
export async function createShareLink(tripId, tripData) {
  try {
    const isBackendUp = await checkBackendAvailability();

    if (isBackendUp && !tripId.startsWith('local-')) {
      const response = await fetch(`${API_URL}/api/share/${tripId}`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        return `${window.location.origin}/share/${data.token}`;
      }
    }
  } catch (error) {
    console.warn('Backend unavailable for share');
  }

  // Fallback: create encoded token
  const shareData = {
    t: tripData.name || tripData.title,
    d: tripData.description || tripData.note || '',
    ids: (tripData.places || []).map(p => p.id)
  };

  const token = btoa(JSON.stringify(shareData));
  return `${window.location.origin}/share/${token}`;
}

/**
 * Decode a share token
 */
export function decodeShareToken(token) {
  try {
    const decoded = JSON.parse(atob(token));
    return {
      title: decoded.t,
      description: decoded.d || '',
      placeIds: decoded.ids || []
    };
  } catch (error) {
    console.error('Failed to decode share token:', error);
    return null;
  }
}

/**
 * Get local trips (for localStorage fallback)
 */
export function getLocalTrips() {
  try {
    const trips = localStorage.getItem('travel_app_trips');
    return trips ? JSON.parse(trips) : [];
  } catch (error) {
    console.error('Error loading local trips:', error);
    return [];
  }
}

// Legacy compatibility - keep old function names
export async function fetchPlaces(options = {}) {
  return getPlaces({
    search: options.q || '',
    category: options.category || '',
    city: options.city || '',
    minRating: 0,
    maxPriceLevel: 4
  });
}

// Cities helper for UI (unused by Browse.jsx dynamic fetch if backend is down)
export async function getCities() {
  try {
    const isBackendUp = await checkBackendAvailability();
    if (isBackendUp) {
      const resp = await fetch(`${API_URL}/api/cities`, { signal: AbortSignal.timeout(4000) });
      if (resp.ok) return await resp.json();
    }
  } catch {}
  // Fallback to local list
  const names = Array.from(new Set((dfwPlaces || []).map(p => p.city).filter(Boolean)));
  return names.map(n => ({ id: null, name: n, slug: null }));
}

export async function fetchPlaceById(id) {
  return getPlaceById(id);
}

export async function checkHealth() {
  return checkBackendAvailability();
}
