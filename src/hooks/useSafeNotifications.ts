import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';
import type { Notification } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  getNotificationsByType: (type: Notification['type']) => Notification[];
  isLoading: boolean;
  testNotifications: () => Promise<void>;
  mobileNotifications: Notification[];
  removeMobileNotification: (notificationId: string) => void;
}

/**
 * Safe hook to use notifications context that handles cases where
 * the context might not be available (e.g., after logout)
 */
export const useSafeNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  // If context is undefined, return default values with proper typing
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      deleteNotification: () => {},
      clearAllNotifications: () => {},
      getNotificationsByType: () => [],
      isLoading: false,
      testNotifications: async () => {},
      mobileNotifications: [],
      removeMobileNotification: () => {}
    };
  }
  
  return context;
};
