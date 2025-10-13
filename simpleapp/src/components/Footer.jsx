import { BuildingOffice2Icon } from '@heroicons/react/24/outline';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <BuildingOffice2Icon className="h-8 w-8 text-adventure-400" />
              <span className="text-2xl font-bold">DFW Explorer</span>
            </div>
            <p className="text-gray-300 mb-4">
              Discover Dallas–Fort Worth’s skyline views, Western heritage,
              world-class arts, sports, parks, and incredible food. Plan your
              perfect day across Dallas, Fort Worth, and Arlington.
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
            <h3 className="text-lg font-semibold mb-4">Around DFW</h3>
            <ul className="space-y-2 text-gray-300">
              <li><span className="hover:text-adventure-400 transition-colors cursor-pointer">Arts & Museums</span></li>
              <li><span className="hover:text-adventure-400 transition-colors cursor-pointer">Parks & Trails</span></li>
              <li><span className="hover:text-adventure-400 transition-colors cursor-pointer">Food & BBQ</span></li>
              <li><span className="hover:text-adventure-400 transition-colors cursor-pointer">Sports & Venues</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">© 2024 DFW Explorer. Built as a demo project.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
