import { GlobeAltIcon } from '@heroicons/react/24/outline';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <GlobeAltIcon className="h-8 w-8 text-adventure-400" />
              <span className="text-2xl font-bold">Travel Discovery</span>
            </div>
            <p className="text-gray-300 mb-4">
              Discover amazing destinations and plan your perfect adventure.
              From pristine beaches to majestic mountains, we help you find
              your next unforgettable journey.
            </p>
            <p className="text-sm text-gray-400">
              Built with React, Vite, and TailwindCSS
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Explore</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="/browse" className="hover:text-adventure-400 transition-colors">Browse Destinations</a></li>
              <li><a href="/gallery" className="hover:text-adventure-400 transition-colors">Photo Gallery</a></li>
              <li><a href="/trips" className="hover:text-adventure-400 transition-colors">Plan Your Trip</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-gray-300">
              <li><span className="hover:text-adventure-400 transition-colors cursor-pointer">Beaches</span></li>
              <li><span className="hover:text-adventure-400 transition-colors cursor-pointer">Mountains</span></li>
              <li><span className="hover:text-adventure-400 transition-colors cursor-pointer">Historical Sites</span></li>
              <li><span className="hover:text-adventure-400 transition-colors cursor-pointer">Wildlife</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 Travel Discovery. Created as a demo project showcasing modern web development.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;