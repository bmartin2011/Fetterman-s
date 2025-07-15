import { CartItem, ProductVariant } from '../types';

// Note: Tax calculations are handled by Square based on location configuration
// These utilities are for display purposes only - actual tax is calculated by Square

// Calculate item price with variant customizations
export const calculateItemPrice = (
  basePrice: number,
  customizations?: {
    selectedVariants?: { [variantId: string]: string | string[]; };
    productVariants?: ProductVariant[];
  }
): number => {
  let totalPrice = basePrice;

  // Add variant price modifiers
  if (customizations?.selectedVariants && customizations?.productVariants) {
    Object.entries(customizations.selectedVariants).forEach(([variantId, selectedValue]) => {
      const variant = customizations.productVariants?.find(v => v.id === variantId);
      if (variant) {
        if (Array.isArray(selectedValue)) {
          selectedValue.forEach(value => {
            const option = variant.options.find(opt => opt.name === value);
            if (option && option.price !== undefined) {
              totalPrice += option.price;
            }
          });
        } else {
          const option = variant.options.find(opt => opt.name === selectedValue);
          if (option && option.price !== undefined) {
            totalPrice += option.price;
          }
        }
      }
    });
  }

  return totalPrice;
};

// Calculate cart item total price
export const calculateCartItemPrice = (item: CartItem): number => {
  const itemPrice = calculateItemPrice(item.product.price, {
    selectedVariants: item.selectedVariants,
    productVariants: item.product.variants
  });

  return itemPrice * item.quantity;
};

// Calculate cart subtotal
export const calculateCartSubtotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + calculateCartItemPrice(item), 0);
};

// Calculate tax amount (placeholder - actual tax calculated by Square)
export const calculateTax = (subtotal: number): number => {
  return 0; // Tax will be calculated by Square during checkout
};

// Calculate cart total (subtotal only - Square handles tax)
export const calculateCartTotal = (items: CartItem[]): number => {
  const subtotal = calculateCartSubtotal(items);
  return subtotal; // Square will add tax automatically
};

// Format price for display
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

// Calculate discount amount
export const calculateDiscount = (subtotal: number, discountPercentage: number): number => {
  return subtotal * (discountPercentage / 100);
};

// Calculate final total with discount
export const calculateTotalWithDiscount = (
  items: CartItem[],
  discountPercentage: number = 0
): { subtotal: number; discount: number; tax: number; total: number } => {
  const subtotal = calculateCartSubtotal(items);
  const discountAmount = calculateDiscount(subtotal, discountPercentage);
  const discountedSubtotal = subtotal - discountAmount;
  const tax = 0; // Tax will be calculated by Square
  const total = discountedSubtotal; // Square will add tax automatically

  return {
    subtotal,
    discount: discountAmount,
    tax,
    total
  };
};