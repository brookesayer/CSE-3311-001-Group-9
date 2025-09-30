import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import PlaceCard from './PlaceCard';
import Toast from './Toast';

const TripPlanner = () => {
  const [trips, setTrips] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [newTripName, setNewTripName] = useState('');
  const [newTripDescription, setNewTripDescription] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = () => {
    const savedTrips = storage.getTrips();
    setTrips(savedTrips);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleCreateTrip = (e) => {
    e.preventDefault();
    if (!newTripName.trim()) return;

    const newTrip = storage.createTrip({
      name: newTripName,
      description: newTripDescription
    });

    setTrips([...trips, newTrip]);
    setNewTripName('');
    setNewTripDescription('');
    setShowCreateForm(false);
    showToast('Trip created successfully!');
  };

  const handleEditTrip = (trip) => {
    setEditingTrip(trip.id);
    setNewTripName(trip.name);
    setNewTripDescription(trip.description);
  };

  const handleUpdateTrip = (e) => {
    e.preventDefault();
    if (!newTripName.trim()) return;

    const updatedTrip = storage.updateTrip(editingTrip, {
      name: newTripName,
      description: newTripDescription
    });

    if (updatedTrip) {
      setTrips(trips.map(trip =>
        trip.id === editingTrip ? updatedTrip : trip
      ));
      setEditingTrip(null);
      setNewTripName('');
      setNewTripDescription('');
      showToast('Trip updated successfully!');
    }
  };

  const handleDeleteTrip = (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      storage.deleteTrip(tripId);
      setTrips(trips.filter(trip => trip.id !== tripId));
      showToast('Trip deleted successfully!');
    }
  };

  const handleRemovePlace = (tripId, placeId) => {
    if (storage.removePlaceFromTrip(tripId, placeId)) {
      loadTrips();
      showToast('Place removed from trip!');
    }
  };

  const handleExportTrips = () => {
    storage.exportTrips();
    showToast('Trips exported successfully!');
  };

  const handleImportTrips = (event) => {
    const file = event.target.files[0];
    if (file) {
      storage.importTrips(file)
        .then((count) => {
          loadTrips();
          showToast(`${count} trips imported successfully!`);
        })
        .catch((error) => {
          showToast('Error importing trips: ' + error.message, 'error');
        });
    }
    event.target.value = '';
  };

  const cancelEditing = () => {
    setEditingTrip(null);
    setShowCreateForm(false);
    setNewTripName('');
    setNewTripDescription('');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-600 mt-1">Plan and organize your adventures</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Trip</span>
          </button>

          <button
            onClick={handleExportTrips}
            className="btn-secondary flex items-center space-x-2"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>Export</span>
          </button>

          <label className="btn-secondary flex items-center space-x-2 cursor-pointer">
            <DocumentArrowUpIcon className="h-5 w-5" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportTrips}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {(showCreateForm || editingTrip) && (
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingTrip ? 'Edit Trip' : 'Create New Trip'}
          </h2>
          <form onSubmit={editingTrip ? handleUpdateTrip : handleCreateTrip}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trip Name
                </label>
                <input
                  type="text"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  placeholder="Enter trip name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newTripDescription}
                  onChange={(e) => setNewTripDescription(e.target.value)}
                  placeholder="Brief description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                {editingTrip ? 'Update Trip' : 'Create Trip'}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {trips.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No trips yet</h3>
          <p className="text-gray-600 mb-6">Create your first trip to start planning your adventure!</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {trips.map((trip) => (
            <div key={trip.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{trip.name}</h2>
                  {trip.description && (
                    <p className="text-gray-600 mt-1">{trip.description}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span>{trip.places.length} destinations</span>
                    <span className="mx-2">•</span>
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>Created {new Date(trip.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditTrip(trip)}
                    className="p-2 text-gray-600 hover:text-adventure-600 transition-colors"
                    title="Edit trip"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTrip(trip.id)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="Delete trip"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {trip.places.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-2">No destinations added yet</p>
                  <p className="text-sm text-gray-500">
                    Browse destinations and add them to this trip
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trip.places.map((place) => (
                    <div key={place.id} className="relative">
                      <PlaceCard place={place} showAddButton={false} />
                      <button
                        onClick={() => handleRemovePlace(trip.id, place.id)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors"
                        title="Remove from trip"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripPlanner;