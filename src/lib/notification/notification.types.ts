export type NotificationType = 'success' | 'error' | 'info' | 'warning';
export type NotificationPosition = 'top' | 'bottom';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  position?: NotificationPosition;
  duration?: number;
  onClose?: () => void;
  createdAt?: number;
}

export type NotificationOptions = Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message'>>;