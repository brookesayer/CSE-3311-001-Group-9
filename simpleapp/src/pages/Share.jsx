import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { decodeShareToken, getPlaceById } from '../lib/api';
import PlaceCard from '../components/PlaceCard';
import { MapPinIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

const Share = () => {
  const { token } = useParams();
  const [trip, setTrip] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadSharedTrip = async () => {
      try {
        setLoading(true);
        setError(null);

        const decoded = decodeShareToken(token);

        if (!decoded) {
          setError('Invalid share link');
          return;
        }

        setTrip({
          title: decoded.title,
          description: decoded.description
        });

        // Fetch all places
        const placesPromises = decoded.placeIds.map(id => getPlaceById(id));
        const placesData = await Promise.all(placesPromises);

        // Filter out null/undefined results
        const validPlaces = placesData.filter(p => p !== null && p !== undefined);
        setPlaces(validPlaces);

      } catch (err) {
        console.error('Error loading shared trip:', err);
        setError('Unable to load this trip. The link may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadSharedTrip();
    }
  }, [token]);

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Share Link</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/browse" className="btn-primary">
            Browse DFW Destinations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-block px-3 py-1 bg-adventure-100 text-adventure-800 text-xs font-medium rounded-full mb-2">
                Shared Trip
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {trip?.title || 'DFW Trip'}
              </h1>
              {trip?.description && (
                <p className="text-lg text-gray-600">{trip.description}</p>
              )}
              <div className="flex items-center text-gray-500 mt-3">
                <MapPinIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">{places.length} destinations</span>
              </div>
            </div>

            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              aria-label="Copy share link"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-5 w-5 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="h-5 w-5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {places.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 mb-4">This trip doesn't have any destinations yet.</p>
            <Link to="/browse" className="btn-primary">
              Explore DFW
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Trip Itinerary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {places.map((place, index) => (
                <div key={place.id} className="relative">
                  <div className="absolute -top-2 -left-2 z-10 bg-adventure-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <PlaceCard place={place} showAddButton={false} />
                </div>
              ))}
            </div>

            <div className="mt-12 bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Want to plan your own DFW adventure?
              </h3>
              <p className="text-gray-600 mb-6">
                Explore Dallas, Fort Worth, and Arlington destinations and create your perfect trip.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/browse" className="btn-primary">
                  Browse Destinations
                </Link>
                <Link to="/trips" className="btn-secondary">
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

export default Share;
