import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'react-hot-toast';

interface StoreStatusContextType {
  isStoreOnline: boolean;
  isCheckingStatus: boolean;
  checkStoreStatus: () => Promise<void>;
}

const StoreStatusContext = createContext<StoreStatusContextType | undefined>(undefined);

interface StoreStatusProviderProps {
  children: ReactNode;
}

export const StoreStatusProvider: React.FC<StoreStatusProviderProps> = ({ children }) => {
  const [isStoreOnline, setIsStoreOnline] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [hasCheckedOnMount, setHasCheckedOnMount] = useState(false);

  const checkStoreStatus = useCallback(async (): Promise<void> => {
    setIsCheckingStatus(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      
      // Make a lightweight API call to check store status
      const response = await fetch(`${backendUrl}/api/store-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const wasOffline = !isStoreOnline;
        setIsStoreOnline(data.isOnline);
        
        // Show notification when store status changes
        if (hasCheckedOnMount) {
          if (!data.isOnline && wasOffline !== true) {
            toast.error('Store is currently closed for online ordering. You can browse our menu but cannot add items to cart.', {
              duration: 5000,
              position: 'top-center'
            });
          } else if (data.isOnline && wasOffline === false) {
            toast.success('Store is now open for online ordering!', {
              duration: 3000,
              position: 'top-center'
            });
          }
        }
      } else {
        // If status check fails, assume store is online to avoid blocking browsing
        // Store status check failed - handled silently in production
        setIsStoreOnline(true);
      }
    } catch (error) {
      // Network error - assume store is online to keep website functional
      // Store status check failed - handled silently in production
      setIsStoreOnline(true);
    } finally {
      setIsCheckingStatus(false);
      if (!hasCheckedOnMount) {
        setHasCheckedOnMount(true);
      }
    }
  }, [hasCheckedOnMount, isStoreOnline]);

  // Check store status on mount
  useEffect(() => {
    checkStoreStatus();
  }, [checkStoreStatus]);

  // Periodic status check every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      checkStoreStatus();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [checkStoreStatus]);

  const value: StoreStatusContextType = {
    isStoreOnline,
    isCheckingStatus,
    checkStoreStatus
  };

  return (
    <StoreStatusContext.Provider value={value}>
      {children}
    </StoreStatusContext.Provider>
  );
};

export const useStoreStatus = (): StoreStatusContextType => {
  const context = useContext(StoreStatusContext);
  if (context === undefined) {
    throw new Error('useStoreStatus must be used within a StoreStatusProvider');
  }
  return context;
};