import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Beef, Clock } from 'lucide-react';
import ImageModal from '../components/common/ImageModal';

const MeatCheeseMenuPage: React.FC = () => {
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
            <Beef className="w-8 h-8 text-red-600 mr-3" aria-hidden="true" />
            <h1 className="text-4xl font-bold text-gray-900">
              Meat & Cheese
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Premium meats and artisanal cheeses, sliced fresh to order
          </p>
          
          {/* Hours Info */}
          <div className="flex items-center justify-center mt-4 text-gray-600">
            <Clock className="w-5 h-5 mr-2" aria-hidden="true" />
            <span>Available all day during store hours</span>
          </div>
        </div>

        {/* Menu Image */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Meat & Cheese Selection
            </h2>
            <div className="flex justify-center">
              <img
                src="/Meat & Cheese Menu.webp"
                alt="Meat and Cheese Menu"
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

        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          imageSrc="/Meat & Cheese Menu.webp"
          imageAlt="Meat and Cheese Menu"
        />
      </main>
    </div>
  );
};

export default MeatCheeseMenuPage;