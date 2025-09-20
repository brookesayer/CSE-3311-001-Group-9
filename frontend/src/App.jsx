import { useEffect, useState } from 'react';

const API = '/api/places'; // nginx/vite proxy will forward to backend

export default function App() {
  const [places, setPlaces] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(API);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        setPlaces(data);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  if (err) return <div style={{padding:20}}>Error: {err}</div>;
  if (!places.length) return <div style={{padding:20}}>No places yet — try seeding.</div>;

  return (
    <div style={{fontFamily:'system-ui', padding:20}}>
      <h1>Arlington Spots</h1>
      <div style={{display:'flex', flexWrap:'wrap', gap:16}}>
        {places.map(p => (
          <article key={p.id} style={{width:300, background:'#fff', border:'1px solid #eee', borderRadius:12, padding:12, boxShadow:'0 6px 18px rgba(0,0,0,.06)'}}>
            <h3 style={{margin:'4px 0'}}>{p.name}</h3>
            <div style={{color:'#667', fontSize:13}}>{p.category || 'Uncategorized'}</div>
            {p.address && <div style={{fontSize:13, marginTop:6}}>📍 {p.address}</div>}
            {p.description && <p style={{fontSize:14}}>{p.description}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
