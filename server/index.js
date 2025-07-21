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
    // Use SearchCatalogItems which supports archived_state_filter
    const requestBody = {
      archived_state_filter: 'ARCHIVED_STATE_NOT_ARCHIVED'
    };
    
    const data = await makeSquareRequest('/catalog/search-catalog-items', {
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
    // Filter out deleted categories (archived filtering handled by include_deleted_objects)
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
    const { items, customerInfo, pickupLocation, appliedDiscounts, pickupDate, pickupTime } = req.body;
    // Handle both customer and customerInfo for backward compatibility
    const customer = customerInfo || req.body.customer;
    
    // Generate unique idempotency key
    const idempotencyKey = `checkout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Build line items for the order
    const lineItems = items.map(item => {
      // Handle CartItem structure: item has product object and totalPrice
      const itemName = item.product?.name || item.name || 'Item';
      const itemPrice = item.totalPrice || item.product?.price || item.price || 0;
      
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
        line_items: lineItems,
        ...(orderDiscounts.length > 0 && { discounts: orderDiscounts }),
        fulfillments: [{
          type: 'PICKUP',
          state: 'PROPOSED',
          pickup_details: {
            recipient: {
              display_name: customer?.name || 'Customer'
            },
            pickup_at: pickupDate && pickupTime 
              ? new Date(`${pickupDate}T${pickupTime}`).toISOString()
              : new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Default to 30 minutes from now
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
    
    console.log('Creating checkout with data:', JSON.stringify(checkoutData, null, 2));
    
    const data = await makeSquareRequest('/online-checkout/payment-links', {
      method: 'POST',
      body: JSON.stringify(checkoutData)
    });
    
    console.log('Checkout response:', JSON.stringify(data, null, 2));
    
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Square proxy server running on port ${PORT}`);
  console.log(`Server started at ${new Date().toISOString()}`);
  if (process.env.NODE_ENV === 'development') {
    console.log(`Environment: ${SQUARE_ENVIRONMENT}`);
    console.log(`Square Base URL: ${SQUARE_BASE_URL}`);
  }
});