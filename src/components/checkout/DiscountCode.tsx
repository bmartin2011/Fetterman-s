import React, { useState } from 'react';
import { Tag, X, Loader2 } from 'lucide-react';
import { AppliedDiscount } from '../../types';
import { squareService } from '../../services/squareService';
import toast from 'react-hot-toast';

interface DiscountCodeProps {
  appliedDiscounts: AppliedDiscount[];
  onDiscountApplied: (discount: AppliedDiscount) => void;
  onDiscountRemoved: (discountId: string) => void;
  subtotal: number;
  cartItems: any[]; // CartItem[] - using any to avoid circular import
}

const DiscountCode: React.FC<DiscountCodeProps> = ({
  appliedDiscounts,
  onDiscountApplied,
  onDiscountRemoved,
  subtotal,
  cartItems
}) => {
  const [discountCode, setDiscountCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error('Please enter a discount code');
      return;
    }

    // Check if discount is already applied
    const isAlreadyApplied = appliedDiscounts.some(
      discount => discount.code?.toLowerCase() === discountCode.toLowerCase()
    );

    if (isAlreadyApplied) {
      toast.error('This discount code is already applied');
      return;
    }

    setIsApplying(true);
    try {
      const validationResult = await squareService.validateDiscount(
        discountCode,
        cartItems,
        subtotal
      );

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

        onDiscountApplied(appliedDiscount);
        setDiscountCode('');
        toast.success(`Discount applied: ${validationResult.discount.name}`);
      } else {
        toast.error(validationResult.error || 'Invalid discount code');
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      toast.error('Failed to apply discount code');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveDiscount = (discountId: string, discountName: string) => {
    onDiscountRemoved(discountId);
    toast.success(`Removed discount: ${discountName}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyDiscount();
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Tag className="h-5 w-5" />
        Discount Code
      </h3>

      {/* Applied Discounts */}
      {appliedDiscounts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Applied Discounts:</h4>
          {appliedDiscounts.map((discount) => (
            <div
              key={discount.discountId}
              className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-800">
                    {discount.code || discount.name}
                  </span>
                  <span className="text-sm text-green-800">
                    -{discount.type === 'percentage' ? `${discount.value}%` : `$${discount.appliedAmount.toFixed(2)}`}
                  </span>
                </div>
                <p className="text-sm text-green-800">{discount.name}</p>
                <p className="text-sm font-semibold text-green-800">
                  Savings: ${discount.appliedAmount.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => handleRemoveDiscount(discount.discountId, discount.name)}
                className="text-green-800 hover:text-green-900 p-1"
                title="Remove discount"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Discount Code Input */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="Enter discount code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isApplying}
          />
          <button
            onClick={handleApplyDiscount}
            disabled={isApplying || !discountCode.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Applying
              </>
            ) : (
              'Apply'
            )}
          </button>
        </div>

        {/* Sample Discount Codes */}
        <div className="text-xs text-gray-500">
          <p className="font-medium mb-1">Try these sample codes:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDiscountCode('WELCOME10')}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
              disabled={isApplying}
            >
              WELCOME10
            </button>
            <button
              onClick={() => setDiscountCode('SAVE5')}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
              disabled={isApplying}
            >
              SAVE5
            </button>
            <button
              onClick={() => setDiscountCode('STUDENT15')}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
              disabled={isApplying}
            >
              STUDENT15
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountCode;