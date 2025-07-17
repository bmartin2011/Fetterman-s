import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { CartProvider } from './contexts/CartContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/common/ScrollToTop';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import AboutPage from './pages/AboutPage';
import WaiverFormPage from './pages/WaiverFormPage';
import MenuPage from './pages/MenuPage';
import BreakfastMenuPage from './pages/BreakfastMenuPage';
import DeliMenuPage from './pages/DeliMenuPage';
import MeatCheeseMenuPage from './pages/MeatCheeseMenuPage';




function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
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
                style: {
                  background: '#4aed88',
                },
              },
            }}
          />
          </div>
        </Router>
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;

