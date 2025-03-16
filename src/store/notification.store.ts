// src/store/notification.store.ts
import { create } from 'zustand';
import { notificationService } from '@/lib/notification';
import { Notification } from '@/lib/notification/notification.types';

interface NotificationState {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => string;
  closeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// Create the store
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  
  showNotification: (notification) => {
    const id = notificationService.show(
      notification.type,
      notification.title,
      notification.message,
      notification
    );
    return id;
  },
  
  closeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },
  
  clearAllNotifications: () => {
    set({ notifications: [] });
  },
}));

// Helper functions for backward compatibility
export function showNotification(notification: Omit<Notification, 'id'>) {
  return useNotificationStore.getState().showNotification(notification);
}

export function showSuccess(title: string, message: string, options = {}) {
  return notificationService.success(title, message, {
    position: 'bottom',
    duration: 5000,
    ...options
  });
}

export function showError(title: string, message: string, options = {}) {
  return notificationService.error(title, message, {
    position: 'bottom',
    duration: 7000,
    ...options
  });
}

export function showInfo(title: string, message: string, options = {}) {
  return notificationService.info(title, message, {
    position: 'bottom',
    duration: 5000,
    ...options
  });
}

export function showWarning(title: string, message: string, options = {}) {
  return notificationService.warning(title, message, {
    position: 'bottom',
    duration: 7000,
    ...options
  });
}

// Attach to the notification object for object-style access
showNotification.success = showSuccess;
showNotification.error = showError;
showNotification.info = showInfo;
showNotification.warning = showWarning;