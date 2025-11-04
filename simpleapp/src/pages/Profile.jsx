import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { updateProfile} from '../lib/api';
import { storage } from '../lib/storage';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  HeartIcon,
  MapIcon,
  CalendarIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Toast from '../components/Toast';

const Profile = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    trips: 0,
    joinedDate: null
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    password: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load user data and stats
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        username: user.username || '',
        password: ''
      });

      // Load stats
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {      
      // Get trips count from local storage
      const trips = storage.getTrips();
      
      setStats({
        trips: trips.length,
        joinedDate: user?.created_at ? new Date(user.created_at) : null
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProfile(formData);
      setToast({ message: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
    } catch (error) {
      setToast({ 
        message: error.message || 'Failed to update profile', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original user data
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      username: user.username || '',
      password: ''
    });
    setIsEditing(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-adventure-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-adventure-600 to-adventure-700 px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <UserCircleIcon className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
            <p className="text-adventure-100">@{user.username}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => navigate('/trips')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <MapIcon className="w-8 h-8 text-adventure-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.trips}</span>
            </div>
            <p className="text-gray-600 font-medium">Trip Plans</p>
          </button>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <CalendarIcon className="w-8 h-8 text-blue-500" />
              <span className="text-sm font-medium text-gray-500">Member Since</span>
            </div>
            <p className="text-gray-900 font-semibold">
              {stats.joinedDate 
                ? stats.joinedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : 'Recently'}
            </p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-adventure-600 text-white rounded-lg hover:bg-adventure-700 transition-colors"
              >
                <PencilSquareIcon className="w-5 h-5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <UserCircleIcon className="w-5 h-5 text-gray-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg ${
                  isEditing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500' 
                    : 'border-gray-200 bg-gray-50'
                }`}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg ${
                  isEditing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500' 
                    : 'border-gray-200 bg-gray-50'
                }`}
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <PhoneIcon className="w-5 h-5 text-gray-400" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                pattern="[0-9]{10}"
                placeholder="1234567890"
                className={`w-full px-4 py-3 border rounded-lg ${
                  isEditing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500' 
                    : 'border-gray-200 bg-gray-50'
                }`}
                required
              />
              {isEditing && (
                <p className="mt-1 text-sm text-gray-500">10 digits, no spaces or dashes</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <span>Address</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg ${
                  isEditing 
                    ? 'border-gray-300 focus:ring-2 focus:ring-adventure-500 focus:border-adventure-500' 
                    : 'border-gray-200 bg-gray-50'
                }`}
                required
              />
            </div>

            {/* Username (read-only) */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <UserCircleIcon className="w-5 h-5 text-gray-400" />
                <span>Username</span>
              </label>
              <input
                type="text"
                value={formData.username}
                disabled
                className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-500"
              />
              <p className="mt-1 text-sm text-gray-500">Username cannot be changed</p>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-adventure-600 text-white rounded-lg hover:bg-adventure-700 disabled:bg-gray-400 transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;