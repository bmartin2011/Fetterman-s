import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CheckoutState {
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  paymentMethod: 'card' | 'cash' | null;
  orderType: 'pickup' | 'delivery';
  pickupTime: string;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  specialInstructions: string;
}

interface CheckoutContextType {
  checkoutState: CheckoutState;
  updateCustomerInfo: (info: Partial<CheckoutState['customerInfo']>) => void;
  setPaymentMethod: (method: CheckoutState['paymentMethod']) => void;
  setOrderType: (type: CheckoutState['orderType']) => void;
  setPickupTime: (time: string) => void;
  setDeliveryAddress: (address: CheckoutState['deliveryAddress']) => void;
  setSpecialInstructions: (instructions: string) => void;
  resetCheckout: () => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

const initialState: CheckoutState = {
  customerInfo: {
    name: '',
    email: '',
    phone: ''
  },
  paymentMethod: null,
  orderType: 'pickup',
  pickupTime: '',
  deliveryAddress: undefined,
  specialInstructions: ''
};

export const CheckoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [checkoutState, setCheckoutState] = useState<CheckoutState>(initialState);

  const updateCustomerInfo = (info: Partial<CheckoutState['customerInfo']>) => {
    setCheckoutState(prev => ({
      ...prev,
      customerInfo: { ...prev.customerInfo, ...info }
    }));
  };

  const setPaymentMethod = (method: CheckoutState['paymentMethod']) => {
    setCheckoutState(prev => ({ ...prev, paymentMethod: method }));
  };

  const setOrderType = (type: CheckoutState['orderType']) => {
    setCheckoutState(prev => ({ ...prev, orderType: type }));
  };

  const setPickupTime = (time: string) => {
    setCheckoutState(prev => ({ ...prev, pickupTime: time }));
  };

  const setDeliveryAddress = (address: CheckoutState['deliveryAddress']) => {
    setCheckoutState(prev => ({ ...prev, deliveryAddress: address }));
  };

  const setSpecialInstructions = (instructions: string) => {
    setCheckoutState(prev => ({ ...prev, specialInstructions: instructions }));
  };

  const resetCheckout = () => {
    setCheckoutState(initialState);
  };

  const value: CheckoutContextType = {
    checkoutState,
    updateCustomerInfo,
    setPaymentMethod,
    setOrderType,
    setPickupTime,
    setDeliveryAddress,
    setSpecialInstructions,
    resetCheckout
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = (): CheckoutContextType => {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
};

export default CheckoutContext;