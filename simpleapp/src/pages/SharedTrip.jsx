import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PlaceCard from '../components/PlaceCard';
import {
  MapPinIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  UserCircleIcon,
  CalendarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'https://trip-backend-554701706701.us-central1.run.app';

const SharedTrip = () => {
  const { shareToken } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadSharedTrip = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/api/trips/shared/${shareToken}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('This trip does not exist or is not shared');
          } else {
            setError('Unable to load this trip');
          }
          return;
        }

        const data = await response.json();
        setTrip(data);
      } catch (err) {
        console.error('Error loading shared trip:', err);
        setError('Unable to load this trip. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (shareToken) {
      loadSharedTrip();
    }
  }, [shareToken]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-adventure-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared trip...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trip Not Available</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/browse" className="btn-primary">
            Browse Destinations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              {/* Visibility Badge */}
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-adventure-100 text-adventure-800 text-xs font-medium rounded-full mb-3">
                <GlobeAltIcon className="h-4 w-4" />
                <span>{trip.visibility === 'public' ? 'Public Trip' : 'Shared Trip'}</span>
              </div>

              {/* Trip Title */}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                {trip.name}
              </h1>

              {/* Description */}
              {trip.description && (
                <p className="text-lg text-gray-600 mb-4">{trip.description}</p>
              )}

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {trip.owner && (
                  <div className="flex items-center space-x-2">
                    <UserCircleIcon className="h-5 w-5" />
                    <span>
                      Created by <span className="font-medium">{trip.owner.name}</span>
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="h-5 w-5" />
                  <span className="font-medium">{trip.places?.length || 0} destinations</span>
                </div>
                {trip.createdAt && (
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5" />
                    <span>
                      {new Date(trip.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-5 w-5 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-5 w-5" />
                    <span>Share Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {trip.places && trip.places.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <MapPinIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">This trip doesn't have any destinations yet.</p>
            <Link to="/browse" className="btn-primary">
              Explore Destinations
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Trip Itinerary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trip.places.map((place, index) => (
                <div key={place.id} className="relative">
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -left-3 z-10 bg-adventure-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <PlaceCard place={place} showAddButton={false} />
                </div>
              ))}
            </div>

            {/* CTA Section */}
            <div className="mt-12 bg-gradient-to-br from-adventure-600 to-adventure-700 rounded-2xl p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-3">Want to plan your own adventure?</h3>
              <p className="text-adventure-100 mb-6 max-w-2xl mx-auto">
                Explore destinations, create custom trips, and share them with friends.
                Start planning your perfect DFW experience today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/browse" className="btn-primary bg-white text-adventure-600 hover:bg-gray-100">
                  Browse Destinations
                </Link>
                <Link to="/trips" className="btn-secondary border-white text-white hover:bg-white hover:text-adventure-600">
                  Create a Trip
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedTrip;
