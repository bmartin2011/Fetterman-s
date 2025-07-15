import React, { useEffect, useRef, useState } from 'react';

// ARIA label generators
export const AriaLabels = {
  button: {
    addToCart: (productName: string) => `Add ${productName} to cart`,
    removeFromCart: (productName: string) => `Remove ${productName} from cart`,
    increaseQuantity: (productName: string) => `Increase quantity of ${productName}`,
    decreaseQuantity: (productName: string) => `Decrease quantity of ${productName}`,
    viewDetails: (productName: string) => `View details for ${productName}`,
    editProduct: (productName: string) => `Edit ${productName}`,
    deleteProduct: (productName: string) => `Delete ${productName}`,
    closeModal: 'Close modal',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    toggleDropdown: (label: string) => `Toggle ${label} dropdown`,
    submitForm: (formName: string) => `Submit ${formName} form`,
    cancelAction: 'Cancel action',
    confirmAction: 'Confirm action',
    sortBy: (criteria: string) => `Sort by ${criteria}`,
    filterBy: (criteria: string) => `Filter by ${criteria}`,
    clearFilters: 'Clear all filters',
    selectLocation: (locationName: string) => `Select ${locationName} as pickup location`,
    viewOrder: (orderId: string) => `View order ${orderId}`,
    updateOrderStatus: (orderId: string, status: string) => `Update order ${orderId} status to ${status}`,
    logout: 'Log out of account',
    login: 'Log in to account',
    register: 'Create new account'
  },
  
  input: {
    search: 'Search products',
    email: 'Email address',
    password: 'Password',
    confirmPassword: 'Confirm password',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone number',
    address: 'Address',
    city: 'City',
    state: 'State',
    zipCode: 'ZIP code',
    productName: 'Product name',
    productDescription: 'Product description',
    productPrice: 'Product price',
    categoryName: 'Category name',
    specialInstructions: 'Special instructions for order',
    quantity: (productName: string) => `Quantity for ${productName}`,
    customizationOption: (optionName: string) => `Select ${optionName}`
  },
  
  status: {
    loading: 'Loading content',
    error: 'Error occurred',
    success: 'Action completed successfully',
    cartEmpty: 'Shopping cart is empty',
    cartItems: (count: number) => `Shopping cart contains ${count} ${count === 1 ? 'item' : 'items'}`,
    orderStatus: (status: string) => `Order status: ${status}`,
    paymentStatus: (status: string) => `Payment status: ${status}`,
    userRole: (role: string) => `User role: ${role}`,
    productAvailability: (available: boolean) => available ? 'Product available' : 'Product out of stock'
  },
  
  navigation: {
    breadcrumb: 'Breadcrumb navigation',
    pagination: 'Pagination navigation',
    mainMenu: 'Main navigation menu',
    userMenu: 'User account menu',
    adminMenu: 'Admin navigation menu',
    productCategories: 'Product categories',
    currentPage: (page: string) => `Current page: ${page}`,
    goToPage: (page: number) => `Go to page ${page}`,
    previousPage: 'Go to previous page',
    nextPage: 'Go to next page'
  }
};

// Keyboard navigation utilities
export const KeyboardUtils = {
  KEYS: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    TAB: 'Tab',
    HOME: 'Home',
    END: 'End'
  },
  
  isActionKey: (key: string): boolean => {
    return key === KeyboardUtils.KEYS.ENTER || key === KeyboardUtils.KEYS.SPACE;
  },
  
  handleActionKeyPress: (event: React.KeyboardEvent, callback: () => void): void => {
    if (KeyboardUtils.isActionKey(event.key)) {
      event.preventDefault();
      callback();
    }
  },
  
  handleEscapeKey: (event: React.KeyboardEvent, callback: () => void): void => {
    if (event.key === KeyboardUtils.KEYS.ESCAPE) {
      event.preventDefault();
      callback();
    }
  },
  
  handleArrowNavigation: (
    event: React.KeyboardEvent,
    currentIndex: number,
    maxIndex: number,
    onNavigate: (newIndex: number) => void
  ): void => {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case KeyboardUtils.KEYS.ARROW_UP:
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : maxIndex;
        break;
      case KeyboardUtils.KEYS.ARROW_DOWN:
        event.preventDefault();
        newIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
        break;
      case KeyboardUtils.KEYS.HOME:
        event.preventDefault();
        newIndex = 0;
        break;
      case KeyboardUtils.KEYS.END:
        event.preventDefault();
        newIndex = maxIndex;
        break;
      default:
        return;
    }
    
    onNavigate(newIndex);
  }
};

// Focus management utilities
export const FocusUtils = {
  trapFocus: (containerRef: React.RefObject<HTMLElement | null>): (() => void) => {
    const container = containerRef.current;
    if (!container) return () => {};
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },
  
  restoreFocus: (elementRef: React.RefObject<HTMLElement>): void => {
    elementRef.current?.focus();
  },
  
  focusFirstError: (formRef: React.RefObject<HTMLFormElement>): void => {
    const form = formRef.current;
    if (!form) return;
    
    const errorElement = form.querySelector('[aria-invalid="true"], .error input, .error select, .error textarea');
    if (errorElement instanceof HTMLElement) {
      errorElement.focus();
    }
  }
};

// Screen reader utilities
export const ScreenReaderUtils = {
  announceToScreenReader: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },
  
  announcePageChange: (pageName: string): void => {
    ScreenReaderUtils.announceToScreenReader(`Navigated to ${pageName}`, 'assertive');
  },
  
  announceFormError: (errors: string[]): void => {
    const message = `Form has ${errors.length} error${errors.length === 1 ? '' : 's'}: ${errors.join(', ')}`;
    ScreenReaderUtils.announceToScreenReader(message, 'assertive');
  },
  
  announceCartUpdate: (action: string, productName: string, itemCount: number): void => {
    const message = `${action} ${productName}. Cart now has ${itemCount} item${itemCount === 1 ? '' : 's'}.`;
    ScreenReaderUtils.announceToScreenReader(message, 'polite');
  }
};

// Custom hooks for accessibility
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!isActive) return;
    
    const cleanup = FocusUtils.trapFocus(containerRef);
    return cleanup;
  }, [isActive]);
  
  return containerRef;
}

export function useAnnouncement() {
  return {
    announce: ScreenReaderUtils.announceToScreenReader,
    announcePageChange: ScreenReaderUtils.announcePageChange,
    announceFormError: ScreenReaderUtils.announceFormError,
    announceCartUpdate: ScreenReaderUtils.announceCartUpdate
  };
}

export function useKeyboardNavigation<T>(items: T[], onSelect: (index: number) => void) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    KeyboardUtils.handleArrowNavigation(
      event,
      selectedIndex,
      items.length - 1,
      (newIndex) => {
        setSelectedIndex(newIndex);
        onSelect(newIndex);
      }
    );
  };
  
  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown
  };
}

// CSS classes for screen reader only content
export const AccessibilityClasses = {
  srOnly: 'sr-only', // Should be defined in CSS as: .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  focusVisible: 'focus-visible', // For custom focus indicators
  skipLink: 'skip-link' // For skip navigation links
};