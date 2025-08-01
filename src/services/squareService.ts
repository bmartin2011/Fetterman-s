import { CartItem, StoreLocation, Product, Category, CategoryAvailabilityPeriod, ProductVariant, ProductVariantOption, OrderStatus, Discount, AppliedDiscount, DiscountValidationResult, DiscountType, SquareMeasurementUnit, MeasurementUnit } from '../types';
import { apiCache, createCacheKey } from '../utils/cache';
import { trackApiCall, trackError } from '../utils/performance';

export interface SquareCheckoutData {
  items: CartItem[];
  pickupLocation: StoreLocation;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  appliedDiscounts?: AppliedDiscount[];
  pickupDate?: string;
  pickupTime?: string;
}

// Square Web Payments SDK types
interface SquarePayments {
  card: (options?: any) => Promise<SquareCard>;
}

interface SquareCard {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<TokenResult>;
}

interface TokenResult {
  status: 'OK' | 'INVALID_CARD' | 'VALIDATION_ERROR' | 'UNSUPPORTED_CARD_BRAND' | 'GENERIC_DECLINE';
  token?: string;
  details?: Record<string, unknown>;
  errors?: Array<{ message: string; field?: string; type?: string }>;
}

interface SquareSDK {
  payments: (applicationId: string, locationId: string) => SquarePayments;
}

declare global {
  interface Window {
    Square: SquareSDK;
  }
}

export class SquareService {
  private payments: SquarePayments | null = null;
  public card: SquareCard | null = null;
  private accessToken: string;
  private applicationId: string;
  private locationId: string;
  private environment: string;
  private baseUrl: string;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 1000; // 1 second base delay
  
  // Enhanced caching with performance monitoring
  private readonly CACHE_TTL = {
    locations: 30 * 60 * 1000, // 30 minutes
    products: 2 * 60 * 1000,   // 2 minutes (reduced for faster updates when items are archived)
    categories: 60 * 60 * 1000, // 60 minutes (categories change less frequently)
    discounts: 15 * 60 * 1000,  // 15 minutes
    modifiers: 30 * 60 * 1000   // 30 minutes
  };

  constructor() {
    this.accessToken = process.env.REACT_APP_SQUARE_ACCESS_TOKEN || '';
    this.applicationId = process.env.REACT_APP_SQUARE_APPLICATION_ID || '';
    this.locationId = ''; // Will be fetched dynamically from Square API
    this.environment = process.env.REACT_APP_SQUARE_ENVIRONMENT || 'sandbox';
    // Use backend proxy instead of direct Square API calls
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
    // Ensure we have the correct API path structure
    this.baseUrl = backendUrl.includes('/api/square') ? backendUrl : `${backendUrl}/api/square`;
  }

