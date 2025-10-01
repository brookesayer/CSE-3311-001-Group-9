import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { fetchPlaces } from '../lib/api';   // <-- new import

const Gallery = () => {
  const [places, setPlaces] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPlaces();
        setPlaces(data);
      } catch (e) {
        console.error("Failed to load places", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = ['All', ...new Set(places.map(place => place.category))];

  const filteredImages = selectedCategory === 'All'
    ? places
    : places.filter(place => place.category === selectedCategory);

  const openLightbox = (place, index) => {
    setSelectedImage({ place, index });
  };

  const closeLightbox = () => setSelectedImage(null);

  const navigateImage = (direction) => {
    if (!selectedImage) return;

    const currentIndex = selectedImage.index;
    let newIndex;

    if (direction === 'next') {
      newIndex = currentIndex + 1 >= filteredImages.length ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex - 1 < 0 ? filteredImages.length - 1 : currentIndex - 1;
    }

    setSelectedImage({ place: filteredImages[newIndex], index: newIndex });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') navigateImage('next');
    if (e.key === 'ArrowLeft') navigateImage('prev');
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading gallery…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Adventure Gallery</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Immerse yourself in breathtaking photography from around the world.
            Each image tells a story of adventure, culture, and natural beauty.
          </p>
        </div>

        {/* category filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                selectedCategory === category
                  ? 'bg-adventure-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-adventure-50 hover:border-adventure-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* gallery grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {filteredImages.map((place, index) => (
              <motion.div
                key={place.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="group relative overflow-hidden rounded-xl cursor-pointer"
                onClick={() => openLightbox(place, index)}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={place.photo_url || place.imageUrl || "/placeholder.jpg"}
                    alt={place.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-semibold text-lg">{place.name}</h3>
                    <p className="text-sm text-gray-200">{place.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No images found for this category.</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <div className="relative max-w-5xl max-h-[90vh] mx-4">
              <motion.img
                key={selectedImage.place.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                src={selectedImage.place.photo_url || selectedImage.place.imageUrl || "/placeholder.jpg"}
                alt={selectedImage.place.name}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />

              <div className="absolute bottom-4 left-4 text-white bg-black/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="text-xl font-bold">{selectedImage.place.name}</h3>
                <p className="text-gray-200">{selectedImage.place.city}</p>
                <p className="text-sm text-gray-300 mt-1">
                  {selectedImage.index + 1} of {filteredImages.length}
                </p>
              </div>

              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage('prev');
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all duration-200"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage('next');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all duration-200"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
