'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotificationStore } from '@/store/notification-store';
import { Notification as NotificationType } from '@/types/notification';
import { cn } from '@/lib/utils';

export default function NotificationSystem() {
  const { notifications, removeNotification } = useNotificationStore();
  
  // Group notifications by position
  const topNotifications = notifications.filter(n => !n.position || n.position === 'top');
  const bottomNotifications = notifications.filter(n => n.position === 'bottom');

  return (
    <>
      {/* Top notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full">
        {topNotifications.map((notification) => (
          <NotificationItem 
            key={notification.id} 
            notification={notification} 
            onClose={() => removeNotification(notification.id)} 
          />
        ))}
      </div>
      
      {/* Bottom notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full">
        {bottomNotifications.map((notification) => (
          <NotificationItem 
            key={notification.id} 
            notification={notification} 
            onClose={() => removeNotification(notification.id)} 
          />
        ))}
      </div>
    </>
  );
}

interface NotificationItemProps {
  notification: NotificationType;
  onClose: () => void;
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  
  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match this with the CSS transition duration
  }, [onClose]);

  useEffect(() => {
    const newElement = document.getElementById(`notification-${notification.id}`);
    if (newElement) {
      newElement.classList.add('animate-enter');
      setTimeout(() => {
        if (newElement) {
          newElement.classList.remove('animate-enter');
        }
      }, 300);
    }
  }, [notification.id]);

  useEffect(() => {
    if (notification.autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration || 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification, handleClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-[#AFD803]" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  };

  const bgColors = {
    success: 'bg-[#1B2131] border border-[#AFD803]/30',
    error: 'bg-[#1B2131] border border-red-500/30',
    info: 'bg-[#1B2131] border border-blue-500/30',
    warning: 'bg-[#1B2131] border border-yellow-500/30',
  };

  return (
    <div
      id={`notification-${notification.id}`}
      className={cn(
        'rounded-lg shadow-lg overflow-hidden transition-all duration-300 transform',
        bgColors[notification.type],
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100'
      )}
    >
      <div className="flex items-start p-4">
        <div className="shrink-0 pt-0.5">
          {icons[notification.type]}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium uppercase tracking-wider">{notification.title}</p>
          <p className="mt-1 text-sm text-[#94A3B8]">{notification.message}</p>
        </div>
        <button
          onClick={handleClose}
          className="ml-4 shrink-0 flex text-[#94A3B8] hover:text-white focus:outline-none"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}