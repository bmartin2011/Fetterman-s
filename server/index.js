const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const { createRateLimiter, helmetConfig, getCorsConfig, sanitizeInput } = require('./config/security');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

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
  
  if (cleaned > 0) {
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

// Handle CORS preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});

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
    console.log(`Cache hit for ${endpoint}`);
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

  console.log(`Cache miss for ${endpoint} - cached for ${ttl}ms`);
  return data;
}

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
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
    // Use catalog/search endpoint to get full item objects with custom attribute values
    // This endpoint returns complete objects in the 'objects' array
    const requestBody = {
      object_types: ['ITEM'],
      include_deleted_objects: false,
      include_related_objects: true
    };
    
    const data = await makeSquareRequest('/catalog/search', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    res.json(data);
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
    const requestBody = {
      object_types: ['CATEGORY'],
      include_deleted_objects: false,
      include_related_objects: true
    };
    
    const data = await makeSquareRequest('/catalog/search', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
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

// Create Square order
app.post('/api/square/orders', async (req, res) => {
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
app.post('/api/square/payment', [
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
app.post('/api/square/create-checkout', async (req, res) => {
  try {
    const { items, customerInfo, pickupLocation, appliedDiscounts } = req.body;
    
    // Generate unique idempotency key
    const idempotencyKey = `checkout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // First, create an order with line items
    const lineItems = items.map(item => {
      const lineItem = {
        name: item.name,
        quantity: item.quantity.toString(),
        base_price_money: {
          amount: Math.round((item.price || 0) * 100), // Convert to cents
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
    
    // Create checkout session with order data
    const checkoutData = {
      idempotency_key: idempotencyKey,
      order: {
        location_id: pickupLocation?.id || process.env.REACT_APP_SQUARE_LOCATION_ID,
        line_items: lineItems,
        state: 'OPEN'
      },
      checkout_options: {
        ask_for_shipping_address: false,
        merchant_support_email: customerInfo.email || 'support@fettermans.com',
        redirect_url: `${req.headers.origin || 'http://localhost:3000'}/checkout/success`
      },
      pre_populated_data: {
        ...(customerInfo.email && { buyer_email: customerInfo.email }),
        ...(customerInfo.phone && customerInfo.phone.trim() && { buyer_phone_number: customerInfo.phone.trim() })
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
    res.status(500).json({ error: error.message });
  }
});





// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Square proxy server running on port ${PORT}`);
  if (process.env.NODE_ENV === 'development') {
    console.log(`Environment: ${SQUARE_ENVIRONMENT}`);
    console.log(`Square Base URL: ${SQUARE_BASE_URL}`);
  }
});