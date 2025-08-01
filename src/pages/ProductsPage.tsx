import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, MapPin, X, ChevronLeft, ChevronRight, Clock, Info } from 'lucide-react';
import SimpleProductItem from '../components/products/SimpleProductItem';
import LocationSelector from '../components/common/LocationSelector';
import ProductDetailModal from '../components/products/ProductDetailModal';
import ScrollToTop from '../components/common/ScrollToTop';
import SkeletonLoader from '../components/SkeletonLoader';

import { Product, Category } from '../types';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';

import { squareService } from '../services/squareService';
import { isCategoryAvailable, getCategoryAvailabilityText, isCategoryAccessible } from '../utils/categoryAvailability';


const ProductsPage: React.FC = () => {
  const { selectedLocation, storeLocations, setPickupLocation } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  // Store locations managed by LocationSelector component
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy] = useState<'name' | 'price'>('name');
  // View mode functionality can be added later if needed
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  // const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);


  // Cache for expensive computations
  const [dataCache, setDataCache] = useState<{
    products?: Product[];
    categories?: Category[];
    timestamp?: number;
    locationId?: string;
  }>({});

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Helper function to format availability periods for display
  const formatAvailabilityHours = (category: Category): string => {
    if (!category.availabilityPeriods || category.availabilityPeriods.length === 0) {
      return 'Always available';
    }

    const periods = category.availabilityPeriods;
    const dayMap: { [key: string]: string } = {
      'SUNDAY': 'Sun',
      'MONDAY': 'Mon',
      'TUESDAY': 'Tue',
      'WEDNESDAY': 'Wed',
      'THURSDAY': 'Thu',
      'FRIDAY': 'Fri',
      'SATURDAY': 'Sat'
    };

    const formatTime = (timeStr: string): string => {
      if (!timeStr) return '';
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    return periods.map(period => {
      const day = period.dayOfWeek ? dayMap[period.dayOfWeek.toUpperCase()] || period.dayOfWeek : 'Daily';
      const startTime = formatTime(period.startTime || '00:00:00');
      const endTime = formatTime(period.endTime || '23:59:59');
      return `${day}: ${startTime} - ${endTime}`;
    }).join('\n');
  };

  const fetchData = useCallback(async (locationId?: string) => {
    try {
      setLoading(true);
      
      // Create location-aware cache key
      const cacheKey = `${locationId || 'all_locations'}`;
      
      // Check cache first
      const now = Date.now();
      if (dataCache.products && dataCache.categories && dataCache.timestamp && 
          (now - dataCache.timestamp) < CACHE_DURATION && 
          dataCache.locationId === cacheKey) {
        setProducts(dataCache.products);
        setFilteredProducts(dataCache.products);
        setCategories(dataCache.categories);
        setLoading(false);
        return;
      }

      // Show immediate loading state
      setProductsLoading(true);
      setCategoriesLoading(true);
      
      // Fetch categories and products in parallel for better performance
      const [categoriesData, productsData] = await Promise.all([
        squareService.getCategories(),
        squareService.getProducts(false, locationId)
      ]);
      
      // Categories received from API
      
      // Process categories with availability and filtering
  const processedCategories = categoriesData
    .filter(category => {
      // Filter out categories with onlineVisibility: false
      if (category.onlineVisibility === false) {
        // Hidden category filtered out
        return false;
      }
      
      // Only show active categories
      const isActive = category.isActive;
      // Category availability checked
      return isActive;
    })
        .map(category => {
          // Ensure availability data is properly processed
          const processedCategory = {
            ...category,
            // Ensure availability periods are properly formatted
            availabilityPeriods: category.availabilityPeriods || [],
            // Add computed availability status
            isCurrentlyAvailable: isCategoryAvailable(category).isAvailable,
            isAccessible: isCategoryAccessible(category)
          };
          
          return processedCategory;
        })
        .sort((a, b) => {
          // Sort by sort order if available, otherwise by name
          if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
            return a.sortOrder - b.sortOrder;
          }
          return a.name.localeCompare(b.name);
        });
      
      setCategories(processedCategories);
      setCategoriesLoading(false);
      
      setProducts(productsData);
      setFilteredProducts(productsData);
      setProductsLoading(false);
      
      // Update cache with location info
      setDataCache({
        products: productsData,
        categories: processedCategories,
        timestamp: now,
        locationId: cacheKey
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load menu data. Please try again.');
      setProductsLoading(false);
      setCategoriesLoading(false);
    } finally {
      setLoading(false);
    }
  }, [dataCache, CACHE_DURATION]);

  useEffect(() => {
    // Check for clearCache URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const shouldClearCache = urlParams.get('clearCache') === 'true';
    
    if (shouldClearCache) {
      // Clear all caches when explicitly requested
      squareService.clearCache();
      // Remove the parameter from URL to prevent repeated clearing
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Clear products cache to ensure we get fresh data with archived items filtered
      squareService.clearProductsCache();
    }
    
    fetchData(selectedLocation?.id);
  }, [fetchData, selectedLocation]);

  // Watch for location changes and refresh products
  useEffect(() => {
    if (selectedLocation) {
      // No need to clear cache when location changes - client-side filtering handles this
      fetchData(selectedLocation.id);
    }
  }, [selectedLocation?.id, fetchData]);



  useEffect(() => {
    // Filtering products for search and sort
    
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter out archived/inactive products - be more explicit about the check
      const isActive = product.isActive === true; // Only include explicitly active products
      
      const shouldInclude = matchesSearch && isActive;
      
      // Product filtering logic
      
      return shouldInclude;
    });

    // Filtered products ready for display

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        // Rating sort removed
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, sortBy]);

  const handleProductClick = (product: Product) => {
    if (!selectedLocation) {
      toast.error('Please select a pickup location first');
      setShowLocationSelector(true);
      return;
    }
    
    setSelectedProduct(product);
    setShowCustomizationModal(true);
  };

  // Note: Category hierarchy and active categories are handled through parentCategories and productsByCategory
  // Helper function to get all subcategory IDs for a category
  const getAllSubcategoryIds = useCallback((category: Category): string[] => {
    const subcategoryIds = [category.id];
    if (category.subcategories) {
      category.subcategories.forEach(subcategory => {
        subcategoryIds.push(...getAllSubcategoryIds(subcategory));
      });
    }
    return subcategoryIds;
  }, []);

  // Get only parent categories (level 0) for navigation - REBUILT FROM SCRATCH
  const parentCategories = useMemo(() => {
    return categories
      .filter(category => {
        // Show all active parent categories (level 0)
        return category.level === 0 && category.isActive;
      })
      .sort((a, b) => {
        // Sort by sort order if available, otherwise by name
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        return a.name.localeCompare(b.name);
      });
  }, [categories]);

  // COMPLETELY REBUILT: Category display logic with availability
  const categoriesForDisplay = useMemo(() => {
    const result = parentCategories.map(category => {
      // Get all subcategory IDs for this parent category
      const allCategoryIds = getAllSubcategoryIds(category);
      
      // Find products for this category
      const categoryProducts = filteredProducts.filter(product => {
        // Primary check: product belongs to this category or any of its subcategories
        if (product.categoryId && allCategoryIds.includes(product.categoryId)) {
          return true;
        }
        
        // Secondary check: multiple category IDs match
        if (product.categoryIds && Array.isArray(product.categoryIds)) {
          return product.categoryIds.some(id => allCategoryIds.includes(id));
        }
        
        // Fallback: category name match (case insensitive)
        if (product.category && typeof product.category === 'string') {
          const productCategoryLower = product.category.toLowerCase().trim();
          const categoryNameLower = category.name.toLowerCase().trim();
          
          if (productCategoryLower === categoryNameLower) {
            return true;
          }
          
          // Check subcategory names if they exist
          if (category.subcategories && Array.isArray(category.subcategories)) {
            return category.subcategories.some(subcategory => 
              productCategoryLower === subcategory.name.toLowerCase().trim()
            );
          }
        }
        
        return false;
      });
      
      // Return category with its products and availability info
      return {
        category,
        products: categoryProducts,
        isAvailable: isCategoryAvailable(category).isAvailable,
        isAccessible: isCategoryAccessible(category),
        availabilityStatus: isCategoryAvailable(category)
      };
    })
    // Filter out categories with no products
    .filter(({ products }) => products.length > 0);
    
    return result;
  }, [parentCategories, filteredProducts, getAllSubcategoryIds]);

  // Simplified products by category - more robust filtering
  const productsByCategory = useMemo(() => {
    if (!parentCategories.length) {
      return {};
    }
    
    const result: { [categoryId: string]: { category: Category; products: Product[] } } = {};

    parentCategories.forEach(category => {
      // Get all subcategory IDs for this parent category
      const allCategoryIds = getAllSubcategoryIds(category);
      
      // Simplified category matching - check the most reliable ways
      const categoryProducts = filteredProducts.filter(product => {
        // Primary check: product belongs to this category or any of its subcategories
        if (product.categoryId && allCategoryIds.includes(product.categoryId)) {
          return true;
        }
        
        // Secondary check: multiple category IDs match
        if (product.categoryIds && Array.isArray(product.categoryIds)) {
          return product.categoryIds.some(id => allCategoryIds.includes(id));
        }
        
        // Fallback: category name match (case insensitive)
        if (product.category && typeof product.category === 'string') {
          const productCategoryLower = product.category.toLowerCase().trim();
          const categoryNameLower = category.name.toLowerCase().trim();
          
          if (productCategoryLower === categoryNameLower) {
            return true;
          }
          
          // Check subcategory names if they exist
          if (category.subcategories && Array.isArray(category.subcategories)) {
            return category.subcategories.some(subcategory => 
              productCategoryLower === subcategory.name.toLowerCase().trim()
            );
          }
        }
        
        return false;
      });
      
      // Only include categories that have products
      if (categoryProducts.length > 0) {
        result[category.id] = {
          category,
          products: categoryProducts
        };
      }
    });

    return result;
  }, [parentCategories, filteredProducts, getAllSubcategoryIds]);

  // Smooth scroll to category section
  const scrollToCategory = (categoryId: string) => {
    const element = categoryRefs.current[categoryId];
    if (element) {
      const headerOffset = 120; // Account for sticky header
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setSelectedCategory(categoryId);
  };



  // Update selected category based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // Offset for header
      
      // Check if we're at the top (before any category sections)
      if (scrollPosition < 400) {
        setSelectedCategory('all');
        return;
      }
      
      // Find which category section is currently in view
      for (const [categoryId] of Object.entries(productsByCategory)) {
        const element = categoryRefs.current[categoryId];
        if (element) {
          const elementTop = element.offsetTop;
          const elementBottom = elementTop + element.offsetHeight;
          
          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            setSelectedCategory(categoryId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [productsByCategory, selectedLocation]);

  // Initialize and update arrow visibility
  useEffect(() => {
    const updateArrowVisibility = () => {
      if (categoryScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

    // Initial check
    updateArrowVisibility();

    // Add resize listener to update arrows when window size changes
    window.addEventListener('resize', updateArrowVisibility);
    
    return () => {
      window.removeEventListener('resize', updateArrowVisibility);
    };
  }, [productsByCategory, categoriesLoading]);

  if (loading && !dataCache.products) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Our Menu</h1>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">Delicious food made fresh daily with the finest ingredients</p>
          </div>
          
          {/* Location Display/Selector */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            {selectedLocation ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 text-green-800 bg-green-50 px-4 py-2 rounded-lg border border-green-100 shadow-sm">
                  <MapPin className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{selectedLocation.name}</span>
                </div>
                <button
                  onClick={() => setShowLocationSelector(true)}
                  className="text-sm text-green-800 hover:text-green-900 font-bold bg-green-100 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm"
                  aria-label="Change pickup location"
                >
                  Change Location
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLocationSelector(true)}
                className="flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900 transition-colors shadow-sm"
              >
                <MapPin className="w-5 h-5" />
                Select Pickup Location
              </button>
            )}
          </div>
        </header>

        {/* Category Navigation Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
            {/* Mobile Layout - Bottom Sheet */}
            <div className="md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Menu Categories</h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close category navigation"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                <div className="space-y-3">
                  {/* All Section */}
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setShowCategoryModal(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedCategory === 'all'
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                    }`}
                    aria-pressed={selectedCategory === 'all'}
                    role="tab"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">All</h4>
                        <p className="text-sm text-gray-500 mt-1">View all categories</p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Category Buttons */}
                  {categoriesLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="h-20 bg-gray-200 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    Object.entries(productsByCategory).map(([categoryId, { category, products }]) => {
                      const isAvailable = isCategoryAccessible(category);
                      const availabilityStatus = isCategoryAvailable(category);
                      const hasAvailabilityPeriods = category.availabilityPeriods && category.availabilityPeriods.length > 0;
                      

                      
                      return (
                        <div key={categoryId} className="relative">
                          <button
                            onClick={() => scrollToCategory(categoryId)}
                            disabled={!isAvailable}
                            onMouseEnter={() => setHoveredCategory(categoryId)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 relative ${
                              selectedCategory === categoryId
                                ? 'border-green-500 text-green-800 bg-green-50'
                                : isAvailable
                                ? 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50'
                                : 'border-transparent text-gray-400 cursor-not-allowed bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{category.name}</span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {products.length}
                              </span>
                              
                              {/* Availability Indicator */}
                              {hasAvailabilityPeriods && (
                                <div className="flex items-center space-x-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    availabilityStatus.isAvailable 
                                      ? 'bg-green-500 shadow-sm' 
                                      : 'bg-red-500 shadow-sm'
                                  }`} />
                                  <Clock className="w-3 h-3 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Unavailable Badge */}
                            {!isAvailable && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                !
                              </div>
                            )}
                          </button>
                          
                          {/* Availability Tooltip */}
                          {hoveredCategory === categoryId && hasAvailabilityPeriods && (
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
                              <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-xs">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Clock className="w-3 h-3" />
                                  <span className="font-medium">
                                    {availabilityStatus.isAvailable ? 'Available Now' : 'Currently Closed'}
                                  </span>
                                </div>
                                <div className="text-gray-300 whitespace-pre-line text-left">
                                  {formatAvailabilityHours(category)}
                                </div>
                                {!availabilityStatus.isAvailable && availabilityStatus.reason && (
                                  <div className="text-yellow-300 mt-1 text-xs">
                                    {availabilityStatus.reason}
                                  </div>
                                )}
                                {/* Tooltip Arrow */}
                                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                           )}
                         </div>
                       );
                    })
                  )}
                </div>
              </div>
            </div>
            
            {/* Desktop Layout - Centered Modal */}
            <div className="hidden md:flex items-center justify-center min-h-screen p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Browse Menu Categories</h3>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close category navigation"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
                
                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* All Section */}
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setShowCategoryModal(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`text-left p-4 rounded-lg border-2 transition-colors ${
                        selectedCategory === 'all'
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">All Categories</h4>
                          <p className="text-sm text-gray-500 mt-1">View all menu items</p>
                        </div>
                      </div>
                    </button>
                    
                    {/* Category Buttons */}
                    {categoriesLoading ? (
                      [...Array(6)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="h-20 bg-gray-200 rounded-lg"></div>
                        </div>
                      ))
                    ) : (
                      Object.entries(productsByCategory).map(([categoryId, { category, products }]) => (
                        <button
                          key={categoryId}
                          onClick={() => {
                            scrollToCategory(categoryId);
                            setShowCategoryModal(false);
                          }}
                          className={`text-left p-4 rounded-lg border-2 transition-colors ${
                            selectedCategory === categoryId
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{category.name}</h4>
                              {category.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
                              )}
                            </div>
                            <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded-full">
                              {products.length}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 w-5 h-5 cursor-pointer transition-colors" 
                onClick={() => {
                  const searchInput = document.querySelector('input[aria-label="Search menu items"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                  }
                }}
                aria-label="Focus search input"
              />
              <input
                type="text"
                placeholder="Search in menu"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                aria-label="Search menu items"
              />
            </div>

          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="relative mb-8 sticky top-0 z-10 bg-gray-50 py-2">
          {/* Left Arrow - Outside the category bar */}
           {showLeftArrow && (
             <button
               onClick={() => {
                 if (categoryScrollRef.current) {
                   categoryScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                 }
               }}
               className="absolute left-2 top-1/2 transform -translate-y-1/2 z-30 bg-white hover:bg-gray-50 text-gray-700 rounded-full p-2 shadow-md border border-gray-200 transition-all duration-200 hover:scale-110 hover:shadow-lg"
               aria-label="Scroll categories left"
             >
               <ChevronLeft className="w-4 h-4" />
             </button>
           )}
           
           {/* Right Arrow - Outside the category bar */}
           {showRightArrow && (
             <button
               onClick={() => {
                 if (categoryScrollRef.current) {
                   categoryScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                 }
               }}
               className="absolute right-2 top-1/2 transform -translate-y-1/2 z-30 bg-white hover:bg-gray-50 text-gray-700 rounded-full p-2 shadow-md border border-gray-200 transition-all duration-200 hover:scale-110 hover:shadow-lg"
               aria-label="Scroll categories right"
             >
               <ChevronRight className="w-4 h-4" />
             </button>
           )}
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mx-4 md:mx-8">
            <div 
              ref={categoryScrollRef}
              className="flex overflow-x-auto scrollbar-hide scroll-smooth px-2"
              onScroll={() => {
                if (categoryScrollRef.current) {
                  const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
                  setShowLeftArrow(scrollLeft > 0);
                  setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
                }
               }}
            >
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex-shrink-0 px-4 md:px-6 py-3 md:py-4 text-sm font-medium rounded-lg mx-1 transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-green-100 text-green-800 border-2 border-green-300 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <span className="font-semibold">All</span>
              </button>
              {categoriesLoading ? (
                <div className="flex space-x-4">
                  <SkeletonLoader count={3} type="category" className="w-20" />
                </div>
              ) : (
                <>
                  {/* REBUILT: Category navigation using new categoriesForDisplay */}
                  {categoriesForDisplay.map(({ category, products, isAvailable, isAccessible, availabilityStatus }) => {
                    const hasAvailabilityPeriods = category.availabilityPeriods && category.availabilityPeriods.length > 0;
                    
                    return (
                      <div key={category.id} className="relative">
                        <button
                          onClick={() => scrollToCategory(category.id)}
                          disabled={!isAccessible}
                          onMouseEnter={() => setHoveredCategory(category.id)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          className={`flex-shrink-0 px-3 md:px-4 py-3 md:py-4 text-sm font-medium rounded-lg mx-1 transition-all duration-200 relative ${
                            selectedCategory === category.id
                              ? 'bg-green-100 text-green-800 border-2 border-green-300 shadow-sm'
                              : isAccessible
                              ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-2 border-transparent hover:border-gray-200'
                              : 'text-gray-400 cursor-not-allowed bg-gray-100 border-2 border-gray-200 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2">
                            <div className="flex items-center space-x-1">
                              <span className="font-semibold text-xs md:text-sm truncate max-w-20 md:max-w-none">{category.name}</span>
                              
                              {/* Availability Indicator */}
                              {hasAvailabilityPeriods && (
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  isAvailable 
                                    ? 'bg-green-500 shadow-sm' 
                                    : 'bg-red-500 shadow-sm'
                                }`} />
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                                {products.length}
                              </span>
                              
                              {hasAvailabilityPeriods && (
                                <Clock className="w-3 h-3 text-gray-400 hidden md:block" />
                              )}
                            </div>
                          </div>
                          
                          {/* Unavailable Badge */}
                          {!isAccessible && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                              !
                            </div>
                          )}
                        </button>
                        
                        {/* Availability Tooltip */}
                        {hoveredCategory === category.id && hasAvailabilityPeriods && (
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
                            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-xs">
                              <div className="flex items-center space-x-2 mb-2">
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">
                                  {isAvailable ? 'Available Now' : 'Currently Closed'}
                                </span>
                              </div>
                              <div className="text-gray-300 whitespace-pre-line text-left">
                                {formatAvailabilityHours(category)}
                              </div>
                              {!isAvailable && availabilityStatus.reason && (
                                <div className="text-yellow-300 mt-1 text-xs">
                                  {availabilityStatus.reason}
                                </div>
                              )}
                              {/* Tooltip Arrow */}
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          </div>
                         )}
                       </div>
                     );
                  })}
                </>
              )}
            </div>
          </div>
        </div>



        {/* Category Sections - With subcategory organization */}
        <div className="space-y-12">
          {Object.entries(productsByCategory).map(([categoryId, { category, products }]) => {
            // Group products by subcategory if subcategories exist
            const getProductsBySubcategory = () => {
              if (!category.subcategories || category.subcategories.length === 0) {
                return { [categoryId]: { category, products } };
              }
              
              const grouped: { [subcategoryId: string]: { category: Category; products: Product[] } } = {};
              const uncategorizedProducts: Product[] = [];
              
              // First, add products that belong directly to the parent category
              products.forEach(product => {
                if (product.categoryId === category.id) {
                  uncategorizedProducts.push(product);
                  return;
                }
                
                // Find which subcategory this product belongs to
                const subcategory = category.subcategories?.find(sub => 
                  product.categoryId === sub.id ||
                  (product.categoryIds && product.categoryIds.includes(sub.id)) ||
                  (product.category && product.category.toLowerCase() === sub.name.toLowerCase())
                );
                
                if (subcategory) {
                  if (!grouped[subcategory.id]) {
                    grouped[subcategory.id] = { category: subcategory, products: [] };
                  }
                  grouped[subcategory.id].products.push(product);
                } else {
                  uncategorizedProducts.push(product);
                }
              });
              
              // Add uncategorized products to the parent category if any
              if (uncategorizedProducts.length > 0) {
                grouped[categoryId] = { category, products: uncategorizedProducts };
              }
              
              return grouped;
            };
            
            const productsBySubcategory = getProductsBySubcategory();
            
            return (
              <section
                key={categoryId}
                ref={(el) => { categoryRefs.current[categoryId] = el as HTMLDivElement | null; }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"
                role="region"
                aria-labelledby={`category-${categoryId}-title`}
              >
                <div className="mb-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div className="mb-4 md:mb-0">
                      <h2 id={`category-${categoryId}-title`} className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{category.name}</h2>
                      {category.description && (
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed">{category.description}</p>
                      )}
                    </div>
                    {category.availabilityPeriods && category.availabilityPeriods.length > 0 && (
                      <div className="flex-shrink-0">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
                          isCategoryAvailable(category).isAvailable
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            isCategoryAvailable(category).isAvailable ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span>{getCategoryAvailabilityText(category)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              
                {/* Render subcategories or direct products */}
                {Object.entries(productsBySubcategory).map(([subCategoryId, { category: subCategory, products: subProducts }]) => (
                  <div key={subCategoryId} className="mb-10">
                    {/* Show subcategory title only if it's different from parent */}
                    {subCategoryId !== categoryId && (
                      <div className="mb-6 pb-4 border-b border-gray-200">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">{subCategory.name}</h3>
                        {subCategory.description && (
                          <p className="text-gray-600 text-sm md:text-base leading-relaxed">{subCategory.description}</p>
                        )}
                      </div>
                    )}
                  
                    {subProducts.length > 0 ? (
                      <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6 lg:gap-8 relative ${
                        !isCategoryAccessible(category) ? 'opacity-60' : ''
                      }`}>
                      {!isCategoryAccessible(category) && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-opacity-95 flex items-center justify-center z-10 rounded-xl backdrop-blur-sm">
                          <div className="text-center p-6 bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm mx-4">
                            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                              <Clock className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Currently Unavailable</h3>
                            <p className="text-sm text-gray-600 mb-3">{getCategoryAvailabilityText(category)}</p>
                            {category.availabilityPeriods && category.availabilityPeriods.length > 0 && (
                              <div className="bg-gray-50 rounded-lg p-3 mt-3">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                  <Info className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm font-medium text-gray-700">Availability Hours</span>
                                </div>
                                <div className="text-xs text-gray-600 whitespace-pre-line">
                                  {formatAvailabilityHours(category)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {productsLoading ? (
                        <SkeletonLoader count={6} type="product" />
                      ) : (
                        subProducts.map(product => (
                          <SimpleProductItem 
                            key={product.id} 
                            product={product}
                            onClick={() => handleProductClick(product)}
                          />
                        ))
                      )}
                    </div>
                  ) : (
                    subCategoryId === categoryId && (
                      <p className="text-gray-500 italic">No items available in this category.</p>
                    )
                  )}
                </div>
              ))}
          </section>
        );
      })}
        </div>

        {/* Fallback: Show all products if no categories or category filtering fails */}
        {(Object.keys(productsByCategory).length === 0 || 
          Object.values(productsByCategory).every(({products}) => products.length === 0)) && 
         filteredProducts.length > 0 && (
          <div className="mb-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">All Menu Items</h2>
              <p className="text-gray-700">Browse our complete menu</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {productsLoading ? (
                <SkeletonLoader count={6} type="product" />
              ) : (
                filteredProducts.map(product => (
                  <SimpleProductItem 
                    key={product.id} 
                    product={product}
                    onClick={() => handleProductClick(product)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* No Results */}
        {Object.keys(productsByCategory).length === 0 && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-700 text-lg">No menu items found matching your search.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Location Selector Modal */}
      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        locations={storeLocations}
        selectedLocation={selectedLocation}
        onLocationSelect={setPickupLocation}
      />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct!}
          isOpen={showCustomizationModal}
          onClose={() => {
            setShowCustomizationModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
      
      {/* Floating Action Buttons */}
      <ScrollToTop 
        onCategoryModalOpen={() => setShowCategoryModal(true)} 
        hideWhenModalOpen={showCustomizationModal}
      />
    </div>
  );
};

export default ProductsPage;
