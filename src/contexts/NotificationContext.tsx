import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Notification } from '../types';
import { notificationService } from '../services/notificationService';
import { firestoreNotificationService } from '../services/firestoreNotificationService';
import { orderNotificationService } from '../services/orderNotificationService';
import { priceMonitoringService } from '../services/priceMonitoringService';
import { getCurrentHKTimestamp } from '../utils/dateUtils';

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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  userId: string;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load notifications from Firestore on mount
  useEffect(() => {
    const loadNotifications = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        
        // Load notifications from Firestore
        const firestoreNotifications = await firestoreNotificationService.getNotifications(userId);
        
        if (firestoreNotifications.length > 0) {
          setNotifications(firestoreNotifications);
        }
        // Note: Welcome notification is now handled separately during user registration
        
        // Set up real-time subscription
        console.log('🔔 NotificationContext: Setting up real-time subscription for user:', userId);
        const unsubscribe = firestoreNotificationService.subscribeToNotifications(userId, (notifications) => {
          console.log('📨 NotificationContext: Real-time subscription callback triggered');
          console.log('📊 NotificationContext: Received notifications count:', notifications.length);
          console.log('📋 NotificationContext: Notifications:', notifications);
          setNotifications(notifications);
        });
        
        // Set up order monitoring for this user (both buyer and seller)
        const orderUnsubscribe = orderNotificationService.setupUserOrderMonitoringBoth(userId);
        
        // Set up real-time price monitoring for user's watchlist
        const priceUnsubscribes = await priceMonitoringService.setupUserWatchlistMonitoring(userId);
        
        // Cleanup function
        return () => {
          unsubscribe();
          orderUnsubscribe();
          priceUnsubscribes.forEach(unsub => unsub());
        };
        
      } catch (error) {
        console.error('Error loading notifications from Firestore:', error);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [userId]);

  // Notifications are now managed by Firestore, no need for localStorage persistence
  // The real-time subscription handles all updates automatically

  // Subscribe to notification service
  useEffect(() => {
    if (userId) {
      console.log('🔔 Setting up notification subscription for user:', userId);
      console.log('🔔 NotificationContext: User ID provided:', userId);
      console.log('🔔 NotificationContext: NotificationService object:', notificationService);
      
      const unsubscribe = notificationService.subscribe((notification) => {
        console.log('📨 Received notification from service:', notification);
        console.log('👤 Current user ID:', userId);
        console.log('🎯 Notification user ID:', notification.userId);
        console.log('✅ User ID match:', notification.userId === userId);
        
        if (notification.userId === userId) {
          console.log('📬 Processing notification for current user');
          addNotification(notification);
        } else {
          console.log('⏭️ Skipping notification - different user');
        }
      });
      
      console.log('🔔 NotificationContext: Subscription set up successfully');
      return unsubscribe;
    } else {
      console.log('❌ NotificationContext: No userId provided, skipping subscription');
    }
  }, [userId]);

  const addNotification = useCallback(async (notification: Notification | Omit<Notification, 'id' | 'createdAt'>) => {
    console.log('📨 Adding notification to context:', notification);
    console.log('🔍 NotificationContext.addNotification called with:');
    console.log('  - userId:', notification.userId);
    console.log('  - type:', notification.type);
    console.log('  - title:', notification.title);
    console.log('  - message:', notification.message);
    console.log('  - priority:', notification.priority);
    
    try {
      // Check if notification already has an ID (meaning it was already saved to Firestore)
      if ('id' in notification && notification.id) {
        console.log('📋 Notification already has ID, skipping Firestore save:', notification.id);
        const newNotification: Notification = {
          ...notification,
          id: notification.id as string,
          createdAt: ('createdAt' in notification ? notification.createdAt : getCurrentHKTimestamp()) as string
        };
        
        // Update local state only
        setNotifications(prev => {
          const isDuplicate = prev.some(existing => existing.id === newNotification.id);
          if (isDuplicate) {
            console.log('🚫 Duplicate notification with ID detected, skipping add:', newNotification.id);
            return prev;
          }
          
          const updated = [newNotification, ...prev];
          console.log('📋 Updated notifications list:', updated.length, 'notifications');
          return updated;
        });
        return;
      }
      
      // Add to Firestore first
      console.log('💾 Saving notification to Firestore...');
      const notificationId = await firestoreNotificationService.addNotification(notification);
      console.log('✅ Notification saved to Firestore with ID:', notificationId);
      
      const newNotification: Notification = {
        ...notification,
        id: notificationId,
        createdAt: getCurrentHKTimestamp()
      };

      // Update local state
      console.log('🔄 Updating local notifications state...');
      setNotifications(prev => {
        // Enhanced duplicate check - check for same type, title, message, and key data
        const isDuplicate = prev.some(existing => {
          // Check basic fields
          const basicMatch = existing.type === newNotification.type &&
                           existing.title === newNotification.title &&
                           existing.message === newNotification.message;
          
          // Check data fields for key identifiers
          const dataMatch = existing.data?.offerId === newNotification.data?.offerId &&
                           existing.data?.purchaseId === newNotification.data?.purchaseId &&
                           existing.data?.status === newNotification.data?.status;
          
          // Check if notification was created within the last 3 seconds to prevent rapid duplicates (reduced from 5 seconds)
          const timeMatch = (new Date().getTime() - new Date(existing.createdAt).getTime()) < 3000;
          
          // Only consider it a duplicate if ALL conditions are met (basic match AND data match AND time match)
          return basicMatch && dataMatch && timeMatch;
        });
        
        if (isDuplicate) {
          console.log('🚫 Duplicate notification detected, skipping add:', {
            type: newNotification.type,
            title: newNotification.title,
            offerId: newNotification.data?.offerId,
            purchaseId: newNotification.data?.purchaseId
          });
          return prev;
        }
        
        const updated = [newNotification, ...prev];
        console.log('📋 Updated notifications list:', updated.length, 'notifications');
        console.log('📋 New notification added:', newNotification);
        return updated;
      });

      // Show browser notification if supported and permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: newNotification.id
        });
      }
    } catch (error) {
      console.error('❌ Error adding notification:', error);
      
      // Fallback to local state only if Firestore fails
      const newNotification: Notification = {
        ...notification,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: getCurrentHKTimestamp()
      };
      
      setNotifications(prev => [newNotification, ...prev]);
    }
  }, [setNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Update in Firestore
      await firestoreNotificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // Update in Firestore
      await firestoreNotificationService.markAllAsRead(userId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // Delete from Firestore
      await firestoreNotificationService.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      // Delete all from Firestore
      await firestoreNotificationService.deleteAllNotifications(userId);
      
      // Update local state
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }, [userId]);

  const getNotificationsByType = useCallback((type: Notification['type']) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  const testNotifications = useCallback(async () => {
    if (!userId) return;
    
    console.log('🧪 Testing notifications for user:', userId);
    
    try {
      // Test 0: Check notification service listeners
      console.log('🧪 Test 0: Checking notification service listeners...');
      console.log('🧪 Test 0: NotificationService object:', notificationService);
      console.log('🧪 Test 0: Current user ID:', userId);
      
      // Test 1: Test Firestore write permissions
      console.log('🧪 Test 1: Testing Firestore write permissions...');
      const writeTestResult = await firestoreNotificationService.testFirestoreWrite(userId);
      console.log('🧪 Test 1 Result: Firestore write test:', writeTestResult ? 'PASSED' : 'FAILED');
      
      // Test 2: Get notifications directly from Firestore
      console.log('🧪 Test 2: Getting notifications directly from Firestore...');
      const directNotifications = await firestoreNotificationService.getNotifications(userId);
      console.log('🧪 Test 2 Result: Direct notifications count:', directNotifications.length);
      console.log('🧪 Test 2 Result: Direct notifications:', directNotifications);
      
      // Test 3: Check current context state
      console.log('🧪 Test 3: Current context notifications count:', notifications.length);
      console.log('🧪 Test 3: Current context notifications:', notifications);
      
      // Test 4: Check for verification_status notifications specifically
      const verificationNotifications = notifications.filter(n => n.type === 'verification_status');
      console.log('🧪 Test 4: Verification status notifications count:', verificationNotifications.length);
      console.log('🧪 Test 4: Verification status notifications:', verificationNotifications);
      
      // Test 5: Check unread count
      console.log('🧪 Test 5: Unread count:', unreadCount);
      
      // Test 6: Notification service trigger test removed (functionality disabled)
      console.log('🧪 Test 6: Notification service trigger test disabled');
      
      // Test 7: Force trigger a test notification to check listeners
      console.log('🧪 Test 7: Force triggering test notification...');
      const testNotification = {
        userId,
        type: 'verification_status' as const,
        title: '測試通知',
        message: '這是一個測試通知',
        isRead: false,
        data: { status: 'test' },
        priority: 'high' as const
      };
      console.log('🧪 Test 7: Test notification payload:', testNotification);
      notificationService.trigger(testNotification);
      console.log('🧪 Test 7: Test notification triggered');
      
    } catch (error) {
      console.error('🧪 Test failed:', error);
    }
  }, [userId, notifications, unreadCount]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationsByType,
    isLoading,
    testNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 