import React, { useState, useEffect } from 'react';
import { ChevronUp, Search } from 'lucide-react';

interface ScrollToTopProps {
  onCategoryModalOpen?: () => void;
  hideWhenModalOpen?: boolean;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ onCategoryModalOpen, hideWhenModalOpen = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <>
      {isVisible && !hideWhenModalOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {/* Category Navigation Button */}
          {onCategoryModalOpen && (
            <button
              onClick={onCategoryModalOpen}
              className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Open category navigation"
              title="Browse categories"
            >
              <Search className="w-6 h-6" aria-hidden="true" />
            </button>
          )}
          
          {/* Scroll to Top Button */}
          <button
            onClick={scrollToTop}
            className="bg-emerald-700 hover:bg-emerald-800 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-label="Scroll to top"
            title="Back to top"
          >
            <ChevronUp className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
};

export default ScrollToTop;