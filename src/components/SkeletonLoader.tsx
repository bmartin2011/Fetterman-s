import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
  type?: 'product' | 'category' | 'text';
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  count = 1, 
  type = 'product', 
  className = '' 
}) => {
  const renderProductSkeleton = () => (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden animate-pulse ${className}`}>
      <div className="h-48 bg-gray-300"></div>
      <div className="p-4">
        <div className="h-4 bg-gray-300 rounded mb-2"></div>
        <div className="h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  );

  const renderCategorySkeleton = () => (
    <div className={`h-10 bg-gray-300 rounded-full animate-pulse ${className}`}>
      <div className="w-20 h-full bg-gray-300 rounded-full"></div>
    </div>
  );

  const renderTextSkeleton = () => (
    <div className={`h-4 bg-gray-300 rounded animate-pulse ${className}`}></div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'product':
        return renderProductSkeleton();
      case 'category':
        return renderCategorySkeleton();
      case 'text':
        return renderTextSkeleton();
      default:
        return renderProductSkeleton();
    }
  };

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

export default SkeletonLoader;