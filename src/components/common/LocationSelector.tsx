import React, { useState, useEffect } from 'react';
import { StoreLocation } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { MapPin, Clock, Phone, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface LocationSelectorProps {
  locations: StoreLocation[];
  selectedLocation?: StoreLocation | null;
  onLocationSelect: (location: StoreLocation) => void; // Add missing prop
  isOpen: boolean;
  onClose: () => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  selectedLocation,
  onLocationSelect, // Add this prop
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load store locations
    setLoading(false);
  }, []);

  const handleLocationSelect = (location: StoreLocation) => {
    onLocationSelect(location);
    toast.success(`Selected ${location.name}`);
    onClose();
  };

  const formatHours = (hours: StoreLocation['hours']) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayHours = hours[today];
    
    if (todayHours?.closed) {
      return 'Closed Today';
    }
    
    return `${todayHours?.open} - ${todayHours?.close}`;
  };

  const isCurrentlyOpen = (location: StoreLocation) => {
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayHours = location.hours[today];
    
    if (todayHours?.closed) return false;
    
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const openTime = parseInt(todayHours?.open.replace(/[^\d]/g, '') || '0');
    const closeTime = parseInt(todayHours?.close.replace(/[^\d]/g, '') || '0');
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-green-200">
        <div className="p-6 border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-green-900">Choose Your Location</h2>
            <button
              onClick={onClose}
              className="text-green-700 hover:text-green-900 transition-colors p-2 rounded-full hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Close location selector modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-green-800 mt-2 font-medium">Select a pickup location to continue ordering</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedLocation?.id === location.id
                      ? 'border-green-500 bg-green-100 shadow-md'
                      : 'border-green-200 hover:border-green-400 bg-white hover:bg-green-50'
                  }`}
                  onClick={() => handleLocationSelect(location)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLocationSelect(location);
                    }
                  }}
                  aria-label={`Select ${location.name} location`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-green-900">
                          {location.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          isCurrentlyOpen(location)
                            ? 'bg-green-200 text-green-900'
                            : 'bg-red-200 text-red-900'
                        }`}>
                          {isCurrentlyOpen(location) ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-green-800 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {location.address}, {location.city}, {location.state} {location.zipCode}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-green-800 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Today: {formatHours(location.hours)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-green-800">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-medium">{location.phone}</span>
                      </div>
                      
                      {location.features.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2">
                            {location.features.map((feature) => (
                              <span
                                key={feature}
                                className="px-3 py-1 bg-green-200 text-green-900 text-xs rounded-full font-medium"
                              >
                                {feature.replace('-', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {location.estimatedWaitTime && (
                      <div className="text-right bg-green-100 p-3 rounded-lg">
                        <div className="text-sm text-green-900 font-bold">Est. Wait</div>
                        <div className="text-lg font-bold text-green-800">
                          {location.estimatedWaitTime} min
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;