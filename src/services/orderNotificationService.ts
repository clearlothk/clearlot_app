import { 
  collection, 
  doc, 
  getDoc, 
  query, 
  where, 
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { notificationService } from './notificationService';
import { firestoreNotificationService } from './firestoreNotificationService';
import { priceMonitoringService } from './priceMonitoringService';

// Order notification service for order status changes and purchases
class OrderNotificationService {
  private readonly purchasesCollection = 'purchases';
  private readonly offersCollection = 'offers';
  private readonly usersCollection = 'users';
  private processedPurchases = new Set<string>(); // Track processed purchases to prevent duplicates
  private readonly processedPurchasesKey = 'processedPurchases';

  constructor() {
    this.loadProcessedPurchases();
  }

  // Load processed purchases from localStorage
  private loadProcessedPurchases(): void {
    try {
      const stored = localStorage.getItem(this.processedPurchasesKey);
      if (stored) {
        const purchaseIds = JSON.parse(stored);
        this.processedPurchases = new Set(purchaseIds);
        console.log('📋 Loaded processed purchases from localStorage:', this.processedPurchases.size);
      }
    } catch (error) {
      console.error('❌ Error loading processed purchases from localStorage:', error);
      this.processedPurchases = new Set();
    }
  }

  // Save processed purchases to localStorage
  private saveProcessedPurchases(): void {
    try {
      const purchaseIds = Array.from(this.processedPurchases);
      // Keep only the last 100 processed purchases to prevent localStorage from growing too large
      const limitedPurchaseIds = purchaseIds.slice(-100);
      localStorage.setItem(this.processedPurchasesKey, JSON.stringify(limitedPurchaseIds));
      console.log('💾 Saved processed purchases to localStorage:', limitedPurchaseIds.length);
    } catch (error) {
      console.error('❌ Error saving processed purchases to localStorage:', error);
    }
  }

  // Monitor order status changes for a specific purchase
  setupOrderStatusMonitoring(purchaseId: string): () => void {
    const purchaseRef = doc(db, this.purchasesCollection, purchaseId);
    
    return onSnapshot(purchaseRef, async (doc) => {
      if (doc.exists()) {
        const purchaseData = doc.data();
        const newStatus = purchaseData.status;
        const previousStatus = purchaseData.previousStatus || newStatus;
        
        // Only notify if status has changed
        if (newStatus !== previousStatus) {
          await this.handleOrderStatusChange(purchaseData, previousStatus, newStatus);
          
          // Update the previous status
          await this.updatePurchasePreviousStatus(purchaseId, newStatus);
        }
      }
    });
  }

  // Handle order status change
  private async handleOrderStatusChange(
    purchaseData: any, 
    previousStatus: string, 
    newStatus: string
  ): Promise<void> {
    try {
      const { offerId, buyerId, sellerId, finalAmount, id: purchaseId } = purchaseData;
      
      // If status changed from pending to something else, remove from processed set
      if (previousStatus === 'pending' && newStatus !== 'pending') {
        this.removeProcessedPurchase(purchaseId);
      }
      
      // Get offer details
      const offerRef = doc(db, this.offersCollection, offerId);
      const offerDoc = await getDoc(offerRef);
      
      if (!offerDoc.exists()) {
        console.log(`Offer ${offerId} not found for notification`);
        return;
      }
      
      const offerData = offerDoc.data();
      const offerTitle = offerData.title;

      // Notify buyer about status change
      if (buyerId) {
        await this.notifyBuyerStatusChange(buyerId, offerTitle, newStatus, purchaseData.id, offerId);
      }

      // Notify seller about status change (for certain statuses)
      if (sellerId && ['approved', 'shipped', 'delivered', 'completed'].includes(newStatus)) {
        await this.notifySellerStatusChange(sellerId, offerTitle, newStatus, purchaseData.id, offerId);
      }

      // Special handling for new purchases
      if (newStatus === 'pending' && previousStatus === undefined) {
        await this.handleNewPurchase(purchaseData, offerData);
      }

      console.log(`Order status change notification sent: ${previousStatus} → ${newStatus} for ${offerTitle}`);
      
    } catch (error) {
      console.error('Error handling order status change:', error);
    }
  }

  // Notify buyer about status change
  private async notifyBuyerStatusChange(
    buyerId: string, 
    offerTitle: string, 
    status: string, 
    purchaseId: string, 
    offerId: string
  ): Promise<void> {
    const notificationData = {
      userId: buyerId,
      type: 'order_status' as const,
      title: this.getBuyerStatusTitle(status),
      message: this.getBuyerStatusMessage(status, offerTitle),
      isRead: false,
      data: {
        offerId,
        purchaseId,
        status,
        actionUrl: `/hk/${buyerId}/my-orders`
      },
      priority: this.getStatusPriority(status)
    };

    // Add to Firestore
    await firestoreNotificationService.addNotification(notificationData);
    
    // Trigger real-time notification
    notificationService.trigger(notificationData);
  }

  // Notify seller about status change
  private async notifySellerStatusChange(
    sellerId: string, 
    offerTitle: string, 
    status: string, 
    purchaseId: string, 
    offerId: string
  ): Promise<void> {
    const notificationData = {
      userId: sellerId,
      type: 'order_status' as const,
      title: this.getSellerStatusTitle(status),
      message: this.getSellerStatusMessage(status, offerTitle),
      isRead: false,
      data: {
        offerId,
        purchaseId,
        status,
        actionUrl: `/hk/${sellerId}/my-orders`
      },
      priority: this.getStatusPriority(status)
    };

    // Add to Firestore
    await firestoreNotificationService.addNotification(notificationData);
    
    // Trigger real-time notification
    notificationService.trigger(notificationData);
  }

  // Handle new purchase (notify seller)
  private async handleNewPurchase(purchaseData: any, offerData: any = null, isForSeller: boolean = true): Promise<void> {
    try {
      console.log('🛒 handleNewPurchase called with:', { purchaseData, offerData, isForSeller });
      
      const { sellerId, buyerId, finalAmount, offerId, id: purchaseId } = purchaseData;
      console.log('📦 Extracted data:', { sellerId, buyerId, finalAmount, offerId, purchaseId });
      
      // Check if we've already processed this purchase to prevent duplicates
      if (this.processedPurchases.has(purchaseId)) {
        console.log('🚫 Purchase already processed, skipping duplicate notification:', purchaseId);
        return;
      }
      
      // Check if purchase status is still pending (only notify for pending purchases)
      if (purchaseData.status !== 'pending') {
        console.log('🚫 Purchase status is not pending, skipping notification:', purchaseData.status);
        return;
      }
      
      // Mark this purchase as processed
      this.processedPurchases.add(purchaseId);
      this.saveProcessedPurchases(); // Save to localStorage
      console.log('✅ Marked purchase as processed:', purchaseId);
      
      // Only notify seller, not buyer (buyer gets notification from PurchaseModal)
      if (!isForSeller) {
        console.log('⏭️ Skipping notification - not for seller');
        return;
      }
      
      // Get offer details if not provided
      if (!offerData) {
        console.log('📋 Getting offer details from Firestore...');
        const offerRef = doc(db, this.offersCollection, offerId);
        const offerDoc = await getDoc(offerRef);
        offerData = offerDoc.exists() ? offerDoc.data() : { title: 'Unknown Offer' };
        console.log('📋 Offer data:', offerData);
      }
      
      // Get buyer details
      console.log('👤 Getting buyer details from Firestore...');
      const buyerRef = doc(db, this.usersCollection, buyerId);
      const buyerDoc = await getDoc(buyerRef);
      const buyerCompany = buyerDoc.exists() ? buyerDoc.data().company : 'Unknown Buyer';
      console.log('👤 Buyer company:', buyerCompany);

      // Notify seller about new order
      const sellerNotificationData = {
        userId: sellerId,
        type: 'offer_purchased' as const,
        title: '收到新訂單！🎉',
        message: `${buyerCompany} 已購買 "${offerData.title}"，金額為 HKD ${finalAmount.toFixed(2)}。`,
        isRead: false,
        data: {
          offerId,
          purchaseId,
          amount: finalAmount,
          actionUrl: `/hk/${sellerId}/my-orders`
        },
        priority: 'high' as const
      };

      console.log('📨 Creating seller notification:', sellerNotificationData);

      // Add to Firestore
      console.log('💾 Saving notification to Firestore...');
      const notificationId = await firestoreNotificationService.addNotification(sellerNotificationData);
      console.log('✅ Notification saved to Firestore with ID:', notificationId);
      
      // Create notification with ID to prevent duplicate saving
      const notificationWithId = {
        ...sellerNotificationData,
        id: notificationId,
        createdAt: new Date().toISOString()
      };
      
      // Trigger real-time notification (without saving to Firestore again)
      console.log('🔔 Triggering real-time notification...');
      notificationService.trigger(notificationWithId);
      console.log('✅ Real-time notification triggered');

      console.log(`🎉 New purchase notification sent to seller ${sellerId}`);
      
    } catch (error) {
      console.error('❌ Error handling new purchase notification:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        purchaseData,
        offerData,
        isForSeller
      });
    }
  }

  // Update the previous status of a purchase
  private async updatePurchasePreviousStatus(purchaseId: string, newStatus: string): Promise<void> {
    try {
      const purchaseRef = doc(db, this.purchasesCollection, purchaseId);
      await purchaseRef.update({
        previousStatus: newStatus,
        lastStatusUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating purchase previous status:', error);
    }
  }

  // Get buyer status title
  private getBuyerStatusTitle(status: string): string {
    const statusTitles = {
      'pending': '訂單等待付款 ⏳',
      'approved': '付款已獲批准！✅',
      'shipped': '訂單已發貨！📦',
      'delivered': '訂單已送達！🎯',
      'completed': '訂單已完成！🎉'
    };
    return statusTitles[status] || `訂單狀態：${status}`;
  }

  // Get buyer status message
  private getBuyerStatusMessage(status: string, offerTitle: string): string {
    const statusMessages = {
      'pending': `您的訂單 "${offerTitle}" 正在等待付款審核。`,
      'approved': `您的付款 "${offerTitle}" 已獲批准！`,
      'shipped': `您的訂單 "${offerTitle}" 已發貨，正在運送途中！`,
      'delivered': `您的訂單 "${offerTitle}" 已送達！請確認收貨。`,
      'completed': `您的訂單 "${offerTitle}" 已成功完成！`
    };
    return statusMessages[status] || `您的訂單狀態已更新為 ${status}。`;
  }

  // Get seller status title
  private getSellerStatusTitle(status: string): string {
    const statusTitles = {
      'approved': '收到付款！💰',
      'shipped': '訂單已發貨！📦',
      'delivered': '訂單已送達！🎯',
      'completed': '訂單已完成！🎉'
    };
    return statusTitles[status] || `訂單狀態：${status}`;
  }

  // Get seller status message
  private getSellerStatusMessage(status: string, offerTitle: string): string {
    const statusMessages = {
      'approved': `"${offerTitle}" 已收到付款。請準備發貨。`,
      'shipped': `您的訂單 "${offerTitle}" 已標記為已發貨。`,
      'delivered': `您的訂單 "${offerTitle}" 已送達買家。`,
      'completed': `您的訂單 "${offerTitle}" 已成功完成！`
    };
    return statusMessages[status] || `訂單狀態已更新為 ${status}。`;
  }

  // Get priority based on status
  private getStatusPriority(status: string): 'low' | 'medium' | 'high' {
    const highPriorityStatuses = ['delivered', 'completed', 'approved'];
    const mediumPriorityStatuses = ['shipped', 'pending'];
    
    if (highPriorityStatuses.includes(status)) return 'high';
    if (mediumPriorityStatuses.includes(status)) return 'medium';
    return 'low';
  }

  // Monitor all orders for a user
  setupUserOrderMonitoring(userId: string, userType: 'buyer' | 'seller'): () => void {
    const field = userType === 'buyer' ? 'buyerId' : 'sellerId';
    const ordersQuery = query(
      collection(db, this.purchasesCollection),
      where(field, '==', userId)
    );
    
    return onSnapshot(ordersQuery, (querySnapshot) => {
      querySnapshot.docChanges().forEach(async (change) => {
        if (change.type === 'modified') {
          const purchaseData = change.doc.data();
          const newStatus = purchaseData.status;
          const previousStatus = purchaseData.previousStatus || newStatus;
          
          if (newStatus !== previousStatus) {
            await this.handleOrderStatusChange(purchaseData, previousStatus, newStatus);
            await this.updatePurchasePreviousStatus(change.doc.id, newStatus);
          }
        }
      });
    });
  }

  // Clear processed purchases (call this when user logs out or when needed)
  clearProcessedPurchases(): void {
    console.log('🧹 Clearing processed purchases set');
    this.processedPurchases.clear();
    this.saveProcessedPurchases(); // Save to localStorage
  }

  // Remove specific purchase from processed set (call when purchase status changes)
  removeProcessedPurchase(purchaseId: string): void {
    if (this.processedPurchases.has(purchaseId)) {
      console.log('🧹 Removing purchase from processed set:', purchaseId);
      this.processedPurchases.delete(purchaseId);
      this.saveProcessedPurchases(); // Save to localStorage
    }
  }

  // Monitor all orders for a user (both buyer and seller)
  setupUserOrderMonitoringBoth(userId: string): () => void {
    // Create queries for both buyer and seller
    const buyerQuery = query(
      collection(db, this.purchasesCollection),
      where('buyerId', '==', userId)
    );
    
    const sellerQuery = query(
      collection(db, this.purchasesCollection),
      where('sellerId', '==', userId)
    );
    
    // Set up listeners for both queries
    const buyerUnsubscribe = onSnapshot(buyerQuery, (querySnapshot) => {
      querySnapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          // Check if this is a truly new document or just initial load
          const purchaseData = change.doc.data();
          const purchaseId = change.doc.id;
          
          // Check if this purchase was created recently (within last 5 minutes)
          const purchaseDate = purchaseData.purchaseDate;
          const now = new Date();
          const purchaseTime = purchaseDate ? new Date(purchaseDate) : now;
          const timeDiff = now.getTime() - purchaseTime.getTime();
          const isRecent = timeDiff < 5 * 60 * 1000; // 5 minutes
          
          if (isRecent) {
            console.log('🛒 New purchase detected for buyer (recent):', userId);
            // Skip buyer notification here to avoid duplicates (buyer gets notification from PurchaseModal)
          } else {
            console.log('⏭️ Skipping old purchase on initial load for buyer:', purchaseId, 'created:', purchaseTime);
          }
        } else if (change.type === 'modified') {
          // Status change - notify buyer
          const purchaseData = change.doc.data();
          const newStatus = purchaseData.status;
          const previousStatus = purchaseData.previousStatus || newStatus;
          
          if (newStatus !== previousStatus) {
            await this.handleOrderStatusChange(purchaseData, previousStatus, newStatus);
            await this.updatePurchasePreviousStatus(change.doc.id, newStatus);
          }
        }
      });
    });
    
    const sellerUnsubscribe = onSnapshot(sellerQuery, (querySnapshot) => {
      console.log('🔍 Seller query snapshot received:', querySnapshot.size, 'documents');
      querySnapshot.docChanges().forEach(async (change) => {
        console.log('📝 Seller document change:', change.type, change.doc.id);
        if (change.type === 'added') {
          // Check if this is a truly new document or just initial load
          const purchaseData = change.doc.data();
          const purchaseId = change.doc.id;
          
          // Check if this purchase was created recently (within last 5 minutes)
          const purchaseDate = purchaseData.purchaseDate;
          const now = new Date();
          const purchaseTime = purchaseDate ? new Date(purchaseDate) : now;
          const timeDiff = now.getTime() - purchaseTime.getTime();
          const isRecent = timeDiff < 5 * 60 * 1000; // 5 minutes
          
          if (isRecent) {
            console.log('🛒 New purchase detected for seller (recent):', userId);
            console.log('📦 Purchase data for seller:', purchaseData);
            await this.handleNewPurchase(purchaseData, null, true); // Only notify seller
          } else {
            console.log('⏭️ Skipping old purchase on initial load:', purchaseId, 'created:', purchaseTime);
          }
        } else if (change.type === 'modified') {
          // Status change - notify seller
          const purchaseData = change.doc.data();
          const newStatus = purchaseData.status;
          const previousStatus = purchaseData.previousStatus || newStatus;
          
          if (newStatus !== previousStatus) {
            console.log('📊 Status change detected for seller:', previousStatus, '->', newStatus);
            await this.handleOrderStatusChange(purchaseData, previousStatus, newStatus);
            await this.updatePurchasePreviousStatus(change.doc.id, newStatus);
          }
        }
      });
    });
    
    // Return cleanup function that unsubscribes from both
    return () => {
      buyerUnsubscribe();
      sellerUnsubscribe();
    };
  }

  // Batch setup monitoring for multiple purchases
  setupBatchOrderMonitoring(purchaseIds: string[]): (() => void)[] {
    return purchaseIds.map(purchaseId => this.setupOrderStatusMonitoring(purchaseId));
  }

  // Clean up monitoring for a specific purchase
  cleanupOrderMonitoring(purchaseId: string): void {
    // This would be handled by the calling component
    // when it unmounts or no longer needs monitoring
    console.log(`Cleaning up monitoring for purchase ${purchaseId}`);
  }
}

// Export singleton instance
export const orderNotificationService = new OrderNotificationService(); 