import { useState, useEffect, useCallback } from 'react';
import CategoryChips from '../components/CategoryChips';
import PlaceCard from '../components/PlaceCard';
import Toast from '../components/Toast';
import { storage } from '../lib/storage';
import { getPlaces } from '../lib/api';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

const Browse = () => {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [maxPriceLevel, setMaxPriceLevel] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTrip, setActiveTrip] = useState(null);

  // DFW Categories
  const categories = ['All', 'Museum', 'Park', 'Landmark', 'Stadium', 'Outdoors', 'Family', 'Neighborhood', 'Nightlife', 'Food'];
  const cities = ['All', 'Dallas', 'Fort Worth', 'Arlington'];

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load active trip
  useEffect(() => {
    const trip = storage.getActiveTrip();
    setActiveTrip(trip);
  }, []);

  // Fetch places with filters
  const loadPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPlaces({
        search: debouncedSearch,
        city: selectedCity,
        category: selectedCategory,
        minRating: minRating,
        maxPriceLevel: maxPriceLevel
      });
      setPlaces(data);
      setFilteredPlaces(data);
    } catch (err) {
      console.error('Error loading places:', err);
      setToast({ message: 'Error loading DFW places. Showing cached data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCity, selectedCategory, minRating, maxPriceLevel]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  const handleAddToTrip = useCallback((place) => {
    const currentActiveTrip = storage.getActiveTrip();

    if (!currentActiveTrip) {
      setToast({
        message: 'Create or select a trip first (Trips → New Trip).',
        type: 'warning'
      });
      return;
    }

    const success = storage.addPlaceToTrip(currentActiveTrip.id, place);

    if (success) {
      setToast({
        message: `${place.name} added to ${currentActiveTrip.name}!`,
        type: 'success'
      });
      // Update active trip state
      setActiveTrip(storage.getActiveTrip());
    } else {
      setToast({
        message: `${place.name} is already in your trip!`,
        type: 'warning'
      });
    }
  }, []);

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedCity('All');
    setMinRating(0);
    setMaxPriceLevel(4);
    setSearchQuery('');
  };

  if (loading && filteredPlaces.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-adventure-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading DFW destinations...</p>
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

      {/* Header Section */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Explore DFW Destinations
            </h1>
            <p className="text-lg sm:text-xl text-gray-600">
              Discover amazing places across Dallas, Fort Worth, and Arlington
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="relative flex-1 max-w-full lg:max-w-lg">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search destinations, neighborhoods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500 transition-shadow"
                aria-label="Search DFW destinations"
              />
            </div>

            {/* City Selector */}
            <div className="flex gap-2">
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  type="button"
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedCity === city
                      ? 'bg-adventure-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                  aria-pressed={selectedCity === city}
                >
                  {city}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              type="button"
              aria-expanded={showFilters}
              className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="rating-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    id="rating-filter"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500"
                  >
                    <option value={0}>All Ratings</option>
                    <option value={4.5}>4.5+ Stars</option>
                    <option value={4.0}>4.0+ Stars</option>
                    <option value={3.5}>3.5+ Stars</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="price-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Price Level
                  </label>
                  <select
                    id="price-filter"
                    value={maxPriceLevel}
                    onChange={(e) => setMaxPriceLevel(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500"
                  >
                    <option value={4}>All Price Levels</option>
                    <option value={1}>$ (Budget)</option>
                    <option value={2}>$$ (Moderate)</option>
                    <option value={3}>$$$ (Expensive)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    type="button"
                    className="w-full btn-secondary"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Category Chips */}
        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600 text-sm sm:text-base">
            Showing <span className="font-semibold">{filteredPlaces.length}</span> of{' '}
            <span className="font-semibold">{places.length}</span> DFW places
          </p>
          {activeTrip && (
            <p className="text-xs sm:text-sm text-adventure-600 font-medium">
              Adding to: <span className="font-bold">{activeTrip.name}</span>
            </p>
          )}
        </div>

        {/* Places Grid */}
        {filteredPlaces.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No DFW destinations found</p>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search query</p>
            <button onClick={clearFilters} type="button" className="btn-primary">
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
