import React, { useCallback } from 'react';
import { useSafeNotifications } from '../hooks/useSafeNotifications';
import MobileNotificationPopup from './MobileNotificationPopup';

interface MobileNotificationManagerProps {
  userId: string;
}

const MobileNotificationManager: React.FC<MobileNotificationManagerProps> = ({ userId }) => {
  const { mobileNotifications, markAsRead, removeMobileNotification } = useSafeNotifications();

  const handleCloseNotification = useCallback((notificationId: string) => {
    removeMobileNotification(notificationId);
  }, [removeMobileNotification]);

  const handleMarkAsRead = useCallback((notificationId: string) => {
    markAsRead(notificationId);
  }, [markAsRead]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {mobileNotifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <MobileNotificationPopup
            notification={notification}
            onClose={() => handleCloseNotification(notification.id)}
            onMarkAsRead={handleMarkAsRead}
          />
        </div>
      ))}
    </div>
  );
};

export default MobileNotificationManager;
