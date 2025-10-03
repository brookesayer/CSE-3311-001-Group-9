import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import Toast from '../components/Toast';
import {
  StarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  PlusIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/solid';
import { fetchPlaceById } from '../lib/api';

const PlaceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [place, setPlace] = useState(null);
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [toast, setToast] = useState(null);
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load place + trips
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await fetchPlaceById(id);
        if (active) setPlace(p || null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    const savedTrips = storage.getTrips();
    setTrips(savedTrips);
    if (savedTrips.length > 0) setSelectedTripId(savedTrips[0].id);

    return () => { active = false; };
  }, [id]);

  // Check if already in selected trip
  useEffect(() => {
    if (place && selectedTripId) {
      const trip = trips.find(t => t.id === selectedTripId);
      if (trip) {
        const already = trip.places.some(p => Number(p.id) === Number(place.id));
        setIsAdded(already);
      }
    }
  }, [place, selectedTripId, trips]);

  const normalizePriceLevel = (value) => {
    if (value == null) return null;
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && Number.isFinite(numeric) && numeric > 0) {
      return Math.min(4, Math.max(1, Math.round(numeric)));
    }
    const textValue = String(value).trim();
    if (!textValue) return null;
    if (/^\$+$/.test(textValue)) {
      return Math.min(4, textValue.length);
    }
    const parsed = Number(textValue);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return Math.min(4, Math.max(1, Math.round(parsed)));
    }
    return null;
  };

  const getPriceLevelText = (level, display) => {
    const texts = ['Budget-friendly', 'Moderate', 'Expensive', 'Luxury'];
    const normalized = normalizePriceLevel(level ?? display);
    if (normalized) {
      return texts[normalized - 1] ?? 'Moderate';
    }
    return display || 'Unknown';
  };

  const getPriceLevelSymbol = (level, display) => {
    if (display) return display;
    const normalized = normalizePriceLevel(level);
    return normalized ? '$'.repeat(normalized) : 'N/A';
  };

  const handleAddToTrip = () => {
    if (!selectedTripId) {
      setToast({ message: 'Please select a trip first!', type: 'warning' });
      return;
    }
    if (!place) return;

    const success = storage.addPlaceToTrip(selectedTripId, place);
    const trip = trips.find(t => t.id === selectedTripId);

    if (success) {
      setToast({ message: `${place.name} added to ${trip.name}!`, type: 'success' });
      setIsAdded(true);
      setTrips(storage.getTrips());
    } else {
      setToast({ message: `${place.name} is already in ${trip.name}!`, type: 'warning' });
    }
  };

  const handleCreateNewTrip = () => navigate('/trips');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading place…</div>;
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Place not found</h2>
          <p className="text-gray-600 mb-4">The destination you’re looking for doesn’t exist.</p>
          <button onClick={() => navigate('/browse')} className="btn-primary">
            Browse Destinations
          </button>
        </div>
      </div>
    );
  }

  const heroImg = place.imageUrl || '/placeholder.jpg';


  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hero */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={heroImg}
          alt={place.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm hover:bg-white p-3 rounded-full transition-all duration-200"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
        </button>

        <div className="absolute bottom-6 left-6 text-white">
          {place.category && (
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium mb-3 inline-block">
              {place.category}
            </span>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{place.name}</h1>
          {(place.city || place.address) && (
            <div className="flex items-center text-lg">
              <MapPinIcon className="h-5 w-5 mr-2" />
              <span>{place.city || place.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this destination</h2>
              <p className="text-gray-700 text-lg leading-relaxed">{place.description || 'No description available.'}</p>
            </div>

            <div className="bg-white rounded-xl shadow p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Facts</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <StarIcon className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{place.rating ?? '—'}</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {getPriceLevelSymbol(place.priceLevel, place.priceDisplay)}
                  </div>
                  <div className="text-sm text-gray-600">{getPriceLevelText(place.priceLevel, place.priceDisplay)}</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <MapPinIcon className="h-8 w-8 text-adventure-500 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{place.category || '—'}</div>
                  <div className="text-sm text-gray-600">Category</div>
                </div>
              </div>

              {place.mapsUrl && (
                <div className="mt-6">
                  <a
                    href={place.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary inline-block"
                  >
                    Open in Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add to Trip</h3>

              {trips.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">
                    You don't have any trips yet. Create one to start planning!
                  </p>
                  <button onClick={handleCreateNewTrip} className="btn-primary w-full">
                    Create Your First Trip
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select a trip
                    </label>
                    <select
                      value={selectedTripId}
                      onChange={(e) => setSelectedTripId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500"
                    >
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.name} ({trip.places.length} places)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAddToTrip}
                    disabled={isAdded}
                    className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      isAdded
                        ? 'bg-green-100 text-green-800 cursor-not-allowed'
                        : 'bg-adventure-600 hover:bg-adventure-700 text-white'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <CheckIcon className="h-5 w-5" />
                        <span>Added to Trip</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-5 w-5" />
                        <span>Add to Trip</span>
                      </>
                    )}
                  </button>

                  <div className="pt-4 border-t">
                    <button
                      onClick={handleCreateNewTrip}
                      className="w-full btn-secondary"
                    >
                      Create New Trip
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PlaceDetails;
