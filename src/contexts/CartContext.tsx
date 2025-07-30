import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { CartItem, Product, StoreLocation, CartContextType, ProductVariant, AppliedDiscount } from '../types';
import { squareService } from '../services/squareService';
import { toast } from 'react-hot-toast';
import { calculateCartSubtotal } from '../utils/priceCalculations';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants';
import { useStoreStatus } from './StoreStatusContext';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { isStoreOnline } = useStoreStatus();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<StoreLocation | null>(null);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [appliedDiscounts, setAppliedDiscounts] = useState<AppliedDiscount[]>([]);
  const [selectedPickupDate, setSelectedPickupDate] = useState<string | null>(null);
  const [selectedPickupTime, setSelectedPickupTime] = useState<string | null>(null);

  useEffect(() => {
    const initializeCart = async () => {
      try {
        // Fetch store locations from Square
        const locations = await squareService.getSquareLocations();
        setStoreLocations(locations);
        
        // Load cart and location from localStorage
        const savedCart = localStorage.getItem('cart');
        const savedLocation = localStorage.getItem('selectedLocation');
        const savedPickupDate = localStorage.getItem('selectedPickupDate');
        const savedPickupTime = localStorage.getItem('selectedPickupTime');
        
        if (savedCart) {
          setItems(JSON.parse(savedCart));
        }
        
        if (savedLocation) {
          const location = JSON.parse(savedLocation);
          // Verify location still exists in our data
          const validLocation = locations.find(loc => loc.id === location.id);
          if (validLocation) {
            setSelectedLocation(validLocation);
          }
        }
        
        if (savedPickupDate) {
          setSelectedPickupDate(savedPickupDate);
        }
        
        if (savedPickupTime) {
          setSelectedPickupTime(savedPickupTime);
        }
        
        // Load applied discounts from localStorage
        const savedDiscounts = localStorage.getItem('appliedDiscounts');
        if (savedDiscounts) {
          setAppliedDiscounts(JSON.parse(savedDiscounts));
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // Error initializing cart
        }
        // Fallback to empty locations array if Square API fails
        setStoreLocations([]);
      }
    };
    
    initializeCart();
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever items change
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    // Save selected location to localStorage
    if (selectedLocation) {
      localStorage.setItem('selectedLocation', JSON.stringify(selectedLocation));
    } else {
      localStorage.removeItem('selectedLocation');
    }
  }, [selectedLocation]);

  useEffect(() => {
    // Save applied discounts to localStorage
    localStorage.setItem('appliedDiscounts', JSON.stringify(appliedDiscounts));
  }, [appliedDiscounts]);

  useEffect(() => {
    // Save selected pickup date to localStorage
    if (selectedPickupDate) {
      localStorage.setItem('selectedPickupDate', selectedPickupDate);
    } else {
      localStorage.removeItem('selectedPickupDate');
    }
  }, [selectedPickupDate]);

  useEffect(() => {
    // Save selected pickup time to localStorage
    if (selectedPickupTime) {
      localStorage.setItem('selectedPickupTime', selectedPickupTime);
    } else {
      localStorage.removeItem('selectedPickupTime');
    }
  }, [selectedPickupTime]);

  // Auto-apply eligible discounts when cart changes
  useEffect(() => {
    const applyAutomaticDiscounts = async () => {
      if (items.length === 0) {
        // Clear discounts if cart is empty
        if (appliedDiscounts.length > 0) {
          setAppliedDiscounts([]);
        }
        return;
      }

      try {
        const subtotal = getSubtotal();
        const automaticDiscounts = await squareService.getAutomaticDiscounts(items, subtotal);
        
        // Only update if there are new automatic discounts
        if (automaticDiscounts.length > 0) {
          // Keep manually applied discounts and add automatic ones
          const manualDiscounts = appliedDiscounts.filter(d => d.discount.type !== 'automatic');
          const newDiscounts = [...manualDiscounts, ...automaticDiscounts];
          
          // Remove duplicates based on discount ID
          const uniqueDiscounts = newDiscounts.filter((discount, index, self) => 
            index === self.findIndex(d => d.discount.id === discount.discount.id)
          );
          
          if (JSON.stringify(uniqueDiscounts) !== JSON.stringify(appliedDiscounts)) {
            setAppliedDiscounts(uniqueDiscounts);
            
            // Notify user of automatic discounts applied
            const newAutoDiscounts = automaticDiscounts.filter(autoDiscount => 
              !appliedDiscounts.some(existing => existing.discount.id === autoDiscount.discount.id)
            );
            
            if (newAutoDiscounts.length > 0) {
              toast.success(`${newAutoDiscounts.length} automatic discount${newAutoDiscounts.length > 1 ? 's' : ''} applied!`);
            }
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // Error applying automatic discounts
        }
        // Don't show error to user as this is background functionality
      }
    };

    // Debounce the automatic discount application
    const timeoutId = setTimeout(applyAutomaticDiscounts, 500);
    return () => clearTimeout(timeoutId);
  }, [items]); // Don't include appliedDiscounts to avoid infinite loop
  
  const addToCart = useCallback((
    product: Product, 
    quantity: number, 
    customizations: {
      selectedVariants?: { [variantId: string]: string | string[]; };
    } = {},
    specialInstructions?: string
  ) => {
    // Check if store is online before allowing add to cart
    if (!isStoreOnline) {
      toast.error('Store is currently closed for online ordering. You can browse our menu but cannot add items to cart.');
      return;
    }

    if (!selectedLocation) {
      toast.error(ERROR_MESSAGES.LOCATION_REQUIRED);
      return;
    }

    // Calculate total price including customizations
    let totalPrice = product.price;
    
    // Add variant option prices
    if (product.variants && customizations.selectedVariants) {
      product.variants.forEach(variant => {
        const selectedValue = customizations.selectedVariants![variant.id];
        if (selectedValue) {
          if (Array.isArray(selectedValue)) {
            selectedValue.forEach(optionValue => {
              const option = variant.options.find(opt => opt.name === optionValue);
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
    
    // All customizations now handled through variants
    
    totalPrice *= quantity;

    // Create unique ID for cart item
    const cartItemId = `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const cartItem: CartItem = {
      id: cartItemId,
      product,
      quantity,
      selectedVariants: customizations.selectedVariants,
      specialInstructions,
      totalPrice,
      addedAt: new Date().toISOString()
    };

    setItems(prevItems => [...prevItems, cartItem]);
    toast.success(SUCCESS_MESSAGES.ITEM_ADDED_TO_CART);
  }, [selectedLocation, isStoreOnline]);

  const removeFromCart = useCallback((itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
    toast.success(SUCCESS_MESSAGES.ITEM_REMOVED_FROM_CART);
  }, [items]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems(items.map(item => {
      if (item.id === itemId) {
        // Calculate the per-item price from the current totalPrice
        const perItemPrice = item.totalPrice / item.quantity;
        // Recalculate totalPrice for the new quantity
        const newTotalPrice = perItemPrice * quantity;
        return { ...item, quantity, totalPrice: newTotalPrice };
      }
      return item;
    }));
  }, [items, removeFromCart]);

  const updateCustomizations = useCallback((itemId: string, customizations: {
    selectedVariants?: { [variantId: string]: string | string[]; };
  }) => {
    setItems(items.map(item => 
      item.id === itemId ? { 
        ...item, 
        selectedVariants: customizations.selectedVariants
      } : item
    ));
  }, [items]);

  const updateSpecialInstructions = useCallback((itemId: string, instructions: string) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, specialInstructions: instructions } : item
    ));
  }, [items]);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedDiscounts([]);
    localStorage.removeItem('appliedDiscounts');
    toast.success(SUCCESS_MESSAGES.CART_CLEARED);
  }, []);

  const setPickupLocation = useCallback((location: StoreLocation) => {
    setSelectedLocation(location);
    toast.success(SUCCESS_MESSAGES.LOCATION_SELECTED);
  }, []);

  const setPickupDateTime = useCallback((date: string, time: string) => {
    setSelectedPickupDate(date);
    setSelectedPickupTime(time);
    toast.success('Pickup date and time selected');
  }, []);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getSubtotal = useCallback(() => {
    return calculateCartSubtotal(items);
  }, [items]);

  const getTotalDiscount = useCallback(() => {
    return appliedDiscounts.reduce((total, discount) => total + discount.appliedAmount, 0);
  }, [appliedDiscounts]);

  const getTotalPrice = useCallback(() => {
    const subtotal = getSubtotal();
    const discount = getTotalDiscount();
    return Math.max(0, subtotal - discount); // Ensure total never goes below 0
  }, [getSubtotal, getTotalDiscount]);

  const applyDiscount = useCallback(async (code: string): Promise<boolean> => {
    try {
      // Check if discount is already applied
      const isAlreadyApplied = appliedDiscounts.some(
        discount => discount.code?.toLowerCase() === code.toLowerCase()
      );

      if (isAlreadyApplied) {
        toast.error('This discount code is already applied');
        return false;
      }

      const subtotal = getSubtotal();
      const validationResult = await squareService.validateDiscount(code, items, subtotal);

      if (validationResult.isValid && validationResult.discount && validationResult.appliedAmount) {
        const appliedDiscount: AppliedDiscount = {
          discountId: validationResult.discount.id,
          code: validationResult.discount.code,
          name: validationResult.discount.name,
          type: validationResult.discount.type,
          value: validationResult.discount.value,
          appliedAmount: validationResult.appliedAmount,
          appliedTo: 'order',
          discount: validationResult.discount
        };

        setAppliedDiscounts(prev => [...prev, appliedDiscount]);
        toast.success(`Discount applied: ${validationResult.discount.name}`);
        return true;
      } else {
        toast.error(validationResult.error || 'Invalid discount code');
        return false;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Error applying discount
      }
      toast.error('Failed to apply discount code');
      return false;
    }
  }, [appliedDiscounts, items, getSubtotal]);

  const removeDiscount = useCallback((discountId: string) => {
    const discount = appliedDiscounts.find(d => d.discountId === discountId);
    setAppliedDiscounts(prev => prev.filter(d => d.discountId !== discountId));
    if (discount) {
      toast.success(`Removed discount: ${discount.name}`);
    }
  }, [appliedDiscounts]);

  const getEstimatedPickupTime = useCallback(() => {
    // Only return the customer's selected pickup time
    if (selectedPickupDate && selectedPickupTime) {
      return new Date(`${selectedPickupDate}T${selectedPickupTime}`);
    }
    
    // Return null if no pickup time is selected
     return null;
   }, [selectedPickupDate, selectedPickupTime]);

  const value: CartContextType = useMemo(() => ({
    items,
    selectedLocation,
    storeLocations,
    appliedDiscounts,
    selectedPickupDate,
    selectedPickupTime,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCustomizations,
    updateSpecialInstructions,
    setPickupLocation,
    setPickupDateTime,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getSubtotal,
    getTotalDiscount,
    applyDiscount,
    removeDiscount,
    getEstimatedPickupTime
  }), [
    items,
    selectedLocation,
    storeLocations,
    appliedDiscounts,
    selectedPickupDate,
    selectedPickupTime,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCustomizations,
    updateSpecialInstructions,
    setPickupLocation,
    setPickupDateTime,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getSubtotal,
    getTotalDiscount,
    applyDiscount,
    removeDiscount,
    getEstimatedPickupTime
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};