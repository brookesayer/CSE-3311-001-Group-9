const STORAGE_KEY = 'travel_app_trips';

export const storage = {
  getTrips: () => {
    try {
      const trips = localStorage.getItem(STORAGE_KEY);
      return trips ? JSON.parse(trips) : [];
    } catch (error) {
      console.error('Error loading trips from localStorage:', error);
      return [];
    }
  },

  saveTrips: (trips) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
      return true;
    } catch (error) {
      console.error('Error saving trips to localStorage:', error);
      return false;
    }
  },

  createTrip: (tripData) => {
    const trips = storage.getTrips();
    const newTrip = {
      id: Date.now().toString(),
      name: tripData.name || 'Untitled Trip',
      description: tripData.description || '',
      places: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    trips.push(newTrip);
    storage.saveTrips(trips);
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
            const mergedTrips = [...existingTrips, ...importedTrips];
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
  }
};