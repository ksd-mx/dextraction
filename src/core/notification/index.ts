export * from './notification.types';
export * from './notification.context';
export * from './notification.service';
export * from './notification-container.component';
export * from './notification-item.component';

// Export a convenient default object
import { notificationService } from './notification.service';

// Import styles
import './notification.styles.css';

export default notificationService;