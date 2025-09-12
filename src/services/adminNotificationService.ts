import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { notificationService } from './notificationService';

export interface AdminNotification {
  id: string;
  type: 'payment_receipt' | 'offer_upload' | 'user_registration' | 'transaction_completed' | 'verification_document';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  data: {
    purchaseId?: string;
    offerId?: string;
    userId?: string;
    amount?: number;
    actionUrl?: string;
    documentType?: string;
  };
  priority: 'low' | 'medium' | 'high';
}

export interface PaymentReceiptNotification {
  id: string;
  purchaseId: string;
  buyerId: string;
  buyerCompany: string;
  amount: number; // Total amount paid by buyer (including platform fee)
  platformFee: number; // Platform fee amount
  finalAmount: number; // Amount seller will receive (amount - platformFee)
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptUrl: string;
}

export interface OfferUploadNotification {
  id: string;
  offerId: string;
  sellerId: string;
  sellerCompany: string;
  title: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface VerificationDocumentNotification {
  id: string;
  userId: string;
  userCompany: string;
  documentType: string;
  documentUrl: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'not_submitted';
}

class AdminNotificationService {
  private listeners: Map<string, () => void> = new Map();

  // Listen to payment receipt notifications
  listenToPaymentReceipts(callback: (notifications: PaymentReceiptNotification[]) => void): () => void {
    // Simplified query to avoid composite index requirements
    const q = query(
      collection(db, 'purchases'),
      where('status', '==', 'pending'),
      limit(50) // Get more documents and filter in memory
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('🔍 Payment receipts query snapshot:', snapshot.size, 'documents');
      const notifications: PaymentReceiptNotification[] = [];
      
      // Process each document and fetch buyer information
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        console.log('📄 Processing purchase:', docSnapshot.id, 'has receipt:', !!data.paymentDetails?.receiptFile);
        
        // Filter for documents with receipt files in memory
        if (data.paymentDetails?.receiptFile && data.paymentDetails?.receiptPreview) {
          // Fetch buyer information
          let buyerCompany = 'Unknown Company';
          try {
            const buyerDoc = await getDoc(doc(db, 'users', data.buyerId));
            if (buyerDoc.exists()) {
              const buyerData = buyerDoc.data();
              buyerCompany = buyerData.company || 'Unknown Company';
            }
          } catch (error) {
            console.warn('Failed to fetch buyer info for:', data.buyerId, error);
          }
          
          // Use totalAmount (which includes platform fee) as that's what the client actually paid
          const totalPaidAmount = data.totalAmount || data.paymentDetails?.amount || 0;
          const platformFee = data.platformFee || 0;
          const finalAmount = data.finalAmount || (totalPaidAmount - platformFee);
          
          notifications.push({
            id: docSnapshot.id,
            purchaseId: docSnapshot.id,
            buyerId: data.buyerId,
            buyerCompany: buyerCompany,
            amount: totalPaidAmount,
            platformFee: platformFee,
            finalAmount: finalAmount,
            timestamp: data.purchaseDate || new Date().toISOString(),
            status: data.paymentApprovalStatus || 'pending',
            receiptUrl: data.paymentDetails.receiptPreview
          });
        }
      }

      // Sort by timestamp in memory (most recent first)
      notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Limit to 20 most recent
      const limitedNotifications = notifications.slice(0, 20);
      
      console.log('📧 Final payment receipt notifications:', limitedNotifications.length);
      callback(limitedNotifications);
    }, (error) => {
      console.error('❌ Payment receipts listener error:', error);
    });

