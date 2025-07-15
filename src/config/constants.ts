// Application Constants

// Note: Tax rates are handled by Square based on location configuration
// Tip calculations are also managed through Square's payment system

// Order Configuration
export const MINIMUM_ORDER_AMOUNT = 10.00;

// Time Constants (in minutes)
export const DEFAULT_PREPARATION_TIME = 5;
export const ORDER_PROCESSING_BUFFER = 12;
export const PICKUP_TIME_SLOTS = [15, 30, 45, 60, 90, 120]; // Available pickup time slots

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PRODUCTS_PER_PAGE = 12;
export const ORDERS_PER_PAGE = 10;
export const USERS_PER_PAGE = 15;

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGES_PER_PRODUCT = 5;

// Validation
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PRODUCT_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_SPECIAL_INSTRUCTIONS_LENGTH = 200;

// UI Constants
export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;
export const DESKTOP_BREAKPOINT = 1280;

// Toast Duration
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000
};

// Cache Duration (in milliseconds)
export const CACHE_DURATION = {
  PRODUCTS: 5 * 60 * 1000, // 5 minutes
  CATEGORIES: 10 * 60 * 1000, // 10 minutes
  STORE_LOCATIONS: 30 * 60 * 1000, // 30 minutes
  USER_PROFILE: 15 * 60 * 1000 // 15 minutes
};

// API Retry Configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  BACKOFF_MULTIPLIER: 2
};

// Order Status Colors
export const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  'picked-up': 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800'
};

// Payment Status Colors
export const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800'
};

// User Role Colors
export const USER_ROLE_COLORS = {
  user: 'bg-blue-100 text-blue-800',
  admin: 'bg-purple-100 text-purple-800'
};

// Spice Level Configuration
export const SPICE_LEVELS = {
  mild: { label: 'Mild', color: 'text-green-600', icon: '🌶️' },
  medium: { label: 'Medium', color: 'text-yellow-600', icon: '🌶️🌶️' },
  hot: { label: 'Hot', color: 'text-orange-600', icon: '🌶️🌶️🌶️' },
  'extra-hot': { label: 'Extra Hot', color: 'text-red-600', icon: '🌶️🌶️🌶️🌶️' }
};

// Default User Preferences
export const DEFAULT_USER_PREFERENCES = {
  favoriteCategories: [],
  spiceLevel: 'mild' as const,
  newsletter: false,
  notifications: {
    email: true,
    sms: false,
    push: true,
    orderReady: true
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  PAYMENT_FAILED: 'Payment failed. Please try again or use a different payment method.',
  ORDER_NOT_FOUND: 'Order not found. Please check your order number.',
  PRODUCT_OUT_OF_STOCK: 'This product is currently out of stock.',
  LOCATION_REQUIRED: 'Please select a pickup location before adding items to cart.',
  GENERIC: 'An unexpected error occurred. Please try again.',
  FAILED_TO_LOAD: 'Failed to load data. Please try again.',
  FAILED_TO_SAVE: 'Failed to save. Please try again.',
  FAILED_TO_UPDATE: 'Failed to update. Please try again.',
  FAILED_TO_DELETE: 'Failed to delete. Please try again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_IN_USE: 'This email is already registered.',
  WEAK_PASSWORD: 'Password is too weak. Please choose a stronger password.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  ORDER_PLACED: 'Order placed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  ITEM_ADDED_TO_CART: 'Item added to cart!',
  ITEM_REMOVED_FROM_CART: 'Item removed from cart!',
  CART_CLEARED: 'Cart cleared!',
  LOCATION_SELECTED: 'Pickup location selected!',
  PASSWORD_UPDATED: 'Password updated successfully!',
  EMAIL_VERIFIED: 'Email verified successfully!',
  ITEM_ADDED: 'Item added successfully!',
  ITEM_UPDATED: 'Item updated successfully!',
  ITEM_DELETED: 'Item deleted successfully!'
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,3}[\s\-\(\)]?[\d]{1,4}[\s\-\(\)]?[\d]{1,4}[\s\-\(\)]?[\d]{1,9}$/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,2}[\s\-\.]?[\(]?[\d]{1,3}[\)]?[\s\-\.]?[\d]{3,4}[\s\-\.]?[\d]{3,4}$/,
  PASSWORD_MIN_LENGTH: MIN_PASSWORD_LENGTH,
  PASSWORD: {
    MIN_LENGTH: MIN_PASSWORD_LENGTH,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },
  PRODUCT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: MAX_PRODUCT_NAME_LENGTH
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: MAX_DESCRIPTION_LENGTH
  },
  PRICE: {
    MIN: 0.01,
    MAX: 9999.99
  },
  MIN_PRICE: 0.01,
  MAX_PRICE: 9999.99,
  MAX_FILE_SIZE: MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES: ALLOWED_IMAGE_TYPES,
  SPECIAL_INSTRUCTIONS: {
    MAX_LENGTH: MAX_SPECIAL_INSTRUCTIONS_LENGTH
  },
  QUANTITY: {
    MIN: 1,
    MAX: 99
  },
  ZIP_CODE: /^[0-9]{5}(-[0-9]{4})?$/,
  CREDIT_CARD: /^[0-9]{13,19}$/,
  CVV: /^[0-9]{3,4}$/
};