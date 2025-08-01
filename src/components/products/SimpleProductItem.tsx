import React, { useState } from 'react';
import { Product } from '../../types';

interface SimpleProductItemProps {
  product: Product;
  onClick?: (product: Product) => void;
}

const SimpleProductItem: React.FC<SimpleProductItemProps> = ({ 
  product, 
  onClick
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
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
  
  const getShortDescription = () => {
    if (!product.ingredients || product.ingredients.length === 0) return '';
    const fullText = product.ingredients.join(', ');
    const maxLength = 60; // Very short for compact design
    
    if (fullText.length <= maxLength) {
      return fullText;
    }
    
    return fullText.substring(0, maxLength) + '...';
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all duration-200 cursor-pointer p-4 mb-3"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${product.name}`}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Product Info */}
        <div className="flex-1 min-w-0 pr-4">
          {/* Product Name */}
          <h3 className="text-base font-bold text-green-700 mb-1 leading-tight uppercase">
            {product.name}
          </h3>
          
          {/* Short Description */}
          {product.ingredients && product.ingredients.length > 0 && (
            <p className="text-xs text-gray-600 mb-2 leading-relaxed">
              <span className="font-medium">Ingredients:</span> {getShortDescription()}
            </p>
          )}
          
          {/* Price */}
          <div className="text-lg font-bold text-green-700">
            ${product.price.toFixed(2)}
          </div>
        </div>
        
        {/* Right side - Image */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <>
              <img
                src={product.images[0]}
                alt={`${product.name} - Food item`}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 animate-pulse">
                  <span className="text-gray-400 text-sm">🍽️</span>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400 text-sm">🍽️</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleProductItem;