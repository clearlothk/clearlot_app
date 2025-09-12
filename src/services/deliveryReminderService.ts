import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Import notification services
import { notificationService } from './notificationService';
import { firestoreNotificationService } from './firestoreNotificationService';
import { getCurrentHKTimestamp } from '../utils/dateUtils';

interface DeliveryReminder {
  purchaseId: string;
  buyerId: string;
  sellerId: string;
  offerTitle: string;
  shippedAt: string;
  lastReminderSent: string;
  reminderCount: number;
  adminNotified: boolean;
  isActive: boolean;
}

class DeliveryReminderService {
  private static instance: DeliveryReminderService;
  private reminderIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  public static getInstance(): DeliveryReminderService {
    if (!DeliveryReminderService.instance) {
      DeliveryReminderService.instance = new DeliveryReminderService();
    }
    return DeliveryReminderService.instance;
  }

  /**
   * Start delivery reminder system for a purchase
   */
  public async startDeliveryReminder(purchaseId: string): Promise<void> {
    try {
      console.log(`🚚 Starting delivery reminder system for purchase: ${purchaseId}`);

      // Import auth to get current user
      const { auth } = await import('../config/firebase');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.error(`❌ No authenticated user, cannot start delivery reminder`);
        return;
      }

      // Get purchase details
      const purchaseRef = doc(db, 'purchases', purchaseId);
      const purchaseDoc = await getDoc(purchaseRef);

      if (!purchaseDoc.exists()) {
        console.error(`❌ Purchase not found: ${purchaseId}`);
        return;
      }

      const purchaseData = purchaseDoc.data();
      const { buyerId, sellerId, offerId, status } = purchaseData;

      // Check if current user has access to this purchase
      if (currentUser.uid !== buyerId && currentUser.uid !== sellerId) {
        console.error(`❌ Current user does not have access to purchase: ${purchaseId}`);
        return;
      }

      // Only start reminders for shipped purchases
      if (status !== 'shipped') {
        console.log(`⏭️ Purchase ${purchaseId} is not shipped, skipping reminder system`);
        return;
      }

      // Get offer details
      const offerRef = doc(db, 'offers', offerId);
      const offerDoc = await getDoc(offerRef);
      const offerData = offerDoc.exists() ? offerDoc.data() : null;
      const offerTitle = offerData?.title || '商品';

      // Get buyer details
      const buyerRef = doc(db, 'users', buyerId);
      const buyerDoc = await getDoc(buyerRef);
      const buyerData = buyerDoc.exists() ? buyerDoc.data() : null;
      const buyerCompany = buyerData?.company || 'Unknown Buyer';

      // Get seller details
      const sellerRef = doc(db, 'users', sellerId);
      const sellerDoc = await getDoc(sellerRef);
      const sellerData = sellerDoc.exists() ? sellerDoc.data() : null;
      const sellerCompany = sellerData?.company || 'Unknown Seller';

      const shippedAt = purchaseData.shippingDetails?.shippedAt || new Date().toISOString();
      const now = new Date().toISOString();

      // Create reminder data
      const reminderData: DeliveryReminder = {
        purchaseId,
        buyerId,
        sellerId,
        offerTitle,
        shippedAt,
        lastReminderSent: now,
        reminderCount: 0,
        adminNotified: false,
        isActive: true
      };

      // Save reminder data to purchase document
      await updateDoc(purchaseRef, {
        'deliveryReminder.isActive': true,
        'deliveryReminder.shippedAt': shippedAt,
        'deliveryReminder.lastReminderSent': now,
        'deliveryReminder.reminderCount': 0,
        'deliveryReminder.adminNotified': false
      });

      // Schedule first reminder (1 hour after shipping)
      const firstReminderDelay = 60 * 60 * 1000; // 1 hour in milliseconds
      const firstReminderTimeout = setTimeout(() => {
        this.sendBuyerReminder(purchaseId, reminderData);
      }, firstReminderDelay);

      this.reminderIntervals.set(purchaseId, firstReminderTimeout);

      console.log(`✅ Delivery reminder system started for purchase: ${purchaseId}`);
      console.log(`⏰ First reminder scheduled in 1 hour`);

    } catch (error) {
      console.error('❌ Error starting delivery reminder system:', error);
    }
  }

  /**
   * Send reminder to buyer
   */
  private async sendBuyerReminder(purchaseId: string, reminderData: DeliveryReminder): Promise<void> {
    try {
      console.log(`🔔 Sending delivery reminder to buyer for purchase: ${purchaseId}`);

      // Check if purchase is still active and not delivered
      const purchaseRef = doc(db, 'purchases', purchaseId);
      const purchaseDoc = await getDoc(purchaseRef);

      if (!purchaseDoc.exists()) {
        console.log(`❌ Purchase ${purchaseId} no longer exists, stopping reminders`);
        this.stopDeliveryReminder(purchaseId);
        return;
      }

      const purchaseData = purchaseDoc.data();
      if (purchaseData.status !== 'shipped') {
        console.log(`✅ Purchase ${purchaseId} status changed to ${purchaseData.status}, stopping reminders`);
        this.stopDeliveryReminder(purchaseId);
        return;
      }

      // Update reminder count
      const newReminderCount = reminderData.reminderCount + 1;
      const now = new Date().toISOString();

      await updateDoc(purchaseRef, {
        'deliveryReminder.lastReminderSent': now,
        'deliveryReminder.reminderCount': newReminderCount
      });

      // Send notification to buyer
      const notificationData = {
        userId: reminderData.buyerId,
        type: 'order_status' as const,
        title: '📦 請確認收貨',
        message: `您的訂單 "${reminderData.offerTitle}" 已發貨，請檢查是否已收到貨物並確認收貨。`,
        isRead: false,
        data: {
          purchaseId: purchaseId,
          offerTitle: reminderData.offerTitle,
          actionUrl: `/hk/${reminderData.buyerId}/my-orders`
        },
        priority: 'high' as const
      };

      console.log('📨 Creating delivery reminder notification:', notificationData);

      // Save notification to Firestore
      const notificationId = await firestoreNotificationService.addNotification(notificationData);
      console.log('✅ Delivery reminder notification saved to Firestore with ID:', notificationId);

      // Create notification with ID and trigger real-time notification
      const notificationWithId = {
        ...notificationData,
        id: notificationId,
        createdAt: getCurrentHKTimestamp()
      };

      console.log('📡 Triggering real-time delivery reminder notification...');
      notificationService.trigger(notificationWithId);
      console.log('✅ Delivery reminder notification sent successfully');

      // Check if we need to notify admin (after 6 hours)
      const shippedTime = new Date(reminderData.shippedAt).getTime();
      const currentTime = new Date().getTime();
      const hoursSinceShipped = (currentTime - shippedTime) / (1000 * 60 * 60);

      if (hoursSinceShipped >= 6 && !reminderData.adminNotified) {
        await this.sendAdminNotification(purchaseId, reminderData);
      }

      // Schedule next reminder (1 hour later)
      const nextReminderTimeout = setTimeout(() => {
        this.sendBuyerReminder(purchaseId, { ...reminderData, reminderCount: newReminderCount, lastReminderSent: now });
      }, 60 * 60 * 1000); // 1 hour

      this.reminderIntervals.set(purchaseId, nextReminderTimeout);

      console.log(`✅ Next reminder scheduled for purchase: ${purchaseId}`);

    } catch (error) {
      console.error('❌ Error sending buyer reminder:', error);
    }
  }

  /**
   * Send notification to admin dashboard
   */
  private async sendAdminNotification(purchaseId: string, reminderData: DeliveryReminder): Promise<void> {
    try {
      console.log(`🔔 Sending admin notification for purchase: ${purchaseId}`);

      // Get buyer details for admin notification
      const buyerRef = doc(db, 'users', reminderData.buyerId);
      const buyerDoc = await getDoc(buyerRef);
      const buyerData = buyerDoc.exists() ? buyerDoc.data() : null;
      const buyerCompany = buyerData?.company || 'Unknown Buyer';

      // Get seller details for admin notification
      const sellerRef = doc(db, 'users', reminderData.sellerId);
      const sellerDoc = await getDoc(sellerRef);
      const sellerData = sellerDoc.exists() ? sellerDoc.data() : null;
      const sellerCompany = sellerData?.company || 'Unknown Seller';

      // Mark admin as notified
      const purchaseRef = doc(db, 'purchases', purchaseId);
      await updateDoc(purchaseRef, {
        'deliveryReminder.adminNotified': true
      });

      // Create admin notification (this will appear in admin dashboard recent activities)
      const adminNotificationData = {
        id: `delivery_reminder_${purchaseId}_${Date.now()}`,
        type: 'delivery_reminder' as const,
        title: '⚠️ 買家未確認收貨',
        description: `買家 ${buyerCompany} 在發貨後6小時仍未確認收到訂單 "${reminderData.offerTitle}" (賣家: ${sellerCompany})`,
        timestamp: new Date().toISOString(),
        status: 'pending',
        purchaseData: {
          purchaseId,
          buyerId: reminderData.buyerId,
          sellerId: reminderData.sellerId,
          offerTitle: reminderData.offerTitle,
          buyerCompany,
          sellerCompany,
          shippedAt: reminderData.shippedAt,
          reminderCount: reminderData.reminderCount
        }
      };

      // Save to admin notifications collection
      const adminNotificationsRef = collection(db, 'adminNotifications');
      await updateDoc(doc(adminNotificationsRef, 'delivery_reminders'), {
        [purchaseId]: adminNotificationData,
        lastUpdated: new Date().toISOString()
      });

      console.log(`✅ Admin notification sent for purchase: ${purchaseId}`);

    } catch (error) {
      console.error('❌ Error sending admin notification:', error);
    }
  }

  /**
   * Stop delivery reminder system for a purchase
   */
  public stopDeliveryReminder(purchaseId: string): void {
    try {
      console.log(`🛑 Stopping delivery reminder system for purchase: ${purchaseId}`);

      // Clear the timeout
      const timeout = this.reminderIntervals.get(purchaseId);
      if (timeout) {
        clearTimeout(timeout);
        this.reminderIntervals.delete(purchaseId);
      }

      // Mark as inactive in database
      const purchaseRef = doc(db, 'purchases', purchaseId);
      updateDoc(purchaseRef, {
        'deliveryReminder.isActive': false
      }).catch(error => {
        console.error('❌ Error updating delivery reminder status:', error);
      });

      console.log(`✅ Delivery reminder system stopped for purchase: ${purchaseId}`);

    } catch (error) {
      console.error('❌ Error stopping delivery reminder system:', error);
    }
  }

  /**
   * Check and restart reminders for current user's shipped purchases
   */
  public async initializeReminders(): Promise<void> {
    try {
      console.log('🔄 Initializing delivery reminders for current user...');

      // Import auth to get current user
      const { auth } = await import('../config/firebase');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log('⏭️ No authenticated user, skipping delivery reminder initialization');
        return;
      }

      // Get current user's shipped purchases (as buyer or seller)
      const purchasesRef = collection(db, 'purchases');
      const userShippedQuery = query(
        purchasesRef, 
        where('status', '==', 'shipped'),
        where('buyerId', '==', currentUser.uid)
      );
      const userShippedSnapshot = await getDocs(userShippedQuery);

      // Also get purchases where user is the seller
      const sellerShippedQuery = query(
        purchasesRef, 
        where('status', '==', 'shipped'),
        where('sellerId', '==', currentUser.uid)
      );
      const sellerShippedSnapshot = await getDocs(sellerShippedQuery);

      // Combine both results
      const allShippedPurchases = [...userShippedSnapshot.docs, ...sellerShippedSnapshot.docs];
      
      // Remove duplicates (in case user is both buyer and seller of same purchase)
      const uniquePurchases = allShippedPurchases.filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      );

      for (const docSnapshot of uniquePurchases) {
        const purchaseData = docSnapshot.data();
        const purchaseId = docSnapshot.id;

        // Check if reminder system is not active
        if (!purchaseData.deliveryReminder?.isActive) {
          console.log(`🔄 Restarting reminder system for purchase: ${purchaseId}`);
          await this.startDeliveryReminder(purchaseId);
        }
      }

      console.log(`✅ Delivery reminder system initialized for ${uniquePurchases.length} purchases`);

    } catch (error) {
      console.error('❌ Error initializing delivery reminders:', error);
    }
  }
}

// Export singleton instance
export const deliveryReminderService = DeliveryReminderService.getInstance();
