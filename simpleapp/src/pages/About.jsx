import { GlobeAltIcon, HeartIcon, CameraIcon, MapIcon } from '@heroicons/react/24/outline';

const About = () => {
  const features = [
    {
      icon: GlobeAltIcon,
      title: 'Discover Amazing Places',
      description: 'Explore curated destinations from around the world, from pristine beaches to majestic mountains.'
    },
    {
      icon: MapIcon,
      title: 'Plan Your Perfect Trip',
      description: 'Create custom itineraries, organize your favorite places, and share your travel plans with friends.'
    },
    {
      icon: CameraIcon,
      title: 'Stunning Photography',
      description: 'Browse our beautiful gallery featuring breathtaking images that inspire your next adventure.'
    },
    {
      icon: HeartIcon,
      title: 'Save Your Favorites',
      description: 'Build your personal collection of dream destinations and never lose track of places you want to visit.'
    }
  ];

  const techStack = [
    { name: 'React', description: 'Modern JavaScript library for building user interfaces' },
    { name: 'Vite', description: 'Lightning-fast build tool and development server' },
    { name: 'Tailwind CSS', description: 'Utility-first CSS framework for rapid styling' },
    { name: 'React Router', description: 'Declarative routing for React applications' },
    { name: 'Swiper.js', description: 'Modern mobile touch slider with hardware accelerated transitions' },
    { name: 'Framer Motion', description: 'Production-ready motion library for React' },
    { name: 'Heroicons', description: 'Beautiful hand-crafted SVG icons by the makers of Tailwind CSS' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-adventure-600 to-adventure-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GlobeAltIcon className="h-16 w-16 mx-auto mb-6 text-adventure-200" />
          <h1 className="text-5xl font-bold mb-6">About Travel Discovery</h1>
          <p className="text-xl text-adventure-100 max-w-3xl mx-auto leading-relaxed">
            Travel Discovery is a modern web application designed to inspire and help you plan
            your next adventure. Built with cutting-edge web technologies, it showcases the
            beauty of destinations around the world while providing powerful trip planning tools.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Features</h2>
          <p className="text-xl text-gray-600">
            Everything you need to discover and plan your perfect trip
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="bg-adventure-100 p-3 rounded-lg">
                  <feature.icon className="h-8 w-8 text-adventure-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built With Modern Technology</h2>
            <p className="text-xl text-gray-600">
              This project demonstrates modern web development practices and technologies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {techStack.map((tech, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {tech.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {tech.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Start Exploring?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover amazing destinations, create memorable trips, and start planning your next adventure today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/browse" className="btn-primary text-lg px-8 py-3">
              Browse Destinations
            </a>
            <a href="/trips" className="btn-secondary text-lg px-8 py-3">
              Plan a Trip
            </a>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Project Information</h3>
          <p className="text-gray-300 mb-6">
            This is a demo project showcasing modern React development with Vite and Tailwind CSS.
            All destination data is fictional and for demonstration purposes only.
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-400">
            <span>React + Vite</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Responsive Design</span>
            <span>•</span>
            <span>Modern UI/UX</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;