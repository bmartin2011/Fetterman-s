import React, { useEffect, useState } from 'react';
import { squareService } from '../services/squareService';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
}

/**
 * Performance optimizer component that preloads critical data
 * and manages resource loading priorities
 */
const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ children }) => {
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);

  useEffect(() => {
    const preloadCriticalData = async () => {
      try {
        // Step 1: Preload categories (fast, needed for navigation)
        setPreloadProgress(25);
        await squareService.getCategories();
        
        // Step 2: Preload products (slower, but critical for main page)
        setPreloadProgress(75);
        await squareService.getProducts();
        
        // Step 3: Preload modifiers (background, for product details)
        setPreloadProgress(100);
        squareService.getModifiers().catch(() => {}); // Silent fail
        
        setIsPreloading(false);
      } catch (error) {
        console.warn('Preloading failed, continuing with normal loading:', error);
        setIsPreloading(false);
      }
    };

    // Start preloading after a short delay to not block initial render
    const timer = setTimeout(preloadCriticalData, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Show minimal loading indicator during preload
  if (isPreloading && preloadProgress < 100) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Loading menu...</p>
          <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${preloadProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PerformanceOptimizer;