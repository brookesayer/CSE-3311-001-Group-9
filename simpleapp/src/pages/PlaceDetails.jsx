import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import Toast from '../components/Toast';
import placesData from '../data/places.json';
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
  const [place, setPlace] = useState(null);
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [toast, setToast] = useState(null);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    const foundPlace = placesData.find(p => p.id === parseInt(id));
    if (foundPlace) {
      setPlace(foundPlace);
    }

    const savedTrips = storage.getTrips();
    setTrips(savedTrips);
    if (savedTrips.length > 0) {
      setSelectedTripId(savedTrips[0].id);
    }
  }, [id]);

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

  const handleAddToTrip = () => {
    if (!selectedTripId) {
      setToast({ message: 'Please select a trip first!', type: 'warning' });
      return;
    }

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

  const handleCreateNewTrip = () => {
    navigate('/trips');
  };

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Place not found</h2>
          <p className="text-gray-600 mb-4">The destination you're looking for doesn't exist.</p>
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

      <div className="relative h-96 overflow-hidden">
        <img
          src={place.imageUrl}
          alt={place.name}
          className="w-full h-full object-cover"
        />
        <div className="gradient-overlay" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm hover:bg-white p-3 rounded-full transition-all duration-200"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
        </button>

        <div className="absolute bottom-6 left-6 text-white">
          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium mb-3 inline-block">
            {place.category}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{place.name}</h1>
          <div className="flex items-center text-lg">
            <MapPinIcon className="h-5 w-5 mr-2" />
            <span>{place.city}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="card p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this destination</h2>
              <p className="text-gray-700 text-lg leading-relaxed">{place.description}</p>
            </div>

            <div className="card p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Facts</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <StarIcon className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{place.rating}</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {getPriceLevelSymbol(place.priceLevel)}
                  </div>
                  <div className="text-sm text-gray-600">{getPriceLevelText(place.priceLevel)}</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <MapPinIcon className="h-8 w-8 text-adventure-500 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{place.category}</div>
                  <div className="text-sm text-gray-600">Category</div>
                </div>
              </div>
            </div>
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