import { toast } from 'sonner';

// Prevent browser notifications by ensuring we only use Sonner toasts
const preventBrowserNotifications = () => {
  // Disable browser notifications if they're enabled
  if ('Notification' in window && Notification.permission === 'granted') {
    // Don't request permission or show browser notifications
    return false;
  }
  return true;
};

// Override console methods that might trigger notifications
const overrideConsoleNotifications = () => {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = (...args) => {
    // Filter out notification-related errors
    const message = args.join(' ');
    if (!message.includes('Notification') && !message.includes('permission')) {
      originalConsoleError.apply(console, args);
    }
  };
  
  console.warn = (...args) => {
    // Filter out notification-related warnings
    const message = args.join(' ');
    if (!message.includes('Notification') && !message.includes('permission')) {
      originalConsoleWarn.apply(console, args);
    }
  };
};

// Custom toast functions that ensure consistent behavior
export const showToast = {
  success: (message, options = {}) => {
    preventBrowserNotifications();
    return toast.success(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #10b981',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      ...options,
    });
  },
  
  error: (message, options = {}) => {
    preventBrowserNotifications();
    return toast.error(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #ef4444',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      ...options,
    });
  },
  
  warning: (message, options = {}) => {
    preventBrowserNotifications();
    return toast.warning(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #f59e0b',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      ...options,
    });
  },
  
  info: (message, options = {}) => {
    preventBrowserNotifications();
    return toast.info(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #3b82f6',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      ...options,
    });
  },
  
  loading: (message, options = {}) => {
    preventBrowserNotifications();
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #6b7280',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      ...options,
    });
  },
  
  promise: (promise, messages, options = {}) => {
    preventBrowserNotifications();
    return toast.promise(promise, messages, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      ...options,
    });
  },
  
  dismiss: (toastId) => {
    return toast.dismiss(toastId);
  },
  
  // Custom method to ensure no browser notifications
  custom: (message, type = 'info', options = {}) => {
    preventBrowserNotifications();
    
    const baseStyle = {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      position: 'top-right',
    };
    
    const toastConfig = {
      duration: 4000,
      style: baseStyle,
      ...options,
    };
    
    switch (type) {
      case 'success':
        toastConfig.style.borderLeft = '4px solid #10b981';
        return toast.success(message, toastConfig);
      case 'error':
        toastConfig.style.borderLeft = '4px solid #ef4444';
        return toast.error(message, toastConfig);
      case 'warning':
        toastConfig.style.borderLeft = '4px solid #f59e0b';
        return toast.warning(message, toastConfig);
      default:
        toastConfig.style.borderLeft = '4px solid #3b82f6';
        return toast.info(message, toastConfig);
    }
  }
};

// Block browser notification requests
export const blockBrowserNotifications = () => {
  // Override console methods
  overrideConsoleNotifications();
  
  // Override Notification constructor to prevent browser notifications
  if ('Notification' in window) {
    const originalNotification = window.Notification;
    
    window.Notification = function(...args) {
      console.warn('Browser notifications blocked. Using toast notifications instead.');
      return null;
    };
    
    // Copy static properties
    Object.setPrototypeOf(window.Notification, originalNotification);
    Object.defineProperty(window.Notification, 'permission', {
      get: () => 'denied',
      configurable: true
    });
    
    window.Notification.requestPermission = () => Promise.resolve('denied');
  }
  
  // Block any existing notification permissions
  if ('permissions' in navigator) {
    navigator.permissions.query({ name: 'notifications' }).then(permission => {
      if (permission.state === 'granted') {
        console.log('Notifications were granted but will be blocked in favor of toast notifications');
      }
    }).catch(() => {
      // Ignore permission query errors
    });
  }
};

export default showToast;