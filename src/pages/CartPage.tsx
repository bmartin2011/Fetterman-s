import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { squareService } from '../services/squareService';
import LocationSelector from '../components/common/LocationSelector';
import DateTimePicker from '../components/common/DateTimePicker';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const CartPage: React.FC = () => {
  const { 
    items, 
    updateQuantity, 
    removeFromCart, 
    getTotalPrice, 
    clearCart, 
    selectedLocation, 
    storeLocations, 
    setPickupLocation,
    selectedPickupDate,
    selectedPickupTime,
    setPickupDateTime
  } = useCart();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id: string, name: string) => {
    removeFromCart(id);
    toast.success(`${name} removed from cart`);
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared');
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!selectedLocation) {
      setShowLocationSelector(true);
      toast.error('Please select a pickup location');
      return;
    }

    if (!selectedPickupDate || !selectedPickupTime) {
      toast.error('Please select a pickup date and time');
      return;
    }

    setIsLoading(true);
    try {
      // Create Square checkout with minimal customer info
      const checkoutData = {
        items,
        pickupLocation: selectedLocation,
        customerInfo: {
          name: 'Customer', // Will be collected by Square
          phone: '', // Will be collected by Square
          email: '' // Will be collected by Square
        }
      };

      const result = await squareService.createCheckout(checkoutData);
      
      if (result.checkoutUrl) {
        // Redirect to Square's hosted checkout page
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout - no checkout URL received');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Checkout error:', error);
      }
      toast.error('Failed to proceed to checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <Link
              to="/"
              className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">{items.length} item(s) in your cart</p>
          </div>
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-700 transition-colors text-sm font-medium"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                    {item.product.images && item.product.images.length > 0 ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <span className="text-xs font-medium">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-medium text-gray-900 truncate">
                      {item.product.name}
                    </h4>
                    
                    {/* Selections/Modifiers */}
                    {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(item.selectedVariants).map(([variantId, selectedValue]) => {
                          const variant = item.product.variants?.find(v => v.id === variantId);
                          if (!variant) return null;
                          
                          const getOptionLabels = (value: string | string[]) => {
                            if (Array.isArray(value)) {
                              return value.map(val => {
                                const option = variant.options.find(opt => opt.name === val);
                                return option ? option.name : val;
                              }).join(', ');
                            } else {
                              const option = variant.options.find(opt => opt.name === value);
                              return option ? option.name : value;
                            }
                          };
                          
                          return (
                            <p key={variantId} className="text-sm text-gray-600">
                              <span className="font-medium">{variant.name}:</span> {getOptionLabels(selectedValue)}
                            </p>
                          );
                        })}
                      </div>
                    )}

                    {/* Special Instructions/Note */}
                    {item.specialInstructions && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-yellow-800">Note:</span> {item.specialInstructions}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      ${(item.totalPrice / item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        aria-label={`Decrease quantity of ${item.product.name}`}
                      >
                        <Minus className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        aria-label={`Increase quantity of ${item.product.name}`}
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.id, item.product.name)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <Trash2 className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Item Total */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm text-gray-600">Item Total:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${item.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Pickup Location */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Pickup Location</h4>
                {selectedLocation ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{selectedLocation.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedLocation.address}, {selectedLocation.city}, {selectedLocation.state}
                        </p>
                        <p className="text-sm text-gray-600">{selectedLocation.phone}</p>
                      </div>
                      <button
                        onClick={() => setShowLocationSelector(true)}
                        className="text-green-700 hover:text-green-800 text-sm font-semibold bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLocationSelector(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Select Pickup Location</span>
                  </button>
                )}
              </div>

              {/* Pickup Date & Time */}
              {selectedLocation && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <DateTimePicker
                    selectedDate={selectedPickupDate || undefined}
                    selectedTime={selectedPickupTime || undefined}
                    onDateTimeSelect={setPickupDateTime}
                    selectedLocation={selectedLocation}
                    storeHours={selectedLocation.hours}
                  />
                </div>
              )}
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total:</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full mt-6 bg-green-700 text-white py-3 px-4 rounded-lg hover:bg-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
              >
                {isLoading ? (
                  'Redirecting to Square...'
                ) : (
                  <>
                    Go to Payment
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>

              <Link
                to="/"
                className="block w-full mt-3 text-center text-green-700 hover:text-green-800 transition-colors font-semibold bg-green-50 hover:bg-green-100 py-2 rounded-lg"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Location Selector Modal */}
      <LocationSelector
        locations={storeLocations}
        selectedLocation={selectedLocation}
        onLocationSelect={setPickupLocation}
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
      />
    </div>
  );
};

export default CartPage;