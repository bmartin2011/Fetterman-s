const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { Client, Environment } = require('square/legacy');
const helmet = require('helmet');
require('dotenv').config();
const { body, validationResult } = require('express-validator');
const { createRateLimiter, helmetConfig, getCorsConfig, sanitizeInput } = require('./config/security');
require('dotenv').config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Square client
const squareClient = new Client({
  bearerAuthCredentials: {
    accessToken: process.env.REACT_APP_SQUARE_ACCESS_TOKEN
  },
  environment: process.env.REACT_APP_SQUARE_ENVIRONMENT === 'sandbox' ? Environment.Sandbox : Environment.Production
});
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for Railway deployment
app.set('trust proxy', true);

// Cache cleanup interval (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of apiCache.entries()) {
    // Remove entries older than their TTL
    if (now - value.timestamp > 60 * 60 * 1000) { // Max 1 hour
      apiCache.delete(key);
      cleaned++;
    }
  }
  

}, 10 * 60 * 1000);

// Security middleware
app.use(helmet(helmetConfig));

// Rate limiting
app.use('/api/', createRateLimiter());

// CORS configuration
app.use(cors(getCorsConfig()));

// Request logging middleware for debugging
app.use((req, res, next) => {
  // Request logging removed for production
  next();
});

// Input sanitization
app.use(sanitizeInput);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    const timestamp = new Date().toISOString();

  }
  
  next();
});

// CORS preflight requests are handled by the cors middleware above

// Square API configuration
const SQUARE_ACCESS_TOKEN = process.env.REACT_APP_SQUARE_ACCESS_TOKEN;
const SQUARE_ENVIRONMENT = process.env.REACT_APP_SQUARE_ENVIRONMENT || 'sandbox';
const SQUARE_BASE_URL = SQUARE_ENVIRONMENT === 'production' 
  ? 'https://connect.squareup.com/v2' 
  : 'https://connect.squareupsandbox.com/v2';

// Simple in-memory cache for Square API responses
const apiCache = new Map();
const CACHE_TTL = {
  locations: 30 * 60 * 1000, // 30 minutes
  products: 30 * 60 * 1000,  // 30 minutes
  categories: 60 * 60 * 1000, // 60 minutes
  modifiers: 30 * 60 * 1000,  // 30 minutes
  discounts: 15 * 60 * 1000   // 15 minutes
};

// Helper function to create cache key
function createCacheKey(endpoint, body = null) {
  return `${endpoint}_${body ? JSON.stringify(body) : 'no_body'}`;
}

// Helper function to make Square API requests with caching
async function makeSquareRequest(endpoint, options = {}) {
  // Determine cache type based on endpoint
  let cacheType = 'default';
  if (endpoint.includes('/locations')) cacheType = 'locations';
  else if (endpoint.includes('/catalog/search')) {
    if (options.body && options.body.includes('ITEM')) cacheType = 'products';
    else if (options.body && options.body.includes('CATEGORY')) cacheType = 'categories';
    else if (options.body && options.body.includes('MODIFIER')) cacheType = 'modifiers';
    else if (options.body && options.body.includes('DISCOUNT')) cacheType = 'discounts';
  }

  const cacheKey = createCacheKey(endpoint, options.body);
  const ttl = CACHE_TTL[cacheType] || 5 * 60 * 1000; // 5 minutes default

  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ttl) {

    return cached.data;
  }

  const url = `${SQUARE_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Square-Version': '2023-10-18',
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Square API error: ${errorData.errors?.[0]?.detail || response.statusText}`);
  }

  const data = await response.json();
  
  // Cache the response
  apiCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });


  return data;
}

// Routes

