import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sandwich, Clock } from 'lucide-react';
import ImageModal from '../components/common/ImageModal';

const DeliMenuPage: React.FC = () => {
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
            <Sandwich className="w-8 h-8 text-emerald-600 mr-3" aria-hidden="true" />
            <h1 className="text-4xl font-bold text-gray-900">
              Deli Menu
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Fresh sandwiches, salads, and lunch favorites made to order
          </p>
          
          {/* Hours Info */}
          <div className="flex items-center justify-center mt-4 text-gray-600">
            <Clock className="w-5 h-5 mr-2" aria-hidden="true" />
            <span>Available all day</span>
          </div>
        </div>

        {/* Menu Image */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              October Lunch Menu
            </h2>
            <div className="flex justify-center">
              <img
                src="/Lunch Fetterman's October Menu.webp"
                alt="October Lunch and Deli Menu"
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

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Highlights */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Deli Highlights
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-emerald-800 mr-2" aria-hidden="true">•</span>
                Fresh-sliced meats and cheeses daily
              </li>
              <li className="flex items-start">
                <span className="text-emerald-800 mr-2" aria-hidden="true">•</span>
                House-made salads and sides
              </li>
              <li className="flex items-start">
                <span className="text-emerald-800 mr-2" aria-hidden="true">•</span>
                Artisan breads baked fresh daily
              </li>
              <li className="flex items-start">
                <span className="text-emerald-800 mr-2" aria-hidden="true">•</span>
                Custom sandwich creations available
              </li>
              <li className="flex items-start">
                <span className="text-emerald-800 mr-2" aria-hidden="true">•</span>
                Vegetarian and vegan options
              </li>
            </ul>
          </div>

          {/* Ordering Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Ordering Information
            </h3>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong className="text-gray-900">Hours:</strong> Available all day during store hours
              </p>
              <p>
                <strong className="text-gray-900">Pickup:</strong> Available at all locations
              </p>
              <p>
                <strong className="text-gray-900">Custom Orders:</strong> Call ahead for large orders or special requests
              </p>
              <p>
                <strong className="text-gray-900">Catering:</strong> Ask about our catering options for events
              </p>
              <p className="text-sm text-gray-500">
                Prices and availability may vary by location. Seasonal menu items available while supplies last.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Craving Something Fresh?
            </h3>
            <p className="text-gray-600 mb-4">
              Order your favorite deli items for pickup today
            </p>
            <Link
              to="/products"
              className="inline-flex items-center bg-emerald-700 text-white px-6 py-3 rounded-lg hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200"
              aria-label="Browse products and place order"
            >
              Order Now
            </Link>
          </div>
        </div>

        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          imageSrc="/Lunch Fetterman's October Menu.webp"
          imageAlt="October Lunch and Deli Menu"
        />
      </main>
    </div>
  );
};

export default DeliMenuPage;