  // Enhanced API call with retry mechanism and response validation
  private async retryApiCall<T>(
    apiCall: () => Promise<Response>,
    operation: string,
    expectedFields?: string[]
  ): Promise<T> {   
    let lastError: Error = new Error(`Failed after ${this.MAX_RETRIES} attempts: ${operation}`);
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await apiCall();
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.errors?.[0]?.detail || response.statusText;
          
          // Don't retry client errors (4xx), only server errors (5xx) and network issues
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`Square API error: ${errorMessage}`);
          }
          
          throw new Error(`Server error (${response.status}): ${errorMessage}`);
        }
        
        const data = await response.json();
        
        // Validate response structure if expected fields are provided
        if (expectedFields) {
          this.validateApiResponse(data, expectedFields, operation);
        }
        
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry client errors or validation errors
        if (lastError.message.includes('Square API error') || 
            lastError.message.includes('Invalid response')) {
          break;
        }
        
        if (attempt === this.MAX_RETRIES) {
          break;
        }
        
        // Exponential backoff with jitter
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (process.env.NODE_ENV === 'development') {
          // Retrying operation
        }
      }
    }
    
    // Track the error for monitoring
    trackError(lastError!, { operation, attempts: this.MAX_RETRIES });
    throw new Error(lastError?.message || `Failed after ${this.MAX_RETRIES} attempts: ${operation}`);
  }

  // Validate API response structure
  private validateApiResponse(response: any, expectedFields: string[], operation: string): void {
    if (!response) {
      throw new Error(`Invalid response from ${operation}: Empty response`);
    }
    
    for (const field of expectedFields) {
      if (!(field in response)) {
        throw new Error(`Invalid response from ${operation}: Missing required field '${field}'`);
      }
    }
  }

  // Get the main location ID from Square with caching
  async getMainLocationId(): Promise<string> {
    const cacheKey = createCacheKey('main_location_id');
    
    // Try cache first
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    return trackApiCall(async () => {
      const data = await this.retryApiCall<any>(
        () => fetch(`${this.baseUrl}/locations`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        'getMainLocationId',
        ['locations']
      );
      
      if (data.locations && data.locations.length > 0) {
        const locationId = data.locations[0].id;
        // Cache the result
        apiCache.set(cacheKey, locationId, this.CACHE_TTL.locations);
        return locationId;
      }
      
      throw new Error('No locations found in Square account');
    }, 'getMainLocationId');
  }

  // Fetch all locations from Square and map to our StoreLocation interface with caching
  async getSquareLocations(): Promise<StoreLocation[]> {
    const cacheKey = createCacheKey('square_locations');
    
    // Try cache first
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    return trackApiCall(async () => {
      const data = await this.retryApiCall<any>(
        () => fetch(`${this.baseUrl}/locations`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        'getSquareLocations',
        ['locations']
      );
      
      if (!data.locations || data.locations.length === 0) {
        return [];
      }

      // Map Square locations to our StoreLocation interface
      const locations = data.locations
        .filter((loc: any) => loc.status === 'ACTIVE') // Only active locations
        .map((location: any): StoreLocation => {
          const address = location.address || {};
          
          return {
            id: location.id,
            name: location.name || location.business_name || 'Unnamed Location',
            address: address.address_line_1 || '',
            city: address.locality || '',
            state: address.administrative_district_level_1 || '',
            zipCode: address.postal_code || '',
            phone: location.phone_number || '',
            email: location.email || '',
            hours: this.mapSquareBusinessHours(location.business_hours),
            coordinates: location.coordinates ? {
              lat: location.coordinates.latitude,
              lng: location.coordinates.longitude
            } : undefined,
            features: location.capabilities || [],
            estimatedWaitTime: 15, // Default wait time
            isActive: location.status === 'ACTIVE',
            createdAt: location.created_at || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });
      
      // Cache the result
      apiCache.set(cacheKey, locations, this.CACHE_TTL.locations);
      return locations;
    }, 'getSquareLocations');
  }

  // Helper method to map Square business hours to our format
  private mapSquareBusinessHours(businessHours: any): { [key: string]: { open: string; close: string; closed?: boolean } } {
    // No fallback hours - rely only on Square API data
    if (!businessHours || !businessHours.periods) {
      return {};
    }

    const mappedHours: { [key: string]: { open: string; close: string; closed?: boolean } } = {};
    const dayMap: { [key: string]: string } = {
      'MON': 'monday',
      'TUE': 'tuesday', 
      'WED': 'wednesday',
      'THU': 'thursday',
      'FRI': 'friday',
      'SAT': 'saturday',
      'SUN': 'sunday'
    };

    // Initialize all days as closed
    Object.values(dayMap).forEach(day => {
      mappedHours[day] = { closed: true, open: '', close: '' };
    });

    // Map Square business hours
    businessHours.periods?.forEach((period: any) => {
      const dayName = dayMap[period.day_of_week];
      if (dayName && period.start_local_time && period.end_local_time) {
        mappedHours[dayName] = {
          open: period.start_local_time.substring(0, 5), // Format: HH:MM
          close: period.end_local_time.substring(0, 5),
          closed: false
        };
      }
    });

    return mappedHours;
  }

  async initializeSquare() {
    if (!window.Square) {
      throw new Error('Square Web Payments SDK not loaded');
    }

    if (!this.applicationId) {
      throw new Error('Square Application ID not configured. Please check your environment variables.');
    }

    // If location ID is not provided, fetch it from Square
    if (!this.locationId) {
      this.locationId = await this.getMainLocationId();
    }

    this.payments = window.Square.payments(this.applicationId, this.locationId);
  }

  async initializeCard(cardContainerId: string) {
    if (!this.payments) {
      await this.initializeSquare();
    }

    if (!this.payments) {
      throw new Error('Failed to initialize Square payments');
    }

    this.card = await this.payments.card({
      style: {
        '.input-container': {
          borderColor: '#d1d5db',
          borderRadius: '8px'
        },
        '.input-container.is-focus': {
          borderColor: '#3b82f6'
        },
        '.input-container.is-error': {
          borderColor: '#ef4444'
        }
      }
    });

    await this.card.attach(`#${cardContainerId}`);
    return this.card;
  }

  async createCheckoutSession(data: SquareCheckoutData) {
    try {
      // Validate input data
      if (!data.items || data.items.length === 0) {
        throw new Error('Invalid checkout data: missing required fields');
      }

      // Calculate subtotal (Square will handle tax calculation automatically)
      const subtotal = data.items.reduce((sum, item) => {
        let itemPrice = item.product.price;
        
        // Add variant price modifiers
        if (item.selectedVariants && item.product.variants) {
          Object.entries(item.selectedVariants).forEach(([variantId, selectedValue]) => {
            const variant = item.product.variants?.find(v => v.id === variantId);
            if (variant) {
              if (Array.isArray(selectedValue)) {
                selectedValue.forEach(value => {
                  const option = variant.options.find(opt => opt.name === value);
                  if (option && option.price !== undefined) {
                    itemPrice += option.price;
                  }
                });
              } else {
                const option = variant.options.find(opt => opt.name === selectedValue);
                if (option && option.price !== undefined) {
                  itemPrice += option.price;
                }
              }
            }
          });
        }
        
        return sum + (itemPrice * item.quantity);
      }, 0);
      
      // Create pickup information note
      const pickupInfo = data.pickupDate && data.pickupTime 
        ? `\n\n📅 PICKUP SCHEDULED:\n🗓️ Date: ${new Date(data.pickupDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n🕐 Time: ${this.formatTime(data.pickupTime)}\n📍 Location: ${data.pickupLocation.name}`
        : '';

      // Ensure we have a valid location ID
      const locationId = this.locationId || await this.getMainLocationId();
      
      // Create Square order first
      let orderRequest = {
        location_id: locationId,
        order: {
          location_id: locationId,
          pricing_options: {
            auto_apply_taxes: true
          },
          line_items: data.items.map(item => {
            // Build modifiers array for Square API using catalog object IDs
            const modifiers: any[] = [];
            
            if (item.selectedVariants && item.product.variants) {
              Object.entries(item.selectedVariants).forEach(([variantId, selectedValue]) => {
                const variant = item.product.variants?.find(v => v.id === variantId);
                if (variant) {
                  if (Array.isArray(selectedValue)) {
                    selectedValue.forEach(value => {
                      const option = variant.options.find(opt => opt.name === value);
                      if (option && option.price !== undefined && option.price > 0) {

                        
                        // Always include base_price_money to ensure proper pricing
                        // According to Square API: base_price_money overrides catalog price when both are set
                        const modifier: any = {
                          base_price_money: {
                            amount: Math.round(option.price * 100),
                            currency: 'USD'
                          },
                          quantity: '1'
                        };
                        
                        // Add catalog_object_id if available for better integration
                        if (option.id) {
                          modifier.catalog_object_id = option.id;

                        } else {
                          modifier.name = option.name;

                        }
                        
                        modifiers.push(modifier);
                      }
                    });
                  } else {
                    const option = variant.options.find(opt => opt.name === selectedValue);
                    if (option && option.price !== undefined && option.price > 0) {
                      // Always include base_price_money to ensure proper pricing
                      const modifier: any = {
                        base_price_money: {
                          amount: Math.round(option.price * 100),
                          currency: 'USD'
                        },
                        quantity: '1'
                      };
                      
                      // Add catalog_object_id if available for better integration
                      if (option.id) {
                        modifier.catalog_object_id = option.id;

                      } else {
                        modifier.name = option.name;

                      }
                      
                      modifiers.push(modifier);
                    }
                  }
                }
              });
            }
            
            const lineItem: any = {
              name: item.product.name,
              quantity: item.quantity.toString(),
              base_price_money: {
                amount: Math.round(item.product.price * 100), // Base price only, no modifiers
                currency: 'USD'
              },
              variation_name: item.selectedVariants ? 
                Object.entries(item.selectedVariants).map(([_, value]) => 
                  Array.isArray(value) ? value.join(', ') : value
                ).join(', ') : undefined,
              note: item.specialInstructions ? `${item.specialInstructions}${pickupInfo}` : pickupInfo || undefined
            };
            
            // Add modifiers array if there are any modifiers
            if (modifiers.length > 0) {
              lineItem.modifiers = modifiers;
            }
            
            return lineItem;
          })
        }
      };

      // Apply discounts to the order if any
      if (data.appliedDiscounts && data.appliedDiscounts.length > 0) {
        orderRequest = this.applyDiscountsToOrder(orderRequest, data.appliedDiscounts);
      }



      // Create order in Square
      const orderResponse = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderRequest)
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        
        // Handle store offline scenario
        if (orderResponse.status === 503 && errorData.storeOffline) {
          throw new Error('🚫 Online ordering is currently unavailable. Please try again later or contact us directly for assistance.');
        }
        
        throw new Error(`Square Order API error: ${errorData.errors?.[0]?.detail || orderResponse.statusText}`);
      }

      const orderData = await orderResponse.json();
      const orderId = orderData.order?.id;
      const total = orderData.order?.total_money?.amount || Math.round(subtotal * 100);
      const discountTotal = data.appliedDiscounts ? this.calculateTotalDiscount(data.appliedDiscounts) : 0;

      return { 
        orderId, 
        total, 
        orderData: orderData.order,
        appliedDiscounts: data.appliedDiscounts || [],
        discountAmount: discountTotal
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Error creating checkout session
      }
      throw error;
    }
  }

  // Method for processing actual payment with Square Web Payments SDK
  async processPayment(token: string, amount: number, orderId?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          amount,
          orderId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Payment processing failed: ${errorData.error || response.statusText}`);
      }

      const paymentData = await response.json();
      
      return {
        success: true,
        transactionId: paymentData.payment?.id || `sq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentData
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Error processing payment
      }
      throw error;
    }
  }

  // Method for creating Square Checkout (redirect to Square hosted page)
  async createCheckout(checkoutData: SquareCheckoutData): Promise<{ checkoutUrl: string; orderId?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkoutData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle store offline scenario
        if (response.status === 503 && errorData.storeOffline) {
          throw new Error('🚫 Online ordering is currently unavailable. Please try again later or contact us directly for assistance.');
        }
        
        throw new Error(`Checkout creation failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      
      return {
        checkoutUrl: result.checkoutUrl,
        orderId: result.orderId
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Error creating checkout
      }
      throw error;
    }
  }

  // Note: Order history is now managed through Square Dashboard
  // No need for getUserOrders since we're not storing orders locally

  // Map internal order statuses to Square order statuses
  private mapToSquareStatus(status: string): OrderStatus {
    const statusMap: { [key: string]: OrderStatus } = {
      'pending': 'pending',
      'preparing': 'preparing',
      'ready': 'ready',
      'completed': 'picked-up',
      'cancelled': 'cancelled',
      'failed': 'cancelled'
    };
    
    return statusMap[status] || 'pending';
  }

  // Helper method to format time for display
  private formatTime(timeString: string): string {
    const [hour, minute] = timeString.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  // Cache methods now use the enhanced caching utility

  // Discount Management Methods
  
  /**
   * Validate and apply a discount code
   * @param code - The discount code to validate
   * @param cartItems - Current cart items
   * @param subtotal - Cart subtotal before discounts
   * @returns Validation result with discount details
   */
  /**
   * Fetch discounts from Square Catalog API
   * @returns Array of available discounts
   */
  async getDiscounts(): Promise<Discount[]> {
    const cacheKey = createCacheKey('discounts');
    
    // Check cache first
    const cachedDiscounts = apiCache.get(cacheKey);
    if (cachedDiscounts) {
      return cachedDiscounts;
    }

    return trackApiCall(async () => {

      const response = await fetch(`${this.baseUrl}/discounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Square API error: ${errorData.errors?.[0]?.detail || response.statusText}`);
      }

      const data = await response.json();
      const discounts: Discount[] = [];

      if (data.objects) {
        data.objects.forEach((discount: any) => {
          if (discount.type === 'DISCOUNT' && discount.discount_data) {
            const discountData = discount.discount_data;
            
            // Map Square discount types to our types
            let discountType: DiscountType = 'automatic';
            let value = 0;
            
            if (discountData.percentage) {
              discountType = 'percentage';
              value = parseFloat(discountData.percentage);
            } else if (discountData.amount_money) {
              discountType = 'fixed_amount';
              value = discountData.amount_money.amount; // Already in cents
            }
            
            discounts.push({
              id: discount.id,
              name: discountData.name || 'Unnamed Discount',
              description: discountData.description || '',
              type: discountType,
              value: value,
              isActive: !discount.is_deleted,
              usageCount: 0, // Square doesn't track this in catalog
              squareDiscountId: discount.id,
              squareDiscountType: discountData.discount_type,
              scope: discountData.scope || 'ORDER',
              validFrom: discount.created_at || new Date().toISOString(),
              validUntil: discount.updated_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Default 1 year
              createdAt: discount.created_at || new Date().toISOString(),
              updatedAt: discount.updated_at || new Date().toISOString()
            });
          }
        });
      }

      // Cache the results
      apiCache.set(cacheKey, discounts, this.CACHE_TTL.discounts);
      
      return discounts;
    }, 'getDiscounts').catch(error => {
      // Error fetching discounts from Square
      // Return fallback mock discounts if Square API fails
      return this.getFallbackDiscounts();
    });
  }

  /**
   * Fallback mock discounts when Square API is unavailable
   */
  private getFallbackDiscounts(): Discount[] {
    return [
      {
        id: 'welcome10',
        code: 'WELCOME10',
        name: '10% Off Welcome Discount',
        description: 'Get 10% off your first order',
        type: 'percentage',
        value: 10,
        minOrderAmount: 2000, // $20.00 in cents
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
        usageCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'save5',
        code: 'SAVE5',
        name: '$5 Off Order',
        description: 'Get $5 off orders over $25',
        type: 'fixed_amount',
        value: 500, // $5.00 in cents
        minOrderAmount: 2500, // $25.00 in cents
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
        usageCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'student15',
        code: 'STUDENT15',
        name: '15% Student Discount',
        description: 'Student discount - 15% off',
        type: 'percentage',
        value: 15,
        maxDiscountAmount: 1000, // Max $10.00 discount
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
        usageCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Validate discount code with real Square integration
   * @param code - Discount code to validate
   * @param cartItems - Current cart items
   * @param subtotal - Order subtotal
   * @returns Discount validation result
   */
  async validateDiscount(code: string, cartItems: CartItem[], subtotal: number): Promise<DiscountValidationResult> {
    try {
      // First try to get discounts from Square Catalog API
      const availableDiscounts = await this.getDiscounts();
      
      const discount = availableDiscounts.find(d => 
        d.code?.toLowerCase() === code.toLowerCase() && d.isActive
      );

      if (!discount) {
        return {
          isValid: false,
          error: 'Invalid discount code'
        };
      }

      // Check if discount is currently valid
      const now = new Date();
      const validFrom = new Date(discount.validFrom);
      const validUntil = new Date(discount.validUntil);
      
      if (now < validFrom || now > validUntil) {
        return {
          isValid: false,
          error: 'Discount code has expired'
        };
      }

      // Check minimum order amount
      const subtotalInCents = Math.round(subtotal * 100);
      if (discount.minOrderAmount && subtotalInCents < discount.minOrderAmount) {
        const minAmount = (discount.minOrderAmount / 100).toFixed(2);
        return {
          isValid: false,
          error: `Minimum order amount of $${minAmount} required`
        };
      }

      // Check advanced conditions if present
      if (discount.conditions) {
        const conditionCheck = this.validateDiscountConditions(discount.conditions, cartItems, subtotal);
        if (!conditionCheck.isValid) {
          return conditionCheck;
        }
      }

      // Calculate discount amount
      let appliedAmount = 0;
      if (discount.type === 'percentage') {
        appliedAmount = Math.round(subtotalInCents * (discount.value / 100));
        if (discount.maxDiscountAmount && appliedAmount > discount.maxDiscountAmount) {
          appliedAmount = discount.maxDiscountAmount;
        }
      } else if (discount.type === 'fixed_amount') {
        appliedAmount = Math.min(discount.value, subtotalInCents);
      }

      return {
        isValid: true,
        discount,
        appliedAmount: appliedAmount / 100 // Convert back to dollars
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Error validating discount
      }
      return {
        isValid: false,
        error: 'Failed to validate discount code'
      };
    }
  }

  /**
   * Validate advanced discount conditions
   * @param conditions - Discount conditions to check
   * @param cartItems - Current cart items
   * @param subtotal - Order subtotal
   * @returns Validation result
   */
  private validateDiscountConditions(
    conditions: NonNullable<Discount['conditions']>, 
    cartItems: CartItem[], 
    subtotal: number
  ): { isValid: boolean; error?: string } {
    // Check minimum quantity
    if (conditions.minimumQuantity) {
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity < conditions.minimumQuantity) {
        return {
          isValid: false,
          error: `Minimum ${conditions.minimumQuantity} items required`
        };
      }
    }

    // Check applicable items
    if (conditions.applicableItemIds && conditions.applicableItemIds.length > 0) {
      const hasApplicableItems = cartItems.some(item => 
        conditions.applicableItemIds!.includes(item.product.id)
      );
      if (!hasApplicableItems) {
        return {
          isValid: false,
          error: 'No eligible items in cart for this discount'
        };
      }
    }

    // Check applicable categories
    if (conditions.applicableCategoryIds && conditions.applicableCategoryIds.length > 0) {
      const hasApplicableCategories = cartItems.some(item => 
        item.product.categoryIds?.some(catId => 
          conditions.applicableCategoryIds!.includes(catId)
        ) || conditions.applicableCategoryIds!.includes(item.product.categoryId || '')
      );
      if (!hasApplicableCategories) {
        return {
          isValid: false,
          error: 'No eligible categories in cart for this discount'
        };
      }
    }

    // Check time restrictions
    if (conditions.timeRestrictions) {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format
      
      if (conditions.timeRestrictions.dayOfWeek && 
          !conditions.timeRestrictions.dayOfWeek.includes(currentDay)) {
        return {
          isValid: false,
          error: 'Discount not available on this day'
        };
      }
      
      if (conditions.timeRestrictions.startTime && conditions.timeRestrictions.endTime) {
        const startTime = parseInt(conditions.timeRestrictions.startTime.replace(':', ''));
        const endTime = parseInt(conditions.timeRestrictions.endTime.replace(':', ''));
        
        if (currentTime < startTime || currentTime > endTime) {
          return {
            isValid: false,
            error: 'Discount not available at this time'
          };
        }
      }
    }

    return { isValid: true };
   }

   /**
    * Automatically apply eligible discounts based on Square's business rules
    * @param cartItems - Current cart items
    * @param subtotal - Order subtotal
    * @returns Array of automatically applied discounts
    */
   async getAutomaticDiscounts(cartItems: CartItem[], subtotal: number): Promise<AppliedDiscount[]> {
     try {
       const availableDiscounts = await this.getDiscounts();
       const automaticDiscounts = availableDiscounts.filter(d => 
         d.type === 'automatic' && d.isActive
       );
       
       const appliedDiscounts: AppliedDiscount[] = [];
       
       for (const discount of automaticDiscounts) {
         // Check if discount conditions are met
         const validation = await this.validateDiscount(discount.code || discount.id, cartItems, subtotal);
         
         if (validation.isValid && validation.discount && validation.appliedAmount) {
           appliedDiscounts.push({
             discountId: validation.discount.id,
             code: validation.discount.code,
             name: validation.discount.name,
             type: validation.discount.type,
             value: validation.discount.value,
             appliedAmount: validation.appliedAmount,
             appliedTo: 'order',
             discount: validation.discount
           });
         }
       }
       
       // Sort by highest discount amount first
       appliedDiscounts.sort((a, b) => b.appliedAmount - a.appliedAmount);
       
       return appliedDiscounts;
     } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Error applying automatic discounts
      }
      return [];
    }
   }

   /**
    * Get loyalty-based discounts for a customer
    * @param customerId - Customer ID
    * @param cartItems - Current cart items
    * @param subtotal - Order subtotal
    * @returns Array of applicable loyalty discounts
    */
   async getLoyaltyDiscounts(customerId: string, cartItems: CartItem[], subtotal: number): Promise<AppliedDiscount[]> {
     // This would integrate with Square's Loyalty API
     // For now, return empty array as placeholder
     return [];
   }

   /**
    * Calculate total discount amount from applied discounts
   * @param appliedDiscounts - Array of applied discounts
   * @returns Total discount amount
   */
  calculateTotalDiscount(appliedDiscounts: AppliedDiscount[]): number {
    return appliedDiscounts.reduce((total, discount) => total + discount.appliedAmount, 0);
  }

  /**
   * Apply discounts to Square order line items
   * @param orderRequest - Square order request object
   * @param appliedDiscounts - Discounts to apply
   * @returns Modified order request with discounts
   */
  private applyDiscountsToOrder(orderRequest: any, appliedDiscounts: AppliedDiscount[]): any {
    if (!appliedDiscounts || appliedDiscounts.length === 0) {
      return orderRequest;
    }

    // Add order-level discounts
    const orderDiscounts = appliedDiscounts.filter(d => d.appliedTo === 'order');
    if (orderDiscounts.length > 0) {
      orderRequest.order.discounts = orderDiscounts.map(discount => ({
        name: discount.name,
        percentage: discount.type === 'percentage' ? discount.value.toString() : undefined,
        amount_money: discount.type === 'fixed_amount' ? {
          amount: Math.round(discount.appliedAmount * 100), // Convert to cents
          currency: 'USD'
        } : undefined,
        scope: 'ORDER'
      }));
    }

    return orderRequest;
  }









  // Fetch products from Square Catalog API
  // Method to clear products cache - useful when API structure changes
  clearProductsCache(): void {
    const cacheKey = createCacheKey('products');
    apiCache.delete(cacheKey);
    if (process.env.NODE_ENV === 'development') {
      // Products cache cleared
    }
  }

  // Method to clear categories cache - useful when API structure changes
  clearCategoriesCache(): void {
    const cacheKey = createCacheKey('categories', this.locationId);
    apiCache.delete(cacheKey);
    if (process.env.NODE_ENV === 'development') {
      // Categories cache cleared
    }
  }

  // Client-side location filtering using Square's built-in location fields
  private filterProductsByLocation(products: Product[], locationId?: string): Product[] {
    if (!locationId) {
      return products; // Return all products if no location specified
    }
    
    return products.filter(product => {
      // Check if product is available at all locations
      if (product.present_at_all_locations) {
        return true;
      }
      
      // Check if product is available at the specific location
      return product.present_at_location_ids?.includes(locationId) || false;
    });
  }

  // Method to refresh products cache immediately
  async refreshProducts(locationId?: string): Promise<Product[]> {
    if (process.env.NODE_ENV === 'development') {
      // Refreshing products cache
    }
    return this.getProducts(true, locationId);
  }

  async getProducts(forceRefresh: boolean = false, locationId?: string): Promise<Product[]> {
    // Use single cache key for all products - location filtering handled client-side
    const cacheKey = createCacheKey('products');
    
    // Clear cache if force refresh is requested
    if (forceRefresh) {
      apiCache.delete(cacheKey);
    }
    
    // Check cache first
    const cachedProducts = apiCache.get(cacheKey) as Product[] | null;
    if (cachedProducts) {
      // Filter cached products by location client-side
      return this.filterProductsByLocation(cachedProducts, locationId);
    }

    return trackApiCall(async () => {
    try {

      // Fetch products, modifiers, and categories
      // No longer passing locationId to backend - all products fetched at once
      const [productsResponse, modifiersData, categoriesData] = await Promise.all([
        fetch(`${this.baseUrl}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }),
        this.getModifiers(),
        this.getCategories()
      ]);

      if (!productsResponse.ok) {
        const errorData = await productsResponse.json();
        throw new Error(`Square API error: ${errorData.errors?.[0]?.detail || productsResponse.statusText}`);
      }

      const data = await productsResponse.json();
      const products: Product[] = [];

      // Extract image data from related_objects
      const imageMap = new Map<string, string>();
      if (data.related_objects) {
        data.related_objects.forEach((obj: any) => {
          if (obj.type === 'IMAGE' && obj.image_data?.url) {
            imageMap.set(obj.id, obj.image_data.url);
          }
        });
        
        if (process.env.NODE_ENV === 'development') {
          // Found images in Square API response
        }
      } else if (process.env.NODE_ENV === 'development') {
        // No related_objects found in Square API response
      }

      // Create category map for quick lookup
      const categoryMap = new Map<string, string>();
      categoriesData.forEach(category => {
        categoryMap.set(category.id, category.name);
      });
      categoryMap.set('uncategorized', 'Uncategorized'); // Default category

      // Handle both 'objects' (from SearchCatalogObjects) and 'items' (from SearchCatalogItems)
      const itemsArray = data.objects || data.items || [];
      
      if (itemsArray.length > 0) {
        for (const item of itemsArray) {
          if (item.type === 'ITEM' && item.item_data) {
            const itemData = item.item_data;
            const variations = itemData.variations || [];
            
            // Use the first variation for base price, or 0 if no variations
            const basePrice = variations.length > 0 && variations[0].item_variation_data?.price_money
              ? variations[0].item_variation_data.price_money.amount / 100 // Convert from cents
              : 0;

            // Get modifiers for this item
            const itemModifiers = this.getItemModifiers(itemData, modifiersData);
            
            // Extract ingredients from food and beverage details
            const ingredients = this.extractIngredients(itemData);
            
            // Extract images using the image map
            const images = itemData.image_ids ? 
              itemData.image_ids.map((id: string) => imageMap.get(id)).filter(Boolean) : [];
            
            if (process.env.NODE_ENV === 'development' && itemData.image_ids && itemData.image_ids.length > 0 && images.length === 0) {
              // Product has image_ids but no matching images found
            }
            
            // Combine variations and modifiers into variants
            const allVariants = [
              ...this.mapSquareVariationsToVariants(variations),
              ...itemModifiers
            ];

            // Handle multiple categories from Square API
            const categoryIds = itemData.categories || (itemData.category_id ? [itemData.category_id] : ['uncategorized']);
            const primaryCategoryId = categoryIds[0] || 'uncategorized';
            
            // Map category IDs to category names
            const categoryNames = categoryIds.map((id: string) => categoryMap.get(id) || 'Uncategorized').filter(Boolean);
            const primaryCategoryName = categoryMap.get(primaryCategoryId) || 'Uncategorized';
            


            
            // Extract measurement unit from first variation or item data
            let measurementUnit: any | undefined;
            let unitQuantity = 1;
            
            if (allVariants.length > 0 && allVariants[0].options.length > 0) {
              const firstOption = allVariants[0].options[0];
              measurementUnit = firstOption.measurementUnit;
              unitQuantity = firstOption.unitQuantity || 1;
            } else {
              // Try to extract from item name
              const itemName = itemData.name?.toLowerCase() || '';
              if (itemName.includes('oz') || itemName.includes('ounce')) {
                measurementUnit = { abbreviation: 'oz', name: 'Ounce', type: 'weight' };
                const match = itemName.match(/(\d+(?:\.\d+)?)\s*oz/);
                if (match) unitQuantity = parseFloat(match[1]);
              } else if (itemName.includes('lb') || itemName.includes('pound')) {
                measurementUnit = { abbreviation: 'lb', name: 'Pound', type: 'weight' };
                const match = itemName.match(/(\d+(?:\.\d+)?)\s*(?:lb|pound)/);
                if (match) unitQuantity = parseFloat(match[1]);
              } else if (itemName.includes('fl oz') || itemName.includes('fluid ounce')) {
                measurementUnit = { abbreviation: 'fl oz', name: 'Fluid Ounce', type: 'volume' };
                const match = itemName.match(/(\d+(?:\.\d+)?)\s*fl\s*oz/);
                if (match) unitQuantity = parseFloat(match[1]);
              }
            }
            
            // Initialize default values
            const allergens: string[] = [];
            const nutritionalInfo: Record<string, any> = {};
            let preparationTime: number | undefined;

            // Skip archived items - double check since we want to ensure no archived items show up
            if (itemData.is_archived === true) {
              continue;
            }

            const product: Product = {
               id: item.id,
               name: itemData.name || 'Unnamed Product',
               description: itemData.description || '',
               price: basePrice,
               categoryId: primaryCategoryId,
               category: primaryCategoryName,
               categoryIds: categoryIds,
               categories: categoryNames,
               brand: 'Fetterman\'s',
               images: images,
               foodType: [],
               tags: itemData.label_color ? [itemData.label_color] : [],
               specifications: {},
               variants: allVariants,
               ingredients: ingredients,
               isActive: !itemData.is_deleted && !itemData.is_archived, // Check both deleted and archived status
               createdAt: item.created_at || new Date().toISOString(),
               updatedAt: item.updated_at || new Date().toISOString(),
               // Enhanced Square-specific fields
               squareItemId: item.id,
               squareVariationId: variations.length > 0 ? variations[0].id : undefined,
               measurementUnit: measurementUnit,
               unitQuantity: unitQuantity,
               stockable: itemData.stockable !== false,
               sellable: itemData.sellable !== false,
               allergens: allergens,
               nutritionalInfo: nutritionalInfo,
               preparationTime: preparationTime,
               // Square location fields for client-side filtering
               present_at_all_locations: item.present_at_all_locations,
               present_at_location_ids: item.present_at_location_ids
             };

            products.push(product);
          }
        }
      }

      // Cache the results (all products)
      apiCache.set(cacheKey, products, this.CACHE_TTL.products);
      
      // Filter products by location client-side before returning
      return this.filterProductsByLocation(products, locationId);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Error fetching products from Square
      }
      throw error;
    }
    }, 'getProducts');
  }

  // Helper method to map Square variations to our variant format with enhanced support
  private mapSquareVariationsToVariants(variations: any[]): ProductVariant[] {
    // Square variations are different from our variant system
    // For now, we'll create a simple size variant based on variations
    if (variations.length <= 1) {
      return [];
    }

    const sizeVariant: ProductVariant = {
      id: 'size',
      name: 'Size',
      type: 'dropdown',
      options: variations.map((variation, index) => {
        let varData = variation.item_variation_data;
        
        // Handle case where item_variation_data might be a string representation
        if (typeof varData === 'string') {
          // Skip malformed data that can't be parsed
          if (process.env.NODE_ENV === 'development') {
            // Skipping malformed variation data
          }
          return null;
        }
        
        // Skip variations without proper data or with invalid names
        if (!varData || !varData.name || varData.name === '0' || varData.name.trim() === '') {
          if (process.env.NODE_ENV === 'development') {
            // Skipping variation with invalid name
          }
          return null;
        }
        
        // Calculate price difference from base price
        const basePrice = variations[0].item_variation_data?.price_money?.amount / 100 || 0;
        const variantPrice = varData?.price_money ? varData.price_money.amount / 100 : 0;
        const priceDifference = variantPrice - basePrice;
        
        // Store the price difference, but use undefined for zero differences to indicate no additional cost
        const price = priceDifference !== 0 ? priceDifference : undefined;
        
        // Extract measurement unit information
        let measurementUnit: any | undefined;
        let unitQuantity = 1;
        
        if (varData?.name) {
          const unitName = varData.name.toLowerCase();
          if (unitName.includes('oz') || unitName.includes('ounce')) {
            measurementUnit = { abbreviation: 'oz', name: 'Ounce', type: 'weight' };
            const match = unitName.match(/(\d+(?:\.\d+)?)\s*oz/);
            if (match) unitQuantity = parseFloat(match[1]);
          } else if (unitName.includes('lb') || unitName.includes('pound')) {
            measurementUnit = { abbreviation: 'lb', name: 'Pound', type: 'weight' };
            const match = unitName.match(/(\d+(?:\.\d+)?)\s*(?:lb|pound)/);
            if (match) unitQuantity = parseFloat(match[1]);
          } else if (unitName.includes('fl oz') || unitName.includes('fluid ounce')) {
            measurementUnit = { abbreviation: 'fl oz', name: 'Fluid Ounce', type: 'volume' };
            const match = unitName.match(/(\d+(?:\.\d+)?)\s*fl\s*oz/);
            if (match) unitQuantity = parseFloat(match[1]);
          }
        }
        
        return {
          id: variation.id || `option-${index}`,
          name: varData.name,
          price: price,
          squareVariationId: variation.id,
          stockable: varData?.stockable !== false,
          sellable: varData?.sellable !== false,
          measurementUnit,
          unitQuantity
        } as ProductVariantOption;
      }).filter((option): option is ProductVariantOption => option !== null) // Remove null options with type guard
    };

    // Only return the variant if it has valid options
    return sizeVariant.options.length > 0 ? [sizeVariant] : [];
  }

  // Helper method to extract ingredients from Square's description field
  private extractIngredients(itemData: any): string[] {
    const ingredients: string[] = [];
    
    // First, check if item has food and beverage details with ingredients
    if (itemData.food_and_beverage_details && itemData.food_and_beverage_details.ingredients) {
      itemData.food_and_beverage_details.ingredients.forEach((ingredient: any) => {
        if (ingredient.name) {
          ingredients.push(ingredient.name);
        }
      });
    } else if (itemData.description && itemData.description.trim()) {
      // Use the description field from Square items as ingredients
      // Split by common delimiters and clean up the ingredients list
      const description = itemData.description.trim();
      const possibleIngredients = description
        .split(/[,;\n]/) // Split by comma, semicolon, or newline
        .map((ingredient: string) => ingredient.trim())
        .filter((ingredient: string) => ingredient.length > 0 && ingredient.length < 50) // Filter out empty or overly long strings
        .slice(0, 10); // Limit to first 10 ingredients to avoid overly long lists
      
      ingredients.push(...possibleIngredients);
    }
    
    return ingredients;
  }

  // Helper method to get modifiers for a specific item and map them to ProductVariant format
  private getItemModifiers(itemData: any, modifiersData: any[]): ProductVariant[] {
    const itemModifiers: ProductVariant[] = [];
    
    // Check if item has modifier list info
    if (itemData.modifier_list_info && itemData.modifier_list_info.length > 0) {
      itemData.modifier_list_info.forEach((modifierListInfo: any) => {
        const modifierListId = modifierListInfo.modifier_list_id;
        const modifierList = modifiersData.find(mod => mod.id === modifierListId);
        
        if (modifierList && modifierList.enabled) {
          const minSelected = modifierList.minSelectedModifiers || 0;
          // Don't default maxSelected to 1 - use the actual Square data or undefined for unlimited
          const maxSelected = modifierList.maxSelectedModifiers;
          
          const variant: ProductVariant = {
            id: modifierList.id,
            name: modifierList.name,
            type: modifierList.selectionType === 'MULTIPLE' ? 'checklist' : 'dropdown',
            selectionType: modifierList.selectionType,
            minSelectedModifiers: minSelected,
            maxSelectedModifiers: maxSelected,
            isRequired: minSelected > 0,
            options: modifierList.modifiers
              .filter((modifier: any) => {
                // Filter out invalid modifier names
                if (!modifier.name || typeof modifier.name !== 'string') {
                  return false;
                }
                const trimmedName = modifier.name.trim();
                if (trimmedName === '' || trimmedName === '0' || trimmedName === 'null' || trimmedName === 'undefined') {
                  return false;
                }
                return true;
              })
              .map((modifier: any) => ({
                id: modifier.id,
                name: modifier.name.trim(),
                price: modifier.price || 0,
                onByDefault: modifier.onByDefault || false
              }))
          };
          
          itemModifiers.push(variant);
        }
      });
    }
    
    return itemModifiers;
  }

  /**
   * Fetch categories from Square Catalog API with hierarchical support
   * 
   * Square Category Setup Guide:
   * 1. In Square Dashboard, create parent categories (e.g., "Beverages", "Food")
   * 2. Create subcategories and set their parent_category to the parent ID
   * 3. Assign items to subcategories for better organization
   * 
   * Navigation Behavior:
   * - Parent categories with subcategories: Show in nav bar with dropdown
   * - Standalone categories (no subcategories): Show as direct nav buttons
   * - Subcategories: Only appear in parent category dropdowns
   * 
   * Example Structure:
   * Beverages (parent)
   *   ├── Soda (subcategory)
   *   ├── Juices (subcategory)
   *   └── Coffee (subcategory)
   * Snacks (standalone - no subcategories)
   */
  async getCategories(): Promise<Category[]> {
    return trackApiCall(async () => {
        const cacheKey = createCacheKey('categories', this.locationId);
        const cached = apiCache.get(cacheKey);
        // Temporarily disable cache to test POST request
        if (cached) {
          // Returning cached categories
          return cached;
        }
        
        // Fetching categories from API

        const getResponse = await fetch(`${this.baseUrl}/categories`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!getResponse.ok) {
          const errorData = await getResponse.json().catch(() => ({}));
          console.error('❌ GET Response error:', errorData);
          throw new Error(`Square API GET error: ${errorData.errors?.[0]?.detail || getResponse.statusText}`);
        }

        const data = await getResponse.json();
        // Categories data received from backend
      
      const flatCategories: Category[] = [];
      
      // Use availability periods provided by the backend (GET format)
      const availabilityPeriodsMap: { [key: string]: any } = data.availabilityPeriods || {};
      // Availability periods processed

      // Step 3: Process categories with linked availability periods
      if (data.objects) {
        data.objects.forEach((category: any, index: number) => {
          if (category.type === 'CATEGORY' && category.categoryData?.name) {
            
            // Use isTopLevel to determine hierarchy - Square's recommended approach
            const isTopLevel = category.categoryData.isTopLevel === true;
            
            // Check for parent category relationships
            const parentCategoryId = category.categoryData.rootCategory || 
                                   category.categoryData.parentCategory || 
                                   category.categoryData.parentCategoryId ||
                                   undefined;
            
            // Don't set parentId if it's the same as the category's own ID (self-reference)
            const actualParentId = !isTopLevel && parentCategoryId && parentCategoryId !== category.id ? parentCategoryId : undefined;
            
            // Use availability periods directly from enhanced category (backend already mapped them)
            const categoryAvailabilityPeriods = category.availabilityPeriods || [];
            
            // Use online visibility from GET request (already filtered by backend)
            const onlineVisibility = category.categoryData.onlineVisibility;
            const isActive = onlineVisibility !== false && !category.isDeleted;
            
            flatCategories.push({
              id: category.id,
              name: category.categoryData.name || 'Unnamed Category',
              description: category.categoryData.description || '',
              isActive: isActive,
              sortOrder: index + 1,
              parentId: actualParentId,
              level: isTopLevel ? 0 : 1, // Top level categories are level 0
              availabilityPeriods: categoryAvailabilityPeriods,
              createdAt: category.createdAt || new Date().toISOString(),
              updatedAt: category.updatedAt || new Date().toISOString()
            });
          }
        });
      }

      // Build hierarchical structure
      const hierarchicalCategories = this.buildCategoryHierarchy(flatCategories);

      // If no categories found, return empty array
      if (hierarchicalCategories.length === 0) {
        return [];
      }

      // Cache the results
      apiCache.set(cacheKey, hierarchicalCategories, this.CACHE_TTL.categories);
      
      // Categories processed successfully
      return hierarchicalCategories;
    }, 'getCategories');
  }

  // Helper method to map availability periods from Square SDK response
  private mapAvailabilityPeriods(periodIds: string[], availabilityPeriods: any): CategoryAvailabilityPeriod[] {
    if (!periodIds || !Array.isArray(periodIds)) {
      return [];
    }

    return periodIds
      .map(periodId => {
        const period = availabilityPeriods[periodId];
        if (!period) {
          return null;
        }

        // Handle both Square SDK structure (availabilityPeriodData) and REST API structure (availability_period_data)
        const periodData = period.availabilityPeriodData || period.availability_period_data;
        if (!periodData) {
          return null;
        }

        return {
          id: period.id,
          startTime: periodData.startTime || periodData.start_time || '00:00:00',
          endTime: periodData.endTime || periodData.end_time || '23:59:59',
          dayOfWeek: periodData.dayOfWeek || periodData.day_of_week
        };
      })
      .filter(period => period !== null) as CategoryAvailabilityPeriod[];
  }

  // New helper method specifically for API response structure
  private mapAvailabilityPeriodsFromAPI(periodIds: string[], availabilityPeriods: any): CategoryAvailabilityPeriod[] {
    if (!periodIds || !Array.isArray(periodIds)) {
      return [];
    }

    return periodIds
      .map(periodId => {
        const period = availabilityPeriods[periodId];
        if (!period) {
          return null;
        }

        // Backend sends camelCase format: startTime, endTime, dayOfWeek
        return {
          id: period.id,
          startTime: period.startTime || '00:00:00',
          endTime: period.endTime || '23:59:59',
          dayOfWeek: period.dayOfWeek
        };
      })
      .filter(period => period !== null) as CategoryAvailabilityPeriod[];
  }

  // Helper method to build category hierarchy
  private buildCategoryHierarchy(flatCategories: Category[]): Category[] {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // First pass: create map and identify root categories
    flatCategories.forEach(category => {
      const categoryWithDefaults = { ...category, subcategories: [], level: 0 };
      categoryMap.set(category.id, categoryWithDefaults);
      if (!category.parentId) {
        rootCategories.push(categoryMap.get(category.id)!);
      }
    });

    // Second pass: build parent-child relationships and calculate levels
    flatCategories.forEach(category => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        const child = categoryMap.get(category.id);
        if (parent && child) {
          if (!parent.subcategories) {
            parent.subcategories = [];
          }
          parent.subcategories.push(child);
          child.level = parent.level + 1;
        }
      }
    });

    // Sort categories by sortOrder
    const sortCategories = (categories: Category[]) => {
      categories.sort((a, b) => a.sortOrder - b.sortOrder);
      categories.forEach(category => {
        if (category.subcategories && category.subcategories.length > 0) {
          sortCategories(category.subcategories);
        }
      });
    };

    sortCategories(rootCategories);
    return rootCategories;
  }

  /**
   * Get organized category hierarchy for navigation
   * Returns categories separated by type for optimal UI rendering
   */
  async getCategoryHierarchy(): Promise<{
    parentCategories: Category[];
    standaloneCategories: Category[];
    allCategories: Category[];
  }> {
    const categories = await this.getCategories();
    
    const parentCategories: Category[] = [];
    const standaloneCategories: Category[] = [];
    
    categories.forEach(category => {
      if (category.level === 0) { // Only root level categories
        if (category.subcategories && category.subcategories.length > 0) {
          parentCategories.push(category);
        } else {
          standaloneCategories.push(category);
        }
      }
    });
    
    return {
      parentCategories: parentCategories.sort((a, b) => a.sortOrder - b.sortOrder),
      standaloneCategories: standaloneCategories.sort((a, b) => a.sortOrder - b.sortOrder),
      allCategories: categories
    };
  }

  // Fetch modifiers from Square Catalog API
  async getModifiers(): Promise<any[]> {
    const cacheKey = createCacheKey('modifiers');
    
    // Check cache first
    const cachedModifiers = apiCache.get(cacheKey) as any[] | null;
    if (cachedModifiers) {
      return cachedModifiers;
    }

    return trackApiCall(async () => {
    try {

      const response = await fetch(`${this.baseUrl}/modifiers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Square API error: ${errorData.errors?.[0]?.detail || response.statusText}`);
      }

      const data = await response.json();
      const modifiers: any[] = [];

      if (data.objects) {
        data.objects.forEach((modifierList: any) => {
          if (modifierList.type === 'MODIFIER_LIST' && modifierList.modifier_list_data) {
            const modifierListData = modifierList.modifier_list_data;
            
            const modifier = {
              id: modifierList.id,
              name: modifierListData.name || 'Unnamed Modifier List',
              description: modifierListData.description || '',
              selectionType: modifierListData.selection_type || 'SINGLE',
              minSelectedModifiers: modifierListData.min_selected_modifiers || 0,
              maxSelectedModifiers: modifierListData.max_selected_modifiers,
              enabled: modifierListData.enabled !== false,
              ordinal: modifierListData.ordinal || 0,
              modifiers: (modifierListData.modifiers || []).map((mod: any) => ({
                id: mod.id,
                name: mod.modifier_data?.name || 'Unnamed Modifier',
                price: mod.modifier_data?.price_money ? mod.modifier_data.price_money.amount / 100 : 0,
                currency: mod.modifier_data?.price_money?.currency || 'USD',
                ordinal: mod.modifier_data?.ordinal || 0,
                onByDefault: mod.modifier_data?.on_by_default || false
              })),
              createdAt: modifierList.created_at || new Date().toISOString(),
              updatedAt: modifierList.updated_at || new Date().toISOString()
            };

            modifiers.push(modifier);
          }
        });
      }

      // Cache the results
      apiCache.set(cacheKey, modifiers, this.CACHE_TTL.modifiers);
      
      return modifiers;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Error fetching modifiers from Square
      }
      throw error;
    }
    }, 'getModifiers');
  }

  // Fetch measurement units from Square Catalog API
  async getMeasurementUnits(): Promise<SquareMeasurementUnit[]> {
    const cacheKey = createCacheKey('measurement-units');
    
    // Check cache first
    const cachedUnits = apiCache.get(cacheKey) as SquareMeasurementUnit[] | null;
    if (cachedUnits) {
      return cachedUnits;
    }

    return trackApiCall(async () => {
    try {

      const response = await fetch(`${this.baseUrl}/measurement-units`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Square API error: ${errorData.errors?.[0]?.detail || response.statusText}`);
      }

      const data = await response.json();
      const measurementUnits: SquareMeasurementUnit[] = [];

      if (data.objects) {
        data.objects.forEach((unit: any) => {
          if (unit.type === 'MEASUREMENT_UNIT' && unit.measurement_unit_data) {
            const unitData = unit.measurement_unit_data;
            
            const measurementUnit: SquareMeasurementUnit = {
              id: unit.id,
              name: unitData.measurement_unit?.custom_unit?.name || unitData.measurement_unit?.generic_unit || 'Unknown Unit',
              abbreviation: unitData.measurement_unit?.custom_unit?.abbreviation || this.getGenericUnitAbbreviation(unitData.measurement_unit?.generic_unit),
              type: unitData.measurement_unit?.type || 'CUSTOM',
              precision: unitData.precision || 0,
              customUnit: unitData.measurement_unit?.custom_unit,
              genericUnit: unitData.measurement_unit?.generic_unit,
              createdAt: unit.created_at || new Date().toISOString(),
              updatedAt: unit.updated_at || new Date().toISOString()
            };

            measurementUnits.push(measurementUnit);
          }
        });
      }

      // Cache the results
      apiCache.set(cacheKey, measurementUnits, this.CACHE_TTL.modifiers);
      
      return measurementUnits;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Error fetching measurement units from Square
      }
      // Return empty array if no measurement units are configured
      return [];
    }
    }, 'getMeasurementUnits');
  }

  // Convert Square measurement units to our MeasurementUnit format
  convertSquareUnitsToMeasurementUnits(squareUnits: SquareMeasurementUnit[]): MeasurementUnit[] {
    return squareUnits.map(squareUnit => {
      const measurementUnit: MeasurementUnit = {
        id: squareUnit.id,
        name: squareUnit.name,
        abbreviation: squareUnit.abbreviation,
        type: this.mapSquareUnitTypeToMeasurementType(squareUnit.genericUnit || squareUnit.customUnit?.name || ''),
        precision: squareUnit.precision
      };
      return measurementUnit;
    });
  }

  // Helper method to map Square unit types to our measurement types
  private mapSquareUnitTypeToMeasurementType(unitName: string): 'weight' | 'volume' | 'length' | 'area' | 'generic' {
    const weightUnits = ['OUNCE', 'POUND', 'GRAM', 'KILOGRAM'];
    const volumeUnits = ['FLUID_OUNCE', 'GALLON', 'LITER', 'MILLILITER'];
    const lengthUnits = ['INCH', 'FOOT', 'YARD', 'METER', 'CENTIMETER', 'MILLIMETER'];
    
    const upperUnitName = unitName.toUpperCase();
    
    if (weightUnits.includes(upperUnitName)) {
      return 'weight';
    } else if (volumeUnits.includes(upperUnitName)) {
      return 'volume';
    } else if (lengthUnits.includes(upperUnitName)) {
      return 'length';
    } else {
      return 'generic';
    }
  }

  // Helper method to get abbreviations for generic units
  private getGenericUnitAbbreviation(genericUnit: string): string {
    const abbreviations: { [key: string]: string } = {
      'OUNCE': 'oz',
      'POUND': 'lb',
      'FLUID_OUNCE': 'fl oz',
      'GALLON': 'gal',
      'LITER': 'L',
      'MILLILITER': 'mL',
      'GRAM': 'g',
      'KILOGRAM': 'kg',
      'INCH': 'in',
      'FOOT': 'ft',
      'YARD': 'yd',
      'METER': 'm',
      'CENTIMETER': 'cm',
      'MILLIMETER': 'mm'
    };
    return abbreviations[genericUnit] || genericUnit;
  }



  // Method to clear cache (useful for refreshing data)
  clearCache(): void {
    apiCache.clear();
  }

  // Method to clear specific cache entry
  clearCacheEntry(key: string): void {
    apiCache.delete(key);
  }
}

export const squareService = new SquareService();

// Global functions for debugging - clear cache from browser console
(window as any).clearSquareCache = () => {
  squareService.clearCache();
  if (process.env.NODE_ENV === 'development') {
    // All Square cache cleared
  }
};

(window as any).refreshProducts = async () => {
  try {
    const products = await squareService.refreshProducts();
    if (process.env.NODE_ENV === 'development') {
      // Products refreshed
    }
    return products;
  } catch (error) {
    // Failed to refresh products
  }
};

(window as any).clearProductsCache = () => {
  squareService.clearProductsCache();
};
