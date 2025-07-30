// Performance Monitoring Utilities
import React from 'react';

// Enhanced Web Vitals tracking with thresholds and analytics
interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

const webVitalsThresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 }
};

const getRating = (name: keyof typeof webVitalsThresholds, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = webVitalsThresholds[name];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
};

export const trackWebVitals = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Track Core Web Vitals with enhanced analytics
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      const handleMetric = (metric: any) => {
        if (process.env.NODE_ENV === 'development') {
          // Web vital tracked
        }

        // Send to analytics in production
        if (process.env.NODE_ENV === 'production') {
          const webVital: WebVitalMetric = {
            name: metric.name,
            value: metric.value,
            rating: getRating(metric.name as keyof typeof webVitalsThresholds, metric.value),
            timestamp: Date.now()
          };
          // Example: analytics.track('web_vital', webVital);
          // Web vital tracked silently in production
        }
      };

      getCLS(handleMetric);
      getFID(handleMetric);
      getFCP(handleMetric);
      getLCP(handleMetric);
      getTTFB(handleMetric);
    }).catch(() => {
      if (process.env.NODE_ENV === 'development') {
        // Web Vitals library not available
      }
    });
  }
};

// Performance timing utility
export class PerformanceTimer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
  }

  end(): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    
    if (process.env.NODE_ENV === 'development') {
      // Performance timer completed
    }
    
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: analytics.track('performance', { label: this.label, duration });
    }
    
    return duration;
  }
}

// API call performance tracking
export const trackApiCall = async <T>(
  apiCall: () => Promise<T>,
  endpoint: string
): Promise<T> => {
  const timer = new PerformanceTimer(`API: ${endpoint}`);
  
  try {
    const result = await apiCall();
    timer.end();
    return result;
  } catch (error) {
    timer.end();
    
    // Track API errors
    if (process.env.NODE_ENV === 'production') {
      // Example: analytics.track('api_error', { endpoint, error: error.message });
    }
    
    throw error;
  }
};

// Component render performance
export const useRenderTimer = (componentName: string) => {
  const timer = new PerformanceTimer(`Render: ${componentName}`);
  
  React.useEffect(() => {
    timer.end();
  });
};

// Memory usage monitoring
export const trackMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const memoryInfo = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    };
    
    if (process.env.NODE_ENV === 'development') {
      // Memory usage tracked
    }
    
    return memoryInfo;
  }
  
  return null;
};

// Bundle size tracking
export const trackBundleSize = () => {
  if (typeof window !== 'undefined') {
    // Track initial bundle load time
    window.addEventListener('load', () => {
      if (process.env.NODE_ENV === 'development') {
          // Bundle load time tracked
        }
      
      // In production, send to analytics
      if (process.env.NODE_ENV === 'production') {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        // Example: analytics.track('bundle_load_time', { duration: loadTime });
        // Bundle load time tracked silently in production
      }
    });
  }
};

// User interaction tracking
export const trackUserInteraction = (action: string, element?: string) => {
  if (process.env.NODE_ENV === 'development') {
    // User interaction tracked
  }
  
  // In production, send to analytics
  if (process.env.NODE_ENV === 'production') {
    // Example: analytics.track('user_interaction', { action, element, timestamp: Date.now() });
  }
};

// Error tracking
export const trackError = (error: Error, context?: any) => {
  if (process.env.NODE_ENV === 'development') {
    // Error tracked
  }
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    };
    // Example: Sentry.captureException(error, { extra: errorInfo });
    // Error tracked silently in production
  }
};

// Page load performance
export const trackPageLoad = (pageName: string) => {
  if (typeof window !== 'undefined') {
    const timer = new PerformanceTimer(`Page Load: ${pageName}`);
    
    // Track when page is fully loaded
    if (document.readyState === 'complete') {
      timer.end();
    } else {
      window.addEventListener('load', () => timer.end());
    }
  }
};