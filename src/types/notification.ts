export type NotificationType = 'success' | 'error' | 'info' | 'warning';
export type NotificationPosition = 'top' | 'bottom';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
  position?: NotificationPosition;
}