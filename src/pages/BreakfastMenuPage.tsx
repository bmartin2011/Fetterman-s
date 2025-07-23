import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Coffee, Clock } from 'lucide-react';
import ImageModal from '../components/common/ImageModal';
import { squareService } from '../services/squareService';
import { StoreLocation } from '../types';

const BreakfastMenuPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeHours, setStoreHours] = useState<{ [key: string]: { open: string; close: string; closed?: boolean } } | null>(null);
  const [isLoadingHours, setIsLoadingHours] = useState(true);

  useEffect(() => {
    const fetchStoreHours = async () => {
      try {
        const locations = await squareService.getSquareLocations();
        if (locations.length > 0) {
          // Use the first location's hours (main location)
          setStoreHours(locations[0].hours);
        }
      } catch (error) {
        console.error('Error fetching store hours:', error);
      } finally {
        setIsLoadingHours(false);
      }
    };

    fetchStoreHours();
  }, []);

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')}${period.toLowerCase()}`;
  };

  const formatHours = (hours: { [key: string]: { open: string; close: string; closed?: boolean } }) => {
    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayAbbr = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
    
    // Group consecutive days with same hours
    const groupedHours: string[] = [];
    let currentGroup: string[] = [];
    let currentHours = '';
    
    daysOrder.forEach(day => {
      const dayHours = hours[day];
      const hoursStr = dayHours?.closed ? 'Closed' : `${formatTime(dayHours?.open || '')} - ${formatTime(dayHours?.close || '')}`;
      
      if (hoursStr === currentHours && currentGroup.length > 0) {
        currentGroup.push(dayAbbr[day as keyof typeof dayAbbr]);
      } else {
        if (currentGroup.length > 0) {
          const groupStr = currentGroup.length === 1 
            ? currentGroup[0] 
            : `${currentGroup[0]}-${currentGroup[currentGroup.length - 1]}`;
          groupedHours.push(`${groupStr}: ${currentHours}`);
        }
        currentGroup = [dayAbbr[day as keyof typeof dayAbbr]];
        currentHours = hoursStr;
      }
    });
    
    // Add the last group
    if (currentGroup.length > 0) {
      const groupStr = currentGroup.length === 1 
        ? currentGroup[0] 
        : `${currentGroup[0]}-${currentGroup[currentGroup.length - 1]}`;
      groupedHours.push(`${groupStr}: ${currentHours}`);
    }
    
    return groupedHours;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Links */}
      <a 
        href="#main-content" 
        className="skip-link"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      <a 
        href="#navigation" 
        className="skip-link"
        aria-label="Skip to navigation"
      >
        Skip to navigation
      </a>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" tabIndex={-1}>
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <Link
            to="/menu"
            className="flex items-center text-emerald-700 hover:text-emerald-800 mr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-lg p-2"
            aria-label="Back to menu overview"
          >
            <ArrowLeft className="w-5 h-5 mr-1" aria-hidden="true" />
            Back to Menus
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Coffee className="w-8 h-8 text-orange-500 mr-3" aria-hidden="true" />
            <h1 className="text-4xl font-bold text-gray-900">
              Breakfast Menu
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start your day right with our fresh breakfast offerings
          </p>
          
          {/* Hours Info */}
          <div className="flex items-center justify-center mt-4 text-gray-600">
            <Clock className="w-5 h-5 mr-2" aria-hidden="true" />
            <span>Served daily until 10:30 AM</span>
          </div>
        </div>

        {/* Menu Image */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Current Breakfast Menu
            </h2>
            <div className="flex justify-center">
              <img
                src="/Breakfast Fetterman's Menu.webp"
                alt="Fetterman's Breakfast Menu - Complete list of breakfast items with prices and descriptions"
                className="max-w-full h-auto rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200"
                style={{ maxHeight: '800px' }}
                loading="eager"
                onClick={() => setIsModalOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsModalOpen(true);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Click to view menu in full size"
              />
            </div>
          </div>
        </div>

        {/* Hours Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Store Hours
          </h3>
          <div className="space-y-2 text-gray-600">
            {isLoadingHours ? (
              <p>Loading hours...</p>
            ) : storeHours && Object.keys(storeHours).length > 0 ? (
              formatHours(storeHours).map((hourStr, index) => (
                <p key={index}>
                  <strong className="text-gray-900">{hourStr.split(':')[0]}:</strong> {hourStr.split(':').slice(1).join(':')}
                </p>
              ))
            ) : (
              <p>Hours not available. Please contact the store for current hours.</p>
            )}
          </div>
        </div>

        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          imageSrc="/Breakfast Fetterman's Menu.webp"
          imageAlt="Fetterman's Breakfast Menu - Complete list of breakfast items with prices and descriptions"
        />
      </main>
    </div>
  );
};

export default BreakfastMenuPage;