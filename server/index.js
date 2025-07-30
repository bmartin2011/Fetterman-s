const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const { createRateLimiter, helmetConfig, getCorsConfig, sanitizeInput } = require('./config/security');
require('dotenv').config({ path: './server/.env' });

const app = express();
const PORT = process.env.PORT || 3001;
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
  
  if (cleaned > 0 && process.env.NODE_ENV === 'development') {
    console.log(`Cleaned ${cleaned} expired cache entries`);
  }
}, 10 * 60 * 1000);

// Security middleware
app.use(helmet(helmetConfig));

// Rate limiting
app.use('/api/', createRateLimiter());

// CORS configuration
app.use(cors(getCorsConfig()));

// Input sanitization
app.use(sanitizeInput);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${timestamp}] ${req.method} ${req.url}`);
      console.log('Headers:', req.headers);
      
      if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
      }
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.log(`Cache hit for ${endpoint}`);
    }
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

  if (process.env.NODE_ENV === 'development') {
    console.log(`Cache miss for ${endpoint} - cached for ${ttl}ms`);
  }
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
      console.log('Fetching products with request body:', JSON.stringify(requestBody, null, 2));
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
          console.log(`Hidden category found: ${categoryData.name} (${category.id})`);
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
            console.log(`Filtering out archived item: ${itemData.name}`);
          }
          return false;
        }
        
        // Filter out items with visibility set to 'PRIVATE'
        if (itemData.visibility === 'PRIVATE') {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Filtering out private item: ${itemData.name}`);
          }
          return false;
        }
        
        // Filter out items that belong to hidden categories
        if (itemData.categories) {
          const itemCategoryIds = itemData.categories.map(cat => cat.id || cat);
          const belongsToHiddenCategory = itemCategoryIds.some(catId => hiddenCategoryIds.has(catId));
          if (belongsToHiddenCategory) {
            if (process.env.NODE_ENV === 'development') {
            console.log(`Filtering out item in hidden category: ${itemData.name}`);
          }
            return false;
          }
        }
        
        // Also check legacy category_id field
        if (itemData.category_id && hiddenCategoryIds.has(itemData.category_id)) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Filtering out item in hidden category (legacy): ${itemData.name}`);
          }
          return false;
        }
        
        return true;
      });
      
      const filteredCount = productsData.objects.length;
      if (process.env.NODE_ENV === 'development') {
        console.log(`Products fetched: ${originalCount}, after visibility filtering: ${filteredCount}`);
        console.log('All products fetched - location filtering will be handled client-side');
      }
    }
    
    res.json(productsData);
  } catch (error) {
    console.error('Error fetching products:', error);
    console.error('Full error details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Square categories
app.post('/api/square/categories', async (req, res) => {
  try {
    // Use catalog/search endpoint for categories - fetch ALL categories to see hierarchy
    // Removed category_type filter to see all category types including parent/child relationships
    // Filter out deleted categories (archived filtering handled by include_deleted_objects)
    // Include related objects for complete category data
    const requestBody = {
      object_types: ['CATEGORY'],
      include_deleted_objects: false,
      include_related_objects: true
    };
    
    const data = await makeSquareRequest('/catalog/search', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    
    // Filter out categories with online_visibility set to false
    if (data.objects) {
      const originalCount = data.objects.length;
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n📂 Processing ${originalCount} categories for visibility filtering...`);
      }
      
      data.objects = data.objects.filter(category => {
        if (category.type !== 'CATEGORY' || !category.category_data) {
          return true; // Keep non-category objects
        }
        
        const categoryData = category.category_data;
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Checking category: ${categoryData.name} - online_visibility: ${categoryData.online_visibility}`);
        }
        
        // Filter out categories that are explicitly hidden online
        // online_visibility: false means hidden, true or undefined means visible
        if (categoryData.online_visibility === false) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`❌ Filtering out hidden category: ${categoryData.name}`);
          }
          return false;
        }
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Keeping visible category: ${categoryData.name}`);
          }
        return true;
      });
      
      const filteredCount = data.objects.length;
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n📊 Categories summary: ${originalCount} fetched → ${filteredCount} after visibility filtering\n`);
      }
    }
    
    res.json(data);
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
    
    // Build line items for the order
    const lineItems = items.map(item => {
      // Handle CartItem structure: item has product object and base price
      const itemName = item.product?.name || item.name || 'Item';
      const itemPrice = item.product?.price || item.price || 0;
      
      const lineItem = {
        name: itemName,
        quantity: item.quantity.toString(),
        base_price_money: {
          amount: Math.round(itemPrice * 100), // Convert to cents
          currency: 'USD'
        }
      };
      
      // Add variations/modifiers if present
      if (item.selectedVariants && Object.keys(item.selectedVariants).length > 0) {
        const modifiers = [];
        Object.entries(item.selectedVariants).forEach(([variantId, selection]) => {
          if (Array.isArray(selection)) {
            selection.forEach(option => {
              modifiers.push({
                name: option,
                base_price_money: {
                  amount: 0, // Modifier pricing can be added here if needed
                  currency: 'USD'
                }
              });
            });
          } else if (selection) {
            modifiers.push({
              name: selection,
              base_price_money: {
                amount: 0, // Modifier pricing can be added here if needed
                currency: 'USD'
              }
            });
          }
        });
        
        if (modifiers.length > 0) {
          lineItem.modifiers = modifiers;
        }
      }
      
      // Add special instructions as note
      if (item.specialInstructions) {
        lineItem.note = item.specialInstructions;
      }
      
      return lineItem;
    });
    
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
    
    // Create checkout with order data directly (order-based checkout)
    const checkoutData = {
      idempotency_key: idempotencyKey,
      order: {
        location_id: pickupLocation?.id || process.env.REACT_APP_SQUARE_LOCATION_ID,
        pricing_options: {
          auto_apply_taxes: true
        },
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
              // Fixed Central Time for Missouri store
              const now = new Date();
              const january = new Date(now.getFullYear(), 0, 1);
              const july = new Date(now.getFullYear(), 6, 1);
              
              // Determine if Central Time is in DST using America/Chicago timezone
              const centralJan = new Date(january.toLocaleString("en-US", {timeZone: "America/Chicago"}));
              const centralJuly = new Date(july.toLocaleString("en-US", {timeZone: "America/Chicago"}));
              const isDST = centralJuly.getTimezoneOffset() < centralJan.getTimezoneOffset();
              
              const timezoneOffset = isDST ? '-05:00' : '-06:00'; // CDT vs CST
              return `${pickupDate}T${pickupTime}:00${timezoneOffset}`;
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating checkout with data:', JSON.stringify(checkoutData, null, 2));
    }
    
    const data = await makeSquareRequest('/online-checkout/payment-links', {
      method: 'POST',
      body: JSON.stringify(checkoutData)
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Checkout response:', JSON.stringify(data, null, 2));
    }
    
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
  console.log(`🚀 Square proxy server running on port ${PORT}`);
if (process.env.NODE_ENV === 'development') {
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`🔗 Square Environment: ${SQUARE_ENVIRONMENT}`);
  console.log(`⏰ Server started at: ${new Date().toISOString()}`);
  console.log(`✅ Server ready to accept requests`);
}
});