import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import { AuthUser, RegisterData, LoginCredentials, Offer, Transaction, Purchase } from '../types';
import { firestoreNotificationService } from './firestoreNotificationService';
import { notificationService } from './notificationService';

// User registration
export const registerUser = async (data: RegisterData): Promise<AuthUser> => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      data.email, 
      data.password
    );

    const user = userCredential.user;

    // Create user profile in Firestore
    const userData: AuthUser = {
      id: user.uid,
      email: data.email,
      // name field removed - not collected during registration
      company: data.company,
      // role field removed - users can both buy and sell
      isVerified: false,
      status: 'active', // Set default status to active for all registered users
      verificationStatus: 'not_submitted', // Set default verification status
      phone: data.phone,
      address: data.location,
      website: '',
      businessType: '',
      industry: '',
      companySize: '',
      brNumber: '',
      bankDetails: {
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        branchCode: '',
        fpsId: '',
        paymeId: ''
      },
      socialMedia: {
        facebook: '',
        instagram: '',
        tiktok: '',
        linkedin: ''
      },
      contactPersons: [],
      joinedDate: new Date().toISOString(),
      watchlist: [],
      purchaseHistory: []
    };

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), userData);

    // Send welcome notification
    try {
      await firestoreNotificationService.addNotification({
        userId: user.uid,
        type: 'system',
        title: '歡迎來到 ClearLot！🎉',
        message: '感謝您加入 ClearLot！開始探索優惠商品並與供應商建立聯繫。',
        isRead: false,
        priority: 'low'
      });
    } catch (notificationError) {
      console.log('Could not send welcome notification:', notificationError);
      // Don't fail registration if notification fails
    }

    return userData;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(getErrorMessage(error.code));
  }
};

// User login
export const loginUser = async (credentials: LoginCredentials): Promise<AuthUser> => {
  try {
    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      credentials.email, 
      credentials.password
    );

    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    return userDoc.data() as AuthUser;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(getErrorMessage(error.code));
  }
};

// User logout
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error('登出失敗。請重試。');
  }
};

// Get current user data
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data() as AuthUser;
    
    // Ensure user has status field, default to 'active' if missing
    if (!userData.status) {
      await updateDoc(doc(db, 'users', user.uid), {
        status: 'active'
      });
      userData.status = 'active';
    }

    // Ensure user has verificationStatus field, default to 'not_submitted' if missing
    if (!userData.verificationStatus) {
      await updateDoc(doc(db, 'users', user.uid), {
        verificationStatus: 'not_submitted'
      });
      userData.verificationStatus = 'not_submitted';
    }

    return userData;
  } catch (error: any) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Update user data
export const updateUserData = async (userId: string, updates: Partial<AuthUser>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), updates);
    
    // If company logo was updated, also update all offers from this user
    if (updates.companyLogo !== undefined) {
      try {
        const offersRef = collection(db, 'offers');
        const q = query(offersRef, where('supplierId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        const updatePromises = querySnapshot.docs.map(doc => 
          updateDoc(doc.ref, {
            'supplier.logo': updates.companyLogo
          })
        );
        
        await Promise.all(updatePromises);
        console.log(`Updated company logo for ${querySnapshot.docs.length} offers`);
      } catch (error) {
        console.warn('Failed to update offers with new company logo:', error);
        // Don't throw error for this, as user update was successful
      }
    }
  } catch (error: any) {
    console.error('Update user error:', error);
    throw new Error('更新用戶資料失敗。請重試。');
  }
};

// Check if email already exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error: any) {
    console.error('Check email error:', error);
    return false;
  }
};

// Error message mapping
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return '此電子郵件已被使用。';
    case 'auth/invalid-email':
      return '無效的電子郵件地址。';
    case 'auth/operation-not-allowed':
      return '此操作不被允許。';
    case 'auth/weak-password':
      return '密碼太弱。請使用至少6個字符。';
    case 'auth/user-disabled':
      return '此帳戶已被停用。';
    case 'auth/user-not-found':
      return '找不到此電子郵件的帳戶。';
    case 'auth/wrong-password':
      return '密碼錯誤。';
    case 'auth/too-many-requests':
      return '嘗試次數過多。請稍後再試。';
    case 'auth/network-request-failed':
      return '網絡連接失敗。請檢查您的網絡連接。';
    default:
      return '發生錯誤。請重試。';
  }
}; 

// Generate custom offer ID
const generateOfferId = async (): Promise<string> => {
  try {
    // Get the latest offer to determine the next ID
    const offersRef = collection(db, 'offers');
    const q = query(offersRef, orderBy('offerId', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    let nextNumber = 1;
    
    if (!querySnapshot.empty) {
      const latestOffer = querySnapshot.docs[0].data();
      if (latestOffer.offerId) {
        // Extract number from existing offerId (e.g., "oid000001" -> 1)
        const match = latestOffer.offerId.match(/oid(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
    }
    
    // Format as "oid" + 6-digit number with leading zeros
    return `oid${nextNumber.toString().padStart(6, '0')}`;
  } catch (error) {
    console.error('Error generating offer ID:', error);
    // Fallback: use timestamp-based ID
    return `oid${Date.now().toString().slice(-6)}`;
  }
};

// Upload offer to Firestore
export const uploadOffer = async (offerData: Omit<Offer, 'id' | 'createdAt' | 'supplier' | 'offerId' | 'supplierId'>, images: File[]): Promise<string> => {
  try {
    console.log('uploadOffer started with:', { offerData, imageCount: images.length }); // Debug log
    
    const user = auth.currentUser;
    if (!user) {
      throw new Error('用戶未登入');
    }

    console.log('User authenticated:', user.uid); // Debug log

    // Get user data
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('用戶資料不存在');
    }
    const userData = userDoc.data() as AuthUser;
    
    console.log('User data retrieved:', userData.company); // Debug log

    // Upload images to Firebase Storage
    const imageUrls: string[] = [];
    console.log('Starting image upload, count:', images.length); // Debug log
    
    for (const image of images) {
      const imagePath = `offers/${user.uid}/${Date.now()}_${image.name}`;
      console.log('Uploading image to path:', imagePath); // Debug log
      
      const imageRef = ref(storage, imagePath);
      await uploadBytes(imageRef, image);
      const downloadURL = await getDownloadURL(imageRef);
      imageUrls.push(downloadURL);
      
      console.log('Image uploaded successfully:', downloadURL); // Debug log
    }
    
    console.log('All images uploaded, URLs:', imageUrls); // Debug log

    // Generate custom offer ID
    const offerId = await generateOfferId();
    console.log('Generated offer ID:', offerId); // Debug log

    // Create offer document
    const offerDoc = {
      ...offerData,
      offerId: offerId, // Add custom offer ID
      supplier: {
        company: userData.company,
        rating: 0, // Default rating
        isVerified: userData.isVerified,
        logo: userData.companyLogo || ''
      },
      images: imageUrls,
      createdAt: Timestamp.now().toDate().toISOString(),
      supplierId: user.uid,
      status: 'active' // Set initial status as active
    };

    console.log('Creating offer document:', offerDoc); // Debug log
    
    const docRef = await addDoc(collection(db, 'offers'), offerDoc);
    console.log('Offer document created with ID:', docRef.id); // Debug log
    
    return offerId; // Return the custom offer ID instead of Firestore document ID
  } catch (error: any) {
    console.error('Upload offer error:', error);
    throw new Error(error.message || '上傳優惠失敗。請重試。');
  }
};

// Get all offers from Firestore
export const getOffers = async (filters?: {
  category?: string;
  location?: string;
  priceRange?: [number, number];
  minQuantity?: number;
  sortBy?: 'price' | 'ending-soon' | 'newest' | 'discount';
  verifiedOnly?: boolean;
  limit?: number;
}): Promise<Offer[]> => {
  try {
    let q = collection(db, 'offers');
    const constraints: any[] = [];

    // Apply simple filters that don't require complex indexes
    if (filters?.category && filters.category !== '所有類別') {
      constraints.push(where('category', '==', filters.category));
    }

    if (filters?.location && filters.location !== '所有地點') {
      constraints.push(where('location', '==', filters.location));
    }

    if (filters?.verifiedOnly) {
      constraints.push(where('supplier.isVerified', '==', true));
    }

    // Filter out sold offers and deleted offers
    // Note: We can't use '!=' queries for multiple values in Firestore
    // So we'll filter these on the client side

    // Always order by creation date for consistent results
    constraints.push(orderBy('createdAt', 'desc'));

    if (filters?.limit) {
      constraints.push(limit(filters.limit));
    }

    const querySnapshot = await getDocs(query(q, ...constraints));
    const offers: Offer[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      offers.push({
        id: doc.id,
        offerId: data.offerId || `oid${doc.id.slice(-6)}`, // Use custom offerId or fallback
        ...data
      } as Offer);
    });

    // Apply remaining filters on the client side to avoid index issues
    let filteredOffers = offers;

    // Filter out sold offers, expired offers, deleted offers, and offers with 0 quantity
    filteredOffers = filteredOffers.filter(offer => 
      offer.status !== 'sold' && 
      offer.status !== 'expired' &&
      !offer.deleted &&
      offer.quantity > 0
    );

    // Note: We no longer filter out offers with pending purchases
    // Offers should remain visible until they are completely sold out (status: 'sold')
    // or have 0 remaining quantity. This allows multiple buyers to purchase
    // from the same offer if quantity is available.

    // Filter by price range
    if (filters?.priceRange) {
      filteredOffers = filteredOffers.filter(offer => 
        offer.currentPrice >= filters.priceRange![0] && 
        offer.currentPrice <= filters.priceRange![1]
      );
    }

    // Filter by minimum quantity
    if (filters?.minQuantity) {
      filteredOffers = filteredOffers.filter(offer => 
        offer.quantity >= filters.minQuantity!
      );
    }

    // Apply sorting
    switch (filters?.sortBy) {
      case 'price':
        filteredOffers.sort((a, b) => a.currentPrice - b.currentPrice);
        break;
      case 'discount':
        filteredOffers.sort((a, b) => {
          const discountA = ((a.originalPrice - a.currentPrice) / a.originalPrice) * 100;
          const discountB = ((b.originalPrice - b.currentPrice) / b.originalPrice) * 100;
          return discountB - discountA;
        });
        break;
      case 'newest':
        // Already sorted by createdAt desc from Firestore
        break;
      default:
        // Default to newest
        break;
    }

    return filteredOffers;
  } catch (error: any) {
    console.error('Get offers error:', error);
    throw new Error('獲取優惠失敗。請重試。');
  }
};

// Search offers by text query
export const searchOffers = async (searchQuery: string, filters?: {
  category?: string;
  location?: string;
  priceRange?: [number, number];
  minQuantity?: number;
  sortBy?: 'price' | 'ending-soon' | 'newest' | 'discount';
  verifiedOnly?: boolean;
  limit?: number;
}): Promise<Offer[]> => {
  try {
    // Get all offers first (since Firestore doesn't support full-text search)
    const allOffers = await getOffers(filters);
    
    // Filter by search query
    const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return allOffers.filter(offer => {
      const searchableText = [
        offer.title,
        offer.description,
        offer.category,
        offer.supplier.company,
        offer.offerId,
        offer.id,
        ...offer.tags
      ].join(' ').toLowerCase();
      
      // Check if all search terms are found in the searchable text
      return searchTerms.every(term => searchableText.includes(term));
    });
  } catch (error: any) {
    console.error('Search offers error:', error);
    throw new Error('搜索優惠失敗。請重試。');
  }
};

// Get offer by ID
export const getOfferById = async (offerId: string): Promise<Offer | null> => {
  try {
    const offerDoc = await getDoc(doc(db, 'offers', offerId));
    if (!offerDoc.exists()) {
      return null;
    }
    const data = offerDoc.data();
    return {
      id: offerDoc.id,
      offerId: data.offerId || `oid${offerDoc.id.slice(-6)}`, // Use custom offerId or fallback
      ...data
    } as Offer;
  } catch (error: any) {
    console.error('Get offer by ID error:', error);
    throw new Error('獲取優惠詳情失敗。請重試。');
  }
};

// Get user's offers
export const getUserOffers = async (userId: string): Promise<Offer[]> => {
  try {
    const q = query(
      collection(db, 'offers'),
      where('supplierId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const offers: Offer[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const offer = {
        id: doc.id,
        offerId: data.offerId || `oid${doc.id.slice(-6)}`, // Use custom offerId or fallback
        ...data
      } as Offer;

      // Filter out sold offers, expired offers, and deleted offers
      // Only include offers that are still available (not sold, not expired, and not deleted)
      if (offer.status !== 'sold' && offer.status !== 'expired' && !offer.deleted) {
        offers.push(offer);
      }
    });

    return offers;
  } catch (error: any) {
    console.error('Get user offers error:', error);
    throw new Error('獲取用戶優惠失敗。請重試。');
  }
};

// Get offers by IDs (for watchlist)
export const getOffersByIds = async (offerIds: string[]): Promise<Offer[]> => {
  try {
    if (offerIds.length === 0) return [];

    const offers: Offer[] = [];
    
    // Firestore doesn't support 'in' queries with more than 10 items
    // So we need to batch the requests
    const batchSize = 10;
    for (let i = 0; i < offerIds.length; i += batchSize) {
      const batch = offerIds.slice(i, i + batchSize);
      
      const q = query(
        collection(db, 'offers'),
        where('__name__', 'in', batch)
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        offers.push({
          id: doc.id,
          offerId: data.offerId || `oid${doc.id.slice(-6)}`, // Use custom offerId or fallback
          ...data
        } as Offer);
      });
    }

    // First, filter out expired and deleted offers
    let filteredOffers = offers.filter(offer => 
      offer.status !== 'expired' &&
      !offer.deleted
    );

    // Check for pending purchases and filter out offers that have pending orders
    try {
      const purchasesSnapshot = await getDocs(collection(db, 'purchases'));
      const purchases = purchasesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Get offer IDs that have pending purchases
      const pendingOfferIds = purchases
        .filter(purchase => 
          purchase.status === 'pending' || 
          purchase.status === 'approved' || 
          purchase.paymentApprovalStatus === 'pending'
        )
        .map(purchase => purchase.offerId);
      
      console.log('🔍 Watchlist offers with pending purchases:', pendingOfferIds);
      
      // Filter out offers that have pending purchases
      filteredOffers = filteredOffers.filter(offer => 
        !pendingOfferIds.includes(offer.id)
      );
      
      console.log(`📊 Watchlist: Filtered out ${offers.length - filteredOffers.length} offers (expired, deleted, or pending purchases)`);
      return filteredOffers;
    } catch (error) {
      console.error('Error checking pending purchases for watchlist offers:', error);
      // Even if there's an error checking purchases, still return filtered offers (expired/deleted filtered out)
      console.log(`📊 Watchlist: Filtered out ${offers.length - filteredOffers.length} offers (expired or deleted)`);
      return filteredOffers;
    }
  } catch (error: any) {
    console.error('Get offers by IDs error:', error);
    throw new Error('獲取願望清單優惠失敗。請重試。');
  }
};

// Get offers by supplier ID (for company profile page)
export const getOffersBySupplierId = async (supplierId: string): Promise<Offer[]> => {
  try {
    // Try compound query first
    const q = query(
      collection(db, 'offers'),
      where('supplierId', '==', supplierId),
      where('deleted', '!=', true), // Only show non-deleted offers
      where('status', '==', 'active'), // Only show active offers
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const offers: Offer[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const offerData = docSnapshot.data() as Omit<Offer, 'id'>;
      offers.push({
        id: docSnapshot.id,
        ...offerData
      });
    }

    // Note: We no longer filter out offers with pending purchases
    // Offers should remain visible until they are completely sold out (status: 'sold')
    // or have 0 remaining quantity. This allows multiple buyers to purchase
    // from the same offer if quantity is available.
    
    // Filter out sold offers, expired offers, deleted offers, and offers with 0 quantity
    const filteredOffers = offers.filter(offer => 
      offer.status !== 'sold' && 
      offer.status !== 'expired' &&
      !offer.deleted &&
      offer.quantity > 0
    );
    
    return filteredOffers;
  } catch (error: any) {
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      console.log('Compound index missing for offers query, falling back to simple query');
      try {
        // Fallback: Simple query without orderBy, then filter and sort manually
        const simpleQuery = query(
          collection(db, 'offers'),
          where('supplierId', '==', supplierId)
        );
        
        const querySnapshot = await getDocs(simpleQuery);
        const offers: Offer[] = [];

        for (const docSnapshot of querySnapshot.docs) {
          const offerData = docSnapshot.data() as Omit<Offer, 'id'>;
          // Filter out deleted and inactive offers manually
          if (offerData.deleted !== true && offerData.status === 'active') {
            offers.push({
              id: docSnapshot.id,
              ...offerData
            });
          }
        }

        // Filter out sold offers, expired offers, deleted offers, and offers with 0 quantity
        const filteredOffers = offers.filter(offer => 
          offer.status !== 'sold' && 
          offer.status !== 'expired' &&
          !offer.deleted &&
          offer.quantity > 0
        );
        
        // Sort by createdAt manually
        return filteredOffers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (fallbackError) {
        console.error('Error with fallback query:', fallbackError);
        return [];
      }
    }
    console.error('Error fetching offers by supplier ID:', error);
    throw error;
  }
};

// Update offer
export const updateOffer = async (
  offerId: string, 
  offerData: Omit<Offer, 'id' | 'createdAt' | 'supplier' | 'offerId' | 'supplierId'>, 
  newImages: File[],
  isAdmin: boolean = false
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('用戶未登入');
    }

    // Get offer to check ownership
    const offerDoc = await getDoc(doc(db, 'offers', offerId));
    if (!offerDoc.exists()) {
      throw new Error('優惠不存在');
    }

    const existingOfferData = offerDoc.data();
    
    // Check if user is admin or the offer owner
    if (!isAdmin && existingOfferData.supplierId !== user.uid) {
      throw new Error('無權限編輯此優惠');
    }

    // Upload new images to Firebase Storage
    const newImageUrls: string[] = [];
    for (const image of newImages) {
      const imageRef = ref(storage, `offers/${user.uid}/${Date.now()}_${image.name}`);
      await uploadBytes(imageRef, image);
      const downloadURL = await getDownloadURL(imageRef);
      newImageUrls.push(downloadURL);
    }

    // Prepare final images array
    const finalImages = [
      ...(offerData.images as string[]).filter(img => 
        typeof img === 'string' && 
        !img.startsWith('data:') && 
        !img.startsWith('blob:') && 
        img.startsWith('https://') // Only keep proper Firebase Storage URLs
      ), // Keep existing URLs
      ...newImageUrls
    ];

    // Determine status based on quantity
    let newStatus = offerData.status;
    if (offerData.quantity > 0) {
      // If quantity is greater than 0, set status to active
      newStatus = 'active';
    } else if (offerData.quantity <= 0) {
      // If quantity is 0 or less, set status to sold
      newStatus = 'sold';
    }

    // Update offer document
    const updateData = {
      ...offerData,
      images: finalImages,
      status: newStatus,
      updatedAt: Timestamp.now().toDate().toISOString()
    };

    await updateDoc(doc(db, 'offers', offerId), updateData);
    
    // Update watchlist quantities for all users who have this offer in their watchlist
    console.log('Updating offer quantity in watchlists after edit...');
    const affectedUserIds = await updateOfferQuantityInWatchlists(offerId, offerData.quantity);
    console.log(`Updated offer quantity in watchlists, affected ${affectedUserIds.length} users`);
  } catch (error: any) {
    console.error('Update offer error:', error);
    throw new Error(error.message || '更新優惠失敗。請重試。');
  }
};

// Delete offer
export const deleteOffer = async (offerId: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('用戶未登入');
    }

    // Get offer to check ownership and delete images
    const offerDoc = await getDoc(doc(db, 'offers', offerId));
    if (!offerDoc.exists()) {
      throw new Error('優惠不存在');
    }

    const offerData = offerDoc.data();
    if (offerData.supplierId !== user.uid) {
      throw new Error('無權限刪除此優惠');
    }

    // Update offer document to set status as expired and mark as deleted
    // Note: We keep the images in Firebase Storage for potential recovery
    await updateDoc(doc(db, 'offers', offerId), { 
      deleted: true,
      status: 'expired',
      deletedAt: Timestamp.now().toDate().toISOString()
    });
  } catch (error: any) {
    console.error('Delete offer error:', error);
    throw new Error(error.message || '刪除優惠失敗。請重試。');
  }
}; 

// Get all offers for admin panel (including deleted offers)
export const getAllOffersForAdmin = async (): Promise<Offer[]> => {
  try {
    const q = query(
      collection(db, 'offers'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const offers: Offer[] = [];

    // Get unique supplier IDs to fetch user data
    const supplierIds = new Set<string>();
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.supplierId) {
        supplierIds.add(data.supplierId);
      }
    });

    // Fetch all supplier user data
    const supplierDataMap = new Map<string, AuthUser>();
    for (const supplierId of supplierIds) {
      try {
        const userData = await getUserById(supplierId);
        if (userData) {
          supplierDataMap.set(supplierId, userData);
        }
      } catch (error) {
        console.warn(`Failed to fetch user data for supplier ${supplierId}:`, error);
      }
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const supplierId = data.supplierId;
      const userData = supplierDataMap.get(supplierId);
      
      // Enhanced supplier data with complete user information
      const enhancedSupplier = userData ? {
        company: userData.company,
        rating: data.supplier?.rating || 0,
        isVerified: userData.isVerified,
        logo: userData.companyLogo || '',
        // Additional seller information
        email: userData.email,
        phone: userData.phone || '',
        address: userData.address || '',
        website: userData.website || '',
        businessType: userData.businessType || '',
        industry: userData.industry || '',
        companySize: userData.companySize || '',
        brNumber: userData.brNumber || '',
        companyBio: userData.companyBio || '',
        joinedDate: userData.joinedDate || '',
        status: userData.status || 'active',
        // Contact information
        contactPersons: userData.contactPersons || [],
        // Social media
        socialMedia: userData.socialMedia || {},
        // Bank details (for admin reference)
        bankDetails: userData.bankDetails || {}
      } : {
        company: data.supplier?.company || 'Unknown Company',
        rating: data.supplier?.rating || 0,
        isVerified: data.supplier?.isVerified || false,
        logo: data.supplier?.logo || '',
        email: '',
        phone: '',
        address: '',
        website: '',
        businessType: '',
        industry: '',
        companySize: '',
        brNumber: '',
        companyBio: '',
        joinedDate: '',
        status: 'active',
        contactPersons: [],
        socialMedia: {},
        bankDetails: {}
      };

      offers.push({
        id: doc.id,
        offerId: data.offerId || `oid${doc.id.slice(-6)}`,
        ...data,
        supplier: enhancedSupplier
      } as Offer);
    });

    return offers;
  } catch (error: any) {
    console.error('Get all offers for admin error:', error);
    throw new Error('獲取所有優惠失敗。請重試。');
  }
};

// Update offer status (admin function)
export const updateOfferStatus = async (offerId: string, status: 'active' | 'pending' | 'rejected' | 'expired' | 'sold'): Promise<void> => {
  try {
    await updateDoc(doc(db, 'offers', offerId), {
      status: status,
      isApproved: status === 'active',
      updatedAt: Timestamp.now().toDate().toISOString()
    });
  } catch (error: any) {
    console.error('Update offer status error:', error);
    throw new Error('更新優惠狀態失敗。請重試。');
  }
};

// Delete offer permanently (admin function)
export const deleteOfferPermanently = async (offerId: string): Promise<void> => {
  try {
    // Get offer to delete images
    const offerDoc = await getDoc(doc(db, 'offers', offerId));
    if (!offerDoc.exists()) {
      throw new Error('優惠不存在');
    }

    const offerData = offerDoc.data();

    // Delete images from storage
    for (const imageUrl of offerData.images) {
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.warn('Failed to delete image:', error);
      }
    }

    // Delete offer document permanently
    await updateDoc(doc(db, 'offers', offerId), { 
      deleted: true,
      deletedAt: Timestamp.now().toDate().toISOString()
    });
  } catch (error: any) {
    console.error('Delete offer permanently error:', error);
    throw new Error('永久刪除優惠失敗。請重試。');
  }
}; 

// Get user by ID (admin function)
export const getUserById = async (userId: string): Promise<AuthUser | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    return userDoc.data() as AuthUser;
  } catch (error: any) {
    console.error('Get user by ID error:', error);
    throw new Error('獲取用戶資料失敗。請重試。');
  }
};

// Update company logo (admin function)
export const updateCompanyLogo = async (userId: string, logoFile: File): Promise<string> => {
  try {
    // Validate file type
    if (!logoFile.type.startsWith('image/')) {
      throw new Error('請選擇圖片文件');
    }
    
    // Validate file size (10MB for company logos)
    if (logoFile.size > 10 * 1024 * 1024) {
      throw new Error('文件大小必須小於10MB');
    }

    // Get current user data to delete old logo
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      throw new Error('用戶不存在');
    }

    // Delete old logo from storage if exists
    if (currentUser.companyLogo && currentUser.companyLogo.startsWith('https://')) {
      try {
        const oldLogoRef = ref(storage, currentUser.companyLogo);
        await deleteObject(oldLogoRef);
      } catch (error) {
        console.warn('Failed to delete old logo:', error);
      }
    }

    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `users/${userId}/company-logo/${timestamp}_${logoFile.name}`;
    const storageRef = ref(storage, fileName);
    
    // Upload file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, logoFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update user data
    await updateUserData(userId, { companyLogo: downloadURL });
    
    // Update all offers from this user
    try {
      const offersRef = collection(db, 'offers');
      const q = query(offersRef, where('supplierId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          'supplier.logo': downloadURL
        })
      );
      
      await Promise.all(updatePromises);
      console.log(`Updated company logo for ${querySnapshot.docs.length} offers`);
    } catch (error) {
      console.warn('Failed to update offers with new company logo:', error);
    }

    return downloadURL;
  } catch (error: any) {
    console.error('Update company logo error:', error);
    throw new Error(error.message || '更新公司標誌失敗。請重試。');
  }
};

// Delete company logo (admin function)
export const deleteCompanyLogo = async (userId: string): Promise<void> => {
  try {
    // Get current user data
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      throw new Error('用戶不存在');
    }

    // Delete logo from storage if exists
    if (currentUser.companyLogo && currentUser.companyLogo.startsWith('https://')) {
      try {
        const logoRef = ref(storage, currentUser.companyLogo);
        await deleteObject(logoRef);
      } catch (error) {
        console.warn('Failed to delete logo from storage:', error);
      }
    }

    // Update user data
    await updateUserData(userId, { companyLogo: '' });
    
    // Update all offers from this user
    try {
      const offersRef = collection(db, 'offers');
      const q = query(offersRef, where('supplierId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          'supplier.logo': ''
        })
      );
      
      await Promise.all(updatePromises);
      console.log(`Removed company logo from ${querySnapshot.docs.length} offers`);
    } catch (error) {
      console.warn('Failed to update offers with logo removal:', error);
    }
  } catch (error: any) {
    console.error('Delete company logo error:', error);
    throw new Error(error.message || '刪除公司標誌失敗。請重試。');
  }
};

// Update company cover photo
export const updateCompanyCoverPhoto = async (userId: string, coverPhotoFile: File): Promise<string> => {
  try {
    // Validate file type
    if (!coverPhotoFile.type.startsWith('image/')) {
      throw new Error('請選擇圖片文件');
    }
    
    // Validate file size (10MB for cover photos)
    if (coverPhotoFile.size > 10 * 1024 * 1024) {
      throw new Error('文件大小必須小於10MB');
    }

    // Get current user data to delete old cover photo
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      throw new Error('用戶不存在');
    }

    // Delete old cover photo from storage if exists
    if (currentUser.companyCoverPhoto && currentUser.companyCoverPhoto.startsWith('https://')) {
      try {
        const oldCoverRef = ref(storage, currentUser.companyCoverPhoto);
        await deleteObject(oldCoverRef);
      } catch (error) {
        console.warn('Failed to delete old cover photo:', error);
      }
    }

    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `users/${userId}/company-cover/${timestamp}_${coverPhotoFile.name}`;
    const storageRef = ref(storage, fileName);
    
    // Upload file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, coverPhotoFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update user data
    await updateUserData(userId, { companyCoverPhoto: downloadURL });

    return downloadURL;
  } catch (error: any) {
    console.error('Update company cover photo error:', error);
    throw new Error(error.message || '更新公司封面照片失敗。請重試。');
  }
};

// Delete company cover photo
export const deleteCompanyCoverPhoto = async (userId: string): Promise<void> => {
  try {
    // Get current user data
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      throw new Error('用戶不存在');
    }

    // Delete cover photo from storage if exists
    if (currentUser.companyCoverPhoto && currentUser.companyCoverPhoto.startsWith('https://')) {
      try {
        const coverRef = ref(storage, currentUser.companyCoverPhoto);
        await deleteObject(coverRef);
      } catch (error) {
        console.warn('Failed to delete cover photo from storage:', error);
      }
    }

    // Update user data
    await updateUserData(userId, { companyCoverPhoto: '' });
  } catch (error: any) {
    console.error('Delete company cover photo error:', error);
    throw new Error(error.message || '刪除公司封面照片失敗。請重試。');
  }
};

// Get all users (admin function)
export const getAllUsers = async (): Promise<AuthUser[]> => {
  try {
    const q = query(collection(db, 'users'), orderBy('joinedDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const users: AuthUser[] = [];

    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      } as AuthUser);
    });

    return users;
  } catch (error: any) {
    console.error('Get all users error:', error);
    throw new Error('獲取所有用戶失敗。請重試。');
  }
};

// Update user verification status (admin function)
export const updateUserVerification = async (userId: string, isVerified: boolean, adminEmail?: string, customReason?: string): Promise<void> => {
  try {
    const verificationStatus: 'approved' | 'rejected' = isVerified ? 'approved' : 'rejected';
    const verificationNotes = customReason || (isVerified ? 'Verification approved by admin' : 'Verification rejected by admin');
    
    const updateData = {
      isVerified,
      verificationStatus,
      verificationReviewedAt: new Date().toISOString(),
      verificationReviewedBy: adminEmail || 'admin',
      verificationNotes
    };
    
    console.log('🔔 FirebaseService: Updating user verification status');
    console.log('👤 User ID:', userId);
    console.log('📊 Is Verified:', isVerified);
    console.log('📊 Verification Status:', verificationStatus);
    console.log('📊 Update Data:', updateData);
    
    await updateUserData(userId, updateData);
    
    // Update all offers from this user
    try {
      const offersRef = collection(db, 'offers');
      const q = query(offersRef, where('supplierId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          'supplier.isVerified': isVerified
        })
      );
      
      await Promise.all(updatePromises);
      console.log(`Updated verification status for ${querySnapshot.docs.length} offers`);
    } catch (error) {
      console.warn('Failed to update offers with verification status:', error);
    }

    // Send notification to user about verification status change
    console.log(`🔔 Sending verification status notification to user: ${userId}`);
    try {
      // Get user details for notification
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const companyName = userData?.company || 'Unknown Company';
        
        const notificationData = {
          userId: userId,
          type: 'verification_status' as const,
          title: isVerified ? '驗證已通過！✅' : '驗證被拒絕 ❌',
          message: isVerified 
            ? `恭喜！您的公司 "${companyName}" 的驗證已通過，現在可以正常使用所有功能。`
            : `很抱歉，您的公司 "${companyName}" 的驗證被拒絕。${customReason ? `原因：${customReason}` : '請檢查您的文件並重新提交。'}`,
          isRead: false,
          data: {
            verificationStatus: verificationStatus,
            isVerified: isVerified,
            companyName: companyName,
            rejectionReason: customReason,
            actionUrl: `/hk/${userId}/profile`
          },
          priority: 'high' as const
        };
        
        console.log('📨 Creating verification status notification:', notificationData);
        
        // Save notification to Firestore
        const notificationId = await firestoreNotificationService.addNotification(notificationData);
        console.log('✅ Verification status notification saved to Firestore with ID:', notificationId);
        
        // Create notification with ID and trigger real-time notification
        const notificationWithId = {
          ...notificationData,
          id: notificationId,
          createdAt: new Date().toISOString()
        };
        
        // Trigger real-time notification with the notification that has ID
        notificationService.trigger(notificationWithId);
        console.log('✅ Verification status notification sent');
      }
      
      console.log(`✅ Verification status notification sent for user: ${userId}`);
    } catch (notificationError: any) {
      console.error('❌ Error sending verification status notification:', notificationError);
      // Don't throw the error, just log it so the verification status still gets updated
      console.log('⚠️ Verification status updated but user notification failed');
    }
  } catch (error: any) {
    console.error('Update user verification error:', error);
    throw new Error('更新用戶驗證狀態失敗。請重試。');
  }
};

// Get all transactions (admin function)
export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const q = query(collection(db, 'transactions'), orderBy('transactionDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      } as Transaction);
    });

    return transactions;
  } catch (error: any) {
    console.error('Get all transactions error:', error);
    throw new Error('獲取所有交易失敗。請重試。');
  }
};

// Get all purchases for admin (new function)
export const getAllPurchasesForAdmin = async (): Promise<Purchase[]> => {
  try {
    const q = query(collection(db, 'purchases'), orderBy('purchaseDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const purchases: Purchase[] = [];

    querySnapshot.forEach((doc) => {
      purchases.push({
        id: doc.id,
        ...doc.data()
      } as Purchase);
    });

    return purchases;
  } catch (error: any) {
    console.error('Get all purchases error:', error);
    throw new Error('獲取所有購買記錄失敗。請重試。');
  }
};



// Update purchase approval status (admin function)
export const updatePurchaseApprovalStatus = async (purchaseId: string, approvalStatus: 'pending' | 'approved' | 'rejected', adminNotes?: string): Promise<void> => {
  try {
    const updateData: any = {
      approvalStatus,
      adminNotes,
      updatedAt: Timestamp.now().toDate().toISOString()
    };
    
    // If approved, also update the payment status
    if (approvalStatus === 'approved') {
      updateData.status = 'completed';
      updateData['paymentDetails.status'] = 'completed';
    } else if (approvalStatus === 'rejected') {
      updateData.status = 'cancelled';
      updateData['paymentDetails.status'] = 'failed';
    }
    
    // First update the purchase status
    await updateDoc(doc(db, 'purchases', purchaseId), updateData);
    
    // Then restore the offer if rejected
    if (approvalStatus === 'rejected') {
      console.log(`🔄 Starting offer restoration for purchase: ${purchaseId}`);
      try {
        await restoreOfferAfterRejection(purchaseId);
        console.log(`✅ Offer restoration completed for purchase: ${purchaseId}`);
      } catch (restoreError: any) {
        console.error('❌ Error during offer restoration:', restoreError);
        // Don't throw the error, just log it so the purchase status still gets updated
        console.log('⚠️ Purchase status updated but offer restoration failed');
      }
      
      // Send rejection notifications to buyer and seller
      try {
        console.log(`🔔 Sending rejection notifications for purchase: ${purchaseId}`);
        
        // Get purchase details for notifications
        const purchaseRef = doc(db, 'purchases', purchaseId);
        const purchaseDoc = await getDoc(purchaseRef);
        
        if (purchaseDoc.exists()) {
          const purchaseData = purchaseDoc.data();
          const { buyerId, offerId, sellerId, totalAmount } = purchaseData;
          
          // Validate required fields
          if (buyerId && offerId && sellerId) {
            // Get offer details
            const offerRef = doc(db, 'offers', offerId);
            const offerDoc = await getDoc(offerRef);
            const offerData = offerDoc.exists() ? offerDoc.data() : null;
            const offerTitle = offerData?.title || '商品';
            
            // Get buyer and seller details
            const [buyerRef, sellerRef] = await Promise.all([
              getDoc(doc(db, 'users', buyerId)),
              getDoc(doc(db, 'users', sellerId))
            ]);
            
            const buyerData = buyerRef.exists() ? buyerRef.data() : null;
            const sellerData = sellerRef.exists() ? sellerRef.data() : null;
            const buyerCompanyName = buyerData?.company || 'Unknown Buyer';
            const sellerCompanyName = sellerData?.company || 'Unknown Seller';
            
            console.log(`📋 Rejection notification details: offerTitle=${offerTitle}, buyerCompany=${buyerCompanyName}, sellerCompany=${sellerCompanyName}`);
            
            // Import notification services dynamically
            const { firestoreNotificationService } = await import('./firestoreNotificationService');
            const { notificationService } = await import('./notificationService');
            
            // Notify buyer
            const buyerNotificationData = {
              userId: buyerId,
              type: 'order_status' as const,
              title: '訂單被拒絕 ❌',
              message: `您的訂單 "${offerTitle}" 已被拒絕。${adminNotes ? `原因：${adminNotes}` : ''}`,
              isRead: false,
              data: {
                offerId: offerId,
                purchaseId: purchaseId,
                status: 'cancelled',
                amount: totalAmount,
                actionUrl: `/hk/my-orders`
              },
              priority: 'high' as const
            };
            
            console.log('📨 Creating buyer rejection notification:', buyerNotificationData);
            
            const buyerNotificationId = await firestoreNotificationService.addNotification(buyerNotificationData);
            const buyerNotificationWithId = {
              ...buyerNotificationData,
              id: buyerNotificationId,
              createdAt: new Date().toISOString()
            };
            notificationService.trigger(buyerNotificationWithId);
            console.log('✅ Buyer rejection notification sent');
            
            // Notify seller
            const sellerNotificationData = {
              userId: sellerId,
              type: 'order_status' as const,
              title: '訂單被拒絕 ❌',
              message: `您的訂單 "${offerTitle}" 已被拒絕。${adminNotes ? `原因：${adminNotes}` : ''}`,
              isRead: false,
              data: {
                offerId: offerId,
                purchaseId: purchaseId,
                status: 'cancelled',
                amount: totalAmount,
                actionUrl: `/hk/my-orders`
              },
              priority: 'high' as const
            };
            
            console.log('📨 Creating seller rejection notification:', sellerNotificationData);
            
            const sellerNotificationId = await firestoreNotificationService.addNotification(sellerNotificationData);
            const sellerNotificationWithId = {
              ...sellerNotificationData,
              id: sellerNotificationId,
              createdAt: new Date().toISOString()
            };
            notificationService.trigger(sellerNotificationWithId);
            console.log('✅ Seller rejection notification sent');
          } else {
            console.error('❌ Missing required fields for rejection notification:', { buyerId, offerId, sellerId });
          }
        }
      } catch (notificationError: any) {
        console.error('❌ Error sending rejection notifications:', notificationError);
        console.log('⚠️ Purchase status updated but rejection notifications failed');
      }
    }
  } catch (error: any) {
    console.error('Update purchase approval status error:', error);
    throw new Error('更新購買審批狀態失敗。請重試。');
  }
};

// Update purchase payment status (admin function)
export const updatePurchasePaymentStatus = async (purchaseId: string, paymentStatus: 'pending' | 'approved' | 'rejected' | 'shipped' | 'delivered' | 'completed', adminNotes?: string): Promise<void> => {
  try {
    const updateData: any = {
      status: paymentStatus,
      paymentApprovalStatus: paymentStatus,
      updatedAt: Timestamp.now().toDate().toISOString()
    };
    
    // Also update the nested payment details status
    if (paymentStatus === 'approved') {
      updateData['paymentDetails.status'] = 'completed';
      updateData['paymentDetails.approvedBy'] = 'admin';
      updateData['paymentDetails.approvedAt'] = Timestamp.now().toDate().toISOString();
      if (adminNotes) {
        updateData['paymentDetails.adminNotes'] = adminNotes;
      }
    } else if (paymentStatus === 'rejected') {
      updateData['paymentDetails.status'] = 'failed';
      if (adminNotes) {
        updateData['paymentDetails.adminNotes'] = adminNotes;
      }
    } else if (paymentStatus === 'shipped') {
      updateData['paymentDetails.status'] = 'completed';
      updateData['shippingApprovalStatus'] = 'approved';
      updateData['shippingDetails.approvedBy'] = 'admin';
      updateData['shippingDetails.approvedAt'] = Timestamp.now().toDate().toISOString();
      if (adminNotes) {
        updateData['shippingDetails.adminNotes'] = adminNotes;
      }
    } else if (paymentStatus === 'delivered') {
      updateData['paymentDetails.status'] = 'completed';
      updateData['shippingApprovalStatus'] = 'approved';
      updateData['shippingDetails.deliveredAt'] = Timestamp.now().toDate().toISOString();
      if (adminNotes) {
        updateData['shippingDetails.adminNotes'] = adminNotes;
      }
    } else if (paymentStatus === 'completed') {
      updateData['paymentDetails.status'] = 'completed';
      updateData['shippingApprovalStatus'] = 'approved';
      updateData['shippingDetails.deliveredAt'] = Timestamp.now().toDate().toISOString();
      updateData['shippingDetails.deliveryConfirmedAt'] = Timestamp.now().toDate().toISOString();
      if (adminNotes) {
        updateData['shippingDetails.adminNotes'] = adminNotes;
      }
    } else {
      updateData['paymentDetails.status'] = 'pending';
    }
    
    await updateDoc(doc(db, 'purchases', purchaseId), updateData);
    
    // NOTE: Offer quantity should already be updated during purchase, not during admin approval
    // Only update offer quantity if this is a new purchase completion (not admin approval)
    if (paymentStatus === 'completed') {
      console.log('ℹ️ Payment status set to completed - offer quantity should already be updated during purchase');
      // Don't update offer quantity here as it should have been done during purchase
    }
    
    // If payment status is approved, send notification to seller
    if (paymentStatus === 'approved') {
      console.log(`🔔 Payment approved, sending notification to seller for purchase: ${purchaseId}`);
      try {
        await sendSellerPaymentApprovalNotification(purchaseId);
        console.log(`✅ Seller payment approval notification sent for purchase: ${purchaseId}`);
      } catch (notificationError: any) {
        console.error('❌ Error sending seller payment approval notification:', notificationError);
        // Don't throw the error, just log it so the payment status still gets updated
        console.log('⚠️ Payment status updated but seller notification failed');
      }
    }
    
    // If payment status is rejected, restore the offer
    if (paymentStatus === 'rejected') {
      console.log(`🔄 Starting offer restoration for rejected payment: ${purchaseId}`);
      try {
        await restoreOfferAfterRejection(purchaseId);
        console.log(`✅ Offer restoration completed for rejected payment: ${purchaseId}`);
      } catch (restoreError: any) {
        console.error('❌ Error during offer restoration:', restoreError);
        // Don't throw the error, just log it so the payment status still gets updated
        console.log('⚠️ Payment status updated but offer restoration failed');
      }
    }
    
    // If payment status is completed, send notification to seller about payment sent
    if (paymentStatus === 'completed') {
      console.log(`🔔 Payment completed, sending notification to seller for purchase: ${purchaseId}`);
      try {
        // Get purchase details for notification
        const purchaseRef = doc(db, 'purchases', purchaseId);
        const purchaseDoc = await getDoc(purchaseRef);
        
        if (purchaseDoc.exists()) {
          const purchaseData = purchaseDoc.data();
          const { sellerId, offerId, totalAmount, platformFee, finalAmount } = purchaseData;
          
          console.log(`📦 Purchase data: sellerId=${sellerId}, offerId=${offerId}, totalAmount=${totalAmount}, platformFee=${platformFee}, finalAmount=${finalAmount}`);
          
          // Get offer details
          const offerRef = doc(db, 'offers', offerId);
          const offerDoc = await getDoc(offerRef);
          const offerData = offerDoc.exists() ? offerDoc.data() : null;
          const offerTitle = offerData?.title || '商品';
          
          console.log(`📋 Offer data: title=${offerTitle}`);

          // Send notification to seller about payment sent
          const notificationData = {
            userId: sellerId,
            type: 'offer_sales_status' as const,
            title: '付款已發送！💰',
            message: `ClearLot 已為您發送優惠 "${offerTitle}" 的付款 HKD ${totalAmount.toFixed(2)}。`,
            isRead: false,
            data: {
              offerId: offerId,
              purchaseId: purchaseId,
              status: 'completed',
              amount: totalAmount,
              actionUrl: `/hk/${sellerId}/my-orders`
            },
            priority: 'high' as const
          };
          
          console.log('📨 Creating seller payment sent notification:', notificationData);
          
          // Save notification to Firestore
          const notificationId = await firestoreNotificationService.addNotification(notificationData);
          console.log('✅ Seller payment sent notification saved to Firestore with ID:', notificationId);
          
          // Create notification with ID and trigger real-time notification
          const notificationWithId = {
            ...notificationData,
            id: notificationId,
            createdAt: new Date().toISOString()
          };
          
          // Trigger real-time notification with the notification that has ID
          notificationService.trigger(notificationWithId);
          console.log('✅ Seller payment sent notification sent');
        }
        
        console.log(`✅ Seller payment sent notification sent for purchase: ${purchaseId}`);
      } catch (notificationError: any) {
        console.error('❌ Error sending seller payment sent notification:', notificationError);
        // Don't throw the error, just log it so the payment status still gets updated
        console.log('⚠️ Payment status updated but seller notification failed');
      }
    }
  } catch (error: any) {
    console.error('Update purchase payment status error:', error);
    throw new Error('更新購買付款狀態失敗。請重試。');
  }
};

// Update transaction approval status (admin function) - keeping for backward compatibility
export const updateTransactionApprovalStatus = async (transactionId: string, approvalStatus: 'pending' | 'approved' | 'rejected'): Promise<void> => {
  try {
    await updateDoc(doc(db, 'transactions', transactionId), {
      approvalStatus,
      updatedAt: Timestamp.now().toDate().toISOString()
    });
  } catch (error: any) {
    console.error('Update transaction approval status error:', error);
    throw new Error('更新交易審批狀態失敗。請重試。');
  }
};

// Update transaction payment status (admin function)
export const updateTransactionPaymentStatus = async (transactionId: string, paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'): Promise<void> => {
  try {
    await updateDoc(doc(db, 'transactions', transactionId), {
      paymentStatus,
      updatedAt: Timestamp.now().toDate().toISOString()
    });
  } catch (error: any) {
    console.error('Update transaction payment status error:', error);
    throw new Error('更新交易付款狀態失敗。請重試。');
  }
};

// Create transaction when purchase is made
export const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const transactionDoc = {
      ...transactionData,
      createdAt: Timestamp.now().toDate().toISOString(),
      updatedAt: Timestamp.now().toDate().toISOString()
    };

    const docRef = await addDoc(collection(db, 'transactions'), transactionDoc);
    return docRef.id;
  } catch (error: any) {
    console.error('Create transaction error:', error);
    throw new Error('創建交易失敗。請重試。');
  }
};

