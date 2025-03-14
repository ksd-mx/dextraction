import { create } from 'zustand';
import { Notification, NotificationType } from '@/types/notification';

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = {
      id,
      autoClose: true,
      duration: 5000,
      ...notification,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    if (newNotification.autoClose) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));

// Helper functions to quickly create different types of notifications
export const showNotification = {
  success: (title: string, message: string, options = {}) => 
    useNotificationStore.getState().addNotification({ 
      type: 'success', 
      title, 
      message, 
      ...options 
    }),
    
  error: (title: string, message: string, options = {}) => 
    useNotificationStore.getState().addNotification({ 
      type: 'error', 
      title, 
      message, 
      ...options 
    }),
    
  info: (title: string, message: string, options = {}) => 
    useNotificationStore.getState().addNotification({ 
      type: 'info', 
      title, 
      message, 
      ...options 
    }),
    
  warning: (title: string, message: string, options = {}) => 
    useNotificationStore.getState().addNotification({ 
      type: 'warning', 
      title, 
      message, 
      ...options 
    }),
};