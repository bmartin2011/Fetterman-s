import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { squareService } from '../services/squareService';
import GooglePayButton from '@google-pay/button-react';
import DiscountCode from '../components/checkout/DiscountCode';
import DateTimePicker from '../components/common/DateTimePicker';

import { 
  CreditCard, 
  MapPin, 
  ArrowLeft,
  Package,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface BillingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

type PaymentMethod = 'square-redirect' | 'square' | 'googlepay' | 'cashapp';

const CheckoutPage: React.FC = () => {
  const { 
    items, 
    getTotalPrice, 
    getSubtotal, 
    getTotalDiscount, 
    appliedDiscounts, 
    clearCart, 
    selectedLocation,
    selectedPickupDate,
    selectedPickupTime,
    setPickupDateTime
  } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('square-redirect');
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [showCustomTip, setShowCustomTip] = useState(false);
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  const subtotal = getSubtotal();
  const discountAmount = getTotalDiscount();
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * 0.08875; // 8.875% tax rate
  const finalTipAmount = showCustomTip ? parseFloat(customTip) || 0 : tipAmount;
  const finalTotal = discountedSubtotal + tax + finalTipAmount;

  // Calculate estimated pickup time (15 minutes from now)
  const estimatedPickupTime = useMemo(() => {
    const now = new Date();
    return new Date(now.getTime() + 15 * 60000); // 15 minutes
  }, []);

  // Initialize Square Web Payments SDK
  useEffect(() => {
    if (!selectedLocation) {
      toast.error('Please select a pickup location first');
      navigate('/cart');
      return;
    }

    const initializeSquare = async () => {
      try {
        await squareService.initializeSquare();
        await squareService.initializeCard('card-container');
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to initialize Square:', error);
        }
      }
    };

    // Delay initialization to ensure DOM is ready
    const timer = setTimeout(initializeSquare, 1000);
    return () => clearTimeout(timer);
  }, [selectedLocation, navigate]);

  if (!selectedLocation) {
    return null;
  }

  const validateCustomerInfo = () => {
    const required = ['firstName', 'lastName', 'email', 'phone'];
    for (const field of required) {
      if (!customerInfo[field as keyof CustomerInfo]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  const validatePickupDateTime = () => {
    if (!selectedPickupDate) {
      toast.error('Please select a pickup date');
      return false;
    }
    if (!selectedPickupTime) {
      toast.error('Please select a pickup time');
      return false;
    }
    return true;
  };

  // Handle Square Checkout redirect (new simplified approach)
  const handleSquareCheckoutRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCustomerInfo()) {
      return;
    }

    if (!validatePickupDateTime()) {
      return;
    }

    setLoading(true);
    try {
      const checkoutData = {
          items,
          pickupLocation: selectedLocation!,
          customerInfo: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            phone: customerInfo.phone,
            email: customerInfo.email
          },
          appliedDiscounts,
          pickupDate: selectedPickupDate || undefined,
          pickupTime: selectedPickupTime || undefined
        };

      // Create Square Checkout and get redirect URL
      const result = await squareService.createCheckout(checkoutData);
      
      // Redirect to Square's hosted checkout page
      window.location.href = result.checkoutUrl;
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Square Checkout failed:', error);
      }
      toast.error(`Checkout failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Updated function name and implementation for Square Web Payments SDK
  const handleSquareCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCustomerInfo()) {
      return;
    }

    if (!validatePickupDateTime()) {
      return;
    }

    if (!squareService.card) {
       toast.error('Payment form not ready. Please wait a moment and try again.');
       return;
     }

    setLoading(true);
    try {
      // Tokenize the card
      const tokenResult = await squareService.card.tokenize();
      if (tokenResult.status === 'OK' && tokenResult.token) {
        const checkoutData = {
          items,
          pickupLocation: selectedLocation!,
          customerInfo: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            phone: customerInfo.phone,
            email: customerInfo.email
          },
          appliedDiscounts,
          pickupDate: selectedPickupDate || undefined,
          pickupTime: selectedPickupTime || undefined
        };

        // Create order in Square
        const orderResult = await squareService.createCheckoutSession(checkoutData);
        
        // Process payment
        const paymentResult = await squareService.processPayment(
          tokenResult.token,
          orderResult.total,
          orderResult.orderId
        );

        if (paymentResult.success) {
          // Clear cart and navigate to success page
          clearCart();
          navigate('/checkout/success', { 
            state: { 
              orderId: orderResult.orderId,
              total: orderResult.total / 100, // Convert back from cents
              estimatedPickupTime,
              transactionId: paymentResult.transactionId
            } 
          });
        } else {
          throw new Error('Payment processing failed');
        }
      } else {
        const errorMessage = tokenResult.errors?.[0]?.message || 'Card tokenization failed';
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Checkout failed:', error);
      }
       toast.error(`Checkout failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart before checking out.</p>
          <Link
            to="/products"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selection */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Checkout</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => setSelectedPaymentMethod('square-redirect')}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedPaymentMethod === 'square-redirect'
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  <span className="text-sm">Square Checkout</span>
                </button>
                <button
                  onClick={() => setSelectedPaymentMethod('square')}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedPaymentMethod === 'square'
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  <span className="text-sm">Square Pay</span>
                </button>
                <button
                  onClick={() => setSelectedPaymentMethod('googlepay')}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedPaymentMethod === 'googlepay'
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <span className="text-lg font-bold">G</span>
                  <span className="ml-1">Pay</span>
                </button>
              </div>
              {selectedPaymentMethod === 'square-redirect' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Secure Square Checkout
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>You'll be redirected to Square's secure payment page to complete your order. This is the fastest and most secure way to pay.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pickup Location */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Pickup at
              </h2>
              <div className="flex items-start mb-4">
                <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">{selectedLocation.name}</p>
                  <p className="text-sm text-gray-600">{selectedLocation.address}, {selectedLocation.city}</p>
                  {selectedPickupDate && selectedPickupTime ? (
                    <p className="text-sm text-gray-600">
                      {new Date(selectedPickupDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })} at {new Date(`2000-01-01T${selectedPickupTime}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">Please select pickup date and time</p>
                  )}
                </div>
              </div>
              
              {/* Date Time Picker */}
              <div className="mb-4">
                <DateTimePicker
                  selectedDate={selectedPickupDate || undefined}
                  selectedTime={selectedPickupTime || undefined}
                  onDateTimeSelect={setPickupDateTime}
                  selectedLocation={selectedLocation}
                />
              </div>
              
              <div className="mt-4 flex items-center">
                <input type="checkbox" id="curbside" className="mr-2" />
                <label htmlFor="curbside" className="text-sm text-gray-600">Curbside pickup</label>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-600">Instructions</p>
                <p className="text-sm text-gray-500">Curbside Pickup: Call us @16-431-6266 when you're here and we'll run your order out to you. Please park in spots closest to build... <span className="text-blue-600 cursor-pointer">Show more</span></p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Contact</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg">
                    <option>+1 United States</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email address for receipt"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First name"
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                By providing your phone number/email, you agree to receive order updates via text or email from Square and our other partners on our behalf. <span className="text-blue-600 cursor-pointer">Learn more</span>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment</h2>
              <p className="text-sm text-gray-600 mb-4">All transactions are secure and encrypted</p>
              
              {selectedPaymentMethod === 'square' && (
                <div className="space-y-4">
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Credit card</span>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="space-y-3">
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>United States</option>
                      </select>
                      <div 
                        id="card-container" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
                        style={{ minHeight: '56px' }}
                      >
                        {/* Square card form will be inserted here */}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-green-600 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-800">Cash App Pay</span>
                      <span className="text-green-600 font-bold text-lg">$</span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedPaymentMethod === 'googlepay' && (
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-center py-4">
                    <GooglePayButton
                      environment="TEST"
                      paymentRequest={{
                        apiVersion: 2,
                        apiVersionMinor: 0,
                        allowedPaymentMethods: [
                          {
                            type: 'CARD',
                            parameters: {
                              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                              allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX', 'DISCOVER'],
                            },
                            tokenizationSpecification: {
                              type: 'PAYMENT_GATEWAY',
                              parameters: {
                                gateway: 'square',
                                gatewayMerchantId: process.env.REACT_APP_SQUARE_MERCHANT_ID || 'sandbox-sq0idb-YOUR_MERCHANT_ID',
                              },
                            },
                          },
                        ],
                        merchantInfo: {
                          merchantId: '01234567890123456789',
                          merchantName: "Fetterman's Deli",
                        },
                        transactionInfo: {
                          totalPriceStatus: 'FINAL',
                          totalPriceLabel: 'Total',
                          totalPrice: finalTotal.toFixed(2),
                          currencyCode: 'USD',
                          countryCode: 'US',
                        },
                      }}
                      onLoadPaymentData={(paymentData) => {
                    
                        // Handle the payment data here
                        // You would typically send this to your payment processor
                        toast.success('Google Pay payment initiated!');
                        // For demo purposes, redirect to success page
                        navigate('/checkout/success');
                      }}
                      onError={(error) => {
                        if (process.env.NODE_ENV === 'development') {
                          console.error('Google Pay error:', error);
                        }
                        toast.error('Google Pay payment failed. Please try another payment method.');
                      }}
                      onCancel={() => {
                     
                         toast('Google Pay payment cancelled.');
                       }}
                      buttonType="pay"
                      buttonColor="black"
                      buttonSizeMode="fill"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Billing Address */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Billing address</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First name"
                    value={billingAddress.firstName}
                    onChange={(e) => setBillingAddress({...billingAddress, firstName: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={billingAddress.lastName}
                    onChange={(e) => setBillingAddress({...billingAddress, lastName: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select 
                  value={billingAddress.country}
                  onChange={(e) => setBillingAddress({...billingAddress, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>United States</option>
                  <option>Canada</option>
                </select>
                <input
                  type="text"
                  placeholder="Enter your address here."
                  value={billingAddress.address}
                  onChange={(e) => setBillingAddress({...billingAddress, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="text-blue-600 text-sm flex items-center">
                  <Plus className="w-4 h-4 mr-1" />
                  Apt, Suite, Floor, etc.
                </button>
              </div>
            </div>

            {/* Create Account */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create account</h2>
              <div className="flex items-start space-x-3">
                <input type="checkbox" id="create-account" className="mt-1" />
                <div>
                  <label htmlFor="create-account" className="text-sm text-gray-700">
                    Save your payment info for faster reordering at Fetterman's Deli • Coffee • Ice Cream • Eatery and secure checkout with Square.
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    By selecting to create an account, you agree to the <span className="text-blue-600">Square buyer account terms</span> and <span className="text-blue-600">Privacy policy</span>. You may provide consent/revoke from Square.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Powered by</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">□</span>
                    </div>
                    <span className="font-bold text-sm">Square Pay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-bold text-gray-900">Order summary ({items.length} {items.length === 1 ? 'item' : 'items'})</h2>
                <button className="text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414L11.414 12l3.293 3.293a1 1 0 01-1.414 1.414L10 13.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 12 5.293 8.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <textarea
                  placeholder="Add a note for the seller"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none h-20 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tip Section */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Add a tip</h3>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[5, 10, 15].map((percentage) => {
                    const amount = (subtotal * percentage) / 100;
                    return (
                      <button
                        key={percentage}
                        onClick={() => {
                          setTipAmount(amount);
                          setShowCustomTip(false);
                          setCustomTip('');
                        }}
                        className={`px-3 py-2 text-sm rounded border transition-colors ${
                          !showCustomTip && tipAmount === amount
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {percentage}%<br />
                        <span className="text-xs">${amount.toFixed(2)}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      setShowCustomTip(true);
                      setTipAmount(0);
                    }}
                    className={`px-3 py-2 text-sm rounded border transition-colors ${
                      showCustomTip
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Other
                  </button>
                </div>
                {showCustomTip && (
                  <input
                    type="number"
                    placeholder="Custom tip amount"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => {
                  let itemPrice = item.product.price;
                  
                  // Add variant price modifiers
                  if (item.selectedVariants && item.product.variants) {
                    Object.entries(item.selectedVariants).forEach(([variantId, selectedValue]) => {
                      const variant = item.product.variants?.find(v => v.id === variantId);
                      if (variant) {
                        if (Array.isArray(selectedValue)) {
                          selectedValue.forEach(value => {
                            const option = variant.options.find(opt => opt.name === value);
                            if (option && option.price) {
                              itemPrice += option.price;
                            }
                          });
                        } else {
                          const option = variant.options.find(opt => opt.name === selectedValue);
                          if (option && option.price) {
                            itemPrice += option.price;
                          }
                        }
                      }
                    });
                  }
                  
                  return (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                        {item.selectedVariants && Object.entries(item.selectedVariants).map(([variantId, selectedValue]) => {
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
                              {variant.name}: {getOptionLabels(selectedValue)}
                            </p>
                          );
                        })}
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${(itemPrice * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Discount Code Section */}
              <div className="mb-6">
                <DiscountCode 
                  appliedDiscounts={appliedDiscounts}
                  onDiscountApplied={() => {}} // Handled by CartContext
                  onDiscountRemoved={() => {}} // Handled by CartContext
                  subtotal={subtotal}
                  cartItems={items}
                />
              </div>

              {/* Order Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Taxes (Missouri)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {finalTipAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tip</span>
                    <span>${finalTipAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                  <span>Order total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <form onSubmit={selectedPaymentMethod === 'square-redirect' ? handleSquareCheckoutRedirect : handleSquareCheckout} className="mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : null}
                  {loading ? 'Processing...' : selectedPaymentMethod === 'square-redirect' ? `Continue to Square $${finalTotal.toFixed(2)}` : `Place order $${finalTotal.toFixed(2)}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;