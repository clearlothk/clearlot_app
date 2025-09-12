import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Review, SellerRating, BuyerRating } from '../types';

class RatingService {
  // Submit a rating for a seller
  async submitRating(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
    try {
      const reviewData = {
        ...review,
        createdAt: Timestamp.now().toDate().toISOString()
      };

      // Add the review to the reviews collection
      const reviewRef = await addDoc(collection(db, 'reviews'), reviewData);
      
      // Update the purchase to mark it as rated
      await updateDoc(doc(db, 'purchases', review.purchaseId), {
        hasRating: true,
        ratingId: reviewRef.id
      });

      // Update rating statistics based on target type
      if (review.targetType === 'supplier') {
        await this.updateSellerRating(review.targetId);
      } else if (review.targetType === 'buyer') {
        await this.updateBuyerRating(review.targetId);
      }

      return reviewRef.id;
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw new Error('Failed to submit rating');
    }
  }

  // Get all reviews for a specific seller
  async getSellerReviews(sellerId: string): Promise<Review[]> {
    try {
      // First try with compound query (requires index)
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('targetId', '==', sellerId),
        where('targetType', '==', 'supplier'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(reviewsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Review));
    } catch (error: any) {
      // If compound query fails due to missing index, try simpler query
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        console.log('Compound index missing, falling back to simple query');
        try {
          const simpleQuery = query(
            collection(db, 'reviews'),
            where('targetId', '==', sellerId),
            where('targetType', '==', 'supplier')
          );
          
          const querySnapshot = await getDocs(simpleQuery);
          const reviews = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Review));
          
          // Sort manually since we can't use orderBy without index
          return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (fallbackError) {
          console.error('Error with fallback query:', fallbackError);
          return [];
        }
      }
      
      console.error('Error fetching seller reviews:', error);
      return [];
    }
  }

  // Get seller rating statistics
  async getSellerRating(sellerId: string): Promise<SellerRating | null> {
    try {
      const reviews = await this.getSellerReviews(sellerId);
      
      if (reviews.length === 0) {
        return null;
      }

      const totalRatings = reviews.length;
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = Math.round((sum / totalRatings) * 10) / 10; // Round to 1 decimal place

      const ratingBreakdown = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      };

      return {
        sellerId,
        averageRating,
        totalRatings,
        ratingBreakdown,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating seller rating:', error);
      return null; // Return null instead of throwing error
    }
  }

  // Update seller rating in the database
  private async updateSellerRating(sellerId: string): Promise<void> {
    try {
      const sellerRating = await this.getSellerRating(sellerId);
      
      if (sellerRating) {
        // Store or update the seller rating document
        const sellerRatingRef = doc(db, 'sellerRatings', sellerId);
        await updateDoc(sellerRatingRef, sellerRating).catch(async () => {
          // If document doesn't exist, create it
          await addDoc(collection(db, 'sellerRatings'), {
            ...sellerRating,
            id: sellerId
          });
        });
      }
    } catch (error) {
      console.error('Error updating seller rating:', error);
      // Don't throw error here as it's not critical for the main flow
    }
  }

  // Check if a purchase has already been rated
  async hasPurchaseBeenRated(purchaseId: string): Promise<boolean> {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('purchaseId', '==', purchaseId)
      );

      const querySnapshot = await getDocs(reviewsQuery);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking if purchase has been rated:', error);
      return false;
    }
  }

  // Get all reviews for a specific buyer
  async getBuyerReviews(buyerId: string): Promise<Review[]> {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('targetId', '==', buyerId),
        where('targetType', '==', 'buyer'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(reviewsQuery);
      const reviews: Review[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data
        } as Review);
      });

      return reviews;
    } catch (error) {
      console.error('Error fetching buyer reviews:', error);
      return [];
    }
  }

  // Get buyer rating statistics
  async getBuyerRating(buyerId: string): Promise<BuyerRating | null> {
    try {
      const reviews = await this.getBuyerReviews(buyerId);
      
      if (reviews.length === 0) {
        return null;
      }

      const totalRatings = reviews.length;
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = Math.round((sum / totalRatings) * 10) / 10; // Round to 1 decimal place

      const ratingBreakdown = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      };

      return {
        buyerId,
        averageRating,
        totalRatings,
        ratingBreakdown,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating buyer rating:', error);
      return null; // Return null instead of throwing error
    }
  }

  // Update buyer rating in the database
  private async updateBuyerRating(buyerId: string): Promise<void> {
    try {
      const buyerRating = await this.getBuyerRating(buyerId);
      
      if (buyerRating) {
        await updateDoc(doc(db, 'buyerRatings', buyerId), {
          ...buyerRating,
          lastUpdated: Timestamp.now().toDate().toISOString()
        });
      } else {
        // Create new buyer rating document if it doesn't exist
        await updateDoc(doc(db, 'buyerRatings', buyerId), {
          buyerId,
          averageRating: 0,
          totalRatings: 0,
          ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          lastUpdated: Timestamp.now().toDate().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating buyer rating:', error);
      // Don't throw error here as it's not critical for the main flow
    }
  }

  // Get recent reviews for a seller (for display purposes)
  async getRecentSellerReviews(sellerId: string, limitCount: number = 5): Promise<Review[]> {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('targetId', '==', sellerId),
        where('targetType', '==', 'supplier'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(reviewsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Review));
    } catch (error) {
      console.error('Error fetching recent seller reviews:', error);
      throw new Error('Failed to fetch recent seller reviews');
    }
  }

  // Get rating display text based on average rating
  getRatingDisplayText(averageRating: number): string {
    if (averageRating >= 4.5) return 'Excellent';
    if (averageRating >= 4.0) return 'Very Good';
    if (averageRating >= 3.5) return 'Good';
    if (averageRating >= 3.0) return 'Fair';
    if (averageRating >= 2.0) return 'Poor';
    return 'Very Poor';
  }

  // Get rating color based on average rating
  getRatingColor(averageRating: number): string {
    if (averageRating >= 4.5) return 'text-green-600';
    if (averageRating >= 4.0) return 'text-green-500';
    if (averageRating >= 3.5) return 'text-yellow-500';
    if (averageRating >= 3.0) return 'text-yellow-600';
    if (averageRating >= 2.0) return 'text-orange-500';
    return 'text-red-500';
  }
}

export const ratingService = new RatingService();

// Export individual methods for convenience
export const submitRating = (review: Omit<Review, 'id' | 'createdAt'>) => ratingService.submitRating(review);
export const getSellerReviews = (sellerId: string) => ratingService.getSellerReviews(sellerId);
export const getSellerRating = (sellerId: string) => ratingService.getSellerRating(sellerId);
export const updateSellerAverageRating = (sellerId: string) => ratingService.updateSellerRating(sellerId);
export const getBuyerReviews = (buyerId: string) => ratingService.getBuyerReviews(buyerId);
export const getBuyerRating = (buyerId: string) => ratingService.getBuyerRating(buyerId);

export default ratingService;
