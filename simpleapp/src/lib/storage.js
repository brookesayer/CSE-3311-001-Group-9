// Helper to get current user ID from auth token
const getCurrentUserId = () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    // Decode JWT token to get user ID
    // JWT format: header.payload.signature
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.user_id || decoded.sub || decoded.id || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Generate user-specific storage keys
const getUserStorageKey = () => {
  const userId = getCurrentUserId();
  if (!userId) {
    // Fallback to a guest key if no user is logged in
    return 'travel_app_trips_guest';
  }
  return `travel_app_trips_user_${userId}`;
};

const getUserActiveTripKey = () => {
  const userId = getCurrentUserId();
  if (!userId) {
    return 'travel_app_active_trip_guest';
  }
  return `travel_app_active_trip_user_${userId}`;
};

export const storage = {
  getTrips: () => {
    try {
      const storageKey = getUserStorageKey();
      const trips = localStorage.getItem(storageKey);
      return trips ? JSON.parse(trips) : [];
    } catch (error) {
      console.error('Error loading trips from localStorage:', error);
      return [];
    }
  },

  getActiveTrip: () => {
    try {
      const activeTripKey = getUserActiveTripKey();
      const activeTripId = localStorage.getItem(activeTripKey);
      if (!activeTripId) return null;

      const trips = storage.getTrips();
      return trips.find(trip => trip.id === activeTripId) || null;
    } catch (error) {
      console.error('Error loading active trip:', error);
      return null;
    }
  },

  setActiveTrip: (tripId) => {
    try {
      const activeTripKey = getUserActiveTripKey();
      if (tripId) {
        localStorage.setItem(activeTripKey, tripId);
      } else {
        localStorage.removeItem(activeTripKey);
      }
      return true;
    } catch (error) {
      console.error('Error setting active trip:', error);
      return false;
    }
  },

  saveTrips: (trips) => {
    try {
      const storageKey = getUserStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(trips));
      return true;
    } catch (error) {
      console.error('Error saving trips to localStorage:', error);
      return false;
    }
  },

  createTrip: (tripData) => {
    const trips = storage.getTrips();
    const userId = getCurrentUserId();
    const newTrip = {
      id: `${userId || 'guest'}-${Date.now()}`,
      name: tripData.name || 'Untitled Trip',
      description: tripData.description || '',
      places: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: userId // Store the user ID with the trip
    };
    trips.push(newTrip);
    storage.saveTrips(trips);

    // Auto-set as active trip if it's the first trip
    if (trips.length === 1) {
      storage.setActiveTrip(newTrip.id);
    }

    return newTrip;
  },

  updateTrip: (tripId, updates) => {
    const trips = storage.getTrips();
    const tripIndex = trips.findIndex(trip => trip.id === tripId);
    if (tripIndex !== -1) {
      trips[tripIndex] = {
        ...trips[tripIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      storage.saveTrips(trips);
      return trips[tripIndex];
    }
    return null;
  },

  deleteTrip: (tripId) => {
    const trips = storage.getTrips();
    const filteredTrips = trips.filter(trip => trip.id !== tripId);
    storage.saveTrips(filteredTrips);
    return true;
  },

  addPlaceToTrip: (tripId, place) => {
    const trips = storage.getTrips();
    const trip = trips.find(trip => trip.id === tripId);
    if (trip) {
      const isAlreadyAdded = trip.places.some(p => p.id === place.id);
      if (!isAlreadyAdded) {
        trip.places.push(place);
        trip.updatedAt = new Date().toISOString();
        storage.saveTrips(trips);
        return true;
      }
    }
    return false;
  },

  removePlaceFromTrip: (tripId, placeId) => {
    const trips = storage.getTrips();
    const trip = trips.find(trip => trip.id === tripId);
    if (trip) {
      trip.places = trip.places.filter(place => place.id !== placeId);
      trip.updatedAt = new Date().toISOString();
      storage.saveTrips(trips);
      return true;
    }
    return false;
  },

  reorderPlacesInTrip: (tripId, reorderedPlaces) => {
    const trips = storage.getTrips();
    const trip = trips.find(trip => trip.id === tripId);
    if (trip) {
      trip.places = reorderedPlaces;
      trip.updatedAt = new Date().toISOString();
      storage.saveTrips(trips);
      return true;
    }
    return false;
  },

  exportTrips: () => {
    const trips = storage.getTrips();
    const dataStr = JSON.stringify(trips, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `travel-trips-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importTrips: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedTrips = JSON.parse(e.target.result);
          if (Array.isArray(importedTrips)) {
            const existingTrips = storage.getTrips();
            const userId = getCurrentUserId();
            
            // Add userId to imported trips if they don't have one
            const tripsWithUserId = importedTrips.map(trip => ({
              ...trip,
              userId: trip.userId || userId
            }));
            
            const mergedTrips = [...existingTrips, ...tripsWithUserId];
            storage.saveTrips(mergedTrips);
            resolve(importedTrips.length);
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  },

  // Helper function to clear all user data on logout
  clearUserData: () => {
    const activeTripKey = getUserActiveTripKey();
    const storageKey = getUserStorageKey();
    localStorage.removeItem(activeTripKey);
    localStorage.removeItem(storageKey);
  }
};