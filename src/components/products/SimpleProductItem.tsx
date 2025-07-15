import React from 'react';
import { Product } from '../../types';

interface SimpleProductItemProps {
  product: Product;
  onClick?: (product: Product) => void;
}

const SimpleProductItem: React.FC<SimpleProductItemProps> = ({ 
  product, 
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-green-500 transition-all duration-300 cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${product.name}`}
    >
      <div className="flex gap-3 sm:gap-4">
        {/* Left Content Section */}
        <div className="flex-1 min-w-0">
          {/* Product Name */}
          <h3 className="text-base sm:text-lg font-bold text-green-700 hover:text-green-800 mb-1 sm:mb-2 line-clamp-2 transition-colors">
            {product.name}
          </h3>
          
          {/* Ingredients */}
          {product.ingredients && product.ingredients.length > 0 && (
            <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 leading-relaxed">
              <span className="font-bold">Ingredients:</span> {product.ingredients.slice(0, 4).join(', ')}
              {product.ingredients.length > 4 && (
                <span className="text-gray-600">...</span>
              )}
            </p>
          )}
          
          {/* Price Range */}
          <div className="text-sm sm:text-base font-semibold text-green-800 mb-1 sm:mb-2">
            ${product.price.toFixed(2)} - ${(product.price * 1.2).toFixed(2)}
          </div>
          
          {/* Store Wide Badge */}
          {(product.isFeatured || false) && (
            <span className="inline-block bg-green-600 text-white text-xs px-2 sm:px-3 py-1 rounded font-medium">
              20% Store Wide!
            </span>
          )}
        </div>
        
        {/* Right Image Section */}
        <div className="flex-shrink-0 w-20 h-16 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={`${product.name} - Food item`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-600 text-sm sm:text-lg">🍽️</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleProductItem;