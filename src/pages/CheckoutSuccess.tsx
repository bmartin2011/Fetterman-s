import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Clock } from 'lucide-react';

interface OrderState {
  orderId: string;
  total: number;
  estimatedPickupTime: Date;
  transactionId?: string;
}

const CheckoutSuccess: React.FC = () => {
  const location = useLocation();
  const orderData = location.state as OrderState;

  const formatDateTime = (date: Date) => {
    const today = new Date();
    const pickupDate = new Date(date);
    const isToday = today.toDateString() === pickupDate.toDateString();
    
    if (isToday) {
      // For today's orders, show "Today at [time]"
      return `Today at ${new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(pickupDate)}`;
    } else {
      // For future orders, show full date and time
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(pickupDate);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been confirmed and is being prepared.
        </p>
        
        {orderData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Order ID:</span>
              <span className="font-mono text-sm">{orderData.orderId}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-semibold">${orderData.total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Estimated Pickup:
              </span>
              <span className="font-semibold">{formatDateTime(new Date(orderData.estimatedPickupTime))}</span>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <Link
            to="/products"
            className="block w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Order More
          </Link>
          <Link
            to="/"
            className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;