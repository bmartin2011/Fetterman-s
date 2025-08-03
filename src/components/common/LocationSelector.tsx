import React, { useState, useEffect } from 'react';
import { StoreLocation } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { MapPin, Clock, Phone, Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface LocationSelectorProps {
  locations: StoreLocation[];
  selectedLocation?: StoreLocation | null;
  onLocationSelect: (location: StoreLocation) => void;
  isOpen: boolean;
  onClose: () => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  selectedLocation,
  onLocationSelect,
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
    
    const formatTime = (time: string) => {
      if (!time) return '';
      
      // Handle different time formats
      let hour: number, minute: number;
      
      if (time.includes(':')) {
        // Format: "HH:MM" or "H:MM"
        const [h, m] = time.split(':');
        hour = parseInt(h);
        minute = parseInt(m);
      } else {
        // Format: "HHMM" or "HMM"
        const timeStr = time.replace(/\D/g, ''); // Remove non-digits
        if (timeStr.length === 4) {
          hour = parseInt(timeStr.substring(0, 2));
          minute = parseInt(timeStr.substring(2));
        } else if (timeStr.length === 3) {
          hour = parseInt(timeStr.substring(0, 1));
          minute = parseInt(timeStr.substring(1));
        } else {
          return time; // Return original if can't parse
        }
      }
      
      // Convert to 12-hour format
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const displayMinute = minute.toString().padStart(2, '0');
      
      return `${displayHour}:${displayMinute} ${period}`;
    };
    
    return `${formatTime(todayHours?.open || '')} - ${formatTime(todayHours?.close || '')}`;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
      {/* Mobile: Bottom sheet style, Desktop: Centered modal */}
      <div className="bg-white w-full max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto shadow-2xl border border-green-200 rounded-t-2xl md:rounded-lg md:m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white p-4 md:p-6 border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl md:rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-green-900">Choose Your Location</h2>
              <p className="text-green-800 mt-1 text-sm md:text-base font-medium">Select a pickup location to continue ordering</p>
            </div>
            <button
              onClick={onClose}
              className="text-green-700 hover:text-green-900 transition-colors p-2 rounded-full hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ml-4"
              aria-label="Close location selector modal"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 bg-gradient-to-br from-green-50 to-emerald-50">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`border rounded-xl p-4 md:p-5 cursor-pointer transition-all hover:shadow-lg touch-manipulation ${
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
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      {/* Location name and status */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="text-lg md:text-xl font-bold text-green-900">
                          {location.name}
                        </h3>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold self-start ${
                          isCurrentlyOpen(location)
                            ? 'bg-green-200 text-green-900'
                            : 'bg-red-200 text-red-900'
                        }`}>
                          {isCurrentlyOpen(location) ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      
                      {/* Address */}
                      <div className="flex items-start gap-2 text-green-800">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium leading-relaxed">
                          {location.address}, {location.city}, {location.state} {location.zipCode}
                        </span>
                      </div>
                      
                      {/* Hours */}
                      <div className="flex items-center gap-2 text-green-800">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          Today: {formatHours(location.hours)}
                        </span>
                      </div>
                      
                      {/* Contact info - Stack on mobile */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 text-green-800">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium">{location.phone}</span>
                        </div>
                      </div>
                      
                      {/* Features */}
                      {location.features.filter(feature => 
                        feature !== 'CREDIT_CARD_PROCESSING' && 
                        feature !== 'AUTOMATIC_TRANSFERS'
                      ).length > 0 && (
                        <div className="pt-2">
                          <div className="flex flex-wrap gap-2">
                            {location.features
                              .filter(feature => 
                                feature !== 'CREDIT_CARD_PROCESSING' && 
                                feature !== 'AUTOMATIC_TRANSFERS'
                              )
                              .map((feature) => (
                              <span
                                key={feature}
                                className="px-2 py-1 bg-green-200 text-green-900 text-xs rounded-full font-medium"
                              >
                                {feature.replace(/[_-]/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Wait time - Better positioned on mobile */}
                    {location.estimatedWaitTime && (
                      <div className="bg-green-100 p-3 rounded-lg text-center md:text-right self-start">
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