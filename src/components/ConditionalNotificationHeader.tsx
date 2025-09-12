import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

interface ConditionalNotificationHeaderProps {
  userId: string;
}

const ConditionalNotificationHeader: React.FC<ConditionalNotificationHeaderProps> = ({ userId }) => {
  const { unreadCount } = useNotifications();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLButtonElement>(null);
  const [notificationPosition, setNotificationPosition] = useState({ top: 0, right: 0 });

  const updatePosition = () => {
    if (notificationRef.current && isNotificationOpen) {
      const rect = notificationRef.current.getBoundingClientRect();
      setNotificationPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  };

  const handleNotificationClick = () => {
    if (notificationRef.current) {
      const rect = notificationRef.current.getBoundingClientRect();
      setNotificationPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleCloseNotification = () => {
    setIsNotificationOpen(false);
  };

  // Update position when window resizes or scrolls
  useEffect(() => {
    if (isNotificationOpen) {
      const handleResize = () => updatePosition();
      const handleScroll = () => updatePosition();

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isNotificationOpen]);

  return (
    <>
      {/* Notification Button */}
      <button 
        ref={notificationRef}
        onClick={handleNotificationClick}
        className="relative p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
        title="通知"
      >
        <Bell className="h-6 w-6" />
        {/* Unread notification badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-300 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full min-w-[20px] flex items-center justify-center shadow-sm border border-yellow-400">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isNotificationOpen && (
        <div 
          className="absolute w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1000]"
          style={{
            top: `${notificationPosition.top}px`,
            right: `${notificationPosition.right}px`
          }}
        >
          <NotificationDropdown 
            isOpen={isNotificationOpen}
            onClose={handleCloseNotification}
            position={notificationPosition}
            userId={userId}
          />
        </div>
      )}
    </>
  );
};

export default ConditionalNotificationHeader; 