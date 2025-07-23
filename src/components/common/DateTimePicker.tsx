import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, X } from 'lucide-react';
import { StoreLocation } from '../../types';
import { squareService } from '../../services/squareService';

interface DateTimePickerProps {
  selectedDate?: string;
  selectedTime?: string;
  onDateTimeSelect: (date: string, time: string) => void;
  storeHours?: { [key: string]: { open: string; close: string; closed?: boolean } };
  selectedLocation?: StoreLocation;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  selectedTime,
  onDateTimeSelect,
  storeHours: propStoreHours,
  selectedLocation
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [storeHours, setStoreHours] = useState<{ [key: string]: { open: string; close: string; closed?: boolean } } | null>(propStoreHours || null);
  const [isLoading, setIsLoading] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<string | null>(selectedDate || null);
  const [tempSelectedTime, setTempSelectedTime] = useState<string | null>(selectedTime || null);

  // Helper function to get local date string (YYYY-MM-DD)
  const getLocalDateString = (date: Date = new Date()) => {
    // Create a new date to avoid timezone issues
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize current week to start from today
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0); // Reset time to start of day
    setCurrentWeekStart(startOfWeek);
  }, []);

  // Fetch store hours from Square if location is provided
  useEffect(() => {
    const fetchStoreHours = async () => {
      if (selectedLocation && !propStoreHours) {
        setIsLoading(true);
        try {
          const locations = await squareService.getSquareLocations();
          const location = locations.find((loc: StoreLocation) => loc.id === selectedLocation.id);
          if (location && location.hours) {
            setStoreHours(location.hours);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            // Error fetching store hours
          }
        } finally {
          setIsLoading(false);
        }
      } else if (propStoreHours) {
        setStoreHours(propStoreHours);
      }
    };

    fetchStoreHours();
  }, [selectedLocation, propStoreHours]);

  // Note: Available dates are generated dynamically in getWeekDates function

  // Generate available times based on selected date
  useEffect(() => {
    if (!tempSelectedDate) {
      setAvailableTimes([]);
      return;
    }

    const date = new Date(tempSelectedDate);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Only use store hours from Square - no fallback hours
    const hours = storeHours?.[dayName];

    if (!hours || hours.closed) {
      setAvailableTimes([]);
      return;
    }

    const times: string[] = [];
    const [openHour, openMinute] = hours.open.split(':').map(Number);
    const [closeHour, closeMinute] = hours.close.split(':').map(Number);
    
    // Validate hours are reasonable
    if (openHour < 0 || openHour >= 24 || closeHour < 0 || closeHour >= 24 || 
        openMinute < 0 || openMinute >= 60 || closeMinute < 0 || closeMinute >= 60) {
      setAvailableTimes([]);
      return;
    }
    
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    
    // Ensure close time is after open time
    if (closeTime <= openTime) {
      setAvailableTimes([]);
      return;
    }
    
    const now = new Date();
    const isToday = tempSelectedDate === getLocalDateString(now);
    

    
    // Generate 15-minute intervals within store hours
    for (let time = openTime; time < closeTime; time += 15) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      
      // Ensure we don't go beyond 24 hours or create invalid times
      if (hour >= 24) break;
      
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // For today, only show times that haven't passed yet with a 15-minute prep time
       if (isToday) {
         const selectedDateTime = new Date(tempSelectedDate + 'T' + timeString);
         const timeDiff = selectedDateTime.getTime() - now.getTime();
         const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
         
         if (timeDiff >= fifteenMinutes) { // Require 15-minute prep time
           times.push(timeString);
         }
      } else {
        // For future dates, show all available times within store hours
        times.push(timeString);
      }
    }
    

    
    setAvailableTimes(times);
  }, [tempSelectedDate, storeHours]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (dateString === getLocalDateString(today)) {
      return 'Today';
    } else if (dateString === getLocalDateString(tomorrow)) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  // Updated getWeekDates function
  const getWeekDates = () => {
    const dates: string[] = [];
    const start = new Date(currentWeekStart);
    
    // Show all 7 days of the week for a complete calendar view
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateString = getLocalDateString(date);
      dates.push(dateString);
    }
    
    return dates;
  };
  
  // Fixed date selection handler
  const handleDateSelect = (date: string) => {
    setTempSelectedDate(date);
    setTempSelectedTime(null); // Reset time when date changes
  };

  const handleTimeSelect = (time: string) => {
    setTempSelectedTime(time);
  };

  const handleConfirm = () => {
    if (tempSelectedDate && tempSelectedTime) {
      onDateTimeSelect(tempSelectedDate, tempSelectedTime);
      setIsModalOpen(false);
    }
  };

  const handleCancel = () => {
    setTempSelectedDate(selectedDate || null);
    setTempSelectedTime(selectedTime || null);
    setIsModalOpen(false);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    
    // Don't go before the current week (week containing today)
    const today = new Date();
    const todayWeekStart = new Date(today);
    todayWeekStart.setDate(today.getDate() - today.getDay());
    
    if (direction === 'prev' && newStart < todayWeekStart) {
      return;
    }
    
    setCurrentWeekStart(newStart);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select pickup time</h2>
          <p className="text-gray-600">Choose from the available timeslots for your order</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
            <div className="grid grid-cols-7 gap-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              {selectedDate && selectedTime ? (
                <div>
                  <div className="font-medium text-gray-900">
                    {formatDate(selectedDate)} at {formatTime(selectedTime)}
                  </div>
                  <div className="text-sm text-gray-500">Click to change pickup time</div>
                </div>
              ) : (
                <div>
                  <div className="font-medium text-gray-900">Select pickup time</div>
                  <div className="text-sm text-gray-500">Choose date and time for your order</div>
                </div>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Select pickup time</h2>
                <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Choose from the available timeslots for your order</p>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close date and time picker"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">

      {/* Date Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <span className="hidden sm:inline">Select pickup date</span>
            <span className="sm:hidden">Pick date</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={(() => {
                const today = new Date();
                const todayWeekStart = new Date(today);
                todayWeekStart.setDate(today.getDate() - today.getDay());
                return currentWeekStart <= todayWeekStart;
              })()}
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" aria-hidden="true" />
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" aria-hidden="true" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-3">
          {getWeekDates().map((date) => {
            const dayDate = new Date(date);
            const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const hours = storeHours?.[dayName];
            const isClosed = !hours || hours.closed;
            const isSelected = tempSelectedDate === date;
            const today = new Date();
            const todayString = getLocalDateString(today);
            const isToday = date === todayString;
            const isPast = date < todayString;
            
            return (
              <button
                key={date}
                onClick={() => !isClosed && !isPast && handleDateSelect(date)}
                disabled={isClosed || isPast}
                className={`
                  relative p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 text-center transition-all duration-300 transform hover:scale-105
                  ${isSelected 
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-500 shadow-lg shadow-green-200' 
                    : isPast
                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                    : isClosed
                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                    : 'bg-white text-gray-900 border-gray-200 hover:border-green-300 hover:bg-green-50 hover:shadow-md'
                  }
                  ${isToday && !isSelected ? 'ring-2 ring-blue-200 border-blue-300' : ''}
                `}
              >
                {isToday && (
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-blue-600 text-white text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold shadow-sm">
                    <span className="hidden sm:inline">Today</span>
                    <span className="sm:hidden">•</span>
                  </div>
                )}
                <div className="text-xs font-semibold mb-1 sm:mb-2 uppercase tracking-wide">
                  {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-sm sm:text-lg font-bold mb-0.5 sm:mb-1">
                  {dayDate.getDate()}
                </div>
                <div className="text-xs opacity-75 hidden sm:block">
                  {dayDate.toLocaleDateString('en-US', { month: 'short' })}
                </div>
                {isClosed && !isPast && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 rounded-xl">
                    <span className="text-xs font-medium text-gray-500">Closed</span>
                  </div>
                )}
                {isPast && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 rounded-xl">
                    <span className="text-xs font-medium text-gray-500">Past</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Selection */}
      {tempSelectedDate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <span className="hidden sm:inline">Available time slots</span>
            <span className="sm:hidden">Pick time</span>
          </h3>
          
          {availableTimes.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No pickup times available
                </h4>
                <p className="text-gray-600 max-w-md mx-auto">
                  {(() => {
                    const date = new Date(tempSelectedDate);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                    const hours = storeHours?.[dayName];
                    const isToday = tempSelectedDate === getLocalDateString();
                    
                    if (!hours || hours.closed) {
                      return `We're closed on ${date.toLocaleDateString('en-US', { weekday: 'long' })}s. Please select another day.`;
                    }
                    
                    if (isToday) {
                      return `No more pickup slots available today. We're open ${hours.open} - ${hours.close}. Try selecting tomorrow or another day.`;
                    }
                    
                    return `No pickup slots available for this date. Please try another day.`;
                  })()
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const tomorrowString = getLocalDateString(tomorrow);
                  handleDateSelect(tomorrowString);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Try Tomorrow
              </button>
            </div>
          ) : (
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 max-h-60 sm:max-h-80 overflow-y-auto">
            {availableTimes.map((time) => {
              const isSelected = tempSelectedTime === time;
              
              return (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className={`
                    relative p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 text-center transition-all duration-300 transform hover:scale-105
                    ${isSelected 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg shadow-blue-200' 
                      : 'bg-white text-gray-900 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
                    }
                  `}
                >
                  <div className="text-xs sm:text-sm font-bold">
                    {formatTime(time)}
                  </div>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-green-500 text-white rounded-full w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center">
                      <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          )}
        </div>
      )}

              {/* Selected Summary */}
              {tempSelectedDate && tempSelectedTime && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      Pickup scheduled for {formatDate(tempSelectedDate)} at {formatTime(tempSelectedTime)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={handleCancel}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!tempSelectedDate || !tempSelectedTime}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium order-1 sm:order-2"
              >
                <span className="hidden sm:inline">Confirm Selection</span>
                <span className="sm:hidden">Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DateTimePicker;