export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  // role field removed - users can both buy and sell
  isVerified: boolean;
  emailVerified?: boolean; // Track email verification status
  avatar?: string;
  companyLogo?: string;
  companyCoverPhoto?: string;
  companySize?: string;
  companyDescription?: string;
  companyBio?: string;
  industry?: string;
  createdAt?: string;
  // Verification related fields
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  status?: 'active' | 'inactive' | 'pending_verification';
}

// Enhanced supplier interface for admin use
export interface EnhancedSupplier {
  company: string;
  rating: number;
  isVerified: boolean;
  logo?: string;
  // Additional seller information
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  businessType?: string;
  industry?: string;
  companySize?: string;
  brNumber?: string;
  companyBio?: string;
  joinedDate?: string;
  status?: string;
  // Contact information
  contactPersons?: any[];
  // Social media
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
  };
  // Bank details (for admin reference)
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    branchCode?: string;
    fpsId?: string;
    paymeId?: string;
  };
}

export interface Offer {
  id: string;
  offerId: string; // Custom offer ID (e.g., "oid000001")
  title: string;
  description: string;
  category: string;
  originalPrice: number;
  currentPrice: number;
  quantity: number;
  unit: string;
  location: string;
  supplier: {
    company: string;
    rating: number;
    isVerified: boolean;
    logo?: string;
  } | EnhancedSupplier; // Allow both basic and enhanced supplier data
  images: string[];
  type: 'clearance';
  minOrderQuantity: number;
  tags: string[];
  shippingEstimateDays: number;
  createdAt: string;
  supplierId: string; // Added for ownership
  deleted?: boolean; // Added for soft delete
  deletedAt?: string; // Added for soft delete timestamp
  status?: 'active' | 'pending' | 'rejected' | 'expired' | 'sold'; // Added for admin status management
  isApproved?: boolean; // Added for admin approval status
  views?: number; // Added for analytics
  favorites?: number; // Added for analytics
  uploadDate?: string; // Added for admin display
  expiryDate?: string; // Added for expiry management
}

export interface SearchFilters {
  category: string;
  location: string;
  priceRange: [number, number];
  minQuantity: number;
  sortBy: 'price' | 'ending-soon' | 'newest' | 'discount';
  verifiedOnly?: boolean;
  selectedTag?: string; // Added for tag-based filtering
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string; // Made optional since it's not collected during registration
  company: string;
  companyLogo?: string;
  companyCoverPhoto?: string;
  companyBio?: string;
  // role field removed - users can both buy and sell
  isVerified: boolean;
  emailVerified?: boolean; // Track email verification status
  isAdmin?: boolean; // Added admin field
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'pending_verification'; // Added user status
  avatar?: string;
  phone?: string;
  address?: string;
  website?: string;
  businessType?: string;
  industry?: string;
  companySize?: string;
  brNumber?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    branchCode?: string;
    fpsId?: string;
    paymeId?: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
  };
  contactPersons?: {
    id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    department?: string;
    photo?: string;
  }[];
  deliveryAddresses?: {
    id: string;
    district: string;
    subdivision: string;
    address1: string;
    address2?: string;
    contactPersonName: string;
    contactPersonPhone: string;
    isDefault?: boolean;
    createdAt: string;
  }[];
  joinedDate: string;
  watchlist?: string[];
  purchaseHistory?: string[]; // Store purchase IDs instead of full Purchase objects
  // Verification related fields
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  verificationDocuments?: {
    businessRegistration?: string; // File URL
    companyRegistration?: string; // File URL
    businessLicense?: string; // File URL
    taxCertificate?: string; // File URL
    bankStatement?: string; // File URL
    otherDocuments?: string[]; // Array of file URLs
  };
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
  verificationReviewedBy?: string; // Admin ID who reviewed
  verificationNotes?: string; // Admin notes for approval/rejection
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  // name field removed - not needed during registration
  email: string;
  password: string;
  confirmPassword: string;
  company: string;
  phone: string;
  location: string;
}

