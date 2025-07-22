// Security Configuration
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const NODE_ENV = process.env.NODE_ENV || 'development';

// Rate limiting configuration
const createRateLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: NODE_ENV === 'production' ? 100 : 1000,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks
    skip: (req) => req.path === '/health',
    // Disable trust proxy validation for Railway deployment
    validate: {
      trustProxy: false
    }
  });
};

// Helmet security configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://sandbox-web.squarecdn.com", 
        "https://web.squarecdn.com"
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'", 
        "https://connect.squareupsandbox.com", 
        "https://connect.squareup.com"
      ],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for Square SDK compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
};

// CORS configuration
const getCorsConfig = () => {
  const defaultProductionOrigins = [
    'https://fetterman-s-production.up.railway.app',
    'https://fetterman-eck3c5e5m-fettermans.vercel.app',
    'https://fettermans.vercel.app',
    'https://www.fettermans.com',
    'https://fettermans.com'
  ];
  
  const allowedOrigins = NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : defaultProductionOrigins)
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3002', 'http://127.0.0.1:3002'];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      // In production, also allow any vercel.app subdomain for flexibility
      if (NODE_ENV === 'production' && origin && origin.includes('.vercel.app')) {
        callback(null, true);
        return;
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };
};

// Input sanitization
const sanitizeInput = (req, res, next) => {
  // Basic XSS protection - remove script tags
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script[^>]*>.*?<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

module.exports = {
  createRateLimiter,
  helmetConfig,
  getCorsConfig,
  sanitizeInput
};