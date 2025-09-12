import React, { useState, useEffect } from 'react'; // <--- THIS IS THE FIX

// The URL is a relative path. Nginx will handle forwarding it.
const API_URL = '/api/places';

function App() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPlaces(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  if (loading) {
    return <div>Loading amazing places...</div>;
  }

  if (error) {
    return <div>Error fetching data: {error}</div>;
  }

  // A simple card-based layout for better styling
  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f0f2f5', padding: '20px' }}>
      <header style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#333' }}>Travel Destinations</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
          {places.map((place) => (
            <div key={place.id} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              padding: '20px',
              width: '300px',
              boxSizing: 'border-box'
            }}>
              <h2 style={{ marginTop: '0', color: '#1a2b4d' }}>{place.name}</h2>
              <h3 style={{ color: '#555', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>{place.location}</h3>
              <p style={{ color: '#666' }}>{place.description}</p>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;

