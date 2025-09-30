import { useState, useEffect } from 'react';
import CategoryChips from '../components/CategoryChips';
import PlaceCard from '../components/PlaceCard';
import Toast from '../components/Toast';
import { storage } from '../lib/storage';
import placesData from '../data/places.json';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

const Browse = () => {
  const [places, setPlaces] = useState(placesData);
  const [filteredPlaces, setFilteredPlaces] = useState(placesData);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');
  const [selectedPriceLevel, setSelectedPriceLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);

  const categories = ['All', ...new Set(placesData.map(place => place.category))];
  const ratings = ['All', '4.5+', '4.0+', '3.5+'];
  const priceLevels = ['All', '1', '2', '3', '4'];

  useEffect(() => {
    let filtered = places;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(place => place.category === selectedCategory);
    }

    if (selectedRating !== 'All') {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter(place => place.rating >= minRating);
    }

    if (selectedPriceLevel !== 'All') {
      const priceLevel = parseInt(selectedPriceLevel);
      filtered = filtered.filter(place => place.priceLevel === priceLevel);
    }

    if (searchQuery) {
      filtered = filtered.filter(place =>
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPlaces(filtered);
  }, [places, selectedCategory, selectedRating, selectedPriceLevel, searchQuery]);

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

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedRating('All');
    setSelectedPriceLevel('All');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Destinations
            </h1>
            <p className="text-xl text-gray-600">
              Discover amazing places around the world
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="relative flex-1 max-w-lg">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <select
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500"
                  >
                    {ratings.map(rating => (
                      <option key={rating} value={rating}>{rating}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Level
                  </label>
                  <select
                    value={selectedPriceLevel}
                    onChange={(e) => setSelectedPriceLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500"
                  >
                    {priceLevels.map(level => (
                      <option key={level} value={level}>
                        {level === 'All' ? 'All' : '$'.repeat(parseInt(level))}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full btn-secondary"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Showing {filteredPlaces.length} of {places.length} destinations
          </p>
        </div>

        {filteredPlaces.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No destinations found</p>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search query</p>
            <button onClick={clearFilters} className="btn-primary">
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onAddToTrip={handleAddToTrip}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;