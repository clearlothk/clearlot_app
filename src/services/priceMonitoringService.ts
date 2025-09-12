import { 
  collection, 
  doc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { notificationService } from './notificationService';
import { firestoreNotificationService } from './firestoreNotificationService';

// Price monitoring service for watchlist items
class PriceMonitoringService {
  private readonly offersCollection = 'offers';
  private readonly watchlistCollection = 'watchlist';
  private readonly priceHistoryCollection = 'priceHistory';
  private priceChangeThreshold = 0.05; // 5% price change threshold

  // Monitor price changes for a specific offer
  async monitorOfferPrice(offerId: string): Promise<void> {
    try {
      const offerRef = doc(db, this.offersCollection, offerId);
      const offerDoc = await getDoc(offerRef);
      
      if (!offerDoc.exists()) {
        console.log(`Offer ${offerId} not found`);
        return;
      }

      const offerData = offerDoc.data();
      const currentPrice = offerData.price;
      const previousPrice = offerData.previousPrice || currentPrice;

      // Check if price has dropped significantly
      if (previousPrice > currentPrice) {
        const priceChange = (previousPrice - currentPrice) / previousPrice;
        
        if (priceChange >= this.priceChangeThreshold) {
          // Notify all users who have this offer in their watchlist
          await this.notifyWatchlistUsers(offerId, offerData.title, previousPrice, currentPrice, priceChange);
          
          // Update the previous price
          await this.updateOfferPreviousPrice(offerId, currentPrice);
        }
      }
    } catch (error) {
      console.error('Error monitoring offer price:', error);
    }
  }

  // Notify all users who have this offer in their watchlist
  private async notifyWatchlistUsers(
    offerId: string, 
    offerTitle: string, 
    previousPrice: number, 
    newPrice: number, 
    priceChange: number
  ): Promise<void> {
    try {
      const percentage = Math.round(priceChange * 100);
      
      // Get all users who have this offer in their watchlist
      const watchlistQuery = query(
        collection(db, this.watchlistCollection),
        where('offerId', '==', offerId)
      );
      
      const watchlistSnapshot = await getDocs(watchlistQuery);
      
      // Create notifications for each user
      const notificationPromises = watchlistSnapshot.docs.map(async (watchlistDoc) => {
        const watchlistData = watchlistDoc.data();
        const userId = watchlistData.userId;
        
                 // Create notification data
         const notificationData = {
           userId,
           type: 'price_drop' as const,
           title: '價格下降提醒！🎉',
           message: `"${offerTitle}" 的價格已從 HKD ${previousPrice.toFixed(2)} 降至 HKD ${newPrice.toFixed(2)}（${percentage}% 折扣）！`,
           isRead: false,
           data: {
             offerId,
             previousPrice,
             newPrice,
             percentage,
             actionUrl: `/hk/marketplace/offer/${offerId}`
           },
           priority: 'medium' as const
         };

        // Add to Firestore
        await firestoreNotificationService.addNotification(notificationData);
        
        // Trigger real-time notification
        notificationService.trigger(notificationData);
      });
      
      await Promise.all(notificationPromises);
      console.log(`Notified ${watchlistSnapshot.docs.length} users about price drop for ${offerTitle}`);
      
    } catch (error) {
      console.error('Error notifying watchlist users:', error);
    }
  }

  // Update the previous price of an offer
  private async updateOfferPreviousPrice(offerId: string, newPreviousPrice: number): Promise<void> {
    try {
      const offerRef = doc(db, this.offersCollection, offerId);
      await offerRef.update({
        previousPrice: newPreviousPrice,
        lastPriceUpdate: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating offer previous price:', error);
    }
  }

  // Monitor all watchlist items for a user
  async monitorUserWatchlist(userId: string): Promise<void> {
    try {
      const watchlistQuery = query(
        collection(db, this.watchlistCollection),
        where('userId', '==', userId)
      );
      
      const watchlistSnapshot = await getDocs(watchlistQuery);
      
      // Monitor each offer in the user's watchlist
      const monitoringPromises = watchlistSnapshot.docs.map(async (watchlistDoc) => {
        const watchlistData = watchlistDoc.data();
        await this.monitorOfferPrice(watchlistData.offerId);
      });
      
      await Promise.all(monitoringPromises);
      
    } catch (error) {
      console.error('Error monitoring user watchlist:', error);
    }
  }

  // Set up real-time monitoring for all watchlist items for a user
  async setupUserWatchlistMonitoring(userId: string): Promise<(() => void)[]> {
    try {
      // Get user document to access watchlist
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log(`User ${userId} not found`);
        return [];
      }
      
      const userData = userDoc.data();
      const watchlist = userData.watchlist || [];
      
      if (watchlist.length === 0) {
        console.log(`User ${userId} has no items in watchlist`);
        return [];
      }
      
      // Set up real-time monitoring for each offer in the user's watchlist
      const unsubscribes = watchlist.map((offerId: string) => {
        return this.setupOfferPriceMonitoring(offerId);
      });
      
      console.log(`Set up real-time price monitoring for ${unsubscribes.length} watchlist items for user ${userId}`);
      return unsubscribes;
      
    } catch (error) {
      console.error('Error setting up user watchlist monitoring:', error);
      return [];
    }
  }

  // Set up real-time monitoring for an offer
  setupOfferPriceMonitoring(offerId: string, callback?: (priceChange: number) => void): () => void {
    const offerRef = doc(db, this.offersCollection, offerId);
    
    return onSnapshot(offerRef, (doc) => {
      if (doc.exists()) {
        const offerData = doc.data();
        const currentPrice = offerData.price;
        const previousPrice = offerData.previousPrice || currentPrice;
        
        if (previousPrice > currentPrice) {
          const priceChange = (previousPrice - currentPrice) / previousPrice;
          
          if (priceChange >= this.priceChangeThreshold) {
            // Notify users and update price
            this.notifyWatchlistUsers(offerId, offerData.title, previousPrice, currentPrice, priceChange);
            this.updateOfferPreviousPrice(offerId, currentPrice);
            
            // Call callback if provided
            if (callback) {
              callback(priceChange);
            }
          }
        }
      }
    });
  }

  // Set price change threshold (percentage)
  setPriceChangeThreshold(threshold: number): void {
    if (threshold >= 0 && threshold <= 1) {
      this.priceChangeThreshold = threshold;
    } else {
      console.warn('Price change threshold must be between 0 and 1 (0% to 100%)');
    }
  }

  // Get current price change threshold
  getPriceChangeThreshold(): number {
    return this.priceChangeThreshold;
  }

  // Batch monitor multiple offers
  async batchMonitorOffers(offerIds: string[]): Promise<void> {
    try {
      const monitoringPromises = offerIds.map(offerId => this.monitorOfferPrice(offerId));
      await Promise.all(monitoringPromises);
    } catch (error) {
      console.error('Error in batch monitoring offers:', error);
    }
  }

  // Clean up old price history (older than 90 days)
  async cleanupOldPriceHistory(daysOld: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      // This would require a priceHistory collection with timestamps
      // Implementation depends on your data structure
      console.log('Price history cleanup not implemented yet');
    } catch (error) {
      console.error('Error cleaning up price history:', error);
    }
  }
}

// Export singleton instance
export const priceMonitoringService = new PriceMonitoringService(); 