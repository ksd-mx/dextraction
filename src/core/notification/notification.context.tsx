import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Notification, NotificationPosition, NotificationOptions } from './notification.types';
import { notificationService } from './notification.service';
import { NotificationContainer } from './notification-container.component';

interface NotificationContextValue {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => string;
  closeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = {
      id,
      duration: 5000, // Default duration
      position: 'top' as NotificationPosition,
      createdAt: Date.now(),
      ...notification
    };
    
    setNotifications(current => [...current, newNotification]);
    
    if (newNotification.duration) {
      setTimeout(() => {
        closeNotification(id);
      }, newNotification.duration);
    }
    
    return id;
  }, []);
  
  const closeNotification = useCallback((id: string) => {
    setNotifications(current => current.filter(notif => notif.id !== id));
  }, []);
  
  // Register with notification service
  useEffect(() => {
    notificationService.registerHandler(showNotification);
    return () => {
      // Optional cleanup if needed
    };
  }, [showNotification]);
  
  // Auto-cleanup for stale notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNotifications(current => 
        current.filter(notification => {
          // If notification has a createdAt timestamp and is older than 5 minutes, remove it
          return !notification.createdAt || (now - notification.createdAt < 5 * 60 * 1000);
        })
      );
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <NotificationContext.Provider value={{ notifications, showNotification, closeNotification }}>
      <NotificationContainer />
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Helper functions
export const useNotificationHelpers = () => {
  const { showNotification } = useNotification();
  
  return {
    success: (title: string, message: string, options: NotificationOptions = {}) => 
      showNotification({ type: 'success', title, message, ...options }),
    
    error: (title: string, message: string, options: NotificationOptions = {}) => 
      showNotification({ type: 'error', title, message, ...options }),
    
    info: (title: string, message: string, options: NotificationOptions = {}) => 
      showNotification({ type: 'info', title, message, ...options }),
    
    warning: (title: string, message: string, options: NotificationOptions = {}) => 
      showNotification({ type: 'warning', title, message, ...options }),
  };
};