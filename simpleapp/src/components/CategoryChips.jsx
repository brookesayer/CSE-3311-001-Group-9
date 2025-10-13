const CategoryChips = ({ categories, selectedCategory, onCategorySelect }) => {
  // DFW-oriented category icons
  const categoryIcons = {
    All: '🌇',
    Museum: '🏛️',
    Park: '🌳',
    Landmark: '🗼',
    Stadium: '🏟️',
    Outdoors: '🌲',
    Family: '👨‍👩‍👧',
    Neighborhood: '🏘️',
    Nightlife: '🎵',
    Food: '🍴'
  };

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-6 sm:mb-8">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategorySelect(category)}
          type="button"
          aria-pressed={selectedCategory === category}
          aria-label={`Filter by ${category}`}
          className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-adventure-500 focus:ring-offset-2 ${
            selectedCategory === category
              ? 'bg-adventure-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-adventure-50 hover:border-adventure-300 shadow-sm'
          }`}
        >
          <span className="text-base sm:text-lg" aria-hidden="true">
            {categoryIcons[category] || '📍'}
          </span>
          <span>{category}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryChips;
