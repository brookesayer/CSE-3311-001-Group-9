import { XMarkIcon, CheckCircleIcon, MapPinIcon } from '@heroicons/react/24/outline';

const TripSelectorModal = ({ trips, activeTrip, onSelect, onClose, placeName }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add to Trip</h2>
            {placeName && (
              <p className="text-sm text-gray-600 mt-1">Select a trip for "{placeName}"</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Trip List */}
        <div className="p-6">
          {trips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You don't have any trips yet.</p>
              <button
                onClick={onClose}
                className="btn-primary"
              >
                Create Your First Trip
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => {
                const isActive = activeTrip && activeTrip.id === trip.id;
                
                return (
                  <button
                    key={trip.id}
                    onClick={() => onSelect(trip.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-adventure-500 hover:bg-adventure-50 ${
                      isActive
                        ? 'border-adventure-500 bg-adventure-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {trip.name}
                          </h3>
                          {isActive && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-adventure-100 text-adventure-800">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          )}
                        </div>
                        {trip.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {trip.description}
                          </p>
                        )}
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          <span>{trip.places?.length || 0} destinations</span>
                        </div>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-adventure-100 flex items-center justify-center">
                          <span className="text-adventure-700 font-semibold text-sm">
                            +
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripSelectorModal;