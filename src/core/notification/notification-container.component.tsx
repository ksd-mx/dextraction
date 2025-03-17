import React from 'react';
import { createPortal } from 'react-dom';
import { useNotification } from './notification.context';
import { NotificationItem } from './notification-item.component';
// import { Notification } from './notification.types';

// // Optional: function to group similar notifications to reduce clutter
// const groupSimilarNotifications = (notifications: Notification[]): Notification[] => {
//   const groups: Record<string, Notification[]> = {};
  
//   notifications.forEach(notification => {
//     // Group by type and message
//     const key = `${notification.type}-${notification.message}`;
//     if (!groups[key]) {
//       groups[key] = [];
//     }
//     groups[key].push(notification);
//   });
  
//   // Return most recent notification from each group
//   return Object.values(groups).map(group => 
//     // If there are multiple notifications in a group, add a count to the first one
//     group.length > 1 
//       ? { ...group[group.length - 1], title: `${group[group.length - 1].title} (${group.length})` }
//       : group[group.length - 1]
//   );
// };

export const NotificationContainer: React.FC = () => {
  const { notifications, closeNotification } = useNotification();
  
  // Group notifications by position
  const topNotifications = notifications.filter(n => n.position === 'top' || !n.position);
  const bottomNotifications = notifications.filter(n => n.position === 'bottom');
  
  // Only render on client side
  if (typeof window === 'undefined') return null;
  
  return createPortal(
    <>
      {/* Top notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full">
        {topNotifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => closeNotification(notification.id)}
          />
        ))}
      </div>
      
      {/* Bottom notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full">
        {bottomNotifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => closeNotification(notification.id)}
          />
        ))}
      </div>
    </>,
    document.body
  );
};