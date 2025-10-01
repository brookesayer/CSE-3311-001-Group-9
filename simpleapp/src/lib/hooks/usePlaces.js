// src/hooks/usePlaces.js
import { useEffect, useState } from "react";
import { fetchPlaces } from "../lib/api";

export function usePlaces() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchPlaces();
        if (active) setPlaces(data);
      } catch (e) {
        if (active) setError(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return { places, loading, error };
}