    this.listeners.set('payment_receipts', unsubscribe);
    return unsubscribe;
  }

  // Listen to offer upload notifications
  listenToOfferUploads(callback: (notifications: OfferUploadNotification[]) => void): () => void {
    // Simplified query to avoid composite index requirements
    const q = query(
      collection(db, 'offers'),
      where('isApproved', '==', false),
      limit(50) // Get more documents and filter in memory
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: OfferUploadNotification[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Filter for non-deleted offers in memory
        if (!data.deleted) {
          notifications.push({
            id: doc.id,
            offerId: doc.id,
            sellerId: data.supplierId,
            sellerCompany: data.supplier?.company || 'Unknown Company',
            title: data.title,
            timestamp: data.createdAt || new Date().toISOString(),
            status: data.isApproved ? 'approved' : 'pending'
          });
        }
      });

      // Sort by timestamp in memory (most recent first)
      notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Limit to 20 most recent
      const limitedNotifications = notifications.slice(0, 20);
      
      callback(limitedNotifications);
    });

    this.listeners.set('offer_uploads', unsubscribe);
    return unsubscribe;
  }

  // Approve payment receipt
  async approvePaymentReceipt(purchaseId: string): Promise<void> {
    try {
      const purchaseRef = doc(db, 'purchases', purchaseId);
      await updateDoc(purchaseRef, {
        'paymentDetails.approvalStatus': 'approved',
        'paymentDetails.approvedAt': Timestamp.now().toDate().toISOString(),
        status: 'approved'
      });
      console.log(`Payment receipt approved for purchase: ${purchaseId}`);
    } catch (error) {
      console.error('Error approving payment receipt:', error);
      throw new Error('Failed to approve payment receipt');
    }
  }

  // Reject payment receipt
  async rejectPaymentReceipt(purchaseId: string, reason?: string): Promise<void> {
    try {
      const purchaseRef = doc(db, 'purchases', purchaseId);
      await updateDoc(purchaseRef, {
        'paymentDetails.approvalStatus': 'rejected',
        'paymentDetails.rejectedAt': Timestamp.now().toDate().toISOString(),
        'paymentDetails.rejectionReason': reason || 'Payment receipt rejected by admin',
        status: 'rejected'
      });
      console.log(`Payment receipt rejected for purchase: ${purchaseId}`);
    } catch (error) {
      console.error('Error rejecting payment receipt:', error);
      throw new Error('Failed to reject payment receipt');
    }
  }

  // Approve offer
  async approveOffer(offerId: string): Promise<void> {
    try {
      const offerRef = doc(db, 'offers', offerId);
      await updateDoc(offerRef, {
        isApproved: true,
        approvedAt: Timestamp.now().toDate().toISOString(),
        status: 'active'
      });
      console.log(`Offer approved: ${offerId}`);
    } catch (error) {
      console.error('Error approving offer:', error);
      throw new Error('Failed to approve offer');
    }
  }

  // Reject offer
  async rejectOffer(offerId: string, reason?: string): Promise<void> {
    try {
      const offerRef = doc(db, 'offers', offerId);
      await updateDoc(offerRef, {
        isApproved: false,
        rejectedAt: Timestamp.now().toDate().toISOString(),
        rejectionReason: reason || 'Offer rejected by admin',
        status: 'rejected'
      });
      console.log(`Offer rejected: ${offerId}`);
    } catch (error) {
      console.error('Error rejecting offer:', error);
      throw new Error('Failed to reject offer');
    }
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    try {
      // This would typically query a notifications collection
      // For now, we'll return a placeholder
      return 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      // This would typically update a notifications collection
      // For now, we'll just log it
      console.log(`Marked notification as read: ${notificationId}`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Listen to verification document notifications
  listenToVerificationDocuments(callback: (notifications: VerificationDocumentNotification[]) => void): () => void {
    // Simplified query to avoid composite index requirements
    const q = query(
      collection(db, 'users'),
      where('verificationDocuments', '!=', null),
      limit(50) // Get more documents and filter in memory
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: VerificationDocumentNotification[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const verificationDocs = data.verificationDocuments;
        
        if (verificationDocs) {
          // Check each document type for new uploads
          const documentTypes = ['businessRegistration', 'companyRegistration', 'businessLicense', 'taxCertificate', 'bankStatement'];
          
          documentTypes.forEach(docType => {
            if (verificationDocs[docType]) {
              notifications.push({
                id: `${doc.id}_${docType}`,
                userId: doc.id,
                userCompany: data.company || 'Unknown Company',
                documentType: docType,
                documentUrl: verificationDocs[docType],
                timestamp: data.verificationSubmittedAt || new Date().toISOString(),
                status: data.verificationStatus === 'approved' ? 'approved' : 
                       data.verificationStatus === 'rejected' ? 'rejected' : 'pending',
                verificationStatus: data.verificationStatus || 'pending'
              });
            }
          });
        }
      });

      // Sort by timestamp in memory (most recent first)
      notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Limit to 20 most recent
      const limitedNotifications = notifications.slice(0, 20);
      
      callback(limitedNotifications);
    });

    this.listeners.set('verification_documents', unsubscribe);
    return unsubscribe;
  }

  // Approve verification document
  async approveVerificationDocument(userId: string, documentType: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        verificationStatus: 'approved',
        isVerified: true, // Also update the isVerified field
        verificationReviewedAt: Timestamp.now().toDate().toISOString(),
        verificationReviewedBy: 'admin'
      });
      
      // Send notification to user about verification approval
      console.log(`🔔 Sending verification approval notification to user: ${userId}`);
      try {
        // Get user details for notification
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const companyName = userData?.company || 'Unknown Company';
          
          const notificationData = {
            userId: userId,
            type: 'verification_status' as const,
            title: '驗證已通過！✅',
            message: `恭喜！您的公司 "${companyName}" 的驗證已通過，現在可以正常使用所有功能。`,
            isRead: false,
            data: {
              verificationStatus: 'approved',
              isVerified: true,
              companyName: companyName,
              actionUrl: `/hk/${userId}/profile`
            },
            priority: 'high' as const
          };
          
          console.log('📨 Creating verification approval notification:', notificationData);
          
          // Import notification services
          const { firestoreNotificationService } = await import('./firestoreNotificationService');
          const { notificationService } = await import('./notificationService');
          
          // Save notification to Firestore
          const notificationId = await firestoreNotificationService.addNotification(notificationData);
          console.log('✅ Verification approval notification saved to Firestore with ID:', notificationId);
          
          // Create notification with ID and trigger real-time notification
          const notificationWithId = {
            ...notificationData,
            id: notificationId,
            createdAt: new Date().toISOString()
          };
          
          // Trigger real-time notification without re-saving
          notificationService.trigger(notificationWithId);
          console.log('✅ Verification approval notification sent');
        }
        
        console.log(`✅ Verification approval notification sent for user: ${userId}`);
      } catch (notificationError: any) {
        console.error('❌ Error sending verification approval notification:', notificationError);
        // Don't throw the error, just log it so the verification status still gets updated
        console.log('⚠️ Verification approved but user notification failed');
      }
      
      console.log(`Verification document approved for user: ${userId}, document: ${documentType}`);
    } catch (error) {
      console.error('Error approving verification document:', error);
      throw new Error('Failed to approve verification document');
    }
  }

  // Reject verification document
  async rejectVerificationDocument(userId: string, documentType: string, reason?: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        verificationStatus: 'rejected',
        isVerified: false, // Ensure user is not verified
        verificationReviewedAt: Timestamp.now().toDate().toISOString(),
        verificationReviewedBy: 'admin',
        verificationNotes: reason || 'Verification document rejected by admin'
      });
      
      // Send notification to user about verification rejection
      console.log(`🔔 Sending verification rejection notification to user: ${userId}`);
      try {
        // Get user details for notification
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const companyName = userData?.company || 'Unknown Company';
          
          const notificationData = {
            userId: userId,
            type: 'verification_status' as const,
            title: '驗證被拒絕 ❌',
            message: `很抱歉，您的公司 "${companyName}" 的驗證被拒絕。請檢查您的文件並重新提交。`,
            isRead: false,
            data: {
              verificationStatus: 'rejected',
              isVerified: false,
              companyName: companyName,
              rejectionReason: reason || 'Verification document rejected by admin',
              actionUrl: `/hk/${userId}/profile`
            },
            priority: 'high' as const
          };
          
          console.log('📨 Creating verification rejection notification:', notificationData);
          
          // Import notification services
          const { firestoreNotificationService } = await import('./firestoreNotificationService');
          const { notificationService } = await import('./notificationService');
          
          // Save notification to Firestore
          const notificationId = await firestoreNotificationService.addNotification(notificationData);
          console.log('✅ Verification rejection notification saved to Firestore with ID:', notificationId);
          
          // Create notification with ID and trigger real-time notification
          const notificationWithId = {
            ...notificationData,
            id: notificationId,
            createdAt: new Date().toISOString()
          };
          
          // Trigger real-time notification without re-saving
          notificationService.trigger(notificationWithId);
          console.log('✅ Verification rejection notification sent');
        }
        
        console.log(`✅ Verification rejection notification sent for user: ${userId}`);
      } catch (notificationError: any) {
        console.error('❌ Error sending verification rejection notification:', notificationError);
        // Don't throw the error, just log it so the verification status still gets updated
        console.log('⚠️ Verification rejected but user notification failed');
      }
      
      console.log(`Verification document rejected for user: ${userId}, document: ${documentType}`);
    } catch (error) {
      console.error('Error rejecting verification document:', error);
      throw new Error('Failed to reject verification document');
    }
  }

  // Cleanup all listeners
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

export const adminNotificationService = new AdminNotificationService(); 