import React from 'react';
import { AlertTriangle, Clock, Mail } from 'lucide-react';

interface StoreStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StoreStatusModal: React.FC<StoreStatusModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Store status notification"
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="bg-orange-100 rounded-full p-3 mr-3">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Store Temporarily Closed</h2>
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            <p className="text-gray-600 font-medium">Online ordering is currently unavailable</p>
          </div>
          <p className="text-gray-700 leading-relaxed">
            We're temporarily closed for online orders and will be back soon. 
            Thank you for your patience!
          </p>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 text-center">Need to place an order?</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <Mail className="w-4 h-4 text-emerald-600 mr-2" />
              <span className="text-gray-700">
                Email: fettermanscreekside@gmail.com
              </span>
            </div>
            <div className="flex items-center justify-center">
              <Mail className="w-4 h-4 text-emerald-600 mr-2" />
              <span className="text-gray-700">
                Email: fettermansplattecity@gmail.com
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreStatusModal;