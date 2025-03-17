import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Notification } from './notification.types';
import { cn } from '@/utils/class-name.util';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onClose,
}) => {
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
    
    // Auto-close after duration
    if (notification.duration) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.id, notification.duration, handleClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-[#AFD803]" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  };

  // Theme-based colors
  const bgColors = {
    success: 'bg-[#1B2131] border border-[#AFD803]/30',
    error: 'bg-[#1B2131] border border-red-500/30',
    info: 'bg-[#1B2131] border border-blue-500/30',
    warning: 'bg-[#1B2131] border border-yellow-500/30',
  };

  // Theme-based text colors
  const textColor = 'text-white';
  const mutedTextColor = 'text-[#94A3B8]';

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
          <p className={cn("text-sm font-medium uppercase tracking-wider", textColor)}>
            {notification.title}
          </p>
          <p className={cn("mt-1 text-sm", mutedTextColor)}>
            {notification.message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className={cn("ml-4 shrink-0 flex", mutedTextColor, "hover:text-white focus:outline-none")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};