export interface Purchase {
  id: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  platformFee: number;
  finalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'delivered' | 'completed';
  purchaseDate: string;
  paymentMethod: string;
  // Payment approval status for admin management
  paymentApprovalStatus?: 'pending' | 'approved' | 'rejected';
  // Shipping approval status for admin management
  shippingApprovalStatus?: 'pending' | 'approved' | 'rejected';
  paymentDetails?: {
    method: 'bank-transfer';
    receiptFile?: string;
    receiptPreview?: string;
    transactionId?: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    timestamp: string;
    storagePath?: string;
    adminNotes?: string;
    approvedBy?: string;
    approvedAt?: string;
  };
  deliveryDetails?: {
    district: string;
    subdivision: string;
    address1: string;
    address2?: string;
    contactPersonName: string;
    contactPersonPhone: string;
    remarks?: string; // Remarks for the seller
    confirmedAt?: string;
    confirmedBy?: string;
    isFromSavedAddress?: boolean; // Whether this was selected from saved addresses
    savedAddressId?: string; // ID of the saved address if applicable
  };
  shippingDetails?: {
    shippedAt?: string;
    shippingPhoto?: string; // Keep for backward compatibility
    shippingPhotos?: string[]; // Array of photo URLs for multiple photos
    photoCount?: number; // Number of photos uploaded
    trackingNumber?: string;
    shippingNotes?: string;
    deliveredAt?: string;
    deliveryConfirmedBy?: string;
    deliveryConfirmedAt?: string;
    adminNotes?: string;
    approvedBy?: string;
    approvedAt?: string;
  };
  // Timestamps for each status change
  statusHistory?: {
    status: string;
    timestamp: string;
    updatedBy: string;
    notes?: string;
  }[];
  // Rating information
  hasRating?: boolean;
  ratingId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'purchase' | 'sale' | 'payment' | 'offer' | 'system' | 'watchlist' | 'order_status' | 'price_drop' | 'offer_purchased' | 'account_status' | 'verification_status' | 'offer_sales_status' | 'payment_approved' | 'report' | 'message';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    offerId?: string;
    purchaseId?: string;
    amount?: number;
    actionUrl?: string;
    status?: string;
    previousPrice?: number;
    newPrice?: number;
    percentage?: number;
    reportId?: string;
    offerTitle?: string;
    sellerId?: string;
    sellerName?: string;
    reporterId?: string;
    reason?: string;
    customReason?: string;
    conversationId?: string;
    messageId?: string;
    senderId?: string;
    senderName?: string;
    senderCompany?: string;
  };
  priority: 'low' | 'medium' | 'high';
}

export interface Review {
  id: string;
  purchaseId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerCompany: string;
  targetId: string; // offer ID, supplier ID, or buyer ID
  targetType: 'offer' | 'supplier' | 'buyer';
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
}

export interface SellerRating {
  sellerId: string;
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  lastUpdated: string;
}

export interface BuyerRating {
  buyerId: string;
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  lastUpdated: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  offerId: string;
  addedAt: string;
}

export interface Transaction {
  id: string;
  offerId: string;
  offerTitle: string;
  buyerId: string;
  buyer: {
    name: string;
    company: string;
    avatar?: string;
    email: string;
    phone: string;
  };
  sellerId: string;
  seller: {
    name: string;
    company: string;
    avatar?: string;
    email: string;
    phone: string;
  };
  amount: number;
  quantity: number;
  unitPrice: number;
  paymentMethod: 'fps' | 'payme' | 'bank_transfer' | 'stripe';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  transactionDate: string;
  paymentDate?: string;
  receiptUrl?: string;
  receiptPreview?: string;
  platformFee: number;
  totalAmount: number;
  location: string;
  notes?: string;
  adminNotes?: string;
  sellerNotified?: boolean;
  logisticsArranged?: boolean;
  createdAt: string;
  updatedAt?: string;
}