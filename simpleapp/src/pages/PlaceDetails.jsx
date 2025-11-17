import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { fetchPlaceById } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import Toast from '../components/Toast';
import {
  StarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  PlusIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/solid';

const PlaceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [place, setPlace] = useState(null);
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [toast, setToast] = useState(null);
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const loadPlace = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPlaceById(parseInt(id));
        setPlace(data);
      } catch (err) {
        setError('Failed to load place details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPlace();
    loadTrips();
  }, [id, isAuthenticated]);

  const loadTrips = async () => {
    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:8000/api/trips/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setTrips(data);
          if (data.length > 0) {
            setSelectedTripId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading trips:', error);
        const savedTrips = storage.getTrips();
        setTrips(savedTrips);
        if (savedTrips.length > 0) {
          setSelectedTripId(savedTrips[0].id);
        }
      }
    } else {
      const savedTrips = storage.getTrips();
      setTrips(savedTrips);
      if (savedTrips.length > 0) {
        setSelectedTripId(savedTrips[0].id);
      }
    }
  };

  useEffect(() => {
    if (place && selectedTripId) {
      const trip = trips.find(t => t.id === selectedTripId);
      if (trip) {
        const alreadyAdded = trip.places.some(p => p.id === place.id);
        setIsAdded(alreadyAdded);
      }
    }
  }, [place, selectedTripId, trips]);

  const getPriceLevelText = (level) => {
    const texts = ['Budget-friendly', 'Moderate', 'Expensive', 'Luxury'];
    return texts[level - 1] || 'Unknown';
  };

  const getPriceLevelSymbol = (level) => {
    return '$'.repeat(level);
  };

  const handleAddToTrip = async () => {
    if (!selectedTripId) {
      setToast({ message: 'Please select a trip first!', type: 'warning' });
      return;
    }

    setAdding(true);

    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:8000/api/trips/${selectedTripId}/places`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ place_id: place.id })
        });

        if (response.ok) {
          const trip = trips.find(t => t.id === selectedTripId);
          setToast({ message: `${place.name} added to ${trip.name}!`, type: 'success' });
          setIsAdded(true);
          // Reload trips to update counts
          loadTrips();
        } else {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.detail?.includes('already')) {
            setToast({ message: `${place.name} is already in this trip!`, type: 'warning' });
            setIsAdded(true);
          } else {
            setToast({ message: 'Failed to add place to trip', type: 'error' });
          }
        }
      } catch (error) {
        console.error('Error adding place to trip:', error);
        setToast({ message: 'Failed to add place to trip', type: 'error' });
      }
    } else {
      const success = storage.addPlaceToTrip(selectedTripId, place);
      const trip = trips.find(t => t.id === selectedTripId);

      if (success) {
        setToast({ message: `${place.name} added to ${trip.name}!`, type: 'success' });
        setIsAdded(true);
        setTrips(storage.getTrips());
      } else {
        setToast({ message: `${place.name} is already in ${trip.name}!`, type: 'warning' });
      }
    }

    setAdding(false);
  };

  const handleCreateNewTrip = () => {
    navigate('/trips');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-adventure-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading place details...</p>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Place not found'}
          </h2>
          <p className="text-gray-600 mb-4">
            {error ? 'Please try again later.' : "The destination you're looking for doesn't exist."}
          </p>
          <button onClick={() => navigate('/browse')} className="btn-primary">
            Browse Destinations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="relative h-96 overflow-hidden bg-gray-900">
        {place.imageUrl ? (
          <img
            src={place.imageUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-adventure-600 to-adventure-800" />
        )}
        <div className="gradient-overlay" />

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
          {place.address && (
            <div className="flex items-center text-lg">
              <MapPinIcon className="h-5 w-5 mr-2" />
              <span>{place.address}</span>
            </div>
          )}
          {(() => {
            const mapsUrl = place.mapsUrl || (place.lat && place.lon
              ? `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`
              : (place.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}` : null));
            return mapsUrl ? (
              <div className="mt-3">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white text-sm font-medium transition"
                >
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  Open in Google Maps
                </a>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="card p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this destination</h2>
              <p className="text-gray-700 text-lg leading-relaxed">{place.description}</p>
            </div>

            {(place.rating || place.priceLevel || place.category) && (
              <div className="card p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Facts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {place.rating && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <StarIcon className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{place.rating}</div>
                      <div className="text-sm text-gray-600">Rating</div>
                    </div>
                  )}
                  {place.priceLevel && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <CurrencyDollarIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {getPriceLevelSymbol(place.priceLevel)}
                      </div>
                      <div className="text-sm text-gray-600">{getPriceLevelText(place.priceLevel)}</div>
                    </div>
                  )}
                  {place.category && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <MapPinIcon className="h-8 w-8 text-adventure-500 mx-auto mb-2" />
                      <div className="text-lg font-bold text-gray-900">{place.category}</div>
                      <div className="text-sm text-gray-600">Category</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-8">
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
                          {trip.name} ({trip.places?.length || 0} places)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAddToTrip}
                    disabled={isAdded || adding}
                    className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      isAdded
                        ? 'bg-green-100 text-green-800 cursor-not-allowed'
                        : adding
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-adventure-600 hover:bg-adventure-700 text-white'
                    }`}
                  >
                    {adding ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Adding...</span>
                      </>
                    ) : isAdded ? (
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