import React, { useState, useEffect } from 'react';
import { Product } from '../../types';

interface ImageDebuggerProps {
  products: Product[];
}

const ImageDebugger: React.FC<ImageDebuggerProps> = ({ products }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageStats, setImageStats] = useState({
    totalProducts: 0,
    productsWithImages: 0,
    productsWithoutImages: 0,
    totalImages: 0,
    brokenImages: 0,
    workingImages: 0
  });

  useEffect(() => {
    const checkImages = async () => {
      let totalImages = 0;
      let brokenImages = 0;
      let workingImages = 0;
      let productsWithImages = 0;
      let productsWithoutImages = 0;

      for (const product of products) {
        if (product.images && product.images.length > 0) {
          productsWithImages++;
          totalImages += product.images.length;
          
          // Check if first image loads
          try {
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = product.images[0];
            });
            workingImages++;
          } catch {
            brokenImages++;
          }
        } else {
          productsWithoutImages++;
        }
      }

      setImageStats({
        totalProducts: products.length,
        productsWithImages,
        productsWithoutImages,
        totalImages,
        brokenImages,
        workingImages
      });
    };

    if (products.length > 0) {
      checkImages();
    }
  }, [products]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
      >
        🖼️ Debug Images
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <h3 className="font-bold text-lg mb-3">Image Debug Info</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Products:</span>
              <span className="font-mono">{imageStats.totalProducts}</span>
            </div>
            <div className="flex justify-between">
              <span>With Images:</span>
              <span className="font-mono text-green-600">{imageStats.productsWithImages}</span>
            </div>
            <div className="flex justify-between">
              <span>Without Images:</span>
              <span className="font-mono text-red-600">{imageStats.productsWithoutImages}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Image URLs:</span>
              <span className="font-mono">{imageStats.totalImages}</span>
            </div>
            <div className="flex justify-between">
              <span>Working Images:</span>
              <span className="font-mono text-green-600">{imageStats.workingImages}</span>
            </div>
            <div className="flex justify-between">
              <span>Broken Images:</span>
              <span className="font-mono text-red-600">{imageStats.brokenImages}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="font-semibold mb-2">Sample Image URLs:</h4>
            <div className="space-y-1 text-xs">
              {products
                .filter(p => p.images && p.images.length > 0)
                .slice(0, 3)
                .map((product, index) => (
                  <div key={index} className="break-all">
                    <div className="font-medium">{product.name}:</div>
                    <div className="text-gray-600 ml-2">{product.images[0]}</div>
                  </div>
                ))
              }
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="font-semibold mb-2">Troubleshooting:</h4>
            <ul className="text-xs space-y-1 text-gray-600">
              <li>• Check browser console for CORS errors</li>
              <li>• Verify Square API image permissions</li>
              <li>• Check if images exist at URLs</li>
              <li>• Ensure proper authentication</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDebugger;