// Enhanced Food Ordering System Types

// Enhanced Category Management with Square API Hierarchical Support
// Square's Catalog API supports parent-child relationships through the parent_category field
// Best Practice: Use parent categories (level 0) for main navigation, subcategories (level 1+) for dropdowns
// Example: "Beverages" (parent) -> "Soda", "Juices" (subcategories)
export interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  parentId?: string; // Square API: parent_category field - links to parent category ID
  subcategories?: Category[]; // Child categories - populated during hierarchy building
  level: number; // 0 for parent categories (shown in nav), 1+ for subcategories (shown in dropdowns)
  createdAt: string;
  updatedAt: string;
}

// Category Hierarchy Helper Types for Navigation
export interface CategoryHierarchy {
  parentCategories: Category[]; // Categories with subcategories (show with dropdowns)
  standaloneCategories: Category[]; // Categories without subcategories (direct navigation)
  subcategoryMap: Map<string, Category[]>; // Map of parent ID to subcategories
}

export interface NavigationCategory extends Category {
  hasSubcategories: boolean;
  productCount: number;
}

// Enhanced Product Variant System with Square CatalogItemVariation support
export interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
  type: 'weight' | 'volume' | 'length' | 'area' | 'generic';
  precision?: number;
}

// Square-specific measurement unit interface
export interface SquareMeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
  type: 'CUSTOM' | 'GENERIC';
  precision: number;
  customUnit?: {
    name: string;
    abbreviation: string;
  };
  genericUnit?: string; // e.g., 'OUNCE', 'POUND', 'FLUID_OUNCE'
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariantOption {
  id: string;
  name: string;
  price?: number; // Additional cost in cents
  squareVariationId?: string; // Square CatalogItemVariation ID
  stockable?: boolean;
  sellable?: boolean;
  measurementUnit?: MeasurementUnit;
  unitQuantity?: number; // Quantity in the specified unit
}

export interface ProductVariant {
  id: string;
  name: string;
  type: 'dropdown' | 'checklist';
  options: ProductVariantOption[];
  squareModifierListId?: string; // Square CatalogModifierList ID
  selectionType?: 'SINGLE' | 'MULTIPLE';
  minSelectedModifiers?: number;
  maxSelectedModifiers?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Common measurement units for food service
export const MEASUREMENT_UNITS: { [key: string]: MeasurementUnit } = {
  OUNCE: {
    id: 'oz',
    name: 'Ounce',
    abbreviation: 'oz',
    type: 'weight',
    precision: 2
  },
  POUND: {
    id: 'lb',
    name: 'Pound',
    abbreviation: 'lb',
    type: 'weight',
    precision: 2
  },
  FLUID_OUNCE: {
    id: 'fl_oz',
    name: 'Fluid Ounce',
    abbreviation: 'fl oz',
    type: 'volume',
    precision: 2
  },
  EACH: {
    id: 'each',
    name: 'Each',
    abbreviation: 'ea',
    type: 'generic',
    precision: 0
  }
};

// Condiments and Extras
// Removed redundant Condiment and ProductCustomization interfaces
// All customizations now handled through the unified ProductVariant system

// Enhanced Product Interface with Square CatalogItem support


// Enhanced Product Interface with Square CatalogItem support

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Base price in cents
  originalPrice?: number;
  categoryId?: string;
  category: string;
  categoryIds?: string[];
  categories?: string[];
  brand: string;
  stock?: number; // Optional - not all systems track inventory
  images: string[];
  foodType: FoodType[];
  tags: string[];
  specifications: { [key: string]: string };
  
  // Enhanced variant system with Square support
  variants?: ProductVariant[];
  
  // Square-specific fields
  squareItemId?: string; // Square CatalogItem ID
  squareVariationId?: string; // Primary Square CatalogItemVariation ID
  measurementUnit?: MeasurementUnit; // Default unit for this product
  unitQuantity?: number; // Quantity in the specified unit (e.g., 0.5 for half pound)
  stockable?: boolean; // Whether this item can be tracked in inventory
  sellable?: boolean; // Whether this item can be sold
  
  isFeatured?: boolean; // Optional - not all products need to be featured
  ingredients?: string[];
  allergens?: string[];
  nutritionalInfo?: { [key: string]: any }; // Nutritional information
  preparationTime?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Enhanced Cart Item with unified variant-based customizations
export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedVariants?: {
    [variantId: string]: string | string[]; // Selected option IDs
  };
  specialInstructions?: string;
  totalPrice: number; // Calculated with all customizations
  addedAt: string;
}

// Enhanced Order Item with unified variant-based customizations
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  basePrice: number;
  selectedVariants?: {
    [variantId: string]: string | string[]; // Selected option IDs
  };
  specialInstructions?: string;
  totalPrice: number;
}

// Admin Dashboard Stats
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCategories: number;
  todayOrders: number;
  todayRevenue: number;
  popularProducts: {
    id: string;
    name: string;
    orderCount: number;
    revenue: number;
  }[];
  recentOrders: Order[];
  monthlyGrowth: {
    orders: number;
    revenue: number;
  };
}

// Location Selection
export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email?: string;
  hours: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  features: string[];
  estimatedWaitTime: number; // in minutes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}



