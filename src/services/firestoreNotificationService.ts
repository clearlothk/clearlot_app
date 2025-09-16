import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Notification } from '../types';

// Firestore notification service for persistent storage
class FirestoreNotificationService {
  private readonly collectionName = 'notifications';

  // Add a new notification
  async addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    try {
      console.log('💾 FirestoreNotificationService.addNotification called with:', notification);
      console.log('💾 Collection name:', this.collectionName);
      console.log('💾 Database object:', db);
      
      const notificationData = {
        ...notification,
        createdAt: Timestamp.now()
      };
      
      console.log('💾 Notification data to save:', notificationData);
      
      const docRef = await addDoc(collection(db, this.collectionName), notificationData);
      console.log('✅ FirestoreNotificationService: Document created with ID:', docRef.id);
      console.log('✅ FirestoreNotificationService: Document path:', docRef.path);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ FirestoreNotificationService: Error adding notification to Firestore:', error);
      console.error('❌ FirestoreNotificationService: Error details:', error);
      console.error('❌ FirestoreNotificationService: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error('Failed to add notification');
    }
  }

  // Get notifications for a user
  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      console.log('🔍 FirestoreNotificationService: Getting notifications for user:', userId);
      console.log('🔍 FirestoreNotificationService: Auth current user:', auth.currentUser?.uid);
      
      // Check if user is authenticated before querying
      if (!auth.currentUser) {
        console.log('⚠️ FirestoreNotificationService: No authenticated user, returning empty notifications');
        return [];
      }
      
      // Verify the userId matches the authenticated user
      if (auth.currentUser.uid !== userId) {
        console.log('⚠️ FirestoreNotificationService: User ID mismatch, returning empty notifications');
        return [];
      }
      
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('📊 FirestoreNotificationService: Query snapshot size:', querySnapshot.size);
      
      const notifications: Notification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 FirestoreNotificationService: Processing document:', doc.id, 'Type:', data.type);
        
        notifications.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          isRead: data.isRead,
          createdAt: data.createdAt.toDate().toISOString(),
          data: data.data,
          priority: data.priority
        });
      });
      
      console.log('📋 FirestoreNotificationService: Total notifications found:', notifications.length);
      console.log('📋 FirestoreNotificationService: All notifications:', notifications);
      
      return notifications.slice(0, limit);
    } catch (error) {
      console.error('Error getting notifications from Firestore:', error);
      throw new Error('Failed to get notifications');
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.collectionName, notificationId);
      await updateDoc(notificationRef, {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.collectionName, notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  // Delete all notifications for a user
  async deleteAllNotifications(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw new Error('Failed to delete all notifications');
    }
  }

  // Subscribe to notifications for real-time updates
  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    console.log('🔔 FirestoreNotificationService: Setting up real-time subscription for user:', userId);
    console.log('🔔 FirestoreNotificationService: Auth current user:', auth.currentUser?.uid);
    
    // Check if user is authenticated before setting up subscription
    if (!auth.currentUser) {
      console.log('⚠️ FirestoreNotificationService: No authenticated user, skipping subscription setup');
      // Return a no-op unsubscribe function
      return () => {};
    }
    
    // Verify the userId matches the authenticated user
    if (auth.currentUser.uid !== userId) {
      console.log('⚠️ FirestoreNotificationService: User ID mismatch, skipping subscription setup');
      // Return a no-op unsubscribe function
      return () => {};
    }
    
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    console.log('📡 FirestoreNotificationService: Query created, setting up onSnapshot listener');
    
    return onSnapshot(q, (querySnapshot) => {
      console.log('📨 FirestoreNotificationService: Real-time update received');
      console.log('📊 FirestoreNotificationService: Query snapshot size:', querySnapshot.size);
      console.log('👤 FirestoreNotificationService: User ID:', userId);
      
      const notifications: Notification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 FirestoreNotificationService: Processing document:', doc.id);
        console.log('📄 FirestoreNotificationService: Document data:', data);
        
        notifications.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          isRead: data.isRead,
          createdAt: data.createdAt.toDate().toISOString(),
          data: data.data,
          priority: data.priority
        });
      });
      
      console.log('📋 FirestoreNotificationService: Total notifications found:', notifications.length);
      console.log('📋 FirestoreNotificationService: Notifications:', notifications);
      
      callback(notifications);
    }, (error) => {
      console.error('❌ FirestoreNotificationService: Real-time subscription error:', error);
    });
  }

  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Test function to verify Firestore write permissions
  async testFirestoreWrite(userId: string): Promise<boolean> {
    try {
      console.log('🧪 Testing Firestore write permissions...');
      
      const testNotification = {
        userId,
        type: 'system' as const,
        title: '🧪 Test Notification',
        message: 'This is a test notification to verify Firestore write permissions.',
        isRead: false,
        priority: 'low' as const,
        data: {},
        createdAt: Timestamp.now()
      };
      
      console.log('🧪 Test notification data:', testNotification);
      
      const docRef = await addDoc(collection(db, this.collectionName), testNotification);
      console.log('✅ Test notification created with ID:', docRef.id);
      
      // Clean up test notification
      await deleteDoc(docRef);
      console.log('✅ Test notification cleaned up');
      
      return true;
    } catch (error) {
      console.error('❌ Firestore write test failed:', error);
      console.error('❌ Error details:', error);
      return false;
    }
  }

  // Clean up old notifications (older than 30 days)
  async cleanupOldNotifications(userId: string, daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('createdAt', '<', Timestamp.fromDate(cutoffDate))
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      if (querySnapshot.size > 0) {
        await batch.commit();
        console.log(`Cleaned up ${querySnapshot.size} old notifications`);
      }
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }
}

// Export singleton instance
export const firestoreNotificationService = new FirestoreNotificationService(); 