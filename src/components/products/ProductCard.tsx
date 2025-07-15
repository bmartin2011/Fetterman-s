import React, { useEffect, useState } from 'react';
import { Product } from '../../types';
import { Star, Scale, Clock, Info } from 'lucide-react';
import { formatUnit, calculatePricePerUnit } from '../../utils/unitUtils';


interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
  onToggleFeatured?: (productId: string) => void;
  showAdminControls?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onClick,
  onToggleFeatured, 
  showAdminControls = false 
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
    <article 
      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 flex flex-col h-full"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${product.name}`}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={`${product.name} - Food item`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-2xl">🍽️</span>
              </div>
              <span className="text-sm text-gray-500 font-medium">No Image Available</span>
            </div>
          </div>
        )}
        
        {/* Featured Badge */}
        {(product.isFeatured || false) && (
          <div className="absolute top-3 left-3">
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
              ⭐ Featured
            </span>
          </div>
        )}
        
        {/* Admin Controls */}
        {showAdminControls && (
          <div className="absolute top-3 right-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFeatured?.(product.id);
              }}
              className={`p-2 rounded-full transition-all duration-200 shadow-md ${
                product.isFeatured || false
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-yellow-500'
              }`}
              title={product.isFeatured ? 'Remove from featured' : 'Mark as featured'}
              aria-label={product.isFeatured ? 'Remove from featured' : 'Mark as featured'}
            >
              <Star className="w-4 h-4" fill={product.isFeatured ? 'currentColor' : 'none'} />
            </button>
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-4 sm:p-6 flex flex-col flex-1">
        {/* Product Name */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex-1" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
            {product.name}
          </h3>

        </div>
        

        
        {/* Unit Information */}
        {product.measurementUnit && product.unitQuantity && (
          <div className="flex items-center gap-1 mb-2">
            <Scale className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">
              {formatUnit(product.unitQuantity, product.measurementUnit)}
            </span>
          </div>
        )}
        
        {/* Ingredients */}
        {product.ingredients && product.ingredients.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-700">Ingredients:</span>
              <span className="ml-1">{product.ingredients.slice(0, 5).join(', ')}</span>
              {product.ingredients.length > 5 && (
                <span className="text-gray-500"> +{product.ingredients.length - 5} more</span>
              )}
            </p>
          </div>
        )}
        
        {/* Description */}
         {product.description && (
           <p className="text-sm text-gray-600 mb-4 leading-relaxed" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
             {product.description}
           </p>
         )}
        
        {/* Preparation Time */}
        {product.preparationTime && (
          <div className="flex items-center gap-1 mb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {product.preparationTime} min prep
            </span>
          </div>
        )}
        
        {/* Allergens */}
        {product.allergens && product.allergens.length > 0 && (
          <div className="mb-2">
            <span className="text-xs text-orange-600 font-medium">
              Contains: {product.allergens.slice(0, 3).join(', ')}
              {product.allergens.length > 3 && ` +${product.allergens.length - 3} more`}
            </span>
          </div>
        )}
        
        {/* Price Section */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            {/* Price per unit */}
            {product.measurementUnit && product.unitQuantity && (
              <span className="text-xs text-gray-500">
                {calculatePricePerUnit(product.price, product.unitQuantity, product.measurementUnit)}
              </span>
            )}
          </div>
          
          {/* Call to Action */}
          <div className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
            View Details →
          </div>
        </div>
        
        {/* Enhanced Tags with Categories and Custom Attributes */}
        <div className="flex flex-wrap gap-1 mt-2">
          {product.tags && product.tags.slice(0, 2).map((tag, index) => (
            <span 
              key={index}
              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
          

          
          {/* Show stockable/sellable status for admin */}
          {showAdminControls && (
            <>
              {product.stockable === false && (
                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  Non-stockable
                </span>
              )}
              {product.sellable === false && (
                <span className="inline-block bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                  Not sellable
                </span>
              )}
            </>
          )}
          
          {/* Show count of additional items */}
          {(() => {
            const tagCount = product.tags?.length || 0;
            const totalShown = Math.min(2, tagCount);
            const totalAvailable = tagCount;
            
            return totalAvailable > totalShown && (
              <span className="text-xs text-gray-500">
                +{totalAvailable - totalShown} more
              </span>
            );
          })()}
        </div>
       </div>
     </article>
   );
};

export default ProductCard;