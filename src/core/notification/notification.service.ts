import { Notification, NotificationType, NotificationOptions } from './notification.types';

// Singleton pattern
class NotificationService {
  private static instance: NotificationService;
  private handler?: (notification: Omit<Notification, 'id'>) => string;
  
  private constructor() {
    // Private constructor to enforce singleton
  }
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  // Method called by context provider to register itself
  registerHandler(handler: (notification: Omit<Notification, 'id'>) => string) {
    this.handler = handler;
  }
  
  // Public API
  show(type: NotificationType, title: string, message: string, options: NotificationOptions = {}) {
    if (!this.handler) {
      console.warn('NotificationService: No handler registered');
      return '';
    }
    
    return this.handler({
      type,
      title,
      message,
      ...options
    });
  }
  
  success(title: string, message: string, options: NotificationOptions = {}) {
    return this.show('success', title, message, options);
  }
  
  error(title: string, message: string, options: NotificationOptions = {}) {
    return this.show('error', title, message, options);
  }
  
  info(title: string, message: string, options: NotificationOptions = {}) {
    return this.show('info', title, message, options);
  }
  
  warning(title: string, message: string, options: NotificationOptions = {}) {
    return this.show('warning', title, message, options);
  }
}

export const notificationService = NotificationService.getInstance();