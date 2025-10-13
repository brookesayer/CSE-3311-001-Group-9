import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import CategoryChips from '../components/CategoryChips';
import PlaceCard from '../components/PlaceCard';
import Toast from '../components/Toast';
import { storage } from '../lib/storage';
import { fetchPlaces } from '../lib/api';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const Home = () => {
  const [featuredPlaces, setFeaturedPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Beach', 'Mountain', 'Historical', 'Nature', 'Wildlife'];

  useEffect(() => {
    const loadFeaturedPlaces = async () => {
      try {
        setLoading(true);
        const data = await fetchPlaces({ limit: 100 });
        // Sort by rating if available, otherwise just show first 6
        const topPlaces = data
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 6);
        setFeaturedPlaces(topPlaces);
      } catch (err) {
        console.error('Failed to load featured places:', err);
        setFeaturedPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedPlaces();
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
            Featured DFW Destinations
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the best of Dallas, Fort Worth, and Arlington. From world-class museums to
            urban parks, vibrant neighborhoods to iconic landmarks. Start planning your North Texas adventure today.
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

      <div className="bg-adventure-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Plan Your Perfect DFW Trip
              </h2>
              <p className="text-xl text-adventure-100 mb-8">
                Create custom itineraries across Dallas, Fort Worth, and Arlington.
                Save your favorite North Texas destinations and share your plans with friends.
                Make the most of your Metroplex experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/trips" className="btn-primary bg-white text-adventure-900 hover:bg-gray-100">
                  Start Planning
                </Link>
                <Link to="/browse" className="btn-secondary border-white text-white hover:bg-white hover:text-adventure-900">
                  Browse DFW
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Travel planning"
                className="rounded-xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-adventure-900/20 to-transparent rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;