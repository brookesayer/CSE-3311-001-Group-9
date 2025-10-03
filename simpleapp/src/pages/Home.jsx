import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import CategoryChips from '../components/CategoryChips';
import PlaceCard from '../components/PlaceCard';
import Toast from '../components/Toast';
import { storage } from '../lib/storage';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { fetchPlaces } from '../lib/api';

const Home = () => {
  const [allPlaces, setAllPlaces] = useState([]);
  const [featuredPlaces, setFeaturedPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Beach', 'Mountain', 'Historical', 'Nature', 'Wildlife'];

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPlaces();
        setAllPlaces(data);

        // choose top 6 by rating
        const topRated = [...data].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 6);
        setFeaturedPlaces(topRated);
      } catch (e) {
        console.error("Failed to load places", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredPlaces = selectedCategory === 'All'
    ? featuredPlaces
    : featuredPlaces.filter(place => place.category === selectedCategory);

  const handleAddToTrip = (place) => {
    const trips = storage.getTrips();
    if (trips.length === 0) {
      setToast({ message: 'Create a trip first to add destinations!', type: 'warning' });
      return;
    }

    const latestTrip = trips[trips.length - 1];
    const success = storage.addPlaceToTrip(latestTrip.id, place);

    if (success) {
      setToast({ message: `${place.name} added to ${latestTrip.name}!`, type: 'success' });
    } else {
      setToast({ message: `${place.name} is already in your trip!`, type: 'warning' });
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading featured destinations…</div>;
  }

  return (
    <div className="min-h-screen">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <HeroCarousel />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Featured Destinations
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the world's most incredible places, from pristine beaches to majestic mountains.
            Start planning your next adventure today.
          </p>
        </div>

        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onAddToTrip={handleAddToTrip}
            />
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/browse"
            className="inline-flex items-center space-x-2 btn-primary text-lg px-8 py-3"
          >
            <span>Explore All Destinations</span>
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;