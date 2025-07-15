import React, { useState, useEffect } from 'react';
import { Package, Scale, Tag, CheckCircle, Settings } from 'lucide-react';
import { Product, Discount, MeasurementUnit, MEASUREMENT_UNITS } from '../../types';
import { squareService } from '../../services/squareService';
import { formatUnit, calculatePricePerUnit } from '../../utils/unitUtils';
import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';

const EnhancedFeaturesDemo: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, appliedDiscounts } = useCart();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, discountsData] = await Promise.all([
          squareService.getProducts(),
          squareService.getDiscounts()
        ]);
        setProducts(productsData.slice(0, 6)); // Show first 6 products
        setDiscounts(discountsData.slice(0, 4)); // Show first 4 discounts
      } catch (error) {
        console.error('Error loading demo data:', error);
        toast.error('Failed to load demo data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading enhanced features demo...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Enhanced Product Features Demo
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Showcasing enhanced product variations with Square's CatalogItemVariation, 
          unit handling for ounces and pounds, and real Square discount integration.
        </p>
      </div>

      {/* Enhanced Product Variations Section */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-900">
            Enhanced Product Variations with Unit Support
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="aspect-w-16 aspect-h-9 mb-4">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              
              {/* Unit Information */}
              {product.measurementUnit && (
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <Scale className="h-4 w-4" />
                  <span>
                    {formatUnit(product.unitQuantity || 1, product.measurementUnit)}
                  </span>
                  {product.measurementUnit && (
                    <span className="text-gray-500">
                      ({calculatePricePerUnit(product.price, product.unitQuantity || 1, product.measurementUnit)})
                    </span>
                  )}
                </div>
              )}
              

              
              {/* Square Integration Info */}
              <div className="text-xs text-gray-500 mb-3 space-y-1">
                {product.squareItemId && (
                  <div>Square ID: {product.squareItemId.slice(0, 8)}...</div>
                )}
                <div className="flex gap-2">
                  {product.stockable && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Stockable</span>
                  )}
                  {product.sellable && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Sellable</span>
                  )}
                </div>
              </div>
              
              {/* Variations */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Variations:</h4>
                  <div className="space-y-2">
                    {product.variants.slice(0, 2).map((variant) => (
                      <div key={variant.id} className="text-sm">
                        <div className="font-medium">{variant.name}</div>
                        <div className="text-gray-600">
                          {variant.selectionType} • {variant.options.length} options
                        </div>
                        {variant.squareModifierListId && (
                          <div className="text-xs text-gray-500">
                            Square Modifier: {variant.squareModifierListId.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-green-600">
                  ${(product.price / 100).toFixed(2)}
                </span>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Real Square Discounts Section */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Tag className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-semibold text-gray-900">
            Real Square Discount Integration
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {discounts.map((discount) => (
            <div key={discount.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{discount.name}</h3>
                  {discount.code && (
                    <div className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                      {discount.code}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {discount.type === 'percentage' ? `${discount.value}%` : `$${(discount.value / 100).toFixed(2)}`} OFF
                  </div>
                  <div className="text-xs text-gray-500">
                    {discount.type === 'automatic' ? 'Auto-applied' : 'Code required'}
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{discount.description}</p>
              
              {/* Square Integration Info */}
              <div className="text-xs text-gray-500 space-y-1">
                {discount.squareDiscountId && (
                  <div>Square ID: {discount.squareDiscountId.slice(0, 8)}...</div>
                )}
                <div>Type: {discount.squareDiscountType || 'FIXED_PERCENTAGE'}</div>
                <div>Scope: {discount.scope || 'ORDER'}</div>
              </div>
              
              {/* Conditions */}
              {discount.conditions && (
                <div className="mt-3 text-xs text-gray-600">
                  <div className="font-medium mb-1">Conditions:</div>
                  {discount.conditions.minimumQuantity && (
                    <div>• Min quantity: {discount.conditions.minimumQuantity}</div>
                  )}
                  {discount.minOrderAmount && (
                    <div>• Min order: ${(discount.minOrderAmount / 100).toFixed(2)}</div>
                  )}
                  {discount.conditions.timeRestrictions && (
                    <div>• Time restrictions apply</div>
                  )}
                </div>
              )}
              
              <div className="mt-3 text-xs text-gray-500">
                Valid: {new Date(discount.validFrom).toLocaleDateString()} - {new Date(discount.validUntil).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Applied Discounts Status */}
      {appliedDiscounts.length > 0 && (
        <section className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-green-800">
              Active Discounts ({appliedDiscounts.length})
            </h2>
          </div>
          
          <div className="space-y-2">
            {appliedDiscounts.map((discount) => (
              <div key={discount.discountId} className="flex items-center justify-between bg-white rounded-md p-3">
                <div>
                  <div className="font-medium text-green-800">{discount.name}</div>
                  {discount.code && (
                    <div className="text-sm text-green-600">Code: {discount.code}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-800">
                    -${discount.appliedAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600">
                    {discount.type === 'automatic' ? 'Auto-applied' : 'Manual'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}



      {/* Measurement Units Reference */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Supported Measurement Units
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(MEASUREMENT_UNITS).map(([key, unit]) => (
            <div key={key} className="bg-white rounded-md p-3 text-center">
              <div className="font-medium text-gray-900">{unit.name}</div>
              <div className="text-sm text-gray-600">{unit.abbreviation}</div>
              <div className="text-xs text-gray-500 capitalize">{unit.type}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default EnhancedFeaturesDemo;