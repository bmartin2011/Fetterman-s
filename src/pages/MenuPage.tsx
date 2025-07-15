import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Sandwich, Beef } from 'lucide-react';

const MenuPage: React.FC = () => {
  const menuItems = [
    {
      title: 'Breakfast Menu',
      description: 'Start your day with our delicious breakfast options',
      image: '/Breakfast Fetterman\'s Menu.webp',
      link: '/menu/breakfast',
      icon: Coffee,
      color: 'bg-orange-500'
    },
    {
      title: 'Deli Menu',
      description: 'Fresh sandwiches, salads, and lunch favorites',
      image: '/Lunch Fetterman\'s October Menu.webp',
      link: '/menu/deli',
      icon: Sandwich,
      color: 'bg-emerald-600'
    },
    {
      title: 'Meat & Cheese',
      description: 'Premium meats and artisanal cheeses',
      image: '/Meat & Cheese Menu.webp',
      link: '/menu/meat-cheese',
      icon: Beef,
      color: 'bg-red-600'
    }
  ];

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

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" tabIndex={-1}>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Menus
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our carefully crafted menus featuring fresh, local ingredients and time-honored recipes.
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((menu, index) => {
            const IconComponent = menu.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full"
              >
                {/* Menu Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={menu.image}
                    alt={`${menu.title} - View our ${menu.title.toLowerCase()}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  <div className={`absolute top-4 left-4 ${menu.color} text-white p-2 rounded-full`}>
                    <IconComponent className="w-6 h-6" aria-hidden="true" />
                  </div>
                </div>

                {/* Menu Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {menu.title}
                  </h2>
                  <p className="text-gray-600 mb-4 flex-grow">
                    {menu.description}
                  </p>
                  <Link
                    to={menu.link}
                    className="inline-flex items-center justify-center w-full bg-emerald-700 text-white px-6 py-3 rounded-lg hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200 mt-auto"
                    aria-label={`View ${menu.title}`}
                  >
                    View Menu
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Information */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Fresh Daily
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              All our menu items are prepared fresh daily using the finest ingredients. 
              Prices and availability may vary by location. Please contact your local 
              Fetterman's for the most current information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MenuPage;