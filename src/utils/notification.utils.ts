// src/utils/notification.utils.ts
import { notificationService } from '@/lib/notification';

/**
 * Show a success notification
 */
export function showSuccess(title: string, message: string, options = {}) {
  return notificationService.success(title, message, {
    position: 'bottom',
    duration: 5000,
    ...options
  });
}

/**
 * Show an error notification
 */
export function showError(title: string, message: string, options = {}) {
  return notificationService.error(title, message, {
    position: 'bottom',
    duration: 7000,
    ...options
  });
}

/**
 * Show an info notification
 */
export function showInfo(title: string, message: string, options = {}) {
  return notificationService.info(title, message, {
    position: 'bottom',
    duration: 5000,
    ...options
  });
}

/**
 * Show a warning notification
 */
export function showWarning(title: string, message: string, options = {}) {
  return notificationService.warning(title, message, {
    position: 'bottom',
    duration: 7000,
    ...options
  });
}

/**
 * Notification utilities with standardized formatting
 */
export const notifications = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
};

/**
 * For backward compatibility with existing code that uses showNotification
 */
export const showNotification = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
};