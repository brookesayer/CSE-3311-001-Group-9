import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon, 
  GlobeAltIcon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../auth/AuthContext';

const HeaderWithAuth = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Browse', href: '/browse' },
    { name: 'Trips', href: '/trips' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'About', href: '/about' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <GlobeAltIcon className="h-8 w-8 text-adventure-600" />
            <span className="text-2xl font-bold text-gray-900">Travel Discovery</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-adventure-600 bg-adventure-50'
                    : 'text-gray-700 hover:text-adventure-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                      isActive('/profile') || isDropdownOpen
                        ? 'text-adventure-600 bg-adventure-50'
                        : 'text-gray-700 hover:text-adventure-600 hover:bg-gray-50'
                    }`}
                  >
                    <UserCircleIcon className="h-6 w-6" />
                    <span className="text-sm font-medium">{user?.username}</span>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-adventure-50 hover:text-adventure-600 transition-colors"
                      >
                        <UserCircleIcon className="h-5 w-5" />
                        <span>My Account</span>
                      </Link>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-adventure-600 hover:text-adventure-700 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-adventure-600 hover:bg-adventure-700 rounded-lg transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-adventure-600 hover:bg-gray-50"
          >
            {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4">
            <nav className="flex flex-col space-y-2">
              {isAuthenticated && (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                      isActive('/profile')
                        ? 'text-adventure-600 bg-adventure-50'
                        : 'text-gray-700 hover:text-adventure-600 hover:bg-gray-50'
                    }`}
                  >
                    <UserCircleIcon className="h-6 w-6" />
                    <span className="text-sm font-medium">My Account</span>
                  </Link>
                  
                  <div className="border-t border-gray-200 my-2"></div>
                </>
              )}

              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-adventure-600 bg-adventure-50'
                      : 'text-gray-700 hover:text-adventure-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors mt-2"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-3 py-2 text-sm font-medium text-adventure-600 hover:text-adventure-700 hover:bg-adventure-50 rounded-md transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-3 py-2 text-sm font-medium text-white bg-adventure-600 hover:bg-adventure-700 rounded-lg transition-colors text-center"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderWithAuth;