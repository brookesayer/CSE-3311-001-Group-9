const CategoryChips = ({ categories, selectedCategory, onCategorySelect }) => {
  const categoryIcons = {
    All: '🌍',
    Beach: '🏖️',
    Mountain: '🏔️',
    Historical: '🏛️',
    Nature: '🌿',
    Wildlife: '🦁',
    City: '🏙️',
    Desert: '🏜️'
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center mb-8">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategorySelect(category)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
            selectedCategory === category
              ? 'bg-adventure-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-adventure-50 hover:border-adventure-300'
          }`}
        >
          <span className="text-lg">{categoryIcons[category] || '📍'}</span>
          <span>{category}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryChips;