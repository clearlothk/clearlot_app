import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentHKTimestamp } from '../utils/dateUtils';

export interface OfferReport {
  id?: string;
  offerId: string;
  offerTitle: string;
  sellerId: string;
  sellerName: string;
  reporterId: string;
  reason: 'fake-offer' | 'suspect-seller' | 'prohibit-products' | 'other-reason';
  customReason?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
}

// Submit a report
export const submitOfferReport = async (reportData: Omit<OfferReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const report: Omit<OfferReport, 'id'> = {
      ...reportData,
      status: 'pending',
      createdAt: getCurrentHKTimestamp(),
      updatedAt: getCurrentHKTimestamp()
    };

    const reportsRef = collection(db, 'offerReports');
    const docRef = await addDoc(reportsRef, report);
    
    return docRef.id;
  } catch (error) {
    console.error('Error submitting offer report:', error);
    throw new Error('Failed to submit report');
  }
};

// Get all reports for admin
export const getAllReports = async (): Promise<OfferReport[]> => {
  try {
    const reportsRef = collection(db, 'offerReports');
    const q = query(reportsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as OfferReport[];
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw new Error('Failed to fetch reports');
  }
};

// Get pending reports
export const getPendingReports = async (): Promise<OfferReport[]> => {
  try {
    const reportsRef = collection(db, 'offerReports');
    const q = query(
      reportsRef, 
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as OfferReport[];
  } catch (error) {
    console.error('Error fetching pending reports:', error);
    throw new Error('Failed to fetch pending reports');
  }
};

// Get reports by offer ID
export const getReportsByOfferId = async (offerId: string): Promise<OfferReport[]> => {
  try {
    const reportsRef = collection(db, 'offerReports');
    const q = query(
      reportsRef,
      where('offerId', '==', offerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as OfferReport[];
  } catch (error) {
    console.error('Error fetching reports by offer ID:', error);
    throw new Error('Failed to fetch reports by offer ID');
  }
};

// Get reports by seller ID
export const getReportsBySellerId = async (sellerId: string): Promise<OfferReport[]> => {
  try {
    const reportsRef = collection(db, 'offerReports');
    const q = query(
      reportsRef,
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as OfferReport[];
  } catch (error) {
    console.error('Error fetching reports by seller ID:', error);
    throw new Error('Failed to fetch reports by seller ID');
  }
};
