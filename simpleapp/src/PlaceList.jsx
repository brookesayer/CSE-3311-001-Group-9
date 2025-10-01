import React, { useEffect, useState } from "react";

export default function PlaceList() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/places", { cache: "no-store" });
      const data = await res.json();
      setPlaces(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Loading…</p>;
  if (!places.length) return <p>No places to show.</p>;

  return (
    <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
      {places.map((p) => (
        <article key={p.id} style={{ border: "1px solid #3333", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ aspectRatio: "4/3", background: "#eee" }}>
            <img
              src={p.photo_url || "/placeholder.jpg"}
              alt={p.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              loading="lazy"
            />
          </div>
          <div style={{ padding: "12px" }}>
            <h3 style={{ margin: "0 0 8px" }}>{p.name}</h3>
            {p.address && <p style={{ margin: 0, color: "#555" }}>{p.address}</p>}
            <div style={{ marginTop: 10 }}>
              <a href={p.directions_url} target="_blank" rel="noreferrer">Get Directions</a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