// Update transaction with admin notes and notification status
export const updateTransactionWithAdminNotes = async (
  transactionId: string, 
  adminNotes: string, 
  sellerNotified: boolean = false
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'transactions', transactionId), {
      adminNotes,
      sellerNotified,
      updatedAt: Timestamp.now().toDate().toISOString()
    });
  } catch (error: any) {
    console.error('Update transaction with admin notes error:', error);
    throw new Error('更新交易備註失敗。請重試。');
  }
};

// Mark logistics as arranged
export const markLogisticsArranged = async (transactionId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'transactions', transactionId), {
      logisticsArranged: true,
      updatedAt: Timestamp.now().toDate().toISOString()
    });
  } catch (error: any) {
    console.error('Mark logistics arranged error:', error);
    throw new Error('標記物流安排失敗。請重試。');
  }
};

// Remove offer from all users' watchlists (when completely sold out)
export const removeOfferFromAllWatchlists = async (firestoreOfferId: string): Promise<string[]> => {
  try {
    console.log(`Removing offer ${firestoreOfferId} from all users' watchlists...`);
    
    // Get all users who have this offer in their watchlist
    // Note: watchlist stores Firestore document IDs, not custom offer IDs
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('watchlist', 'array-contains', firestoreOfferId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No users have this offer in their watchlist');
      return [];
    }
    
    console.log(`Found ${querySnapshot.size} users with this offer in their watchlist`);
    
    // Remove the offer from each user's watchlist
    const batch = writeBatch(db);
    querySnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const updatedWatchlist = (userData.watchlist || []).filter((id: string) => id !== firestoreOfferId);
      
      batch.update(userDoc.ref, {
        watchlist: updatedWatchlist
      });
    });
    
    // Commit all updates
    await batch.commit();
    console.log(`Successfully removed offer ${firestoreOfferId} from ${querySnapshot.size} users' watchlists`);
    
    // Return the list of affected user IDs for potential UI updates
    return querySnapshot.docs.map(doc => doc.id);
    
  } catch (error: any) {
    console.error('Error removing offer from watchlists:', error);
    // Don't throw error - this is not critical for the purchase process
    return [];
  }
};

// Update offer quantity in all users' watchlists (for real-time quantity sync)
export const updateOfferQuantityInWatchlists = async (firestoreOfferId: string, newQuantity: number): Promise<string[]> => {
  try {
    console.log(`Updating offer ${firestoreOfferId} quantity to ${newQuantity} in all users' watchlists...`);
    
    // Get all users who have this offer in their watchlist
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('watchlist', 'array-contains', firestoreOfferId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No users have this offer in their watchlist');
      return [];
    }
    
    console.log(`Found ${querySnapshot.size} users with this offer in their watchlist`);
    
    // If quantity is 0 or less, remove the offer from all watchlists
    if (newQuantity <= 0) {
      console.log('Quantity is 0 or less, removing offer from all watchlists');
      return await removeOfferFromAllWatchlists(firestoreOfferId);
    }
    
    // For now, we don't need to update user documents since the offer quantity
    // is fetched from the offers collection when displaying watchlist items
    // The real-time update will happen through the offer document itself
    
    console.log(`Offer quantity updated to ${newQuantity}, watchlist users will see updated quantity in real-time`);
    
    // Return the list of affected user IDs for potential UI updates
    return querySnapshot.docs.map(doc => doc.id);
    
  } catch (error: any) {
    console.error('Error updating offer quantity in watchlists:', error);
    // Don't throw error - this is not critical for the purchase process
    return [];
  }
};

// Update offer after successful purchase
export const updateOfferAfterPurchase = async (offerId: string, purchasedQuantity: number): Promise<void> => {
  try {
    console.log(`🔄 updateOfferAfterPurchase called with offerId: ${offerId}, purchasedQuantity: ${purchasedQuantity}`);
    
    // Validate inputs
    if (!offerId) {
      throw new Error('Offer ID is required');
    }
    if (!purchasedQuantity || purchasedQuantity <= 0) {
      throw new Error('Purchased quantity must be greater than 0');
    }
    
    const offerRef = doc(db, 'offers', offerId);
    const offerDoc = await getDoc(offerRef);
    
    if (!offerDoc.exists()) {
      throw new Error(`優惠不存在: ${offerId}`);
    }
    
    const offerData = offerDoc.data() as Offer;
    console.log(`📋 Offer data: id=${offerData.id}, offerId=${offerData.offerId}, title=${offerData.title}, currentQuantity=${offerData.quantity}`);
    
    // Validate current quantity
    if (offerData.quantity < purchasedQuantity) {
      throw new Error(`購買數量 (${purchasedQuantity}) 超過可用數量 (${offerData.quantity})`);
    }
    
    const remainingQuantity = offerData.quantity - purchasedQuantity;
    console.log(`🔢 Quantity update: ${offerData.quantity} - ${purchasedQuantity} = ${remainingQuantity}`);
    
    // Update offer quantity first
    if (remainingQuantity <= 0) {
      // If no quantity left, mark as sold
      console.log('🏷️ Marking offer as sold (quantity reached 0)');
      await updateDoc(offerRef, {
        status: 'sold',
        quantity: 0,
        updatedAt: Timestamp.now().toDate().toISOString()
      });
      console.log('✅ Offer marked as sold successfully');
    } else {
      // Update quantity and keep status as active
      console.log(`📦 Updating offer quantity to ${remainingQuantity}`);
      await updateDoc(offerRef, {
        quantity: remainingQuantity,
        updatedAt: Timestamp.now().toDate().toISOString()
      });
      console.log('✅ Offer quantity updated successfully');
    }
    
    // Update watchlist quantities for all users who have this offer in their watchlist
    console.log('👥 Calling updateOfferQuantityInWatchlists...');
    const affectedUserIds = await updateOfferQuantityInWatchlists(offerId, remainingQuantity);
    console.log(`✅ updateOfferQuantityInWatchlists completed, affected ${affectedUserIds.length} users`);
    
    console.log('🎉 updateOfferAfterPurchase completed successfully');
  } catch (error: any) {
    console.error('❌ Update offer after purchase error:', error);
    console.error('Error details:', {
      offerId,
      purchasedQuantity,
      errorMessage: error.message,
      errorCode: error.code
    });
    
    // Try to get the current offer data for debugging
    try {
      const offerRef = doc(db, 'offers', offerId);
      const offerDoc = await getDoc(offerRef);
      if (offerDoc.exists()) {
        const currentData = offerDoc.data();
        console.error('Current offer data:', {
          id: offerId,
          quantity: currentData.quantity,
          status: currentData.status,
          title: currentData.title
        });
      }
    } catch (debugError) {
      console.error('Could not fetch offer data for debugging:', debugError);
    }
    
    throw new Error(`更新優惠狀態失敗: ${error.message}`);
  }
};

