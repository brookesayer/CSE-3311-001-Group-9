import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { useAuth } from '../auth/AuthContext';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ShareIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import PlaceCard from './PlaceCard';
import Toast from './Toast';
import TripShareModal from './TripShareModal';

const TripPlanner = () => {
  const { isAuthenticated } = useAuth();
  const [trips, setTrips] = useState([]);
  const [activeTrip, setActiveTripState] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [newTripName, setNewTripName] = useState('');
  const [newTripDescription, setNewTripDescription] = useState('');
  const [toast, setToast] = useState(null);
  const [shareModalTrip, setShareModalTrip] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadTripsFromBackend();
    } else {
      loadTrips();
    }
    const active = storage.getActiveTrip();
    setActiveTripState(active);
  }, [isAuthenticated]);

  const loadTrips = () => {
    const savedTrips = storage.getTrips();
    setTrips(savedTrips);
  };

  const loadTripsFromBackend = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        loadTrips();
        return;
      }

      const response = await fetch('http://localhost:8000/api/trips/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTrips(data);
      } else {
        loadTrips();
      }
    } catch (error) {
      console.error('Error loading trips from backend:', error);
      loadTrips();
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!newTripName.trim()) return;

    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:8000/api/trips/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newTripName,
            description: newTripDescription,
            visibility: 'private'
          })
        });

        if (response.ok) {
          const newTrip = await response.json();
          setTrips([...trips, newTrip]);
          setNewTripName('');
          setNewTripDescription('');
          setShowCreateForm(false);

          if (trips.length === 0) {
            handleSetActiveTrip(newTrip.id);
          }

          showToast('Trip created successfully!');
        } else {
          showToast('Failed to create trip', 'error');
        }
      } catch (error) {
        console.error('Error creating trip:', error);
        showToast('Failed to create trip', 'error');
      }
    } else {
      const newTrip = storage.createTrip({
        name: newTripName,
        description: newTripDescription
      });

      setTrips([...trips, newTrip]);
      setNewTripName('');
      setNewTripDescription('');
      setShowCreateForm(false);

      if (trips.length === 0) {
        handleSetActiveTrip(newTrip.id);
      }

      showToast('Trip created successfully!');
    }
  };

  const handleSetActiveTrip = (tripId) => {
    storage.setActiveTrip(tripId);
    const trip = trips.find(t => t.id === tripId);
    setActiveTripState(trip);
    showToast(`"${trip.name}" is now your active trip!`, 'success');
  };

  const handleEditTrip = (trip) => {
    setEditingTrip(trip.id);
    setNewTripName(trip.name);
    setNewTripDescription(trip.description);
  };

  const handleUpdateTrip = async (e) => {
    e.preventDefault();
    if (!newTripName.trim()) return;

    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:8000/api/trips/${editingTrip}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newTripName,
            description: newTripDescription
          })
        });

        if (response.ok) {
          const updatedTrip = await response.json();
          setTrips(trips.map(trip =>
            trip.id === editingTrip ? updatedTrip : trip
          ));

          if (activeTrip && activeTrip.id === editingTrip) {
            setActiveTripState(updatedTrip);
          }

          setEditingTrip(null);
          setNewTripName('');
          setNewTripDescription('');
          showToast('Trip updated successfully!');
        } else {
          showToast('Failed to update trip', 'error');
        }
      } catch (error) {
        console.error('Error updating trip:', error);
        showToast('Failed to update trip', 'error');
      }
    } else {
      const updatedTrip = storage.updateTrip(editingTrip, {
        name: newTripName,
        description: newTripDescription
      });

      if (updatedTrip) {
        setTrips(trips.map(trip =>
          trip.id === editingTrip ? updatedTrip : trip
        ));

        if (activeTrip && activeTrip.id === editingTrip) {
          setActiveTripState(updatedTrip);
        }

        setEditingTrip(null);
        setNewTripName('');
        setNewTripDescription('');
        showToast('Trip updated successfully!');
      }
    }
  };

  const removeTripLocally = (tripId, message = 'Trip deleted successfully!') => {
    storage.deleteTrip(tripId);
    const filtered = trips.filter(trip => trip.id !== tripId);
    setTrips(filtered);

    if (activeTrip && activeTrip.id === tripId) {
      storage.setActiveTrip(null);
      setActiveTripState(null);
    }

    showToast(message);
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;

    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:8000/api/trips/${tripId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setTrips(trips.filter(trip => trip.id !== tripId));

          if (activeTrip && activeTrip.id === tripId) {
            storage.setActiveTrip(null);
            setActiveTripState(null);
          }

          showToast('Trip deleted successfully!');
        } else if (response.status === 403 || response.status === 404) {
          // If the backend rejects (likely ownership mismatch), clean up local copy
          removeTripLocally(
            tripId,
            'Trip was not owned by this account; removed local copy instead.'
          );
        } else {
          showToast('Failed to delete trip', 'error');
        }
      } catch (error) {
        console.error('Error deleting trip:', error);
        showToast('Failed to delete trip', 'error');
      }
    } else {
      removeTripLocally(tripId);
    }
  };

  const handleRemovePlace = async (tripId, placeId) => {
    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:8000/api/trips/${tripId}/places/${placeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          loadTripsFromBackend();
          if (activeTrip && activeTrip.id === tripId) {
            const updatedTrip = trips.find(t => t.id === tripId);
            if (updatedTrip) {
              setActiveTripState({
                ...updatedTrip,
                places: updatedTrip.places.filter(p => p.id !== placeId)
              });
            }
          }
          showToast('Place removed from trip!');
        } else {
          showToast('Failed to remove place', 'error');
        }
      } catch (error) {
        console.error('Error removing place:', error);
        showToast('Failed to remove place', 'error');
      }
    } else {
      if (storage.removePlaceFromTrip(tripId, placeId)) {
        loadTrips();
        if (activeTrip && activeTrip.id === tripId) {
          setActiveTripState(storage.getActiveTrip());
        }
        showToast('Place removed from trip!');
      }
    }
  };

  const handleOpenShareModal = (trip) => {
    setShareModalTrip(trip);
    setIsShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setShareModalTrip(null);
  };

  const handleShareUpdate = (updatedTrip) => {
    setTrips(trips.map(trip =>
      trip.id === updatedTrip.id ? updatedTrip : trip
    ));
    
    if (activeTrip && activeTrip.id === updatedTrip.id) {
      setActiveTripState(updatedTrip);
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

  const getVisibilityBadge = (visibility) => {
    const badges = {
      private: { text: 'Private', class: 'bg-gray-100 text-gray-800' },
      unlisted: { text: 'Unlisted', class: 'bg-blue-100 text-blue-800' },
      public: { text: 'Public', class: 'bg-green-100 text-green-800' }
    };
    const badge = badges[visibility] || badges.private;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
        {badge.text}
      </span>
    );
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

      <TripShareModal
        trip={shareModalTrip}
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        onUpdate={handleShareUpdate}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My DFW Trips</h1>
          <p className="text-gray-600 mt-1">Plan and organize your North Texas adventures</p>
          {activeTrip && (
            <p className="text-sm text-adventure-600 font-medium mt-2">
              Active Trip: <span className="font-bold">{activeTrip.name}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Trip</span>
          </button>

          {!isAuthenticated && (
            <>
              <button
                onClick={handleExportTrips}
                className="btn-secondary flex items-center space-x-2"
                disabled={trips.length === 0}
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
            </>
          )}
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
                <label htmlFor="trip-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Trip Name
                </label>
                <input
                  id="trip-name"
                  type="text"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  placeholder="e.g., Weekend in Downtown Dallas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="trip-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  id="trip-description"
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
          <p className="text-gray-600 mb-6">Create your first DFW trip to start planning your adventure!</p>
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
            <div
              key={trip.id}
              className={`card p-6 ${activeTrip && activeTrip.id === trip.id ? 'ring-2 ring-adventure-500' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{trip.name}</h2>
                    {activeTrip && activeTrip.id === trip.id && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-adventure-100 text-adventure-800">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Active
                      </span>
                    )}
                    {isAuthenticated && trip.visibility && getVisibilityBadge(trip.visibility)}
                  </div>
                  {trip.description && (
                    <p className="text-gray-600 mt-1">{trip.description}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500 mt-2 flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {trip.places?.length || 0} destinations
                    </span>
                    <span className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Created {new Date(trip.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {(!activeTrip || activeTrip.id !== trip.id) && (
                    <button
                      onClick={() => handleSetActiveTrip(trip.id)}
                      className="p-2 text-gray-600 hover:text-adventure-600 transition-colors"
                      title="Set as active trip"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                  {isAuthenticated && (
                    <button
                      onClick={() => handleOpenShareModal(trip)}
                      className="p-2 text-gray-600 hover:text-adventure-600 transition-colors"
                      title="Share trip"
                    >
                      <ShareIcon className="h-5 w-5" />
                    </button>
                  )}
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

              {(!trip.places || trip.places.length === 0) ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-2">No destinations added yet</p>
                  <p className="text-sm text-gray-500">
                    {activeTrip && activeTrip.id === trip.id
                      ? 'Browse destinations and click "Add to Trip"'
                      : 'Set this as your active trip to start adding destinations'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trip.places.map((place) => (
                    <div key={place.id} className="relative">
                      <PlaceCard place={place} showAddButton={false} />
                      <button
                        onClick={() => handleRemovePlace(trip.id, place.id)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition-colors shadow-lg"
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
