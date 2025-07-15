import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, ArrowRight, Phone, Coffee, IceCream, Sandwich, Zap } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import LocationSelector from '../components/common/LocationSelector';
import ProductCard from '../components/products/ProductCard';
import { Product, Category, StoreLocation } from '../types';
import { squareService } from '../services/squareService';
import { AriaLabels, ScreenReaderUtils, KeyboardUtils, useAnnouncement } from '../utils/accessibility';

const HomePage: React.FC = () => {
  const { selectedLocation, setPickupLocation } = useCart();
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const { announce, announcePageChange } = useAnnouncement();

  useEffect(() => {
    announcePageChange('Fetterman\'s Homepage');
  }, [announcePageChange]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [products, categoriesData, locationsData] = await Promise.all([
          squareService.getProducts(),
          squareService.getCategories(),
          squareService.getSquareLocations()
        ]);
        
        // Include products that are either featured OR belong to a 'popular' category
        const popularCategory = categoriesData.find(cat => cat.name.toLowerCase() === 'popular');
        const featured = products.filter(product => {
          const isFeatured = product.isFeatured || false;
          const isInPopularCategory = popularCategory && (
            product.categoryId === popularCategory.id || 
            (product.categoryIds && product.categoryIds.includes(popularCategory.id))
          );
          const hasPopularInCategory = product.category.toLowerCase().includes('popular') ||
            (product.categories && product.categories.some(cat => cat.toLowerCase().includes('popular')));
          
          return isFeatured || isInPopularCategory || hasPopularInCategory;
        });
        
        setFeaturedProducts(featured.slice(0, 6));
        setCategories(categoriesData);
        setStoreLocations(locationsData);
        
        announce(`Page loaded successfully. ${featured.length} featured products available.`);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load page content. Please try refreshing the page.');
        announce('Error loading page content. Please try refreshing the page.', 'assertive');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [announce]);

  const activeCategories = categories.filter(cat => cat.isActive).slice(0, 4);

  const handleLocationSelect = (location: StoreLocation) => {
    setPickupLocation(location);
    announce(`Selected ${location.name} as pickup location`);
  };

  const handleKeyboardNavigation = (event: React.KeyboardEvent, callback: () => void) => {
    KeyboardUtils.handleActionKeyPress(event, callback);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-xl text-gray-600">Loading Fetterman's...</p>
          <span className="sr-only">Loading page content, please wait</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" role="alert">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-600 text-6xl mb-4" aria-hidden="true">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium btn-focus touch-target"
            aria-label="Refresh page to try again"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Links */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>

      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 py-24 overflow-hidden"
        aria-labelledby="hero-heading"
        role="banner"
      >
        <div className="absolute inset-0 bg-black/20" aria-hidden="true"></div>
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-green-400/10 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 id="hero-heading" className="text-6xl md:text-8xl font-bold mb-6 text-white drop-shadow-2xl">
              Fetterman's
            </h1>
            
            <div className="text-2xl md:text-4xl font-semibold mb-8 text-emerald-100" role="text">
              <span className="text-emerald-300">Deli</span> 
              <span className="text-emerald-200 mx-2" aria-hidden="true">|</span> 
              <span className="text-green-300">Coffee</span> 
              <span className="text-emerald-200 mx-2" aria-hidden="true">|</span> 
              <span className="text-teal-300">Kombucha</span> 
              <span className="text-emerald-200 mx-2" aria-hidden="true">|</span> 
              <span className="text-cyan-300">Ice Cream</span>
            </div>
            
            <p className="text-xl md:text-2xl mb-12 text-emerald-100 max-w-4xl mx-auto leading-relaxed">
              Artisan food crafted with passion. Fresh ingredients, bold flavors, and exceptional quality at two convenient Kansas City locations.
            </p>
            
            {/* Current Selection Display */}
            {selectedLocation && (
              <div 
                className="inline-flex items-center gap-3 bg-emerald-800/50 backdrop-blur-sm border border-emerald-600/30 rounded-xl px-8 py-4 mb-8 shadow-xl"
                role="status"
                aria-live="polite"
              >
                <MapPin className="w-6 h-6 text-emerald-300" aria-hidden="true" />
                <span className="font-semibold text-white text-lg">
                  Selected: {selectedLocation.name}
                </span>
                <button
                  onClick={() => setShowLocationSelector(true)}
                  onKeyDown={(e) => handleKeyboardNavigation(e, () => setShowLocationSelector(true))}
                  className="text-white hover:text-emerald-100 ml-3 text-sm font-bold px-4 py-2 bg-emerald-800 border border-emerald-600 rounded-lg hover:bg-emerald-700 transition-all btn-focus touch-target shadow-lg"
                  aria-label={AriaLabels.button.selectLocation('different location')}
                >
                  Change Location
                </button>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                to="/products"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:from-emerald-500 hover:to-green-500 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-emerald-500/30 btn-focus touch-target"
                aria-label="View our menu and place an order"
              >
                <Sandwich className="w-7 h-7" aria-hidden="true" />
                Order Now
                <ArrowRight className="w-7 h-7" aria-hidden="true" />
              </Link>
              
              {!selectedLocation && (
                <button
                  onClick={() => setShowLocationSelector(true)}
                  onKeyDown={(e) => handleKeyboardNavigation(e, () => setShowLocationSelector(true))}
                  className="inline-flex items-center gap-3 bg-emerald-800/50 backdrop-blur-sm border-2 border-emerald-500/50 text-emerald-100 px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-emerald-700/50 hover:border-emerald-400/50 transition-all duration-300 btn-focus touch-target"
                  aria-label={AriaLabels.button.selectLocation('pickup location')}
                >
                  <MapPin className="w-6 h-6" aria-hidden="true" />
                  Choose Location
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main id="main-content" ref={mainContentRef} tabIndex={-1}>
        {/* What We Offer Section */}
        <section 
          className="py-24 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50"
          aria-labelledby="offerings-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 id="offerings-heading" className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-800 to-green-700 bg-clip-text text-transparent mb-8">
                What We Offer
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                From artisan sandwiches to specialty coffee, we craft every item with passion, care, and the finest ingredients.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20" role="list">
              <div className="text-center group h-full flex flex-col" role="listitem">
                <div className="bg-gradient-to-br from-emerald-100 to-green-100 border border-emerald-200/50 rounded-3xl p-10 mb-6 group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300 flex-1 flex flex-col">
                  <Sandwich className="w-20 h-20 text-emerald-700 mx-auto mb-6" aria-hidden="true" />
                  <h3 className="text-2xl font-bold text-emerald-900 mb-4">Fresh Deli</h3>
                  <p className="text-gray-700 leading-relaxed flex-1">
                    Handcrafted sandwiches, wraps, and salads made with premium ingredients and house-made spreads.
                  </p>
                </div>
              </div>

              <div className="text-center group h-full flex flex-col" role="listitem">
                <div className="bg-gradient-to-br from-amber-100 to-yellow-100 border border-amber-200/50 rounded-3xl p-10 mb-6 group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300 flex-1 flex flex-col">
                  <Coffee className="w-20 h-20 text-amber-700 mx-auto mb-6" aria-hidden="true" />
                  <h3 className="text-2xl font-bold text-amber-900 mb-4">Specialty Coffee</h3>
                  <p className="text-gray-700 leading-relaxed flex-1">
                    Expertly roasted beans, artisan espresso drinks, and signature blends to fuel your day.
                  </p>
                </div>
              </div>

              <div className="text-center group h-full flex flex-col" role="listitem">
                <div className="bg-gradient-to-br from-teal-100 to-cyan-100 border border-teal-200/50 rounded-3xl p-10 mb-6 group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300 flex-1 flex flex-col">
                  <Zap className="w-20 h-20 text-teal-700 mx-auto mb-6" aria-hidden="true" />
                  <h3 className="text-2xl font-bold text-teal-900 mb-4">Fresh Kombucha</h3>
                  <p className="text-gray-700 leading-relaxed flex-1">
                    Probiotic-rich, naturally fermented kombucha in unique flavors for a healthy boost.
                  </p>
                </div>
              </div>

              <div className="text-center group h-full flex flex-col" role="listitem">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/50 rounded-3xl p-10 mb-6 group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300 flex-1 flex flex-col">
                  <IceCream className="w-20 h-20 text-blue-700 mx-auto mb-6" aria-hidden="true" />
                  <h3 className="text-2xl font-bold text-blue-900 mb-4">Artisan Ice Cream</h3>
                  <p className="text-gray-700 leading-relaxed flex-1">
                    Small-batch ice cream made with local ingredients and creative seasonal flavors.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Features */}
            <div className="grid md:grid-cols-3 gap-10" role="list">
              <div className="text-center h-full flex flex-col" role="listitem">
                <div className="bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex-1 flex flex-col">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Clock className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h4 className="text-2xl font-bold text-emerald-900 mb-3">Quick Service</h4>
                  <p className="text-gray-700 leading-relaxed flex-1">Fast, friendly service without compromising on quality.</p>
                </div>
              </div>

              <div className="text-center h-full flex flex-col" role="listitem">
                <div className="bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex-1 flex flex-col">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Star className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h4 className="text-2xl font-bold text-green-900 mb-3">Quality Ingredients</h4>
                  <p className="text-gray-700 leading-relaxed flex-1">Locally sourced, fresh ingredients in every dish.</p>
                </div>
              </div>

              <div className="text-center h-full flex flex-col" role="listitem">
                <div className="bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex-1 flex flex-col">
                  <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Phone className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h4 className="text-2xl font-bold text-teal-900 mb-3">Easy Ordering</h4>
                  <p className="text-gray-700 leading-relaxed flex-1">Convenient online ordering and pickup options.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section 
          className="py-24 bg-gradient-to-br from-gray-50 via-emerald-50 to-green-50"
          aria-labelledby="categories-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 id="categories-heading" className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-800 to-green-700 bg-clip-text text-transparent mb-8">
                Featured Categories
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                Discover our most popular menu categories, each crafted with care and attention to detail
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" role="list">
              {activeCategories.map((category, index) => {
                const gradients = [
                  'from-emerald-600 to-green-600',
                  'from-green-600 to-teal-600', 
                  'from-teal-600 to-emerald-600',
                  'from-emerald-700 to-green-700'
                ];
                const textColors = [
                  'text-emerald-100',
                  'text-green-100',
                  'text-teal-100', 
                  'text-emerald-100'
                ];
                return (
                  <div key={category.id} role="listitem" className="h-full">
                    <Link
                      to={`/products?category=${category.id}`}
                      className="group rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 overflow-hidden block btn-focus h-full flex flex-col"
                      aria-label={`View ${category.name} products - ${category.description}`}
                    >
                      <div className={`bg-gradient-to-br ${gradients[index % gradients.length]} p-8 text-center relative overflow-hidden flex-1 flex flex-col justify-center min-h-[200px]`}>
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all duration-300" aria-hidden="true"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" aria-hidden="true"></div>
                        <h3 className="relative text-white text-2xl lg:text-3xl font-bold drop-shadow-2xl leading-tight mb-4">
                          {category.name}
                        </h3>
                        <p className={`relative ${textColors[index % textColors.length]} text-sm lg:text-base leading-relaxed drop-shadow-lg opacity-90 group-hover:opacity-100 transition-opacity duration-300`}>
                          {category.description}
                        </p>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section 
          className="py-24 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50"
          aria-labelledby="featured-products-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 id="featured-products-heading" className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-800 to-green-700 bg-clip-text text-transparent mb-8">
                Customer Favorites
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                Try our most popular menu items, crafted with passion and the finest ingredients
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" role="list">
              {featuredProducts.map((product) => (
                <div key={product.id} role="listitem" className="h-full flex flex-col">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            
            <div className="text-center mt-20">
              <Link
                to="/products"
                className="inline-flex items-center gap-4 bg-gradient-to-r from-emerald-700 to-green-700 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-emerald-600/30 btn-focus touch-target"
                aria-label="View our complete menu with all available products"
              >
                View Full Menu
                <ArrowRight className="w-6 h-6" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Store Locations Section */}
        <section 
          className="py-24 bg-gradient-to-br from-emerald-900 via-green-800 to-forest-900 relative overflow-hidden"
          aria-labelledby="locations-heading"
        >
          <div className="absolute inset-0 bg-black/20" aria-hidden="true"></div>
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute top-20 left-20 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-20 right-20 w-48 h-48 bg-green-400/10 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 id="locations-heading" className="text-5xl md:text-6xl font-bold text-white mb-8 drop-shadow-2xl">
                Our Locations
              </h2>
              <p className="text-xl md:text-2xl text-emerald-100 max-w-4xl mx-auto leading-relaxed">
                Visit us at either of our convenient Kansas City area locations
              </p>
            </div>

            {/* Store Locations Cards */}
            <div className="grid md:grid-cols-2 gap-12" role="list">
              {storeLocations.map((location, index) => {
                // Alternate gradient colors for visual variety
                const gradientColors = index % 2 === 0 
                  ? { header: 'from-emerald-600 to-green-600', button: 'from-emerald-600 to-green-600', hover: 'from-emerald-500 to-green-500', accent: 'emerald' }
                  : { header: 'from-teal-600 to-emerald-600', button: 'from-teal-600 to-emerald-600', hover: 'from-teal-500 to-emerald-500', accent: 'teal' };
                
                // Format phone number for display and tel link
                const formatPhoneForDisplay = (phone: string) => {
                  const cleaned = phone.replace(/\D/g, '');
                  if (cleaned.length === 10) {
                    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
                  }
                  return phone;
                };
                
                const formatPhoneForTel = (phone: string) => {
                  return phone.replace(/\D/g, '');
                };
                
                // Format hours for display
                const formatHours = (hours: { [key: string]: { open: string; close: string; closed?: boolean } }) => {
                  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                  const dayAbbr = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
                  
                  // Group consecutive days with same hours
                  const groupedHours: string[] = [];
                  let currentGroup: string[] = [];
                  let currentHours = '';
                  
                  daysOrder.forEach(day => {
                    const dayHours = hours[day];
                    const hoursStr = dayHours?.closed ? 'Closed' : `${dayHours?.open || ''} - ${dayHours?.close || ''}`;
                    
                    if (hoursStr === currentHours && currentGroup.length > 0) {
                      currentGroup.push(dayAbbr[day as keyof typeof dayAbbr]);
                    } else {
                      if (currentGroup.length > 0) {
                        const range = currentGroup.length === 1 ? currentGroup[0] : `${currentGroup[0]}-${currentGroup[currentGroup.length - 1]}`;
                        groupedHours.push(`${range}: ${currentHours}`);
                      }
                      currentGroup = [dayAbbr[day as keyof typeof dayAbbr]];
                      currentHours = hoursStr;
                    }
                  });
                  
                  // Add the last group
                  if (currentGroup.length > 0) {
                    const range = currentGroup.length === 1 ? currentGroup[0] : `${currentGroup[0]}-${currentGroup[currentGroup.length - 1]}`;
                    groupedHours.push(`${range}: ${currentHours}`);
                  }
                  
                  return groupedHours;
                };
                
                return (
                  <article key={location.id} className="bg-white/10 backdrop-blur-sm border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 h-full flex flex-col min-h-[500px]" role="listitem">
                    <header className={`bg-gradient-to-r ${gradientColors.header} p-8 text-white`}>
                      <h3 className="text-3xl font-bold mb-3">{location.name}</h3>
                      <p className="text-emerald-100 text-base">Fetterman's{location.name.includes('Creekside') ? ' Creekside' : ''}</p>
                    </header>
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="space-y-6 flex-1">
                        <div className="flex items-start gap-4">
                          <MapPin className="w-6 h-6 text-emerald-300 mt-1 flex-shrink-0" aria-hidden="true" />
                          <div>
                            <address className="not-italic">
                              <span className="font-medium text-white text-base block">{location.address}</span>
                              <span className="text-emerald-100 text-sm">{location.city}, {location.state} {location.zipCode}</span>
                            </address>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Phone className="w-6 h-6 text-emerald-300" aria-hidden="true" />
                          <a 
                            href={`tel:${formatPhoneForTel(location.phone)}`}
                            className="text-white hover:text-emerald-200 transition-colors text-base font-medium btn-focus underline-offset-4 hover:underline"
                            aria-label={`Call ${location.name} location at ${formatPhoneForDisplay(location.phone)}`}
                          >
                            {formatPhoneForDisplay(location.phone)}
                          </a>
                        </div>
                        <div className="flex items-start gap-4">
                          <Clock className="w-6 h-6 text-emerald-300 mt-1" aria-hidden="true" />
                          <div className="text-emerald-100">
                            <h4 className="sr-only">{location.name} location hours</h4>
                            <div className="grid grid-cols-1 gap-2 text-sm">
                              {formatHours(location.hours).map((hourStr, idx) => (
                                <span key={idx}>{hourStr}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleLocationSelect(location)}
                        onKeyDown={(e) => handleKeyboardNavigation(e, () => handleLocationSelect(location))}
                        className={`w-full mt-8 bg-gradient-to-r ${gradientColors.button} text-white py-4 rounded-2xl font-bold text-base hover:${gradientColors.hover} transition-all duration-300 transform hover:scale-105 shadow-lg border border-emerald-500/30 btn-focus touch-target`}
                        aria-label={AriaLabels.button.selectLocation(location.name)}
                      >
                        Select {location.name} Location
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Location Selector Modal */}
      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        locations={storeLocations}
        selectedLocation={selectedLocation}
        onLocationSelect={(location) => {
          handleLocationSelect(location);
          setShowLocationSelector(false);
        }}
      />
    </div>
  );
};

export default HomePage;