// Upload shipping photos and mark as shipped
export const uploadShippingPhotos = async (purchaseId: string, files: File[], remarks?: string): Promise<void> => {
  try {
    console.log(`📦 uploadShippingPhotos called for purchase: ${purchaseId}`);
    console.log(`📦 Files to upload: ${files.length} files`);
    
    // Validate inputs
    if (!purchaseId) {
      throw new Error('Purchase ID is required');
    }
    
    if (!files || files.length === 0) {
      throw new Error('At least one file is required');
    }
    
    // Get purchase details first for notification
    const purchaseRef = doc(db, 'purchases', purchaseId);
    const purchaseDoc = await getDoc(purchaseRef);
    
    if (!purchaseDoc.exists()) {
      throw new Error('購買記錄不存在');
    }
    
    const purchaseData = purchaseDoc.data();
    const { buyerId, offerId, sellerId } = purchaseData;
    
    console.log(`📦 Purchase data extracted: buyerId=${buyerId}, offerId=${offerId}, sellerId=${sellerId}`);
    
    // Validate required fields
    if (!buyerId) {
      console.error('❌ No buyerId found in purchase data:', purchaseData);
      throw new Error('No buyerId found in purchase data');
    }
    
    if (!offerId) {
      console.error('❌ No offerId found in purchase data:', purchaseData);
      throw new Error('No offerId found in purchase data');
    }
    
    if (!sellerId) {
      console.error('❌ No sellerId found in purchase data:', purchaseData);
      throw new Error('No sellerId found in purchase data');
    }
    
    // Get offer details for notification
    const offerRef = doc(db, 'offers', offerId);
    const offerDoc = await getDoc(offerRef);
    const offerData = offerDoc.exists() ? offerDoc.data() : null;
    const offerTitle = offerData?.title || '商品';
    
    // Get seller details for notification
    const sellerRef = doc(db, 'users', sellerId);
    const sellerDoc = await getDoc(sellerRef);
    const sellerData = sellerDoc.exists() ? sellerDoc.data() : null;
    const sellerCompanyName = sellerData?.company || 'Unknown Seller';
    
    console.log(`📋 Offer data: title=${offerTitle}, sellerCompanyName=${sellerCompanyName}`);
    console.log(`📋 Seller data: company=${sellerData?.company}, name=${sellerData?.name}`);
    
    const photoURLs: string[] = [];
    
    // Upload all photos to Firebase Storage
    for (const file of files) {
      const storageRef = ref(storage, `shipping-photos/${purchaseId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      photoURLs.push(photoURL);
    }
    
    console.log(`📸 Uploaded ${photoURLs.length} shipping photos`);
    
    // Update purchase with shipping details
    const updateData: any = {
      status: 'shipped',
      shippingApprovalStatus: 'pending', // Pending admin approval
      'shippingDetails.shippedAt': Timestamp.now().toDate().toISOString(),
      'shippingDetails.shippingPhotos': photoURLs, // Array of photo URLs
      'shippingDetails.photoCount': photoURLs.length,
      updatedAt: Timestamp.now().toDate().toISOString()
    };

    // Add remarks if provided
    if (remarks && remarks.trim()) {
      updateData['shippingDetails.remarks'] = remarks.trim();
    }

    await updateDoc(doc(db, 'purchases', purchaseId), updateData);
    
    console.log(`✅ Purchase status updated to 'shipped'`);
    
    // Start delivery reminder system
    try {
      const { deliveryReminderService } = await import('./deliveryReminderService');
      await deliveryReminderService.startDeliveryReminder(purchaseId);
      console.log(`✅ Delivery reminder system started for purchase: ${purchaseId}`);
    } catch (reminderError) {
      console.error('❌ Error starting delivery reminder system:', reminderError);
      // Don't throw error here - shipping photos were uploaded successfully
    }
    
    // Send notification to buyer about shipping
    console.log(`🔔 Sending shipping notification to buyer: ${buyerId}`);
    console.log(`🔍 Current authenticated user:`, auth.currentUser?.uid);
    console.log(`🔍 Buyer ID:`, buyerId);
    console.log(`🔍 User ID match:`, auth.currentUser?.uid === buyerId);
    console.log(`📋 Buyer notification details: sellerCompanyName=${sellerCompanyName}, offerTitle=${offerTitle}, photoCount=${photoURLs.length}`);
    
    try {
      // Validate buyerId before creating notification
      if (!buyerId) {
        console.error('❌ No buyerId found in purchase data');
        throw new Error('No buyerId found in purchase data');
      }
      
      const notificationData = {
        userId: buyerId,
        type: 'order_status' as const,
        title: '商品已發貨！📦',
        message: `${sellerCompanyName} 已為您的訂單 "${offerTitle}" 發貨，共上傳了 ${photoURLs.length} 張發貨照片。`,
        isRead: false,
        data: {
          offerId: offerId,
          purchaseId: purchaseId,
          status: 'shipped',
          photoCount: photoURLs.length,
          actionUrl: `/hk/${buyerId}/my-orders`
        },
        priority: 'high' as const
      };
      
      console.log('📨 Creating buyer shipping notification:', notificationData);
      console.log('🔍 Notification data details:');
      console.log('  - userId:', notificationData.userId);
      console.log('  - type:', notificationData.type);
      console.log('  - title:', notificationData.title);
      console.log('  - message:', notificationData.message);
      console.log('  - priority:', notificationData.priority);
      
      // Import notification services dynamically
      console.log('🔧 Using dynamic imports for notification services');
      const { firestoreNotificationService } = await import('./firestoreNotificationService');
      const { notificationService } = await import('./notificationService');
      
      // Save notification to Firestore
      console.log('💾 Attempting to save buyer notification to Firestore...');
      const notificationId = await firestoreNotificationService.addNotification(notificationData);
      console.log('✅ Buyer shipping notification saved to Firestore with ID:', notificationId);
      
      // Create notification with ID and trigger real-time notification
      const notificationWithId = {
        ...notificationData,
        id: notificationId,
        createdAt: new Date().toISOString()
      };
      
      console.log('📡 Triggering real-time notification for buyer...');
      // Trigger real-time notification with the notification that has ID
      notificationService.trigger(notificationWithId);
      console.log('✅ Buyer shipping notification sent successfully');
      
    } catch (notificationError: any) {
      console.error('❌ Error sending buyer shipping notification:', notificationError);
      console.error('❌ Error details:', {
        message: notificationError.message,
        code: notificationError.code,
        stack: notificationError.stack
      });
      // Don't throw the error, just log it so the shipping photos still get uploaded
      console.log('⚠️ Shipping photos uploaded but buyer notification failed');
    }

    // Send notification to seller about successful shipping upload
    console.log(`🔔 Sending shipping upload confirmation to seller: ${sellerId}`);
    console.log(`🔍 Current authenticated user:`, auth.currentUser?.uid);
    console.log(`🔍 Seller ID:`, sellerId);
    console.log(`🔍 User ID match:`, auth.currentUser?.uid === sellerId);
    
    try {
      const sellerNotificationData = {
        userId: sellerId,
        type: 'order_status' as const,
        title: '發貨照片已上傳！📸',
        message: `您已成功為訂單 "${offerTitle}" 上傳了 ${photoURLs.length} 張發貨照片，買家已收到發貨通知。`,
        isRead: false,
        data: {
          offerId: offerId,
          purchaseId: purchaseId,
          status: 'shipped',
          photoCount: photoURLs.length,
          actionUrl: `/hk/${sellerId}/my-orders`
        },
        priority: 'medium' as const
      };
      
      console.log('📨 Creating seller shipping upload notification:', sellerNotificationData);
      console.log('🔍 Notification data details:');
      console.log('  - userId:', sellerNotificationData.userId);
      console.log('  - type:', sellerNotificationData.type);
      console.log('  - title:', sellerNotificationData.title);
      console.log('  - message:', sellerNotificationData.message);
      console.log('  - priority:', sellerNotificationData.priority);
      
      // Import notification services dynamically for seller notification
      console.log('🔧 Using dynamic imports for seller notification services');
      const { firestoreNotificationService: sellerFirestoreService } = await import('./firestoreNotificationService');
      const { notificationService: sellerNotificationService } = await import('./notificationService');
      
      // Save notification to Firestore
      console.log('💾 Attempting to save seller notification to Firestore...');
      const sellerNotificationId = await sellerFirestoreService.addNotification(sellerNotificationData);
      console.log('✅ Seller shipping upload notification saved to Firestore with ID:', sellerNotificationId);
      
      // Create notification with ID and trigger real-time notification
      const sellerNotificationWithId = {
        ...sellerNotificationData,
        id: sellerNotificationId,
        createdAt: new Date().toISOString()
      };
      
      console.log('📡 Triggering real-time notification for seller...');
      // Trigger real-time notification with the notification that has ID
      sellerNotificationService.trigger(sellerNotificationWithId);
      console.log('✅ Seller shipping upload notification sent');
      
    } catch (sellerNotificationError: any) {
      console.error('❌ Error sending seller shipping upload notification:', sellerNotificationError);
      console.error('❌ Error details:', {
        message: sellerNotificationError.message,
        code: sellerNotificationError.code,
        stack: sellerNotificationError.stack
      });
      // Don't throw the error, just log it so the shipping photos still get uploaded
      console.log('⚠️ Shipping photos uploaded but seller notification failed');
    }
    
  } catch (error: any) {
    console.error('Upload shipping photos error:', error);
    throw new Error('上傳發貨照片失敗。請重試。');
  }
};

// Keep the old function for backward compatibility
export const uploadShippingPhoto = async (purchaseId: string, file: File): Promise<void> => {
  return uploadShippingPhotos(purchaseId, [file]);
};

// Mark purchase as delivered (buyer confirms receipt)
export const confirmDelivery = async (purchaseId: string): Promise<void> => {
  try {
    console.log(`📦 confirmDelivery called for purchase: ${purchaseId}`);
    
    // Get purchase details first to send notifications
    const purchaseDoc = await getDoc(doc(db, 'purchases', purchaseId));
    if (!purchaseDoc.exists()) {
      throw new Error('訂單不存在');
    }
    
    const purchaseData = purchaseDoc.data();
    const { buyerId, sellerId, offerId, finalAmount, totalAmount, platformFee } = purchaseData;
    
    console.log(`📦 Purchase data: buyerId=${buyerId}, sellerId=${sellerId}, offerId=${offerId}, totalAmount=${totalAmount}, platformFee=${platformFee}, finalAmount=${finalAmount}`);
    
    // Get offer details
    const offerDoc = await getDoc(doc(db, 'offers', offerId));
    const offerData = offerDoc.exists() ? offerDoc.data() : null;
    const offerTitle = offerData?.title || '商品';
    
    // Get buyer details for seller notification
    const buyerRef = doc(db, 'users', buyerId);
    const buyerDoc = await getDoc(buyerRef);
    const buyerData = buyerDoc.exists() ? buyerDoc.data() : null;
    const buyerCompanyName = buyerData?.company || 'Unknown Buyer';
    
    console.log(`📋 Offer data: title=${offerTitle}, buyerCompanyName=${buyerCompanyName}`);

    await updateDoc(doc(db, 'purchases', purchaseId), {
      status: 'delivered',
      'shippingDetails.deliveredAt': Timestamp.now().toDate().toISOString(),
      'shippingDetails.deliveryConfirmedAt': Timestamp.now().toDate().toISOString(),
      'shippingDetails.deliveryConfirmedBy': 'buyer',
      'deliveryReminder.isActive': false, // Stop reminder system
      updatedAt: Timestamp.now().toDate().toISOString()
    });
    
    console.log(`✅ Purchase status updated to 'delivered'`);
    
    // Stop delivery reminder system
    try {
      const { deliveryReminderService } = await import('./deliveryReminderService');
      deliveryReminderService.stopDeliveryReminder(purchaseId);
      console.log(`✅ Delivery reminder system stopped for purchase: ${purchaseId}`);
    } catch (reminderError) {
      console.error('❌ Error stopping delivery reminder system:', reminderError);
      // Don't throw error here - delivery was confirmed successfully
    }

    // Send notifications to both buyer and seller
    try {
      // Use static imports for notification services
      
      // 1. Notify buyer about delivery confirmation
      console.log(`🔔 Sending delivery confirmation notification to buyer: ${buyerId}`);
      const buyerNotificationData = {
        userId: buyerId,
        type: 'order_status' as const,
        title: '恭喜！訂單已完成！🎉',
        message: `恭喜！您的訂單 "${offerTitle}" 已成功收貨。訂單已完成。`,
        isRead: false,
        priority: 'high' as const,
        data: {
          offerId: offerId,
          purchaseId: purchaseId,
          status: 'delivered',
          actionUrl: `/hk/${buyerId}/my-orders`
        }
      };
      
      const buyerNotificationId = await firestoreNotificationService.addNotification(buyerNotificationData);
      const buyerNotificationWithId = {
        ...buyerNotificationData,
        id: buyerNotificationId,
        createdAt: new Date().toISOString()
      };
      // Trigger real-time notification with the notification that has ID
      notificationService.trigger(buyerNotificationWithId);
      console.log('✅ Buyer delivery confirmation notification sent');

      // 2. Notify seller about delivery confirmation (first notification)
      console.log(`🔔 Sending delivery confirmation notification to seller: ${sellerId}`);
      const sellerDeliveryNotificationData = {
        userId: sellerId,
        type: 'order_status' as const,
        title: '商品已收到！📦',
        message: `${buyerCompanyName} 已確認收貨，商品 "${offerTitle}" 已送達。`,
        isRead: false,
        priority: 'high' as const,
        data: {
          offerId: offerId,
          purchaseId: purchaseId,
          status: 'delivered',
          buyerCompanyName: buyerCompanyName,
          actionUrl: `/hk/${sellerId}/my-orders`
        }
      };
      
      const sellerDeliveryNotificationId = await firestoreNotificationService.addNotification(sellerDeliveryNotificationData);
      const sellerDeliveryNotificationWithId = {
        ...sellerDeliveryNotificationData,
        id: sellerDeliveryNotificationId,
        createdAt: new Date().toISOString()
      };
      // Trigger real-time notification with the notification that has ID
      notificationService.trigger(sellerDeliveryNotificationWithId);
      console.log('✅ Seller delivery confirmation notification sent');

      // 3. Notify seller about transaction completion (second notification)
      console.log(`🔔 Sending transaction completion notification to seller: ${sellerId}`);
      const sellerCompletionNotificationData = {
        userId: sellerId,
        type: 'offer_sales_status' as const,
        title: '恭喜！交易已完成！🎉',
        message: `恭喜！銷售 "${offerTitle}" 已完成，ClearLot 將很快發送付款 HKD ${totalAmount.toFixed(2)}。`,
        isRead: false,
        priority: 'high' as const,
        data: {
          offerId: offerId,
          purchaseId: purchaseId,
          status: 'completed',
          amount: totalAmount,
          buyerCompanyName: buyerCompanyName,
          actionUrl: `/hk/${sellerId}/my-orders`
        }
      };
      
      const sellerCompletionNotificationId = await firestoreNotificationService.addNotification(sellerCompletionNotificationData);
      const sellerCompletionNotificationWithId = {
        ...sellerCompletionNotificationData,
        id: sellerCompletionNotificationId,
        createdAt: new Date().toISOString()
      };
      // Trigger real-time notification with the notification that has ID
      notificationService.trigger(sellerCompletionNotificationWithId);
      console.log('✅ Seller transaction completion notification sent');
      
    } catch (notificationError: any) {
      console.error('❌ Error sending delivery notifications:', notificationError);
      // Don't fail delivery confirmation if notification fails
      console.log('⚠️ Delivery confirmed but notifications failed');
    }
  } catch (error: any) {
    console.error('Confirm delivery error:', error);
    throw new Error('確認收貨失敗。請重試。');
  }
};

// Mark purchase as completed (admin function)
export const markPurchaseCompleted = async (purchaseId: string): Promise<void> => {
  try {
    console.log(`📦 markPurchaseCompleted called for purchase: ${purchaseId}`);
    
    // Get purchase details first for notification
    const purchaseRef = doc(db, 'purchases', purchaseId);
    const purchaseDoc = await getDoc(purchaseRef);
    
    if (!purchaseDoc.exists()) {
      throw new Error('購買記錄不存在');
    }
    
    const purchaseData = purchaseDoc.data();
    const { sellerId, offerId, totalAmount, platformFee, finalAmount } = purchaseData;
    
    console.log(`📦 Purchase data: sellerId=${sellerId}, offerId=${offerId}, totalAmount=${totalAmount}, platformFee=${platformFee}, finalAmount=${finalAmount}`);
    
    // Get offer details
    const offerRef = doc(db, 'offers', offerId);
    const offerDoc = await getDoc(offerRef);
    const offerData = offerDoc.exists() ? offerDoc.data() : null;
    const offerTitle = offerData?.title || '商品';
    
    console.log(`📋 Offer data: title=${offerTitle}`);

    // Update purchase status to completed
    await updateDoc(doc(db, 'purchases', purchaseId), {
      status: 'completed',
      updatedAt: Timestamp.now().toDate().toISOString()
    });
    
    console.log(`✅ Purchase status updated to 'completed'`);

    // CRITICAL: Update offer quantity after purchase completion
    const { quantity } = purchaseData;
    if (quantity && quantity > 0) {
      try {
        console.log(`🔄 Updating offer quantity after admin completion: offerId=${offerId}, purchasedQuantity=${quantity}`);
        await updateOfferAfterPurchase(offerId, quantity);
        console.log('✅ Offer quantity updated after admin completion');
      } catch (offerError) {
        console.error('❌ Error updating offer quantity after admin completion:', offerError);
        // Don't throw the error, just log it so the purchase completion still succeeds
        console.log('⚠️ Purchase marked as completed but offer quantity update failed');
      }
    }

    // Send notification to seller about payment sent
    console.log(`🔔 Sending payment sent notification to seller: ${sellerId}`);
    try {
      const notificationData = {
        userId: sellerId,
        type: 'offer_sales_status' as const,
        title: '付款已發送！💰',
        message: `ClearLot 已為您發送優惠 "${offerTitle}" 的付款 HKD ${totalAmount.toFixed(2)}。`,
        isRead: false,
        data: {
          offerId: offerId,
          purchaseId: purchaseId,
          status: 'completed',
          amount: totalAmount,
          actionUrl: `/hk/${sellerId}/my-orders`
        },
        priority: 'high' as const
      };
      
      console.log('📨 Creating seller payment sent notification:', notificationData);
      
      // Save notification to Firestore
      const notificationId = await firestoreNotificationService.addNotification(notificationData);
      console.log('✅ Seller payment sent notification saved to Firestore with ID:', notificationId);
      
      // Create notification with ID and trigger real-time notification
      const notificationWithId = {
        ...notificationData,
        id: notificationId,
        createdAt: new Date().toISOString()
      };
      
      // Trigger real-time notification with the notification that has ID
      notificationService.trigger(notificationWithId);
      console.log('✅ Seller payment sent notification sent');
      
    } catch (notificationError: any) {
      console.error('❌ Error sending seller payment sent notification:', notificationError);
      // Don't throw the error, just log it so the purchase status still gets updated
      console.log('⚠️ Purchase status updated but seller notification failed');
    }
    
  } catch (error: any) {
    console.error('Mark purchase completed error:', error);
    throw new Error('標記訂單完成失敗。請重試。');
  }
};

// Get purchase by ID
export const getPurchaseById = async (purchaseId: string): Promise<Purchase | null> => {
  try {
    const purchaseDoc = await getDoc(doc(db, 'purchases', purchaseId));
    if (purchaseDoc.exists()) {
      return { id: purchaseDoc.id, ...purchaseDoc.data() } as Purchase;
    }
    return null;
  } catch (error: any) {
    console.error('Get purchase by ID error:', error);
    throw new Error('獲取訂單詳情失敗。請重試。');
  }
};

// Get offers by user ID (for public profile)
export const getOffersByUserId = async (userId: string): Promise<Offer[]> => {
  try {
    const q = query(
      collection(db, 'offers'),
      where('supplierId', '==', userId),
      where('deleted', '!=', true), // Only show non-deleted offers
      where('status', '==', 'active'), // Only show active offers
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const offers: Offer[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      offers.push({
        id: doc.id,
        offerId: data.offerId || `oid${doc.id.slice(-6)}`,
        ...data
      } as Offer);
    });

    return offers;
  } catch (error: any) {
    console.error('Get offers by user ID error:', error);
    throw new Error('獲取用戶優惠失敗。請重試。');
  }
};

// Restore offer after purchase rejection
export const restoreOfferAfterRejection = async (purchaseId: string): Promise<void> => {
  try {
    console.log(`🔄 restoreOfferAfterRejection called for purchaseId: ${purchaseId}`);
    
    // Get purchase details
    const purchaseRef = doc(db, 'purchases', purchaseId);
    const purchaseDoc = await getDoc(purchaseRef);
    
    if (!purchaseDoc.exists()) {
      throw new Error('購買記錄不存在');
    }
    
    const purchaseData = purchaseDoc.data();
    const { offerId, quantity } = purchaseData;
    
    console.log(`📦 Purchase data: offerId=${offerId}, quantity=${quantity}`);
    
    // Get offer details
    const offerRef = doc(db, 'offers', offerId);
    const offerDoc = await getDoc(offerRef);
    
    if (!offerDoc.exists()) {
      throw new Error('優惠不存在');
    }
    
    const offerData = offerDoc.data() as Offer;
    console.log(`📋 Offer data before restoration:`, {
      id: offerId,
      currentQuantity: offerData.quantity,
      status: offerData.status,
      deleted: offerData.deleted,
      title: offerData.title
    });
    
    // Restore the quantity
    const restoredQuantity = offerData.quantity + quantity;
    console.log(`🔢 Quantity restoration: ${offerData.quantity} + ${quantity} = ${restoredQuantity}`);
    
    // Update offer status and quantity
    const updateData = {
      status: 'active',
      quantity: restoredQuantity,
      deleted: false, // CRITICAL: Remove deleted flag to relist the offer
      updatedAt: Timestamp.now().toDate().toISOString()
    };
    
    console.log(`📝 Updating offer with data:`, updateData);
    
    await updateDoc(offerRef, updateData);
    
    console.log(`✅ Offer ${offerId} restored successfully: status=active, quantity=${restoredQuantity}, deleted=false`);
    
    // Update watchlist quantities for all users who have this offer in their watchlist
    console.log('Calling updateOfferQuantityInWatchlists for restored offer...');
    const affectedUserIds = await updateOfferQuantityInWatchlists(offerId, restoredQuantity);
    console.log(`updateOfferQuantityInWatchlists completed for restored offer, affected ${affectedUserIds.length} users`);
    
    // Verify the update
    const updatedOfferDoc = await getDoc(offerRef);
    if (updatedOfferDoc.exists()) {
      const updatedData = updatedOfferDoc.data();
      console.log(`🔍 Verification - Offer after update:`, {
        status: updatedData.status,
        quantity: updatedData.quantity,
        deleted: updatedData.deleted
      });
    }
    
    // Add the offer back to all users' watchlists who had it before
    await addOfferBackToWatchlists(offerId);
    
    console.log('✅ restoreOfferAfterRejection completed successfully');
  } catch (error: any) {
    console.error('❌ Restore offer after rejection error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error('恢復優惠失敗。請重試。');
  }
};

// Add offer back to watchlists of users who had it before
export const addOfferBackToWatchlists = async (offerId: string): Promise<void> => {
  try {
    console.log(`addOfferBackToWatchlists called for offerId: ${offerId}`);
    
    // When an offer is restored after rejection, we don't automatically add it back to watchlists
    // Users can manually add it back to their watchlist if they want
    // This is a simpler and more user-friendly approach
    
    console.log('Offer restored - users can manually add it back to their watchlist if desired');
    
  } catch (error: any) {
    console.error('Error adding offer back to watchlists:', error);
    // Don't throw error - this is not critical for the rejection process
  }
};

// TEST FUNCTION: Direct offer restoration for debugging
export const testRestoreOffer = async (purchaseId: string): Promise<void> => {
  console.log(`🧪 TEST: Direct offer restoration for purchase: ${purchaseId}`);
  try {
    await restoreOfferAfterRejection(purchaseId);
    console.log(`🧪 TEST: Direct restoration completed successfully`);
  } catch (error: any) {
    console.error(`🧪 TEST: Direct restoration failed:`, error);
    throw error;
  }
};

// TEST FUNCTION: Direct offer update for debugging
export const testUpdateOffer = async (offerId: string): Promise<void> => {
  console.log(`🧪 TEST: Direct offer update for offer: ${offerId}`);
  try {
    const offerRef = doc(db, 'offers', offerId);
    const updateData = {
      status: 'active',
      quantity: 100,
      deleted: false,
      updatedAt: Timestamp.now().toDate().toISOString()
    };
    
    console.log(`🧪 TEST: Updating offer with data:`, updateData);
    await updateDoc(offerRef, updateData);
    console.log(`🧪 TEST: Offer update completed successfully`);
  } catch (error: any) {
    console.error(`🧪 TEST: Offer update failed:`, error);
    throw error;
  }
};

// TEST FUNCTION: Direct buyer shipping notification test
export const testBuyerShippingNotification = async (buyerId: string, offerTitle: string = 'Test Offer'): Promise<void> => {
  console.log(`🧪 TEST: Direct buyer shipping notification test for buyer: ${buyerId}`);
  try {
    const notificationData = {
      userId: buyerId,
      type: 'order_status' as const,
      title: '商品已發貨！📦',
      message: `測試賣家 已為您的訂單 "${offerTitle}" 發貨，共上傳了 1 張發貨照片。`,
      isRead: false,
      data: {
        offerId: 'test-offer-id',
        purchaseId: 'test-purchase-id',
        status: 'shipped',
        photoCount: 1,
        actionUrl: `/hk/${buyerId}/my-orders`
      },
      priority: 'high' as const
    };
    
    console.log('🧪 TEST: Creating test buyer shipping notification:', notificationData);
    
    // Save notification to Firestore
    const notificationId = await firestoreNotificationService.addNotification(notificationData);
    console.log('🧪 TEST: Test buyer shipping notification saved to Firestore with ID:', notificationId);
    
    // Create notification with ID and trigger real-time notification
    const notificationWithId = {
      ...notificationData,
      id: notificationId,
      createdAt: new Date().toISOString()
    };
    
    // Trigger real-time notification with the notification that has ID
    notificationService.trigger(notificationWithId);
    console.log('🧪 TEST: Test buyer shipping notification sent successfully');
    
  } catch (error: any) {
    console.error('🧪 TEST: Test buyer shipping notification failed:', error);
    console.error('🧪 TEST: Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

// Send notification to seller when payment is approved by admin
export const sendSellerPaymentApprovalNotification = async (purchaseId: string): Promise<void> => {
  try {
    console.log(`🔔 sendSellerPaymentApprovalNotification called for purchase: ${purchaseId}`);
    
    // Get purchase details
    const purchaseRef = doc(db, 'purchases', purchaseId);
    const purchaseDoc = await getDoc(purchaseRef);
    
    if (!purchaseDoc.exists()) {
      throw new Error('購買記錄不存在');
    }
    
    const purchaseData = purchaseDoc.data();
    const { sellerId, offerId, finalAmount, buyerId } = purchaseData;
    
    console.log(`📦 Purchase data: sellerId=${sellerId}, offerId=${offerId}, finalAmount=${finalAmount}, buyerId=${buyerId}`);
    
    // Get offer details
    const offerRef = doc(db, 'offers', offerId);
    const offerDoc = await getDoc(offerRef);
    
    if (!offerDoc.exists()) {
      throw new Error('優惠不存在');
    }
    
    const offerData = offerDoc.data();
    const offerTitle = offerData.title;
    
    // Get buyer details for notification
    const buyerRef = doc(db, 'users', buyerId);
    const buyerDoc = await getDoc(buyerRef);
    const buyerData = buyerDoc.exists() ? buyerDoc.data() : null;
    const buyerCompanyName = buyerData?.company || 'Unknown Buyer';
    
    console.log(`📋 Offer data: title=${offerTitle}, buyerCompanyName=${buyerCompanyName}`);
    
    // Create notification data
    const notificationData = {
      userId: sellerId,
      type: 'payment_approved' as const,
      title: '付款已確認！',
      message: `${buyerCompanyName} 的付款已通過管理員審核，金額為 HKD ${finalAmount.toFixed(2)}。請準備發貨 "${offerTitle}"。`,
      isRead: false,
      data: {
        offerId: offerId,
        purchaseId: purchaseId,
        amount: finalAmount,
        buyerId: buyerId,
        buyerCompanyName: buyerCompanyName,
        actionUrl: `/hk/${sellerId}/my-orders`
      },
      priority: 'high' as const
    };
    
    console.log('📨 Creating seller payment approval notification:', notificationData);
    
    // Import notification services
    const { firestoreNotificationService } = await import('./firestoreNotificationService');
    const { notificationService } = await import('./notificationService');
    
    // Save notification to Firestore
    const notificationId = await firestoreNotificationService.addNotification(notificationData);
    console.log('✅ Seller payment approval notification saved to Firestore with ID:', notificationId);
    
    // Create notification with ID and trigger real-time notification
    const notificationWithId = {
      ...notificationData,
      id: notificationId,
      createdAt: new Date().toISOString()
    };
    
    // Trigger real-time notification with the notification that has ID
    notificationService.trigger(notificationWithId);
    console.log('✅ Seller payment approval notification sent');
    
  } catch (error: any) {
    console.error('❌ sendSellerPaymentApprovalNotification error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error('發送賣家付款確認通知失敗。請重試。');
  }
}; 