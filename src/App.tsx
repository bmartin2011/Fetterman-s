import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { CartProvider } from './contexts/CartContext';
import { CheckoutProvider } from './contexts/CheckoutContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/common/ScrollToTop';
import ErrorBoundary from './components/common/ErrorBoundary';
import SkeletonLoader from './components/SkeletonLoader';
import { squareService } from './services/squareService';

// Lazy-loaded Pages for Code Splitting
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ProductsPage = React.lazy(() => import('./pages/ProductsPage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const CheckoutSuccess = React.lazy(() => import('./pages/CheckoutSuccess'));
const CheckoutCancel = React.lazy(() => import('./pages/CheckoutCancel'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const WaiverFormPage = React.lazy(() => import('./pages/WaiverFormPage'));
const MenuPage = React.lazy(() => import('./pages/MenuPage'));
const BreakfastMenuPage = React.lazy(() => import('./pages/BreakfastMenuPage'));
const DeliMenuPage = React.lazy(() => import('./pages/DeliMenuPage'));
const MeatCheeseMenuPage = React.lazy(() => import('./pages/MeatCheeseMenuPage'));




function App() {
  // Preload critical data on app initialization
  useEffect(() => {
    const preloadData = async () => {
      try {
        // Start preloading categories and products in the background
        // This will populate the cache before users navigate to ProductsPage
        squareService.getCategories().catch(() => {});
        // Delay products slightly to avoid overwhelming the API
        setTimeout(() => {
          squareService.getProducts().catch(() => {});
        }, 500);
      } catch (error) {
        // Silently fail - this is just preloading
        if (process.env.NODE_ENV === 'development') {
          // Preloading failed silently
        }
      }
    };

    preloadData();
  }, []);

  return (
    <ErrorBoundary>
      <CartProvider>
        <CheckoutProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Skip Links */}
            <a 
              href="#main-content" 
              className="skip-link"
              aria-label="Skip to main content"
            >
              Skip to main content
            </a>
            <a 
              href="#footer" 
              className="skip-link"
              aria-label="Skip to footer"
            >
              Skip to footer
            </a>
            
            <Navbar />
            
            <main id="main-content" className="flex-grow" tabIndex={-1}>
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <SkeletonLoader />
                </div>
              }>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/waiver-form" element={<WaiverFormPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  
                  {/* Menu Routes */}
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/menu/breakfast" element={<BreakfastMenuPage />} />
                  <Route path="/menu/deli" element={<DeliMenuPage />} />
                  <Route path="/menu/meat-cheese" element={<MeatCheeseMenuPage />} />
                  

                  {/* Checkout Routes */}
                  <Route path="/checkout/success" element={<CheckoutSuccess />} />
                  <Route path="/checkout/cancel" element={<CheckoutCancel />} />
         
                </Routes>
              </Suspense>
            </main>
            
            <Footer id="footer" />
            
            <ScrollToTop />
            
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#ffffff',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '12px 16px',
                  maxWidth: '350px',
                  minHeight: 'auto',
                },
                success: {
                  duration: 2500,
                  style: {
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                    color: '#065f46',
                    border: '1px solid #10b981',
                    borderLeft: '4px solid #10b981',
                    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05)',
                  },
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  duration: 4000,
                  style: {
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fef7f7 100%)',
                    color: '#7f1d1d',
                    border: '1px solid #ef4444',
                    borderLeft: '4px solid #ef4444',
                    boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.1), 0 4px 6px -2px rgba(239, 68, 68, 0.05)',
                  },
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
                loading: {
                  style: {
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    color: '#475569',
                    border: '1px solid #94a3b8',
                    borderLeft: '4px solid #94a3b8',
                    boxShadow: '0 10px 15px -3px rgba(148, 163, 184, 0.1), 0 4px 6px -2px rgba(148, 163, 184, 0.05)',
                  },
                  iconTheme: {
                    primary: '#94a3b8',
                    secondary: '#ffffff',
                  },
                },
              }}
              containerStyle={{
                top: '80px',
                right: '16px',
                zIndex: 9999,
              }}
              gutter={8}
            />
            </div>
          </Router>
        </CheckoutProvider>
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;

