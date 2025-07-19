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
        console.debug('Preloading failed:', error);
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
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            </div>
          </Router>
        </CheckoutProvider>
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;

