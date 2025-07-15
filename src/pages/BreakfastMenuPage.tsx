import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Coffee, Clock } from 'lucide-react';
import ImageModal from '../components/common/ImageModal';

const BreakfastMenuPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            Hours
          </h3>
          <div className="space-y-2 text-gray-600">
            <p><strong className="text-gray-900">Mon-Fri:</strong> 7:00am - 8:00pm</p>
            <p><strong className="text-gray-900">Sat:</strong> 7:30am - 8:00pm</p>
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