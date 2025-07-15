import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, MapPin, ChevronDown, X } from 'lucide-react';
import SimpleProductItem from '../components/products/SimpleProductItem';
import LocationSelector from '../components/common/LocationSelector';
import ProductDetailModal from '../components/products/ProductDetailModal';
import ScrollToTop from '../components/common/ScrollToTop';
import SkeletonLoader from '../components/SkeletonLoader';
import { Product, Category } from '../types';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';

import { squareService } from '../services/squareService';


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
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Cache for expensive computations
  const [dataCache, setDataCache] = useState<{
    products?: Product[];
    categories?: Category[];
    timestamp?: number;
  }>({});

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check cache first
      const now = Date.now();
      if (dataCache.products && dataCache.categories && dataCache.timestamp && 
          (now - dataCache.timestamp) < CACHE_DURATION) {
        setProducts(dataCache.products);
        setFilteredProducts(dataCache.products);
        setCategories(dataCache.categories);
        setLoading(false);
        return;
      }

      // Show immediate loading state
      setProductsLoading(true);
      setCategoriesLoading(true);
      

      
      // Fetch data with staggered loading for better UX
      const categoriesPromise = squareService.getCategories().then(data => {
        setCategories(data);
        setCategoriesLoading(false);
        return data;
      });
      
      const productsPromise = squareService.getProducts().then(data => {
        setProducts(data);
        setFilteredProducts(data);
        setProductsLoading(false);
        return data;
      });
      
      const [fetchedProducts, categoriesData] = await Promise.all([
        productsPromise,
        categoriesPromise
      ]);
      
      

      
      // Update cache
      setDataCache({
        products: fetchedProducts,
        categories: categoriesData,
        timestamp: now
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load menu data. Please try again.');
      setProductsLoading(false);
      setCategoriesLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Only filter by search, not by category (categories are shown as sections)
      return matchesSearch;
    });

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

  // Memoized hierarchical category structure
  const buildCategoryHierarchy = useCallback((categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // First pass: create map and initialize subcategories arrays
    categories.forEach(category => {
      if (category.isActive) {
        categoryMap.set(category.id, { ...category, subcategories: [] });
      }
    });

    // Second pass: build hierarchy
    categoryMap.forEach(category => {
      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId)!;
        parent.subcategories!.push(category);
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories.sort((a, b) => a.sortOrder - b.sortOrder);
  }, []);

  // Get all active categories (including parent categories and their subcategories)
  const getAllActiveCategories = useCallback((categories: Category[]): Category[] => {
    const allCategories: Category[] = [];
    
    const addCategoryAndSubcategories = (category: Category) => {
      if (category.isActive) {
        allCategories.push(category);
        if (category.subcategories) {
          category.subcategories.forEach(addCategoryAndSubcategories);
        }
      }
    };
    
    categories.forEach(addCategoryAndSubcategories);
    return allCategories;
  }, []);
  
  const activeCategories = getAllActiveCategories(categories);
  
  // Get only parent categories (level 0) for navigation
  const parentCategories = useMemo(() => {
    return categories.filter(category => category.level === 0 && category.isActive);
  }, [categories]);
  






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

  // Enhanced products by category - uses parent categories for navigation
  const productsByCategory = useMemo(() => {
    if (!parentCategories.length || !filteredProducts.length) {
      return {};
    }
    
    const result: { [categoryId: string]: { category: Category; products: Product[] } } = {};

    parentCategories.forEach(category => {
      // Get all subcategory IDs for this parent category
      const allCategoryIds = getAllSubcategoryIds(category);
      
      // Enhanced category matching - check multiple ways products can be associated
      const categoryProducts = filteredProducts.filter(product => {
        // Check if product belongs to this category or any of its subcategories
        if (allCategoryIds.includes(product.categoryId || '')) return true;
        
        // Multiple category IDs match
        if (product.categoryIds && product.categoryIds.some(id => allCategoryIds.includes(id))) return true;
        
        // Category name match (case insensitive) - check parent and subcategories
        if (product.category) {
          const productCategoryLower = product.category.toLowerCase();
          if (productCategoryLower === category.name.toLowerCase()) return true;
          
          // Check subcategory names
          if (category.subcategories) {
            return category.subcategories.some(subcategory => 
              productCategoryLower === subcategory.name.toLowerCase()
            );
          }
        }
        
        return false;
      });
      
      // Only include parent categories that have products (directly or through subcategories)
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
  }, [productsByCategory]);

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Menu</h1>
          <p className="text-gray-700">Delicious food made fresh daily</p>
          
          {/* Location Display/Selector */}
          <div className="mt-4">
            {selectedLocation ? (
              <div className="flex items-center gap-2 text-green-800">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{selectedLocation.name}</span>
                <button
                  onClick={() => setShowLocationSelector(true)}
                  className="text-sm text-green-800 hover:text-green-900 ml-2 font-bold bg-green-100 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  aria-label="Change pickup location"
                >
                  Change Location
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLocationSelector(true)}
                className="flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                Select Pickup Location
              </button>
            )}
          </div>
        </div>

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
                    Object.entries(productsByCategory).map(([categoryId, { category, products }]) => (
                      <button
                        key={categoryId}
                        onClick={() => {
                          scrollToCategory(categoryId);
                          setShowCategoryModal(false);
                        }}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
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
          <div className="relative max-w-md">
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

        {/* Category Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8 sticky top-0 z-10">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => {
                setSelectedCategory('all');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                selectedCategory === 'all'
                  ? 'border-green-500 text-green-800'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              All
            </button>
            {categoriesLoading ? (
              <div className="flex space-x-4">
                <SkeletonLoader count={3} type="category" className="w-20" />
              </div>
            ) : (
              <>
                {/* Simple category navigation like HomePage */}
                {Object.entries(productsByCategory).map(([categoryId, { category, products }]) => (
                  <button
                    key={categoryId}
                    onClick={() => scrollToCategory(categoryId)}
                    className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      selectedCategory === categoryId
                        ? 'border-green-500 text-green-800'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                    }`}
                  >
                    {category.name} ({products.length})
                  </button>
                ))}
              </>
            )}
          </div>
        </div>



        {/* Category Sections - With subcategory organization */}
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
            <div
              key={categoryId}
              ref={(el) => { categoryRefs.current[categoryId] = el; }}
              className="mb-12"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h2>
                {category.description && (
                  <p className="text-gray-700">{category.description}</p>
                )}
              </div>
              
              {/* Render subcategories or direct products */}
              {Object.entries(productsBySubcategory).map(([subCategoryId, { category: subCategory, products: subProducts }]) => (
                <div key={subCategoryId} className="mb-8">
                  {/* Show subcategory title only if it's different from parent */}
                  {subCategoryId !== categoryId && (
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{subCategory.name}</h3>
                      {subCategory.description && (
                        <p className="text-gray-600 text-sm">{subCategory.description}</p>
                      )}
                    </div>
                  )}
                  
                  {subProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          );
        })}

        {/* Fallback: Show all products if no categories or category filtering fails */}
        {(Object.keys(productsByCategory).length === 0 || 
          Object.values(productsByCategory).every(({products}) => products.length === 0)) && 
         filteredProducts.length > 0 && (
          <div className="mb-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">All Menu Items</h2>
              <p className="text-gray-700">Browse our complete menu</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          product={selectedProduct}
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