import { Link } from 'react-router-dom';
import { StarIcon, MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';
import { PlusIcon } from '@heroicons/react/24/outline';

const PlaceCard = ({ place, onAddToTrip, showAddButton = true }) => {
  const normalizePriceLevel = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return Math.min(4, Math.max(1, Math.round(numeric)));
  };

  const getPriceLevelText = (level, display) => {
    if (display) return display;
    const normalized = normalizePriceLevel(level);
    return normalized ? '$'.repeat(normalized) : 'N/A';
  };

  const getPriceLevelColor = (level) => {
    const colors = ['text-green-600', 'text-yellow-600', 'text-orange-600', 'text-red-600'];
    const normalized = normalizePriceLevel(level);
    return normalized ? colors[normalized - 1] ?? 'text-gray-600' : 'text-gray-600';
  };

  return (
    <div className="card overflow-hidden group">
      <div className="relative overflow-hidden">
        <Link to={`/place/${place.id}`}>
          <img
            src={place.imageUrl || "/placeholder.jpg"}
            alt={place.name}
            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
          />

        </Link>
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
            {place.category}
          </span>
        </div>
        {showAddButton && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onAddToTrip?.(place);
            }}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm hover:bg-white p-2 rounded-full transition-all duration-200 transform hover:scale-110"
            title="Add to trip"
          >
            <PlusIcon className="h-4 w-4 text-adventure-600" />
          </button>
        )}
      </div>

      <div className="p-4">
        <Link to={`/place/${place.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-adventure-600 transition-colors">
            {place.name}
          </h3>
        </Link>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPinIcon className="h-4 w-4 mr-1" />
          <span className="text-sm">{place.city}</span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {place.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-gray-700 ml-1">
                {place.rating}
              </span>
            </div>
            <div className={`flex items-center ${getPriceLevelColor(place.priceLevel)}`}>
              <CurrencyDollarIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {getPriceLevelText(place.priceLevel, place.priceDisplay)}
              </span>
            </div>
          </div>

          <Link
            to={`/place/${place.id}`}
            className="text-adventure-600 hover:text-adventure-700 font-medium text-sm transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;