import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initializeSecurity } from './config/security';
import { trackWebVitals, trackBundleSize } from './utils/performance';

// Initialize security measures
initializeSecurity();

// Initialize performance monitoring
trackWebVitals();
trackBundleSize();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Enhanced performance monitoring
reportWebVitals((metric) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', metric);
  }
  // In production, send to analytics service
  // Example: analytics.track('web_vital', metric);
});
