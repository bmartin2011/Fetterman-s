import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, ChevronDown } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const [isMobileMenuDropdownOpen, setIsMobileMenuDropdownOpen] = useState(false);
  const { getTotalItems } = useCart();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const totalItems = getTotalItems();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target as Node)) {
        setIsMenuDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation for dropdown
  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsMenuDropdownOpen(false);
      menuButtonRef.current?.focus();
    }
  };

  return (
    <nav id="navigation" className="bg-white shadow-lg sticky top-0 z-50" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2"
            aria-label="Fetterman's Home"
          >
            <img 
              src="/Fettermans_Logo.png" 
              alt="Fetterman's Logo" 
              className="w-16 h-16 object-contain"
            />
            <span className="font-display font-bold text-xl text-gray-900 tracking-wide">
              Fetterman's
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8" role="menubar">
            <Link 
              to="/products" 
              className="text-gray-900 hover:text-emerald-700 font-medium transition-colors"
              aria-label="Navigate to Order Online page"
            >
              Order Online
            </Link>
            
            {/* Menu Dropdown */}
            <div className="relative" ref={menuDropdownRef}>
              <button
                ref={menuButtonRef}
                onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)}
                onKeyDown={handleMenuKeyDown}
                className="flex items-center text-gray-900 hover:text-emerald-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-lg px-2 py-1"
                aria-expanded={isMenuDropdownOpen}
                aria-haspopup="true"
                aria-label="Menu options"
                role="menuitem"
              >
                Menu
                <ChevronDown className={`ml-1 w-4 h-4 transition-transform ${isMenuDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              
              {isMenuDropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  role="menu"
                  aria-label="Menu submenu"
                  onKeyDown={handleMenuKeyDown}
                >
                  <Link
                    to="/menu"
                    className="block px-4 py-2 text-gray-900 hover:bg-emerald-50 hover:text-emerald-700 transition-colors focus:outline-none focus:bg-emerald-50 focus:text-emerald-700"
                    role="menuitem"
                    onClick={() => setIsMenuDropdownOpen(false)}
                    aria-label="View all menus"
                  >
                    All Menus
                  </Link>
                  <Link
                    to="/menu/breakfast"
                    className="block px-4 py-2 text-gray-900 hover:bg-emerald-50 hover:text-emerald-700 transition-colors focus:outline-none focus:bg-emerald-50 focus:text-emerald-700"
                    role="menuitem"
                    onClick={() => setIsMenuDropdownOpen(false)}
                    aria-label="View breakfast menu"
                  >
                    Breakfast Menu
                  </Link>
                  <Link
                    to="/menu/deli"
                    className="block px-4 py-2 text-gray-900 hover:bg-emerald-50 hover:text-emerald-700 transition-colors focus:outline-none focus:bg-emerald-50 focus:text-emerald-700"
                    role="menuitem"
                    onClick={() => setIsMenuDropdownOpen(false)}
                    aria-label="View deli menu"
                  >
                    Deli Menu
                  </Link>
                  <Link
                    to="/menu/meat-cheese"
                    className="block px-4 py-2 text-gray-900 hover:bg-emerald-50 hover:text-emerald-700 transition-colors focus:outline-none focus:bg-emerald-50 focus:text-emerald-700"
                    role="menuitem"
                    onClick={() => setIsMenuDropdownOpen(false)}
                    aria-label="View meat and cheese menu"
                  >
                    Meat & Cheese
                  </Link>
                </div>
              )}
            </div>
            
            <a 
              href="https://squareup.com/gift/MLPYYFNAWK87B/order" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:text-emerald-700 font-medium transition-colors"
              aria-label="Purchase Gift Cards (opens in new tab)"
            >
              Gift Cards
            </a>
            <Link 
              to="/about" 
              className="text-gray-900 hover:text-emerald-700 font-medium transition-colors"
              aria-label="Navigate to About page"
            >
              About
            </Link>
            <Link 
              to="/waiver-form" 
              className="text-gray-900 hover:text-emerald-700 font-medium transition-colors"
              aria-label="Navigate to Waiver/Form page"
            >
              Waiver/Form
            </Link>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <Link 
              to="/cart" 
              className="relative p-2 text-gray-900 hover:text-emerald-700 transition-colors"
              aria-label={`Shopping cart with ${totalItems} items`}
            >
              <ShoppingCart className="w-5 h-5" aria-hidden="true" />
              {totalItems > 0 && (
                <span 
                  className="absolute -top-1 -right-1 bg-emerald-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  aria-label={`${totalItems} items in cart`}
                >
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-900 hover:text-emerald-700 transition-colors"
              aria-label={isMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? 
                <X className="w-5 h-5" aria-hidden="true" /> : 
                <Menu className="w-5 h-5" aria-hidden="true" />
              }
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div 
            className="md:hidden py-4 border-t border-gray-200"
            id="mobile-menu"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            <div className="flex flex-col space-y-4">
              <Link 
                to="/products" 
                className="text-gray-900 hover:text-emerald-700 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Navigate to Order Online page"
              >
                Order Online
              </Link>
              
              {/* Mobile Menu Dropdown */}
              <div>
                <button
                  onClick={() => setIsMobileMenuDropdownOpen(!isMobileMenuDropdownOpen)}
                  className="flex items-center justify-between w-full text-gray-900 hover:text-emerald-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-lg px-2 py-1"
                  aria-expanded={isMobileMenuDropdownOpen}
                  aria-label="Menu options"
                  role="menuitem"
                >
                  Menu
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMobileMenuDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                
                {isMobileMenuDropdownOpen && (
                  <div className="ml-4 mt-2 space-y-2">
                    <Link
                      to="/menu"
                      className="block text-gray-700 hover:text-emerald-700 transition-colors"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsMobileMenuDropdownOpen(false);
                      }}
                      role="menuitem"
                      aria-label="View all menus"
                    >
                      All Menus
                    </Link>
                    <Link
                      to="/menu/breakfast"
                      className="block text-gray-700 hover:text-emerald-700 transition-colors"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsMobileMenuDropdownOpen(false);
                      }}
                      role="menuitem"
                      aria-label="View breakfast menu"
                    >
                      Breakfast Menu
                    </Link>
                    <Link
                      to="/menu/deli"
                      className="block text-gray-700 hover:text-emerald-700 transition-colors"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsMobileMenuDropdownOpen(false);
                      }}
                      role="menuitem"
                      aria-label="View deli menu"
                    >
                      Deli Menu
                    </Link>
                    <Link
                      to="/menu/meat-cheese"
                      className="block text-gray-700 hover:text-emerald-700 transition-colors"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsMobileMenuDropdownOpen(false);
                      }}
                      role="menuitem"
                      aria-label="View meat and cheese menu"
                    >
                      Meat & Cheese
                    </Link>
                  </div>
                )}
              </div>
              
              <a 
                href="https://squareup.com/gift/MLPYYFNAWK87B/order" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 hover:text-emerald-700 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
                role="menuitem"
                aria-label="Purchase Gift Cards (opens in new tab)"
              >
                Gift Cards
              </a>
              <Link 
                to="/about" 
                className="text-gray-900 hover:text-emerald-700 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
                role="menuitem"
                aria-label="Navigate to About page"
              >
                About
              </Link>
              <Link 
                to="/waiver-form" 
                className="text-gray-900 hover:text-emerald-700 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
                role="menuitem"
                aria-label="Navigate to Waiver/Form page"
              >
                Waiver/Form
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;