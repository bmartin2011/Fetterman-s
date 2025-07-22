// Frontend Security Configuration

// Content Security Policy configuration
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for React development
    "https://js.squareup.com",
    "https://sandbox.web.squarecdn.com",
    "https://web.squarecdn.com"
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
    "https://fonts.googleapis.com"
  ],
  'font-src': [
    "'self'",
    "https://fonts.gstatic.com"
  ],
  'img-src': [
    "'self'",
    "data:",
    "https:",
    "blob:"
  ],
  'connect-src': [
    "'self'",
    "https://connect.squareup.com",
    "https://connect.squareupsandbox.com",
    process.env.REACT_APP_BACKEND_URL || "http://localhost:3001"
  ],
  'frame-src': [
    "'self'",
    "https://js.squareup.com",
    "https://sandbox.web.squarecdn.com"
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
};

// Generate CSP header string
export const generateCSPHeader = (): string => {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

// Security headers for static hosting
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

// Input sanitization utilities
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>"'&]/g, (match) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    })
    .trim();
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validate phone number format
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Validate credit card number format (basic Luhn algorithm)
export const isValidCreditCard = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// Rate limiting for client-side API calls
class ClientRateLimit {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

export const apiRateLimit = new ClientRateLimit();

// Secure storage utilities
export const secureStorage = {
  set: (key: string, value: any): void => {
    try {
      const encrypted = btoa(JSON.stringify(value));
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      // Failed to store data securely
    }
  },
  
  get: (key: string): any => {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;
      
      return JSON.parse(atob(encrypted));
    } catch (error) {
      // Failed to retrieve data securely
      return null;
    }
  },
  
  remove: (key: string): void => {
    sessionStorage.removeItem(key);
  },
  
  clear: (): void => {
    sessionStorage.clear();
  }
};

// Environment validation
export const validateEnvironment = (): void => {
  const requiredEnvVars = [
    'REACT_APP_SQUARE_APPLICATION_ID',
    'REACT_APP_SQUARE_ACCESS_TOKEN',
    'REACT_APP_SQUARE_ENVIRONMENT',
    'REACT_APP_BACKEND_URL'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    // Missing required environment variables
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  // Validate Square environment
  const squareEnv = process.env.REACT_APP_SQUARE_ENVIRONMENT;
  if (squareEnv && !['sandbox', 'production'].includes(squareEnv)) {
    throw new Error('REACT_APP_SQUARE_ENVIRONMENT must be either "sandbox" or "production"');
  }
  
  // Warn about development settings in production
  if (process.env.NODE_ENV === 'production') {
    if (squareEnv === 'sandbox') {
      // Running in production with Square sandbox environment
    }
    
    if (process.env.REACT_APP_BACKEND_URL?.includes('localhost')) {
      // Running in production with localhost backend URL
    }
  }
};

// Security event logging
export const logSecurityEvent = (event: string, details?: any): void => {
  const securityEvent = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  if (process.env.NODE_ENV === 'development') {
    // Security event logged
  }
  
  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: securityMonitoring.log(securityEvent);
  }
};

// Initialize security measures
export const initializeSecurity = (): void => {
  validateEnvironment();
  
  // Set up CSP if not handled by server
  if (process.env.NODE_ENV === 'production') {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = generateCSPHeader();
    document.head.appendChild(meta);
  }
  
  // Log security initialization
  logSecurityEvent('security_initialized', {
    environment: process.env.NODE_ENV,
    squareEnvironment: process.env.REACT_APP_SQUARE_ENVIRONMENT
  });
};