// Store status endpoint
app.get('/api/store-status', (req, res) => {
  const storeOnline = process.env.STORE_ONLINE === 'true';
  res.json({
    isOnline: storeOnline,
    timestamp: new Date().toISOString()
  });
});

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Detailed health check endpoint for production monitoring
app.get('/api/health/detailed', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      square: 'unknown',
      cache: 'unknown',
      memory: 'unknown'
    },
    metrics: {
      cacheSize: apiCache.size,
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    }
  };

  // Test Square API connectivity
  try {
    const testResponse = await makeSquareRequest('/locations', { method: 'GET' });
    if (testResponse && testResponse.locations) {
      health.services.square = 'healthy';
    } else {
      health.services.square = 'degraded';
      health.status = 'DEGRADED';
    }
  } catch (error) {
    health.services.square = 'unhealthy';
    health.status = 'DEGRADED';
    health.services.squareError = error.message;
  }

  // Check cache health
  try {
    const testKey = 'health_check_test';
    apiCache.set(testKey, { test: true }, 1000);
    const testValue = apiCache.get(testKey);
    if (testValue && testValue.test) {
      health.services.cache = 'healthy';
      apiCache.delete(testKey);
    } else {
      health.services.cache = 'degraded';
    }
  } catch (error) {
    health.services.cache = 'unhealthy';
    health.status = 'DEGRADED';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memUsageMB = memUsage.heapUsed / 1024 / 1024;
  if (memUsageMB > 500) { // Alert if using more than 500MB
    health.services.memory = 'high_usage';
    health.status = 'DEGRADED';
  } else {
    health.services.memory = 'healthy';
  }

  // Set appropriate HTTP status
  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Environment configuration check endpoint
app.get('/api/health/config', (req, res) => {
  const config = {
    environment: process.env.NODE_ENV || 'development',
    squareEnvironment: SQUARE_ENVIRONMENT,
    hasSquareToken: !!SQUARE_ACCESS_TOKEN,
    squareTokenLength: SQUARE_ACCESS_TOKEN ? SQUARE_ACCESS_TOKEN.length : 0,
    port: PORT,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  };

  // Don't expose sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    delete config.squareTokenLength;
  }

  res.json(config);
});