// Enhanced Discount System with Square Catalog API support
export interface Discount {
  id: string;
  code?: string; // Coupon code (optional for automatic discounts)
  name: string;
  description: string;
  type: DiscountType;
  value: number; // Percentage (0-100) or fixed amount in cents
  minOrderAmount?: number; // Minimum order amount to apply discount
  maxDiscountAmount?: number; // Maximum discount amount for percentage discounts
  validFrom: string;
  validUntil: string;
  usageLimit?: number; // Total usage limit
  usageCount: number; // Current usage count
  isActive: boolean;
  applicableCategories?: string[]; // Category IDs where discount applies
  applicableProducts?: string[]; // Product IDs where discount applies
  
  // Square-specific fields
  squareDiscountId?: string; // Square CatalogDiscount ID
  squareDiscountType?: 'FIXED_PERCENTAGE' | 'FIXED_AMOUNT' | 'VARIABLE_PERCENTAGE' | 'VARIABLE_AMOUNT';
  scope?: 'ORDER' | 'LINE_ITEM'; // Square discount scope
  rewardTier?: {
    points?: number;
    name?: string;
  }; // For loyalty program integration
  
  // Advanced discount rules
  conditions?: {
    minimumQuantity?: number;
    applicableItemIds?: string[];
    applicableCategoryIds?: string[];
    customerSegments?: string[];
    timeRestrictions?: {
      dayOfWeek?: number[];
      startTime?: string;
      endTime?: string;
    };
  };
  
  createdAt: string;
  updatedAt: string;
}

export type DiscountType = 
  | 'percentage' // Percentage off (e.g., 10% off)
  | 'fixed_amount' // Fixed amount off (e.g., $5 off)
  | 'buy_x_get_y' // Buy X get Y free/discounted
  | 'free_shipping' // Free delivery (if applicable)
  | 'loyalty_points' // Loyalty program discount
  | 'automatic'; // Automatic catalog-based discount

export interface AppliedDiscount {
  discountId: string;
  code?: string;
  name: string;
  type: DiscountType;
  value: number;
  appliedAmount: number; // Actual discount amount applied
  appliedTo: 'order' | 'item';
  itemIds?: string[]; // If applied to specific items
  discount: Discount; // Reference to the full discount object
}

// Enhanced Order with pickup location and discount support
export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  appliedDiscounts?: AppliedDiscount[]; // Track multiple discounts
  total: number; // Ensure this exists
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  pickupLocation: StoreLocation;
  paymentMethod: string;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  specialInstructions?: string;
  estimatedReadyTime?: string;
  actualReadyTime?: string;
  pickupTime?: string;
  createdAt: string;
  updatedAt: string;
}



export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked-up'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

// Enhanced Cart Context with unified variant-based customizations and discount support
export interface CartContextType {
  items: CartItem[];
  selectedLocation: StoreLocation | null;
  storeLocations: StoreLocation[];
  appliedDiscounts: AppliedDiscount[];
  selectedPickupDate: string | null;
  selectedPickupTime: string | null;
  addToCart: (
    product: Product, 
    quantity: number, 
    customizations?: {
      selectedVariants?: { [variantId: string]: string | string[]; };
    },
    specialInstructions?: string
  ) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateCustomizations: (itemId: string, customizations: {
    selectedVariants?: { [variantId: string]: string | string[]; };
  }) => void;
  updateSpecialInstructions: (itemId: string, instructions: string) => void;
  setPickupLocation: (location: StoreLocation) => void;
  setPickupDateTime: (date: string, time: string) => void;
  applyDiscount: (code: string) => Promise<boolean>;
  removeDiscount: (discountId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getSubtotal: () => number;
  getTotalDiscount: () => number;
  getEstimatedPickupTime: () => Date | null;
}

// Admin Management Types - simplified to focus on categories and variants
export interface AdminContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  
  // Category management
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Data fetching
  fetchCategories: () => Promise<void>;
}

// Global Variant Management (for admin)
export interface VariantOption {
  id: string;
  name: string;
  price?: number;
}

export interface Variant {
  id: string;
  name: string;
  type: 'dropdown' | 'checklist';
  options: VariantOption[];
  createdAt: string;
  updatedAt: string;
}

// Old ProductVariant interface removed - now using the new ProductVariant interface defined earlier

export type FoodType = 
  | 'italian'
  | 'chinese'
  | 'indian'
  | 'mexican'
  | 'american'
  | 'thai'
  | 'japanese'
  | 'mediterranean'
  | 'fusion'
  | 'local';

// Add missing FoodCategory type
export type FoodCategory = 
  | 'sandwiches'
  | 'beverages'
  | 'appetizers'
  | 'salads'
  | 'desserts'
  | 'sides'
  | 'soups'
  | 'entrees';










export interface FilterOptions {
  categoryId?: string;
  foodType?: FoodType;
  priceRange?: [number, number];
  rating?: number;
  inStock?: boolean;
  onSale?: boolean;
}

export interface SortOptions {
  field: 'name' | 'price' | 'rating' | 'createdAt' | 'preparationTime';
  direction: 'asc' | 'desc';
}

// Discount validation result
export interface DiscountValidationResult {
  isValid: boolean;
  discount?: Discount;
  error?: string;
  appliedAmount?: number;
}