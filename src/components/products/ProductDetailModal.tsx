import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-hot-toast';
import { useStoreStatus } from '../../contexts/StoreStatusContext';


interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedOptions {
  selectedVariants: { [variantId: string]: string | string[]; };
  quantity: number;
  customerNote: string;
}

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({ text, maxLength = 150, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (text.length <= maxLength) {
    return <p className={className}>{text}</p>;
  }
  
  return (
    <div>
      <p className={className}>
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 transition-colors"
      >
        {isExpanded ? (
          <>
            Show less <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            See more <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
};

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const { isStoreOnline } = useStoreStatus();
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    selectedVariants: {},
    quantity: 1,
    customerNote: ''
  });

  // Initialize default selections when modal opens
  React.useEffect(() => {
    if (isOpen && product.variants) {
      const defaultSelections: { [variantId: string]: string | string[] } = {};
      
      product.variants.forEach(variant => {
        const defaultOptions = variant.options.filter(option => option.onByDefault);
        if (defaultOptions.length > 0) {
          if (variant.type === 'checklist') {
            defaultSelections[variant.id] = defaultOptions.map(option => option.name);
          } else {
            defaultSelections[variant.id] = defaultOptions[0].name;
          }
        }
      });
      
      if (Object.keys(defaultSelections).length > 0) {
        setSelectedOptions(prev => ({
          ...prev,
          selectedVariants: { ...prev.selectedVariants, ...defaultSelections }
        }));
      }
    }
  }, [isOpen, product.variants]);

  if (!isOpen) return null;

  // Helper function to get selection count for a variant
  const getSelectedCount = (variantId: string): number => {
    const selected = selectedOptions.selectedVariants[variantId];
    if (Array.isArray(selected)) {
      return selected.length;
    }
    return selected ? 1 : 0;
  };

  // Helper function to clean option names
  const cleanOptionName = (name: string): string => {
    if (!name) return '';
    // Remove trailing " 0" or similar patterns
    return name.replace(/\s+0+$/, '').trim();
  };

  // Validation function for modifier selections
  const validateModifierSelections = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (product.variants) {
      product.variants.forEach(variant => {
        const selectedCount = getSelectedCount(variant.id);
        const minRequired = variant.minSelectedModifiers || 0;
        const maxAllowed = variant.maxSelectedModifiers; // Don't default to 1
        
        // Check minimum requirements - dropdowns always require selection
        const actualMinRequired = variant.type === 'dropdown' ? Math.max(minRequired, 1) : minRequired;
        if (selectedCount < actualMinRequired) {
          if (actualMinRequired === 1) {
            errors.push(`${variant.name}: Please select an option`);
          } else {
            errors.push(`${variant.name}: Please select at least ${actualMinRequired} option(s)`);
          }
        }
        
        // Check maximum limits only if maxAllowed is defined
        if (maxAllowed !== undefined && selectedCount > maxAllowed) {
          errors.push(`${variant.name}: Maximum ${maxAllowed} selection(s) allowed`);
        }
      });
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const handleVariantChange = (variantId: string, optionValue: string, isMultiple: boolean = false) => {
    setSelectedOptions(prev => {
      const variant = product.variants?.find(v => v.id === variantId);
      const maxAllowed = variant?.maxSelectedModifiers; // Don't default to 1
      
      if (isMultiple) {
        const currentValues = (prev.selectedVariants[variantId] as string[]) || [];
        const exists = currentValues.includes(optionValue);
        if (exists) {
          return {
            ...prev,
            selectedVariants: {
              ...prev.selectedVariants,
              [variantId]: currentValues.filter(v => v !== optionValue)
            }
          };
        } else {
          // Check if we can add more options (only if maxAllowed is defined)
          if (maxAllowed === undefined || currentValues.length < maxAllowed) {
            return {
              ...prev,
              selectedVariants: {
                ...prev.selectedVariants,
                [variantId]: [...currentValues, optionValue]
              }
            };
          } else {
            // Maximum reached, don't add
            return prev;
          }
        }
      } else {
        return {
          ...prev,
          selectedVariants: {
            ...prev.selectedVariants,
            [variantId]: optionValue
          }
        };
      }
    });
  };

  const calculateTotalPrice = () => {
    let total = product.price;
    
    // Add variant option prices
    if (product.variants) {
      product.variants.forEach(variant => {
        const selectedValue = selectedOptions.selectedVariants[variant.id];
        if (selectedValue) {
          if (Array.isArray(selectedValue)) {
            // Multiple selection (checklist)
            selectedValue.forEach(optionValue => {
              const option = variant.options.find(opt => opt.name === optionValue);
              if (option && option.price !== undefined) {
                total += option.price;
              }
            });
          } else {
            // Single selection (dropdown)
            const option = variant.options.find(opt => opt.name === selectedValue);
            if (option && option.price !== undefined) {
              total += option.price;
            }
          }
        }
      });
    }
    
    return total * selectedOptions.quantity;
  };

  const handleAddToCart = () => {
    // Check if store is online before allowing add to cart
    if (!isStoreOnline) {
      toast.error('Store is currently closed for online ordering. You can browse our menu but cannot add items to cart.');
      return;
    }

    // Validate modifier selections
    const validation = validateModifierSelections();
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast.error(error);
      });
      return;
    }
    
    // Create special instructions from customer note only
    const instructions = [];
    
    // Only add customer note to instructions, not variant selections
    if (selectedOptions.customerNote) {
      instructions.push(selectedOptions.customerNote);
    }
    
    addToCart(
      product,
      selectedOptions.quantity,
      {
        selectedVariants: selectedOptions.selectedVariants
      },
      instructions.join(' | ')
    );
    
    toast.success(`${product.name} added to cart!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg sm:rounded-xl w-full max-w-lg sm:max-w-xl lg:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-3 sm:p-4 lg:p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-4">
                <h2 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">{product.name}</h2>
                <div className="flex items-center">
                  <span className="text-xl sm:text-2xl lg:text-2xl font-bold text-green-600">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close product details"
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4 lg:space-y-4">
            {product.description && (
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h3 className="text-sm sm:text-base lg:text-base font-semibold text-gray-900 mb-2">Description:</h3>
                <ExpandableText 
                  text={product.description} 
                  maxLength={120}
                  className="text-gray-700 leading-relaxed text-sm"
                />
              </div>
            )}

            {product.ingredients && product.ingredients.length > 0 && (
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h3 className="text-sm sm:text-base lg:text-base font-semibold text-gray-900 mb-2">Ingredients:</h3>
                <ExpandableText 
                  text={product.ingredients.join(', ')} 
                  maxLength={100}
                  className="text-gray-700 leading-relaxed text-sm"
                />
              </div>
            )}

            {product.allergens && product.allergens.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-lg">
                <h3 className="text-sm sm:text-base lg:text-base font-semibold text-red-800 mb-2">⚠️ Allergen Information:</h3>
                <p className="text-red-700 leading-relaxed text-sm">{product.allergens.join(', ')}</p>
              </div>
            )}

            {product.nutritionalInfo && Object.keys(product.nutritionalInfo).length > 0 && (
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <h3 className="text-sm sm:text-base lg:text-base font-semibold text-blue-900 mb-2">Nutritional Information:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(product.nutritionalInfo).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-blue-700 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-blue-800 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.variants?.map((variant: ProductVariant) => {
              const selectedCount = getSelectedCount(variant.id);
              const minRequired = variant.minSelectedModifiers || 0;
              const maxAllowed = variant.maxSelectedModifiers;
              const isRequired = variant.type === 'dropdown' || minRequired > 0;
              
              return (
                <div key={variant.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      {variant.name}
                      {isRequired ? (
                        <span className="text-red-500 ml-1">*</span>
                      ) : (
                        <span className="text-gray-500 ml-1">(Optional)</span>
                      )}
                    </h3>
                    {variant.type === 'checklist' && (
                      <span className="text-xs text-gray-500">
                        {selectedCount}{maxAllowed !== undefined ? `/${maxAllowed}` : ''} selected
                        {minRequired > 0 && ` (min: ${minRequired})`}
                      </span>
                    )}
                  </div>
                  
                  {variant.type === 'dropdown' ? (
                    <div className="relative">
                      <label htmlFor={`variant-${variant.id}`} className="sr-only">
                        {variant.name} selection
                      </label>
                      <select
                        id={`variant-${variant.id}`}
                        value={selectedOptions.selectedVariants[variant.id] || ''}
                        onChange={(e) => handleVariantChange(variant.id, e.target.value, false)}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none cursor-pointer text-sm"
                      >
                        <option value="">Select an option</option>
                        {variant.options
                          .filter((option) => {
                            if (!option.name || option.name.trim() === '') return false;
                            if (option.name === '0' || option.name === 'null' || option.name === 'undefined') return false;
                            return true;
                          })
                          .map((option) => (
                            <option key={option.id} value={option.name}>
                              {cleanOptionName(option.name)}
                              {option.price !== undefined ? ` (+$${option.price.toFixed(2)})` : ''}
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {variant.options
                        .filter((option) => {
                          if (!option.name || option.name.trim() === '') return false;
                          if (option.name === '0' || option.name === 'null' || option.name === 'undefined') return false;
                          return true;
                        })
                        .map((option) => {
                          const isSelected = ((selectedOptions.selectedVariants[variant.id] as string[]) || []).includes(option.name);
                          const isMaxReached = maxAllowed !== undefined && selectedCount >= maxAllowed && !isSelected;
                          
                          return (
                            <label key={option.id} className={`flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                              isMaxReached ? 'opacity-50 cursor-not-allowed' : ''
                            }`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isMaxReached}
                                onChange={() => handleVariantChange(variant.id, option.name, true)}
                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2 disabled:opacity-50"
                              />
                              <span className="flex-1 ml-2 text-gray-900 font-medium text-sm">{cleanOptionName(option.name)}</span>
                              {option.price !== undefined ? (
                                <span className="text-green-700 font-semibold text-sm">
                                  +${option.price.toFixed(2)}
                                </span>
                              ) : null}
                            </label>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
              <label htmlFor="customer-note" className="block text-base sm:text-lg font-semibold text-gray-900 mb-3">
                Customer Note:
              </label>
              <textarea
                id="customer-note"
                value={selectedOptions.customerNote}
                onChange={(e) => setSelectedOptions(prev => ({ ...prev, customerNote: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 resize-none text-sm"
                rows={3}
                placeholder="Any special instructions or requests..."
              />
            </div>
          </div>

          <div className="bg-gray-50 border-t border-gray-200 p-3 sm:p-4 lg:p-5 sticky bottom-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-sm sm:text-base font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedOptions(prev => ({ 
                      ...prev, 
                      quantity: Math.max(1, prev.quantity - 1) 
                    }))}
                    aria-label="Decrease quantity"
                    className="p-2 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm transition-all bg-white"
                  >
                    <Minus className="w-4 h-4 text-gray-600" aria-hidden="true" />
                  </button>
                  <span className="text-lg font-bold text-gray-900 min-w-[2.5rem] text-center">{selectedOptions.quantity}</span>
                  <button
                    onClick={() => setSelectedOptions(prev => ({ 
                      ...prev, 
                      quantity: prev.quantity + 1 
                    }))}
                    aria-label="Increase quantity"
                    className="p-2 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm transition-all bg-white"
                  >
                    <Plus className="w-4 h-4 text-gray-600" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  ${calculateTotalPrice().toFixed(2)}
                </div>
              </div>
            </div>
           
            <button
              onClick={handleAddToCart}
              className="w-full bg-green-700 text-white py-3 px-4 rounded-lg hover:bg-green-800 transition-colors font-semibold text-base shadow-lg hover:shadow-xl"
            >
              Add to order
            </button>
          </div>
        </div>
      </div>
  );
};

export default ProductDetailModal;