// Get Square locations
app.get('/api/square/locations', async (req, res) => {
  try {
    const data = await makeSquareRequest('/locations');
    res.json(data);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Square products
app.post('/api/square/products', async (req, res) => {
  try {
    // Remove location filtering from API call - fetch all products once
    // Location filtering will be handled client-side using Square's built-in location fields
    const requestBody = {
      object_types: ['ITEM'],
      include_deleted_objects: false,
      include_related_objects: true
      // Removed: enabled_location_ids - no longer filtering by location at API level
    };
    
    if (process.env.NODE_ENV === 'development') {
    
    }
    
    // Fetch both products and categories to check visibility
    const [productsData, categoriesData] = await Promise.all([
      makeSquareRequest('/catalog/search', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }),
      makeSquareRequest('/catalog/search', {
        method: 'POST',
        body: JSON.stringify({
          object_types: ['CATEGORY'],
          include_deleted_objects: false,
          include_related_objects: true
        })
      })
    ]);
    
    // Create a set of hidden category IDs for quick lookup
    const hiddenCategoryIds = new Set();
    if (categoriesData.objects) {
      categoriesData.objects.forEach(category => {
        if (category.type === 'CATEGORY' && category.category_data) {
          const categoryData = category.category_data;
          if (categoryData.online_visibility === false) {
            hiddenCategoryIds.add(category.id);
            if (process.env.NODE_ENV === 'development') {
  
        }
          }
        }
      });
    }
    
    // Additional filtering for archived items and visibility
    if (productsData.objects) {
      const originalCount = productsData.objects.length;
      
      productsData.objects = productsData.objects.filter(item => {
        if (item.type !== 'ITEM' || !item.item_data) {
          return true; // Keep non-item objects
        }
        
        const itemData = item.item_data;
        
        // Skip archived items as additional safety check
        if (itemData.is_archived === true) {
          if (process.env.NODE_ENV === 'development') {
    
          }
          return false;
        }
        
        // Filter out items with visibility set to 'PRIVATE'
        if (itemData.visibility === 'PRIVATE') {
          if (process.env.NODE_ENV === 'development') {
    
          }
          return false;
        }
        
        // Filter out items that belong to hidden categories
        if (itemData.categories) {
          const itemCategoryIds = itemData.categories.map(cat => cat.id || cat);
          const belongsToHiddenCategory = itemCategoryIds.some(catId => hiddenCategoryIds.has(catId));
          if (belongsToHiddenCategory) {
            if (process.env.NODE_ENV === 'development') {
    
          }
            return false;
          }
        }
        
        // Also check legacy category_id field
        if (itemData.category_id && hiddenCategoryIds.has(itemData.category_id)) {
          if (process.env.NODE_ENV === 'development') {
    
          }
          return false;
        }
        
        return true;
      });
      
      const filteredCount = productsData.objects.length;
      
    }
    
    res.json(productsData);
  } catch (error) {
    console.error('Error fetching products:', error);
    console.error('Full error details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Square categories using Square SDK
app.get('/api/square/categories', async (req, res) => {
  try {
    const catalogApi = squareClient.catalogApi;
    
    // Fetch categories
    const categoriesResponse = await catalogApi.listCatalog(
      undefined, // cursor
      'CATEGORY' // types
    );
    
    if (categoriesResponse.result.errors) {
      return res.status(400).json({ 
        error: 'Failed to fetch categories from Square API',
        details: categoriesResponse.result.errors 
      });
    }
    
    const allCategories = categoriesResponse.result.objects || [];
    
    // Show all categories - no filtering by onlineVisibility
    const categories = allCategories.filter(category => {
      if (category.type !== 'CATEGORY' || !category.categoryData) {
        return true; // Keep non-category objects
      }
      
      return true; // Show all categories regardless of onlineVisibility
    });
    
    // Log hidden categories for reference
    const hiddenCategories = allCategories.filter(category => {
      if (category.type !== 'CATEGORY' || !category.categoryData) {
        return false;
      }
      return category.categoryData.onlineVisibility === false;
    });
    

    
    // Fetch all availability periods
    const availabilityPeriodsResponse = await catalogApi.listCatalog(
      undefined, // cursor
      'AVAILABILITY_PERIOD' // types
    );
    
    const availabilityPeriods = availabilityPeriodsResponse.result.objects || [];
    

    
    // Create a map of availability periods for easy lookup
    const availabilityPeriodsMap = {};
    availabilityPeriods.forEach(period => {
      if (period.availabilityPeriodData) {

        availabilityPeriodsMap[period.id] = {
          id: period.id,
          startTime: period.availabilityPeriodData.startLocalTime,
          endTime: period.availabilityPeriodData.endLocalTime,
          dayOfWeek: period.availabilityPeriodData.dayOfWeek
        };
      }
     });
    
    // Enhance categories with availability period details
    const enhancedCategories = categories.map(category => {
      const enhanced = { ...category };
      
      // Check if category has availability period IDs (try multiple possible property names)
      const categoryData = category.categoryData;
      if (categoryData) {
        const availabilityPeriodIds = categoryData.availabilityPeriodIds || 
                                    categoryData.availability_period_ids || 
                                    categoryData.availabilityPeriods || 
                                    [];
        
        if (availabilityPeriodIds && availabilityPeriodIds.length > 0) {
          enhanced.availabilityPeriods = availabilityPeriodIds
            .map(id => availabilityPeriodsMap[id])
            .filter(period => period); // Remove undefined periods
        }
      }
      
      return enhanced;
    });
    
    // Convert BigInt values to strings for JSON serialization
    const convertBigIntToString = (obj) => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'bigint') return obj.toString();
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) {
        return obj.map(item => convertBigIntToString(item));
      }
      
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = convertBigIntToString(value);
      }
      return result;
    };
    
    const serializedCategories = convertBigIntToString(enhancedCategories);
    const serializedAvailabilityPeriods = convertBigIntToString(Object.values(availabilityPeriodsMap));
    

    
    res.json({
      objects: serializedCategories,
      availabilityPeriods: serializedAvailabilityPeriods
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error while fetching categories',
      details: error.message 
    });
  }
});

// Keep the original POST endpoint for backward compatibility
app.post('/api/square/categories', async (req, res) => {
  try {
    // Use catalog/list endpoint for categories as per Square workflow
    // This endpoint properly returns availability_period_ids
    const data = await makeSquareRequest('/catalog/list?types=CATEGORY', {
      method: 'GET'
    });
    
    // Collect all availability period IDs from categories
    const availabilityPeriodIds = new Set();
    
    // Filter out categories with online_visibility set to false
    if (data.objects) {
      const originalCount = data.objects.length;
      if (process.env.NODE_ENV === 'development') {
      
      }
      
      data.objects = data.objects.filter(category => {
        if (category.type !== 'CATEGORY' || !category.category_data) {
          return true; // Keep non-category objects
        }
        
        const categoryData = category.category_data;
        
        // Collect availability period IDs
        if (categoryData.availability_period_ids && Array.isArray(categoryData.availability_period_ids)) {
          categoryData.availability_period_ids.forEach(id => availabilityPeriodIds.add(id));
        }
        
        if (process.env.NODE_ENV === 'development') {
    
        }
        
        // Filter out categories that are explicitly hidden online
        // online_visibility: false means hidden, true or undefined means visible
        if (categoryData.online_visibility === false) {
          if (process.env.NODE_ENV === 'development') {
    
          }
          return false;
        }
        
        if (process.env.NODE_ENV === 'development') {
    
          }
        return true;
      });
      
      const filteredCount = data.objects.length;
      if (process.env.NODE_ENV === 'development') {
      
      }
    }
    
    // Fetch availability periods if any were found
    const availabilityPeriods = {};
    if (availabilityPeriodIds.size > 0) {
      try {
        for (const periodId of availabilityPeriodIds) {
          const periodData = await makeSquareRequest(`/catalog/object/${periodId}`, {
            method: 'GET'
          });
          
          if (periodData.object && periodData.object.type === 'AVAILABILITY_PERIOD') {
            availabilityPeriods[periodId] = periodData.object;
          }
        }
      } catch (periodError) {
        console.error('Error fetching availability periods:', periodError);
        // Continue without availability periods if there's an error
      }
    }
    
    // Add availability periods to the response
    const response = {
      ...data,
      availability_periods: availabilityPeriods
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    console.error('Full error details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Square modifiers
app.post('/api/square/modifiers', async (req, res) => {
  try {
    // Use catalog/search endpoint for modifier lists
    // Filter out deleted modifiers (archived filtering handled by include_deleted_objects)
    const requestBody = {
      object_types: ['MODIFIER_LIST'],
      include_deleted_objects: false,
      include_related_objects: true
    };
    
    const data = await makeSquareRequest('/catalog/search', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching modifiers:', error);
    console.error('Full error details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Square discounts
app.post('/api/square/discounts', async (req, res) => {
  try {
    // Use catalog/search endpoint for discounts
    // Filter out deleted discounts (archived filtering handled by include_deleted_objects)
    const requestBody = {
      object_types: ['DISCOUNT'],
      include_deleted_objects: false,
      include_related_objects: true
    };
    
    const data = await makeSquareRequest('/catalog/search', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching discounts:', error);
    console.error('Full error details:', error);
    
    // Return empty response if no discounts are configured in Square
    if (error.message.includes('not found') || error.message.includes('No objects')) {
      res.json({ objects: [] });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get Square measurement units
app.post('/api/square/measurement-units', async (req, res) => {
  try {
    // Use catalog/search endpoint for measurement units
    // Filter out deleted measurement units (archived filtering handled by include_deleted_objects)
    const requestBody = {
      object_types: ['MEASUREMENT_UNIT'],
      include_deleted_objects: false,
      include_related_objects: true
    };
    
    const data = await makeSquareRequest('/catalog/search', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching measurement units:', error);
    console.error('Full error details:', error);
    
    // Return empty response if no measurement units are configured in Square
    if (error.message.includes('not found') || error.message.includes('No objects')) {
      res.json({ objects: [] });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});


// Middleware to check if online store is enabled
const checkStoreOnline = (req, res, next) => {
  const storeOnline = process.env.STORE_ONLINE === 'true';
  
  if (!storeOnline) {
    return res.status(503).json({ 
      error: 'Online ordering is currently unavailable. Please try again later or contact us directly.',
      storeOffline: true
    });
  }
  
  next();
};

// Create Square order
app.post('/api/square/orders', checkStoreOnline, async (req, res) => {
  try {
    const orderData = req.body;
    
    const data = await makeSquareRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    res.json(data);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process payment
app.post('/api/square/payment', checkStoreOnline, [
  body('token').notEmpty().withMessage('Payment token is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('orderId').optional().isString()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, amount, orderId } = req.body;
    
    // Create payment request
    const paymentData = {
      source_id: token,
      amount_money: {
        amount: amount, // Amount in cents
        currency: 'USD'
      },
      idempotency_key: `${orderId || 'payment'}-${Date.now()}`,
      order_id: orderId
    };

    const data = await makeSquareRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
    res.json(data);
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create Square Checkout (redirect to Square hosted page)
app.post('/api/square/create-checkout', checkStoreOnline, async (req, res) => {
  try {
    const { items, customerInfo, pickupLocation, appliedDiscounts, pickupDate, pickupTime } = req.body;
    // Handle both customer and customerInfo for backward compatibility
    const customer = customerInfo || req.body.customer;
    
    // Validate required pickup date and time
    if (!pickupDate || !pickupTime) {
      return res.status(400).json({ 
        error: 'Pickup date and time are required. Please select a pickup time before proceeding.' 
      });
    }
    
    // Generate unique idempotency key
    const idempotencyKey = `checkout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required for checkout' });
    }

    // Build line items for the order
    const lineItems = items.map((item, index) => {
      // Handle CartItem structure: item has product object and total price
      const itemName = item.product?.name || item.name || `Item ${index + 1}`;
      const basePrice = item.product?.price || 0;
      const quantity = item.quantity || 1;
      
      // Calculate modifiers/add-ons separately
      const modifiers = [];
      let addOnTotal = 0;
      
      if (item.selectedVariants && item.product?.variants) {
        Object.entries(item.selectedVariants).forEach(([variantId, selectedValue]) => {
          const variant = item.product.variants?.find(v => v.id === variantId);
          if (variant) {
            if (Array.isArray(selectedValue)) {
              selectedValue.forEach(value => {
                const option = variant.options.find(opt => opt.name === value);
                if (option && option.price !== undefined && option.price > 0) {
                  addOnTotal += option.price;
                  modifiers.push({
                    name: `${variant.name}: ${option.name}`,
                    base_price_money: {
                      amount: Math.round(option.price * 100),
                      currency: 'USD'
                    }
                  });
                }
              });
            } else {
              const option = variant.options.find(opt => opt.name === selectedValue);
              if (option && option.price !== undefined && option.price > 0) {
                addOnTotal += option.price;
                modifiers.push({
                  name: `${variant.name}: ${option.name}`,
                  base_price_money: {
                    amount: Math.round(option.price * 100),
                    currency: 'USD'
                  }
                });
              }
            }
          }
        });
      }
      
      // Validate item data
      if (basePrice <= 0) {
        throw new Error(`Invalid base price for item: ${itemName}`);
      }
      
      const lineItem = {
        name: itemName,
        quantity: quantity.toString(),
        base_price_money: {
          amount: Math.round(basePrice * 100), // Base price only
          currency: 'USD'
        }
      };
      
      // Add modifiers if any
      if (modifiers.length > 0) {
        lineItem.modifiers = modifiers;
      }
      
      // Add special instructions as note
      if (item.specialInstructions) {
        lineItem.note = item.specialInstructions;
      }
      
      // Add variation details for non-pricing options
      if (item.selectedVariants && item.product?.variants) {
        const nonPricingVariations = [];
        Object.entries(item.selectedVariants).forEach(([variantId, selectedValue]) => {
          const variant = item.product.variants?.find(v => v.id === variantId);
          if (variant) {
            if (Array.isArray(selectedValue)) {
              selectedValue.forEach(value => {
                const option = variant.options.find(opt => opt.name === value);
                if (option && (option.price === undefined || option.price === 0)) {
                  nonPricingVariations.push(`${variant.name}: ${option.name}`);
                }
              });
            } else {
              const option = variant.options.find(opt => opt.name === selectedValue);
              if (option && (option.price === undefined || option.price === 0)) {
                nonPricingVariations.push(`${variant.name}: ${option.name}`);
              }
            }
          }
        });
        
        if (nonPricingVariations.length > 0) {
          const existingNote = lineItem.note || '';
          lineItem.note = existingNote ? `${existingNote} | ${nonPricingVariations.join(', ')}` : nonPricingVariations.join(', ');
        }
      }
      
      return lineItem;
    });

    console.log('Creating checkout with line items:', JSON.stringify(lineItems, null, 2));
    
    // Add discounts to the order if present
    const orderDiscounts = [];
    if (appliedDiscounts && appliedDiscounts.length > 0) {
      appliedDiscounts.forEach(discount => {
        orderDiscounts.push({
          name: discount.name,
          percentage: discount.type === 'percentage' ? discount.value.toString() : undefined,
          amount_money: discount.type === 'fixed_amount' ? {
            amount: Math.round(discount.appliedAmount * 100), // Convert to cents
            currency: 'USD'
          } : undefined,
          scope: 'ORDER'
        });
      });
    }
    
    // Ensure we have a valid location ID
    let locationId = pickupLocation?.id;
    if (!locationId) {
      // Fetch the main location from Square API instead of using hardcoded value
      try {
        const locationsResponse = await makeSquareRequest('/locations');
        if (locationsResponse.locations && locationsResponse.locations.length > 0) {
          locationId = locationsResponse.locations[0].id;
          // Using main location ID from Square API
        } else {
          throw new Error('No locations found in Square account');
        }
      } catch (locationError) {
        console.error('Failed to fetch location from Square API:', locationError);
        return res.status(400).json({ 
          error: 'Unable to determine store location. Please select a pickup location.' 
        });
      }
    }

    // Create checkout with order data directly (order-based checkout)
    const checkoutData = {
      idempotency_key: idempotencyKey,
      order: {
        location_id: locationId,
        line_items: lineItems,
        ...(orderDiscounts.length > 0 && { discounts: orderDiscounts }),
        fulfillments: [{
          type: 'PICKUP',
          state: 'PROPOSED',
          pickup_details: {
            recipient: {
              display_name: customer?.name || 'Customer'
            },
            pickup_at: (() => {
              // Frontend sends date as YYYY-MM-DD and time as HH:MM
              // We treat this as Central Time since that's where the store is located
              
              try {
                // Create a date object for the specific pickup date to determine timezone offset
                // Use noon on the pickup date to avoid any edge cases with time
                const testDate = new Date(`${pickupDate}T12:00:00`);
                
                // Use Intl.DateTimeFormat to get the timezone offset for Central Time on this specific date
                const formatter = new Intl.DateTimeFormat('en', {
                  timeZone: 'America/Chicago',
                  timeZoneName: 'longOffset'
                });
                
                const parts = formatter.formatToParts(testDate);
                const timeZonePart = parts.find(part => part.type === 'timeZoneName');
                let timezoneOffset = '-06:00'; // Default to CST
                
                if (timeZonePart && timeZonePart.value) {
                  // Parse the offset (e.g., "GMT-6" or "GMT-5")
                  const offsetMatch = timeZonePart.value.match(/GMT([+-]\d+)/);
                  if (offsetMatch) {
                    const offset = parseInt(offsetMatch[1]);
                    timezoneOffset = offset === -5 ? '-05:00' : '-06:00';
                  }
                }
                
                // Pickup time calculated with timezone offset
                return `${pickupDate}T${pickupTime}:00${timezoneOffset}`;
                
              } catch (error) {
                console.error('Error determining timezone:', error);
                // Fallback to CST
                return `${pickupDate}T${pickupTime}:00-06:00`;
              }
            })(),
            note: 'Order placed via online checkout'
          }
        }]
      },
      checkout_options: {
        ask_for_shipping_address: false,
        merchant_support_email: customer?.email || 'support@fettermans.com',
        redirect_url: `${req.headers.origin || 'http://localhost:3000'}/checkout/success`
      },
      pre_populated_data: {
        ...(customer?.email && { buyer_email: customer.email })
      }
    };
    

    
    const data = await makeSquareRequest('/online-checkout/payment-links', {
      method: 'POST',
      body: JSON.stringify(checkoutData)
    });
    

    
    // Return the checkout URL
    res.json({
      checkoutUrl: data.payment_link?.url,
      orderId: data.payment_link?.order_id
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});





// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Store status check
app.get('/api/store/status', (req, res) => {
  const storeOnline = process.env.STORE_ONLINE === 'true';
  res.json({ 
    online: storeOnline,
    status: storeOnline ? 'Online ordering available' : 'Online ordering disabled',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);

});