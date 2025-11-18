import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  GlobeAltIcon,
  LockClosedIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Toast from '../components/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://trip-backend-554701706701.us-central1.run.app';

const TripShareModal = ({ trip, isOpen, onClose, onUpdate }) => {
  const [visibility, setVisibility] = useState(trip?.visibility || 'private');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (trip) {
      setVisibility(trip.visibility || 'private');
      
      // Generate share URL if trip has a share token
      if (trip.shareToken && trip.visibility !== 'private') {
        setShareUrl(`${window.location.origin}/shared/${trip.shareToken}`);
      } else {
        setShareUrl('');
      }
    }
  }, [trip]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setToast({ message: 'Failed to copy link', type: 'error' });
    }
  };

  const handleSaveVisibility = async () => {
    setSaving(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/trips/${trip.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ visibility })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update failed:', response.status, errorData);
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const updatedTrip = await response.json();
      console.log('Updated trip:', updatedTrip);
      
      // Update share URL with new token if needed
      if (updatedTrip.shareToken && visibility !== 'private') {
        setShareUrl(`${window.location.origin}/shared/${updatedTrip.shareToken}`);
      } else {
        setShareUrl('');
      }

      setToast({ message: 'Sharing settings updated!', type: 'success' });
      onUpdate(updatedTrip);
      
      // Close modal after short delay
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Error updating visibility:', error);
      setToast({ 
        message: error.message || 'Failed to update sharing settings', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !trip) return null;

  const visibilityOptions = [
    {
      value: 'private',
      icon: LockClosedIcon,
      label: 'Private',
      description: 'Only you can see this trip',
      color: 'text-gray-600'
    },
    {
      value: 'unlisted',
      icon: EyeSlashIcon,
      label: 'Unlisted',
      description: 'Anyone with the link can view',
      color: 'text-blue-600'
    },
    {
      value: 'public',
      icon: GlobeAltIcon,
      label: 'Public',
      description: 'Visible to everyone, listed publicly',
      color: 'text-green-600'
    }
  ];

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Share Trip</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Trip Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{trip.name}</h3>
              {trip.description && (
                <p className="text-sm text-gray-600">{trip.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {trip.places?.length || 0} destinations
              </p>
            </div>

            {/* Visibility Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Who can see this trip?
              </label>
              <div className="space-y-3">
                {visibilityOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = visibility === option.value;
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => setVisibility(option.value)}
                      className={`w-full flex items-start p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-adventure-500 bg-adventure-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className={`flex-shrink-0 ${option.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="ml-3 flex-1 text-left">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {option.label}
                          </span>
                          {isSelected && (
                            <CheckIcon className="h-5 w-5 text-adventure-600 ml-2" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Share Link */}
            {shareUrl && visibility !== 'private' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-5 w-5 text-green-600" />
                        <span className="text-green-600 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-700 font-medium">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {visibility === 'public' 
                    ? 'This link will also appear in the public trips list'
                    : 'Only people with this link can view your trip'}
                </p>
              </div>
            )}

            {/* Info Box */}
            {visibility !== 'private' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  📌 Sharing Information
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Viewers can see all destinations in your trip</li>
                  <li>• They cannot edit or modify your trip</li>
                  {visibility === 'public' && (
                    <li>• Your trip will appear in the public trips list</li>
                  )}
                  <li>• You can change sharing settings anytime</li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveVisibility}
              disabled={saving || visibility === trip.visibility}
              className="px-6 py-2 bg-adventure-600 hover:bg-adventure-700 text-white rounded-lg transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TripShareModal;
