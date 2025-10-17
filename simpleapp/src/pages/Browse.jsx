import { useState, useEffect, useCallback, useRef } from 'react';
import CategoryChips from '../components/CategoryChips';
import PlaceCard from '../components/PlaceCard';
import SkeletonPlaceCard from '../components/SkeletonPlaceCard';
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  // Categories aligned with backend data
  const categories = ['All', 'restaurants', 'cafes', 'bars', 'nightlife', 'parks', 'museums', 'landmarks', 'outdoors', 'family', 'shopping', 'arts'];
  const [cities, setCities] = useState(['All', 'Dallas', 'Fort Worth', 'Arlington']);

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

  // Load cities from the backend when available
  useEffect(() => {
    async function loadCities() {
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/cities`, { signal: AbortSignal.timeout(4000) });
        if (resp.ok) {
          const rows = await resp.json();
          // rows: [{id, name, slug}] — map to names and de-dupe
          const names = Array.from(new Set((rows || []).map(r => r.name).filter(Boolean)));
          if (names.length) setCities(['All', ...names]);
        }
      } catch {}
    }
    loadCities();
  }, []);

  // Local post-filter to ensure consistency when appending pages
  const applyLocalFilters = useCallback((list) => {
    let out = [...list];
    const q = (debouncedSearch || '').toLowerCase();
    if (q) {
      out = out.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q) ||
        (p.neighborhood || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    if (selectedCity && selectedCity !== 'All') {
      out = out.filter(p => p.city === selectedCity);
    }
    if (selectedCategory && selectedCategory !== 'All') {
      out = out.filter(p => p.category === selectedCategory);
    }
    if (minRating > 0) {
      out = out.filter(p => (p.rating || 0) >= minRating);
    }
    if (maxPriceLevel < 4) {
      out = out.filter(p => (p.priceLevel || 1) <= maxPriceLevel);
    }
    // keep highest-rated first for consistency
    out.sort((a,b) => (b.rating||0) - (a.rating||0));
    return out;
  }, [debouncedSearch, selectedCity, selectedCategory, minRating, maxPriceLevel]);

  // Fetch places with filters
  const loadPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPlaces({
        search: debouncedSearch,
        city: selectedCity,
        category: selectedCategory,
        minRating: minRating,
        maxPriceLevel: maxPriceLevel,
        limit: pageSize,
        offset: (page - 1) * pageSize
      });
      // Append when loading subsequent pages (use functional updates to avoid stale state)
      if (page > 1) {
        setPlaces(prev => {
          const combined = [...prev, ...data];
          setFilteredPlaces(applyLocalFilters(combined));
          return combined;
        });
      } else {
        setPlaces(data);
        setFilteredPlaces(applyLocalFilters(data));
      }
      setHasMore(data.length === pageSize);
    } catch (err) {
      console.error('Error loading places:', err);
      setToast({ message: 'Error loading DFW places. Showing cached data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCity, selectedCategory, minRating, maxPriceLevel, page, pageSize, applyLocalFilters]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  // Reset paging and clear accumulated data when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setPlaces([]);
    setFilteredPlaces([]);
  }, [debouncedSearch, selectedCity, selectedCategory, minRating, maxPriceLevel]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loading) {
        setPage((p) => p + 1);
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

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

  const isInitialLoading = loading && filteredPlaces.length === 0;

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
              Explore North Texas Destinations
            </h1>
            <p className="text-lg sm:text-xl text-gray-600">
              Discover amazing places across Dallas, Fort Worth, Arlington, and nearby cities
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
            Showing <span className="font-semibold">{filteredPlaces.length}</span> loaded results
          </p>
          {activeTrip && (
            <p className="text-xs sm:text-sm text-adventure-600 font-medium">
              Adding to: <span className="font-bold">{activeTrip.name}</span>
            </p>
          )}
        </div>

        {/* Places Grid */}
        {isInitialLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: pageSize }).map((_, i) => (
              <SkeletonPlaceCard key={i} />
            ))}
          </div>
        ) : filteredPlaces.length === 0 ? (
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
            {/* Skeletons during load-more to avoid visual gaps */}
            {loading && filteredPlaces.length > 0 && (
              Array.from({ length: Math.min(8, pageSize / 2) }).map((_, i) => (
                <SkeletonPlaceCard key={`sk-${i}`} />
              ))
            )}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  );
};

export default Browse;
