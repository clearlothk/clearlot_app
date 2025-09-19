import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Shield,
  Mail,
  Phone,
  ArrowUpDown,
  Plus,
  BarChart3,
  Package,
  ShoppingCart,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  FileText,
  Download,
  Building,
  CreditCard,
  Globe,
  MapPin,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { updateUserVerification } from '../services/firebaseService';
import { db, auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { convertToHKTime, formatHKDate } from '../utils/dateUtils';
import { getSellerRating } from '../services/ratingService';
import VerificationReasonModal from './VerificationReasonModal';

interface User {
  id: string;
  email: string;
  company: string;
  companyLogo?: string;
  isVerified: boolean;
  isAdmin?: boolean;
  joinedDate: string;
  watchlist?: string[];
  purchaseHistory?: string[];
  totalOffers: number;
  totalPurchases: number;
  status: 'active' | 'inactive';
  // Rating information
  rating?: number;
  reviewCount?: number;
  // Company information fields
  industry?: string;
  companySize?: string;
  brNumber?: string;
  location?: string;
  phone?: string;
  website?: string;
  businessType?: string;
  address?: string;
  // Social media links
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
  };
  // Contact persons
  contactPersons?: {
    id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    department?: string;
    photo?: string;
  }[];
  // Bank details
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    branchCode?: string;
    fpsId?: string;
    paymeId?: string;
  };
  // Delivery addresses
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
  // Verification related fields
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  verificationDocuments?: {
    businessRegistration?: string;
    companyRegistration?: string;
    businessLicense?: string;
    taxCertificate?: string;
    bankStatement?: string;
    otherDocuments?: string[];
  };
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
  verificationReviewedBy?: string;
  verificationNotes?: string;
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('joinedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDocumentPreviewModal, setShowDocumentPreviewModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ type: string; url: string; name: string } | null>(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      // Fetch offers for each user to count their offers
      const offersSnapshot = await getDocs(collection(db, 'offers'));
      const offersByUser: { [key: string]: number } = {};
      
      offersSnapshot.docs.forEach(doc => {
        const offer = doc.data();
        if (!offer.deleted && offer.supplierId) {
          offersByUser[offer.supplierId] = (offersByUser[offer.supplierId] || 0) + 1;
        }
      });

      // Fetch purchases for each user to count their purchases
      const purchasesSnapshot = await getDocs(collection(db, 'purchases'));
      const purchasesByUser: { [key: string]: number } = {};
      
      purchasesSnapshot.docs.forEach(doc => {
        const purchase = doc.data();
        if (purchase.buyerId) {
          purchasesByUser[purchase.buyerId] = (purchasesByUser[purchase.buyerId] || 0) + 1;
        }
      });

      // Process users data
      const usersData: User[] = await Promise.all(usersSnapshot.docs.map(async doc => {
         const userData = doc.data();
         
         // Fetch real rating data for this user
         let rating: number | undefined = undefined;
         let reviewCount: number = 0;
         
         try {
           const sellerRating = await getSellerRating(doc.id);
           if (sellerRating) {
             rating = sellerRating.averageRating;
             reviewCount = sellerRating.totalRatings;
           }
         } catch (error) {
           console.log(`No rating data for user ${doc.id}:`, error);
         }
         
         return {
           id: doc.id,
           email: userData.email || 'No email',
           company: userData.company || 'No company',
           companyLogo: userData.companyLogo || null,
           isVerified: userData.isVerified || false,
           isAdmin: userData.isAdmin || false,
           joinedDate: userData.joinedDate || new Date().toISOString(),
           watchlist: userData.watchlist || [],
           purchaseHistory: userData.purchaseHistory || [],
           totalOffers: offersByUser[doc.id] || 0,
           totalPurchases: purchasesByUser[doc.id] || 0,
           status: userData.status || 'active', // Default to active for all users
           // Company information fields
           industry: userData.industry || null,
           companySize: userData.companySize || null,
           brNumber: userData.brNumber || null,
           location: userData.location || null,
           phone: userData.phone || null,
           website: userData.website || null,
           businessType: userData.businessType || null,
           address: userData.address || null,
           // Social media links
           socialMedia: userData.socialMedia || null,
           // Contact persons
           contactPersons: userData.contactPersons || null,
           // Bank details
           bankDetails: userData.bankDetails || null,
           // Delivery addresses
           deliveryAddresses: userData.deliveryAddresses || null,
           // Verification fields
           verificationStatus: userData.verificationStatus || 'not_submitted',
           verificationDocuments: userData.verificationDocuments || {},
           verificationSubmittedAt: userData.verificationSubmittedAt || null,
           verificationReviewedAt: userData.verificationReviewedAt || null,
           verificationReviewedBy: userData.verificationReviewedBy || null,
           verificationNotes: userData.verificationNotes || null,
           // Real rating data from reviews collection
           rating: rating,
           reviewCount: reviewCount
         };
       }));

      setUsers(usersData);
      console.log('👥 Fetched users:', usersData.length);

    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Failed to load users data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    const adminData = localStorage.getItem('adminUser');
    
    if (!isAuthenticated || !adminData) {
      navigate('/hk/admin/login');
      return;
    }

    setAdminUser(JSON.parse(adminData));

    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, fetch users data
        fetchUsers();
      } else {
        // User is signed out, redirect to login
        navigate('/hk/admin/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesVerification = verificationFilter === 'all' || user.verificationStatus === verificationFilter;
    
    return matchesSearch && matchesStatus && matchesVerification;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'email':
        aValue = a.email;
        bValue = b.email;
        break;
      case 'joinedDate':
        aValue = new Date(a.joinedDate);
        bValue = new Date(b.joinedDate);
        break;
      case 'totalOffers':
        aValue = a.totalOffers;
        bValue = b.totalOffers;
        break;
      case 'totalPurchases':
        aValue = a.totalPurchases;
        bValue = b.totalPurchases;
        break;
      default:
        aValue = a.email;
        bValue = b.email;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
      case 'inactive':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const getVerificationBadge = (verificationStatus: string) => {
    switch (verificationStatus) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending Review
        </span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </span>;
      case 'not_submitted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Shield className="h-3 w-3 mr-1" />
          Not Submitted
        </span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  // getRoleBadge function removed - all users can both buy and sell

  const formatDate = (dateString: string) => {
    try {
      const hkDate = convertToHKTime(dateString);
      return formatHKDate(hkDate);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };


  // Action handlers
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle document preview
  const handlePreviewDocument = (type: string, url: string) => {
    const documentNames: { [key: string]: string } = {
      businessRegistration: 'Business Registration',
      companyRegistration: 'Company Registration',
      businessLicense: 'Business License',
      taxCertificate: 'Tax Certificate',
      bankStatement: 'Bank Statement'
    };
    
    console.log('Preview document:', { type, url, name: documentNames[type] || type });
    console.log('URL type check:', {
      isImage: url.match(/\.(jpg|jpeg|png|gif|webp)$/i),
      isPdf: url.match(/\.(pdf)$/i),
      urlLength: url.length,
      urlStart: url.substring(0, 50)
    });
    
    setPreviewDocument({
      type,
      url,
      name: documentNames[type] || type
    });
    setShowDocumentPreviewModal(true);
  };

  // Handle verification action (approve/reject)
  const handleVerificationAction = async (action: 'approve' | 'reject') => {
    if (!selectedUser) return;
    
    // For reject/revoke actions, show reason selection modal
    if (action === 'reject') {
      setPendingAction(action);
      setShowReasonModal(true);
      return;
    }
    
    // For approve actions, proceed directly
    await executeVerificationAction(action, 'Verification approved by admin');
  };

  // Execute the actual verification action with reason
  const executeVerificationAction = async (action: 'approve' | 'reject', reason: string) => {
    if (!selectedUser) return;
    
    setIsUpdating(true);
    try {
      // Get current Firebase Auth user ID
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      const newStatus: 'approved' | 'rejected' = action === 'approve' ? 'approved' : 'rejected';
      
      await updateUserVerification(selectedUser.id, action === 'approve', currentUser.uid, reason);
      
      // Update local state with the new verification status
      const updateData = {
        verificationStatus: newStatus,
        verificationReviewedAt: new Date().toISOString(),
        verificationReviewedBy: currentUser.uid, // Use Firebase Auth user ID
        verificationNotes: reason,
        isVerified: action === 'approve'
      };
      
      setUsers((prevUsers: User[]) => 
        prevUsers.map((user: User) => 
          user.id === selectedUser.id 
            ? { ...user, ...updateData }
            : user
        )
      );
      
      // Update selectedUser state to reflect changes immediately
      setSelectedUser(prev => prev ? { ...prev, ...updateData } : null);
      
      // Notification is now handled by updateUserVerification function
      console.log('🔔 AdminUsersPage: Verification update completed');
      console.log('👤 User ID:', selectedUser.id);
      console.log('📊 Status:', newStatus);
      console.log('📧 User email:', selectedUser.email);
      console.log('🏢 User company:', selectedUser.company);
      console.log('📝 Reason:', reason);

      setUpdateSuccess(`User verification ${action}d successfully!`);
      
      // Don't close modal or refresh - stay in current window
      // setShowUserModal(false);
      // fetchUsers();
      
    } catch (error) {
      console.error(`Error ${action}ing verification:`, error);
      setError(`Failed to ${action} verification`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle reason modal confirmation
  const handleReasonConfirm = async (reason: string, customReason?: string) => {
    if (!pendingAction || !selectedUser) return;
    
    const finalReason = customReason || reason;
    await executeVerificationAction(pendingAction, finalReason);
    
    // Close reason modal and reset state
    setShowReasonModal(false);
    setPendingAction(null);
  };

  // Handle reason modal close
  const handleReasonClose = () => {
    setShowReasonModal(false);
    setPendingAction(null);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      setIsUpdating(true);
      console.log(`🔄 Updating user ${userId} status to: ${newStatus}`);
      
      // Get current Firebase Auth user ID
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      console.log(`🔑 Current Firebase Auth user ID: ${currentUser.uid}`);
      
      // Test: Check if we can read the current user's document
      try {
        const currentUserRef = doc(db, 'users', currentUser.uid);
        const currentUserDoc = await getDoc(currentUserRef);
        if (currentUserDoc.exists()) {
          const currentUserData = currentUserDoc.data();
          console.log(`👤 Current user data:`, currentUserData);
          console.log(`🔐 Current user isAdmin:`, currentUserData.isAdmin);
        } else {
          console.log(`❌ Current user document does not exist in Firestore`);
        }
      } catch (readError) {
        console.log(`❌ Error reading current user document:`, readError);
      }
      
      const userRef = doc(db, 'users', userId);
      const updateData = {
        status: newStatus,
        // Only update isVerified if status is being set to active
        ...(newStatus === 'active' && { isVerified: true }),
        // Add status change tracking
        statusUpdatedAt: new Date().toISOString(),
        statusUpdatedBy: currentUser.uid // Use Firebase Auth user ID
      };
      
      console.log('📝 Update data:', updateData);
      
      await updateDoc(userRef, updateData);
      console.log('✅ User status updated successfully');
      
      // Update the user status locally without refreshing the page
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                status: newStatus,
                isVerified: newStatus === 'active' ? true : user.isVerified
              }
            : user
        )
      );
      
      // Update the selected user state as well
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, status: newStatus, isVerified: newStatus === 'active' ? true : prev.isVerified } : null);
      }
      
      // Close modal and clear selection
      setShowEditModal(false);
      setSelectedUser(null);
      
      // Send notification to user about account status change
      console.log(`🔔 Sending account status notification to user: ${userId}`);
      try {
        // Get user details for notification
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const companyName = userData?.company || 'Unknown Company';
          
          const notificationData = {
            userId: userId,
            type: 'account_status' as const,
            title: newStatus === 'active' ? '歡迎來到 ClearLot！🎉' : '帳戶已被停用 ⚠️',
            message: newStatus === 'active' 
              ? `歡迎來到 ClearLot！現在您可以自由使用我們的平台！享受並希望您能銷售更多清倉優惠。`
              : `很抱歉，您的帳戶因不符合我們的要求而被停用，現在您的帳戶訪問已受到限制。如有任何問題，請聯繫我們。`,
            isRead: false,
            data: {
              accountStatus: newStatus,
              companyName: companyName,
              actionUrl: `/hk/${userId}/profile`
            },
            priority: 'high' as const
          };
          
          console.log('📨 Creating account status notification:', notificationData);
          
          // Import notification services
          const { firestoreNotificationService } = await import('../services/firestoreNotificationService');
          const { notificationService } = await import('../services/notificationService');
          
          // Save notification to Firestore
          const notificationId = await firestoreNotificationService.addNotification(notificationData);
          console.log('✅ Account status notification saved to Firestore with ID:', notificationId);
          
          // Create notification with ID and trigger real-time notification
          const notificationWithId = {
            ...notificationData,
            id: notificationId,
            createdAt: new Date().toISOString()
          };
          
          // Trigger real-time notification without re-saving
          notificationService.trigger(notificationWithId);
          console.log('✅ Account status notification sent');
        }
        
        console.log(`✅ Account status notification sent for user: ${userId}`);
      } catch (notificationError: any) {
        console.error('❌ Error sending account status notification:', notificationError);
        // Don't throw the error, just log it so the user status still gets updated
        console.log('⚠️ User status updated but notification failed');
      }

      // Show success notification
      setUpdateSuccess(`User status updated to ${newStatus} successfully!`);
      setTimeout(() => setUpdateSuccess(null), 3000); // Auto-hide after 3 seconds
    } catch (error: any) {
      console.error('❌ Error updating user status:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to update user status';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check if you have admin access.';
      } else if (error.code === 'not-found') {
        errorMessage = 'User not found.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };


  const handleDeleteUserConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      setIsUpdating(true);
      const userRef = doc(db, 'users', selectedUser.id);
      await deleteDoc(userRef);
      
      // Remove the user locally without refreshing the page
      setUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUser.id));
      
      setShowDeleteModal(false);
      setSelectedUser(null);
      
      // Show success notification
      setUpdateSuccess('User deleted successfully!');
      setTimeout(() => setUpdateSuccess(null), 3000); // Auto-hide after 3 seconds
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <XCircle className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-blue-100">ClearLot</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {/* Main Navigation */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Main
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    navigate('/hk/admin/dashboard');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <BarChart3 className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Dashboard</span>
                </button>
              </div>
            </div>

            {/* Management */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Management
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    navigate('/hk/admin/users');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <Users className="h-5 w-5" />
                  <span>Users</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/hk/admin/offers');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <Package className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Offers</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/hk/admin/transactions');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <ShoppingCart className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Transactions</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/hk/admin/messages');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <MessageCircle className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Messages</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/hk/admin/invoices');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <FileText className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Invoice Management</span>
                </button>
              </div>
            </div>

            {/* System */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                System
              </h3>
              <div className="space-y-1">
                <button
                  disabled
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed rounded-lg opacity-50"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </nav>

          {/* User Profile & Logout */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{adminUser.username}</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('adminAuthenticated');
                localStorage.removeItem('adminUser');
                navigate('/');
                setSidebarOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group border border-gray-200"
            >
              <LogOut className="h-5 w-5 group-hover:text-red-600" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <button
                onClick={() => navigate('/hk/admin/dashboard')}
                className="hidden lg:block p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Users className="h-5 w-5" />
              </button>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Users Management</h2>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 md:p-6">
          {/* Success Notification */}
          {updateSuccess && (
            <div className="mb-4 md:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 mr-2" />
                <span className="text-green-800 font-medium text-sm md:text-base">{updateSuccess}</span>
              </div>
            </div>
          )}
          
          {/* Filters */}
          <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="px-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Verification</option>
                <option value="not_submitted">Not Submitted</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              
              {/* Role filter removed - all users can both buy and sell */}
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{sortedUsers.length} users</span>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th 
                      className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('joinDate')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Join Date</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification
                    </th>
                    {/* Role column header removed - all users can both buy and sell */}
                    <th 
                      className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('totalOffers')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Offers</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('totalPurchases')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Purchases</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                                             <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                             {user.companyLogo ? (
                               <img
                                 src={user.companyLogo}
                                 alt={user.company}
                                 className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover border border-gray-200"
                               />
                             ) : (
                               <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                 <span className="text-xs md:text-sm font-medium text-blue-600">
                                   {user.email.charAt(0).toUpperCase()}
                                 </span>
                               </div>
                             )}
                           </div>
                           <div className="ml-2 md:ml-4">
                             <div className="text-xs md:text-sm font-medium text-gray-900">{user.email}</div>
                             <div className="text-xs md:text-sm text-gray-500 flex items-center">
                               {user.company}
                               {user.rating && user.reviewCount && (
                                 <div className="ml-2 flex items-center">
                                   <Star className="h-3 w-3 text-green-500 mr-1" />
                                   <span className="text-green-500 text-xs font-medium">
                                     {user.rating.toFixed(1)}
                                   </span>
                                   <span className="text-gray-400 text-xs ml-1">
                                     ({user.reviewCount} reviews)
                                   </span>
                                 </div>
                               )}
                             </div>
                             <div className="flex items-center mt-1">
                               {user.isVerified && (
                                 <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                               )}
                               {user.isAdmin && (
                                 <Shield className="h-3 w-3 text-blue-500 mr-1" />
                               )}
                               <span className="text-xs text-gray-500">
                                 {user.isAdmin ? 'Admin' : 'User'}
                               </span>
                             </div>
                           </div>
                         </div>
                       </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                        {formatDate(user.joinedDate)}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getVerificationBadge(user.verificationStatus || 'not_submitted')}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                        {user.totalOffers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.totalPurchases} purchases
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <div className="flex items-center space-x-2">
                           <button 
                             onClick={() => handleViewUser(user)}
                             className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                             title="View user details"
                           >
                             <Eye className="h-4 w-4" />
                           </button>
                           <button 
                             onClick={() => handleEditUser(user)}
                             className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                             title="Edit user"
                           >
                             <Edit className="h-4 w-4" />
                           </button>
                                                       <button 
                              onClick={() => handleDeleteUser(user)}
                              className={`p-1 rounded ${
                                user.isAdmin 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                              }`}
                              title={user.isAdmin ? "Cannot delete admin user" : "Delete user"}
                              disabled={user.isAdmin === true}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{sortedUsers.length}</span> of{' '}
              <span className="font-medium">{users.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg">
                1
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Next
              </button>
            </div>
                     </div>
         </div>
       </div>

       {/* User Details Modal */}
       {showUserModal && selectedUser && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
               <button
                 onClick={() => setShowUserModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="h-6 w-6" />
               </button>
             </div>
             
             <div className="space-y-4">
               <div className="flex items-center space-x-4">
                 {selectedUser.companyLogo ? (
                   <img
                     src={selectedUser.companyLogo}
                     alt={selectedUser.company}
                     className="h-16 w-16 rounded-full object-cover border border-gray-200"
                   />
                 ) : (
                   <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                     <span className="text-xl font-medium text-blue-600">
                       {selectedUser.email.charAt(0).toUpperCase()}
                     </span>
                   </div>
                 )}
                 <div>
                   <h4 className="text-lg font-medium text-gray-900">{selectedUser.email}</h4>
                   <p className="text-gray-500">{selectedUser.company}</p>
                   <div className="flex items-center mt-1">
                     {selectedUser.isVerified && (
                       <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                     )}
                     {selectedUser.isAdmin && (
                       <Shield className="h-4 w-4 text-blue-500 mr-1" />
                     )}
                     <span className="text-sm text-gray-500">
                       {selectedUser.isAdmin ? 'Admin' : 'User'}
                     </span>
                   </div>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium text-gray-500">Join Date</label>
                   <p className="text-sm text-gray-900">{formatDate(selectedUser.joinedDate)}</p>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Status</label>
                   <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Verification Status</label>
                   <div className="mt-1">{getVerificationBadge(selectedUser.verificationStatus || 'not_submitted')}</div>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Total Offers</label>
                   <p className="text-sm text-gray-900">{selectedUser.totalOffers}</p>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Total Purchases</label>
                   <p className="text-sm text-gray-900">{selectedUser.totalPurchases}</p>
                 </div>
               </div>

               {/* Company Information Section */}
               <div className="border-t border-gray-200 pt-4">
                 <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                   <Building className="h-4 w-4 mr-2 text-blue-600" />
                   Company Information
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="text-sm font-medium text-gray-500">Company Name</label>
                     <p className="text-sm text-gray-900">{selectedUser.company}</p>
                   </div>
                   {selectedUser.industry && (
                     <div>
                       <label className="text-sm font-medium text-gray-500">Industry</label>
                       <p className="text-sm text-gray-900">{selectedUser.industry}</p>
                     </div>
                   )}
                   {selectedUser.website && (
                     <div>
                       <label className="text-sm font-medium text-gray-500">Website</label>
                       <p className="text-sm text-gray-900">
                         <a href={selectedUser.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                           {selectedUser.website}
                         </a>
                       </p>
                     </div>
                   )}
                   {selectedUser.phone && (
                     <div>
                       <label className="text-sm font-medium text-gray-500">Phone</label>
                       <p className="text-sm text-gray-900">{selectedUser.phone}</p>
                     </div>
                   )}
                   {selectedUser.businessType && (
                     <div>
                       <label className="text-sm font-medium text-gray-500">Business Type</label>
                       <p className="text-sm text-gray-900">{selectedUser.businessType}</p>
                     </div>
                   )}
                   {selectedUser.companySize && (
                     <div>
                       <label className="text-sm font-medium text-gray-500">Company Size</label>
                       <p className="text-sm text-gray-900">{selectedUser.companySize}</p>
                     </div>
                   )}
                   {selectedUser.address && (
                     <div>
                       <label className="text-sm font-medium text-gray-500">Address</label>
                       <p className="text-sm text-gray-900">{selectedUser.address}</p>
                     </div>
                   )}
                   {selectedUser.brNumber && (
                     <div>
                       <label className="text-sm font-medium text-gray-500">Business Registration No.</label>
                       <p className="text-sm text-gray-900">{selectedUser.brNumber}</p>
                     </div>
                   )}
                 </div>
               </div>

               {/* Social Media Links Section */}
               {selectedUser.socialMedia && (
                 <div className="border-t border-gray-200 pt-4">
                   <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                     <Globe className="h-4 w-4 mr-2 text-indigo-600" />
                     Social Media Links
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {selectedUser.socialMedia.facebook && (
                       <div className="flex items-center space-x-2">
                         <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                           <span className="text-white text-xs font-bold">f</span>
                         </div>
                         <div>
                           <label className="text-sm font-medium text-gray-500">Facebook</label>
                           <p className="text-sm text-gray-900">
                             <a href={selectedUser.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                               {selectedUser.socialMedia.facebook}
                             </a>
                           </p>
                         </div>
                       </div>
                     )}
                     {selectedUser.socialMedia.instagram && (
                       <div className="flex items-center space-x-2">
                         <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                           <span className="text-white text-xs">📷</span>
                         </div>
                         <div>
                           <label className="text-sm font-medium text-gray-500">Instagram</label>
                           <p className="text-sm text-gray-900">
                             <a href={selectedUser.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                               {selectedUser.socialMedia.instagram}
                             </a>
                           </p>
                         </div>
                       </div>
                     )}
                     {selectedUser.socialMedia.linkedin && (
                       <div className="flex items-center space-x-2">
                         <div className="w-6 h-6 bg-blue-700 rounded flex items-center justify-center">
                           <span className="text-white text-xs font-bold">in</span>
                         </div>
                         <div>
                           <label className="text-sm font-medium text-gray-500">LinkedIn</label>
                           <p className="text-sm text-gray-900">
                             <a href={selectedUser.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                               {selectedUser.socialMedia.linkedin}
                             </a>
                           </p>
                         </div>
                       </div>
                     )}
                     {selectedUser.socialMedia.tiktok && (
                       <div className="flex items-center space-x-2">
                         <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                           <span className="text-white text-xs font-bold">T</span>
                         </div>
                         <div>
                           <label className="text-sm font-medium text-gray-500">TikTok</label>
                           <p className="text-sm text-gray-900">
                             <a href={selectedUser.socialMedia.tiktok} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                               {selectedUser.socialMedia.tiktok}
                             </a>
                           </p>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Contact Persons Section */}
               {selectedUser.contactPersons && selectedUser.contactPersons.length > 0 && (
                 <div className="border-t border-gray-200 pt-4">
                   <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                     <Users className="h-4 w-4 mr-2 text-green-600" />
                     Contact Persons
                   </h4>
                   <div className="space-y-3">
                     {selectedUser.contactPersons.map((person) => (
                       <div key={person.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                         <div className="flex items-center space-x-3 mb-2">
                           {person.photo ? (
                             <img
                               src={person.photo}
                               alt={person.name}
                               className="h-10 w-10 rounded-full object-cover border border-gray-200"
                               onError={(e) => {
                                 const target = e.target as HTMLImageElement;
                                 target.style.display = 'none';
                                 const nextElement = target.nextElementSibling as HTMLElement;
                                 if (nextElement) {
                                   nextElement.style.display = 'flex';
                                 }
                               }}
                             />
                           ) : (
                             <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                               <span className="text-sm font-medium text-blue-600">
                                 {person.name.charAt(0).toUpperCase()}
                               </span>
                             </div>
                           )}
                           <div className="flex-1">
                             <div className="flex items-center space-x-2">
                               <span className="text-sm font-medium text-gray-900">{person.name}</span>
                               {person.department && (
                                 <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                   {person.department}
                                 </span>
                               )}
                             </div>
                             <p className="text-sm text-gray-600">{person.title}</p>
                           </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <div className="flex items-center space-x-2">
                             <Mail className="h-3 w-3 text-gray-400" />
                             <span className="text-sm text-gray-700">{person.email}</span>
                           </div>
                           <div className="flex items-center space-x-2">
                             <Phone className="h-3 w-3 text-gray-400" />
                             <span className="text-sm text-gray-700">{person.phone}</span>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Bank Details Section */}
               {selectedUser.bankDetails && (
                 <div className="border-t border-gray-200 pt-4">
                   <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                     <CreditCard className="h-4 w-4 mr-2 text-purple-600" />
                     Bank Details
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {selectedUser.bankDetails.bankName && (
                       <div>
                         <label className="text-sm font-medium text-gray-500">Bank Name</label>
                         <p className="text-sm text-gray-900">{selectedUser.bankDetails.bankName}</p>
                       </div>
                     )}
                     {selectedUser.bankDetails.accountNumber && (
                       <div>
                         <label className="text-sm font-medium text-gray-500">Account Number</label>
                         <p className="text-sm text-gray-900 font-mono">{selectedUser.bankDetails.accountNumber}</p>
                       </div>
                     )}
                     {selectedUser.bankDetails.accountHolderName && (
                       <div>
                         <label className="text-sm font-medium text-gray-500">Account Holder Name</label>
                         <p className="text-sm text-gray-900">{selectedUser.bankDetails.accountHolderName}</p>
                       </div>
                     )}
                     {selectedUser.bankDetails.branchCode && (
                       <div>
                         <label className="text-sm font-medium text-gray-500">Branch Code</label>
                         <p className="text-sm text-gray-900">{selectedUser.bankDetails.branchCode}</p>
                       </div>
                     )}
                     {selectedUser.bankDetails.fpsId && (
                       <div>
                         <label className="text-sm font-medium text-gray-500">FPS ID</label>
                         <p className="text-sm text-gray-900">{selectedUser.bankDetails.fpsId}</p>
                       </div>
                     )}
                     {selectedUser.bankDetails.paymeId && (
                       <div>
                         <label className="text-sm font-medium text-gray-500">PayMe ID</label>
                         <p className="text-sm text-gray-900">{selectedUser.bankDetails.paymeId}</p>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Delivery Addresses Section */}
               {selectedUser.deliveryAddresses && selectedUser.deliveryAddresses.length > 0 && (
                 <div className="border-t border-gray-200 pt-4">
                   <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                     <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                     Delivery Addresses
                   </h4>
                   <div className="space-y-3">
                     {selectedUser.deliveryAddresses.map((address) => (
                       <div key={address.id} className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                         <div className="flex items-start justify-between mb-2">
                           <div className="flex items-center space-x-2">
                             <MapPin className="h-4 w-4 text-orange-600 flex-shrink-0" />
                             <div>
                               <div className="flex items-center space-x-2">
                                 <span className="text-sm font-medium text-gray-900">
                                   {address.district} - {address.subdivision}
                                 </span>
                                 {address.isDefault && (
                                   <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                     Default
                                   </span>
                                 )}
                               </div>
                               <p className="text-sm text-gray-600">{address.address1}</p>
                               {address.address2 && (
                                 <p className="text-sm text-gray-600">{address.address2}</p>
                               )}
                             </div>
                           </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <div className="flex items-center space-x-2">
                             <Users className="h-3 w-3 text-gray-400" />
                             <span className="text-sm text-gray-700">{address.contactPersonName}</span>
                           </div>
                           <div className="flex items-center space-x-2">
                             <Phone className="h-3 w-3 text-gray-400" />
                             <span className="text-sm text-gray-700">{address.contactPersonPhone}</span>
                           </div>
                         </div>
                         <div className="mt-2 pt-2 border-t border-orange-200">
                           <span className="text-xs text-orange-600">
                             Created: {formatDate(address.createdAt)}
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Verification Documents Section */}
               {selectedUser.verificationDocuments && Object.keys(selectedUser.verificationDocuments).length > 0 && (
                 <div className="border-t border-gray-200 pt-4">
                   <h4 className="text-sm font-medium text-gray-900 mb-3">Verification Documents</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {selectedUser.verificationDocuments?.businessRegistration && (
                       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center space-x-2">
                             <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                               <FileText className="h-4 w-4 text-blue-600" />
                             </div>
                             <span className="text-sm font-medium text-gray-900">BR</span>
                           </div>
                           <button
                             onClick={() => handlePreviewDocument('businessRegistration', selectedUser.verificationDocuments!.businessRegistration!)}
                             className="text-blue-600 hover:text-blue-800 text-sm flex items-center bg-white px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200"
                           >
                             <Eye className="h-3 w-3 mr-1" />
                             Preview
                           </button>
                         </div>
                         <div className="text-xs text-gray-500 mb-2">Business Registration</div>
                         {/* File Thumbnail */}
                         <div className="w-full h-32 bg-white rounded border border-blue-100 overflow-hidden">
                           {selectedUser.verificationDocuments.businessRegistration.match(/\.(pdf)$/i) ? (
                             // PDF Document Display
                             <div className="w-full h-full border border-gray-200 rounded overflow-hidden bg-white">
                               <div className="h-full flex flex-col">
                                 <div className="bg-red-50 px-2 py-1 border-b border-red-200 flex items-center justify-between">
                                   <div className="flex items-center space-x-1">
                                     <FileText className="h-3 w-3 text-red-500" />
                                     <span className="text-xs font-medium text-red-700">PDF</span>
                                   </div>
                                   <button
                                     onClick={() => {
                                       console.log('Opening BR PDF in new window:', selectedUser.verificationDocuments!.businessRegistration!);
                                       const newWindow = window.open(selectedUser.verificationDocuments!.businessRegistration!, '_blank', 'noopener,noreferrer');
                                       if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                         const link = document.createElement('a');
                                         link.href = selectedUser.verificationDocuments!.businessRegistration!;
                                         link.target = '_blank';
                                         link.rel = 'noopener noreferrer';
                                         document.body.appendChild(link);
                                         link.click();
                                         document.body.removeChild(link);
                                       }
                                     }}
                                     className="text-xs text-red-600 hover:text-red-800 flex items-center px-1 py-0.5 rounded border border-red-200 hover:bg-red-100 transition-colors duration-200"
                                     title="在新視窗中打開PDF"
                                   >
                                     <Eye className="h-2 w-2 mr-1" />
                                     預覽
                                   </button>
                                 </div>
                                 <div className="flex-1 relative bg-gray-100">
                                   <iframe
                                     src={`${selectedUser.verificationDocuments.businessRegistration}#toolbar=0&navpanes=0&scrollbar=1&zoom=fit&view=FitH`}
                                     className="w-full h-full border-0"
                                     title="Business Registration PDF"
                                     onError={(e) => {
                                       const target = e.target as HTMLIFrameElement;
                                       target.style.display = 'none';
                                       const fallback = target.nextElementSibling as HTMLElement;
                                       if (fallback) {
                                         fallback.style.display = 'flex';
                                       }
                                     }}
                                   />
                                   <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center text-center p-2" style={{ display: 'none' }}>
                                     <FileText className="h-6 w-6 text-gray-400 mb-1" />
                                     <p className="text-xs font-medium text-gray-900 mb-1">PDF 無法預覽</p>
                                     <button
                                       onClick={() => {
                                         const newWindow = window.open(selectedUser.verificationDocuments!.businessRegistration!, '_blank', 'noopener,noreferrer');
                                         if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                           const link = document.createElement('a');
                                           link.href = selectedUser.verificationDocuments!.businessRegistration!;
                                           link.target = '_blank';
                                           link.rel = 'noopener noreferrer';
                                           document.body.appendChild(link);
                                           link.click();
                                           document.body.removeChild(link);
                                         }
                                       }}
                                       className="text-xs text-red-600 hover:text-red-800 flex items-center px-2 py-1 rounded border border-red-200 hover:bg-red-100 transition-colors duration-200"
                                     >
                                       <Eye className="h-2 w-2 mr-1" />
                                       在新標籤頁打開
                                     </button>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           ) : (
                             // Image Document Display
                             <>
                           <img
                             src={selectedUser.verificationDocuments.businessRegistration}
                             alt="Business Registration"
                                 className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                 onClick={() => handlePreviewDocument('businessRegistration', selectedUser.verificationDocuments!.businessRegistration!)}
                             onError={(e) => {
                               const target = e.target as HTMLImageElement;
                               target.style.display = 'none';
                               const nextElement = target.nextElementSibling as HTMLElement;
                               if (nextElement) {
                                 nextElement.style.display = 'flex';
                               }
                             }}
                           />
                           {/* Fallback icon - always present but hidden by default */}
                               <div className="w-full h-full flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-200" style={{display: 'none'}}>
                                 <FileText className="h-12 w-12 text-gray-400" />
                           </div>
                             </>
                           )}
                         </div>
                       </div>
                     )}
                     
                     {selectedUser.verificationDocuments.companyRegistration && (
                       <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center space-x-2">
                             <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                               <FileText className="h-4 w-4 text-green-600" />
                             </div>
                             <span className="text-sm font-medium text-gray-900">CR</span>
                           </div>
                           <button
                             onClick={() => handlePreviewDocument('companyRegistration', selectedUser.verificationDocuments!.companyRegistration!)}
                             className="text-green-600 hover:text-green-800 text-sm flex items-center bg-white px-2 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors duration-200"
                           >
                             <Eye className="h-3 w-3 mr-1" />
                             Preview
                           </button>
                         </div>
                         <div className="text-xs text-gray-500 mb-2">Company Registration</div>
                         {/* File Thumbnail */}
                         <div className="w-full h-32 bg-white rounded border border-green-100 overflow-hidden">
                           {selectedUser.verificationDocuments.companyRegistration.match(/\.(pdf)$/i) ? (
                             // PDF Document Display
                             <div className="w-full h-full border border-gray-200 rounded overflow-hidden bg-white">
                               <div className="h-full flex flex-col">
                                 <div className="bg-red-50 px-2 py-1 border-b border-red-200 flex items-center justify-between">
                                   <div className="flex items-center space-x-1">
                                     <FileText className="h-3 w-3 text-red-500" />
                                     <span className="text-xs font-medium text-red-700">PDF</span>
                                   </div>
                                   <button
                                     onClick={() => {
                                       console.log('Opening CR PDF in new window:', selectedUser.verificationDocuments!.companyRegistration!);
                                       const newWindow = window.open(selectedUser.verificationDocuments!.companyRegistration!, '_blank', 'noopener,noreferrer');
                                       if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                         const link = document.createElement('a');
                                         link.href = selectedUser.verificationDocuments!.companyRegistration!;
                                         link.target = '_blank';
                                         link.rel = 'noopener noreferrer';
                                         document.body.appendChild(link);
                                         link.click();
                                         document.body.removeChild(link);
                                       }
                                     }}
                                     className="text-xs text-red-600 hover:text-red-800 flex items-center px-1 py-0.5 rounded border border-red-200 hover:bg-red-100 transition-colors duration-200"
                                     title="在新視窗中打開PDF"
                                   >
                                     <Eye className="h-2 w-2 mr-1" />
                                     預覽
                                   </button>
                                 </div>
                                 <div className="flex-1 relative bg-gray-100">
                                   <iframe
                                     src={`${selectedUser.verificationDocuments.companyRegistration}#toolbar=0&navpanes=0&scrollbar=1&zoom=fit&view=FitH`}
                                     className="w-full h-full border-0"
                                     title="Company Registration PDF"
                                     onError={(e) => {
                                       const target = e.target as HTMLIFrameElement;
                                       target.style.display = 'none';
                                       const fallback = target.nextElementSibling as HTMLElement;
                                       if (fallback) {
                                         fallback.style.display = 'flex';
                                       }
                                     }}
                                   />
                                   <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center text-center p-2" style={{ display: 'none' }}>
                                     <FileText className="h-6 w-6 text-gray-400 mb-1" />
                                     <p className="text-xs font-medium text-gray-900 mb-1">PDF 無法預覽</p>
                                     <button
                                       onClick={() => {
                                         const newWindow = window.open(selectedUser.verificationDocuments!.companyRegistration!, '_blank', 'noopener,noreferrer');
                                         if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                           const link = document.createElement('a');
                                           link.href = selectedUser.verificationDocuments!.companyRegistration!;
                                           link.target = '_blank';
                                           link.rel = 'noopener noreferrer';
                                           document.body.appendChild(link);
                                           link.click();
                                           document.body.removeChild(link);
                                         }
                                       }}
                                       className="text-xs text-red-600 hover:text-red-800 flex items-center px-2 py-1 rounded border border-red-200 hover:bg-red-100 transition-colors duration-200"
                                     >
                                       <Eye className="h-2 w-2 mr-1" />
                                       在新標籤頁打開
                                     </button>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           ) : (
                             // Image Document Display
                             <>
                           <img
                             src={selectedUser.verificationDocuments.companyRegistration}
                             alt="Company Registration"
                                 className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                 onClick={() => handlePreviewDocument('companyRegistration', selectedUser.verificationDocuments!.companyRegistration!)}
                             onError={(e) => {
                               const target = e.target as HTMLImageElement;
                               target.style.display = 'none';
                               const nextElement = target.nextElementSibling as HTMLElement;
                               if (nextElement) {
                                 nextElement.style.display = 'flex';
                               }
                             }}
                           />
                           {/* Fallback icon - always present but hidden by default */}
                               <div className="w-full h-full flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-200" style={{display: 'none'}}>
                                 <FileText className="h-12 w-12 text-gray-400" />
                           </div>
                             </>
                           )}
                         </div>
                       </div>
                     )}
                     
                     {selectedUser.verificationDocuments.businessLicense && (
                       <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center space-x-2">
                             <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                               <FileText className="h-4 w-4 text-purple-600" />
                             </div>
                             <span className="text-sm font-medium text-gray-900">BL</span>
                           </div>
                           <button
                             onClick={() => handlePreviewDocument('businessLicense', selectedUser.verificationDocuments!.businessLicense!)}
                             className="text-purple-600 hover:text-purple-800 text-sm flex items-center bg-white px-2 py-1 rounded border border-purple-200 hover:bg-purple-50 transition-colors duration-200"
                           >
                             <Eye className="h-3 w-3 mr-1" />
                             Preview
                           </button>
                         </div>
                         <div className="text-xs text-gray-500 mb-2">Business License</div>
                         {/* File Thumbnail */}
                         <div className="w-full h-32 bg-white rounded border border-purple-100 overflow-hidden">
                           {selectedUser.verificationDocuments.businessLicense.match(/\.(pdf)$/i) ? (
                             // PDF Document Display
                             <div 
                               className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 cursor-pointer hover:from-red-100 hover:to-red-200 transition-all duration-200"
                               onClick={() => handlePreviewDocument('businessLicense', selectedUser.verificationDocuments!.businessLicense!)}
                             >
                               <div className="text-center">
                                 <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
                                 <p className="text-xs font-medium text-red-700">PDF 文件</p>
                                 <p className="text-xs text-red-600">點擊預覽</p>
                               </div>
                             </div>
                           ) : selectedUser.verificationDocuments.businessLicense.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                             // Image Document Display
                             <img
                               src={selectedUser.verificationDocuments.businessLicense}
                               alt="Business License"
                               className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                               onClick={() => handlePreviewDocument('businessLicense', selectedUser.verificationDocuments!.businessLicense!)}
                             />
                           ) : (
                             // Generic Document Display
                             <div className="w-full h-full flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                               <FileText className="h-12 w-12 text-gray-400" />
                       </div>
                     )}
                         </div>
                       </div>
                     )}
                     
                     {selectedUser.verificationDocuments.taxCertificate && (
                       <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center space-x-2">
                             <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                               <FileText className="h-4 w-4 text-orange-600" />
                             </div>
                             <span className="text-sm font-medium text-gray-900">TC</span>
                           </div>
                           <button
                             onClick={() => handlePreviewDocument('taxCertificate', selectedUser.verificationDocuments!.taxCertificate!)}
                             className="text-orange-600 hover:text-orange-800 text-sm flex items-center bg-white px-2 py-1 rounded border border-orange-200 hover:bg-orange-50 transition-colors duration-200"
                           >
                             <Eye className="h-3 w-3 mr-1" />
                             Preview
                           </button>
                         </div>
                         <div className="text-xs text-gray-500 mb-2">Tax Certificate</div>
                         {/* File Thumbnail */}
                         <div className="w-full h-32 bg-white rounded border border-orange-100 overflow-hidden">
                           {selectedUser.verificationDocuments.taxCertificate.match(/\.(pdf)$/i) ? (
                             // PDF Document Display
                             <div 
                               className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 cursor-pointer hover:from-red-100 hover:to-red-200 transition-all duration-200"
                               onClick={() => handlePreviewDocument('taxCertificate', selectedUser.verificationDocuments!.taxCertificate!)}
                             >
                               <div className="text-center">
                                 <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
                                 <p className="text-xs font-medium text-red-700">PDF 文件</p>
                                 <p className="text-xs text-red-600">點擊預覽</p>
                               </div>
                             </div>
                           ) : selectedUser.verificationDocuments.taxCertificate.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                             // Image Document Display
                             <img
                               src={selectedUser.verificationDocuments.taxCertificate}
                               alt="Tax Certificate"
                               className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                               onClick={() => handlePreviewDocument('taxCertificate', selectedUser.verificationDocuments!.taxCertificate!)}
                             />
                           ) : (
                             // Generic Document Display
                             <div className="w-full h-full flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                               <FileText className="h-12 w-12 text-gray-400" />
                       </div>
                     )}
                         </div>
                       </div>
                     )}
                     
                     {selectedUser.verificationDocuments.bankStatement && (
                       <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center space-x-2">
                             <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                               <FileText className="h-4 w-4 text-red-600" />
                             </div>
                             <span className="text-sm font-medium text-gray-900">BS</span>
                           </div>
                           <button
                             onClick={() => handlePreviewDocument('bankStatement', selectedUser.verificationDocuments!.bankStatement!)}
                             className="text-red-600 hover:text-red-800 text-sm flex items-center bg-white px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200"
                           >
                             <Eye className="h-3 w-3 mr-1" />
                             Preview
                           </button>
                         </div>
                         <div className="text-xs text-gray-500 mb-2">Bank Statement</div>
                         {/* File Thumbnail */}
                         <div className="w-full h-32 bg-white rounded border border-red-100 overflow-hidden">
                           {selectedUser.verificationDocuments.bankStatement.match(/\.(pdf)$/i) ? (
                             // PDF Document Display
                             <div 
                               className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 cursor-pointer hover:from-red-100 hover:to-red-200 transition-all duration-200"
                               onClick={() => handlePreviewDocument('bankStatement', selectedUser.verificationDocuments!.bankStatement!)}
                             >
                               <div className="text-center">
                                 <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
                                 <p className="text-xs font-medium text-red-700">PDF 文件</p>
                                 <p className="text-xs text-red-600">點擊預覽</p>
                               </div>
                             </div>
                           ) : selectedUser.verificationDocuments.bankStatement.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                             // Image Document Display
                             <img
                               src={selectedUser.verificationDocuments.bankStatement}
                               alt="Bank Statement"
                               className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                               onClick={() => handlePreviewDocument('bankStatement', selectedUser.verificationDocuments!.bankStatement!)}
                             />
                           ) : (
                             // Generic Document Display
                             <div className="w-full h-full flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                               <FileText className="h-12 w-12 text-gray-400" />
                       </div>
                     )}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Verification Action Buttons */}
               {selectedUser.verificationDocuments && 
                Object.keys(selectedUser.verificationDocuments).length > 0 && (
                 <div className="border-t border-gray-200 pt-4">
                   <h4 className="text-sm font-medium text-gray-900 mb-3">Verification Actions</h4>
                   <div className="flex space-x-3">
                     {/* Approve button - show for rejected users and non-approved users */}
                     {(selectedUser.verificationStatus === 'rejected' || selectedUser.verificationStatus !== 'approved') && (
                       <button
                         onClick={() => handleVerificationAction('approve')}
                         disabled={isUpdating}
                         className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                       >
                         <CheckCircle className="h-4 w-4" />
                         <span>{selectedUser.verificationStatus === 'rejected' ? 'Re-approve' : 'Approve'}</span>
                       </button>
                     )}
                     
                     {/* Reject button - show for all users except already rejected */}
                     {selectedUser.verificationStatus !== 'rejected' && (
                       <button
                         onClick={() => handleVerificationAction('reject')}
                         disabled={isUpdating}
                         className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                           selectedUser.verificationStatus === 'approved' 
                             ? 'bg-orange-600 text-white hover:bg-orange-700' 
                             : 'bg-red-600 text-white hover:bg-red-700'
                         }`}
                       >
                         <XCircle className="h-4 w-4" />
                         <span>{selectedUser.verificationStatus === 'approved' ? 'Revoke Approval' : 'Reject'}</span>
                       </button>
                     )}
                   </div>
                 </div>
               )}

               {/* Verification Status Display */}
               {selectedUser.verificationStatus === 'approved' && (
                 <div className="border-t border-gray-200 pt-4">
                   <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg border border-green-200">
                     <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                     <span className="text-sm font-medium text-green-800">Verification Approved</span>
                   </div>
                 </div>
               )}

               {selectedUser.verificationStatus === 'rejected' && (
                 <div className="border-t border-gray-200 pt-4">
                   <div className="flex items-center justify-center p-3 bg-red-50 rounded-lg border border-red-200">
                     <XCircle className="h-5 w-5 text-red-600 mr-2" />
                     <span className="text-sm font-medium text-red-800">Verification Rejected</span>
                   </div>
                 </div>
               )}
             </div>
             
             <div className="mt-6 flex justify-end">
               <button
                 onClick={() => setShowUserModal(false)}
                 className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Edit User Modal */}
       {showEditModal && selectedUser && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
               <button
                 onClick={() => setShowEditModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="h-6 w-6" />
               </button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="text-sm font-medium text-gray-500">Email</label>
                 <p className="text-sm text-gray-900">{selectedUser.email}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">Company</label>
                 <p className="text-sm text-gray-900">{selectedUser.company}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-500">Status</label>
                                   <select
                   value={selectedUser.status}
                   onChange={(e) => setSelectedUser({...selectedUser, status: e.target.value as 'active' | 'inactive'})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={isUpdating === true}
                  >
                   <option value="active">Active</option>
                   <option value="inactive">Inactive</option>
                 </select>
               </div>
             </div>
             
             <div className="mt-6 flex justify-end space-x-3">
                               <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  disabled={isUpdating === true}
                >
                 Cancel
               </button>
               <button
                 onClick={() => {
                   if (window.confirm(`Are you sure you want to change this user's status to "${selectedUser.status}"?`)) {
                     handleUpdateUserStatus(selectedUser.id, selectedUser.status);
                   }
                 }}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                 disabled={isUpdating === true}
               >
                 {isUpdating ? (
                   <div className="flex items-center">
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                     Saving...
                 </div>
                 ) : (
                   'Save Changes'
               )}
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Delete User Modal */}
       {showDeleteModal && selectedUser && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
               <button
                 onClick={() => setShowDeleteModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="h-6 w-6" />
               </button>
             </div>
             
             <div className="space-y-4">
               <div className="flex items-center space-x-4">
                 {selectedUser.companyLogo ? (
                   <img
                     src={selectedUser.companyLogo}
                     alt={selectedUser.company}
                     className="h-12 w-12 rounded-full object-cover border border-gray-200"
                   />
                 ) : (
                   <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                     <span className="text-lg font-medium text-blue-600">
                       {selectedUser.email.charAt(0).toUpperCase()}
                     </span>
                   </div>
                 )}
                 <div>
                   <h4 className="text-lg font-medium text-gray-900">{selectedUser.email}</h4>
                   <p className="text-gray-500">{selectedUser.company}</p>
                 </div>
               </div>
               
               <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                 <div className="flex">
                   <div className="flex-shrink-0">
                     <XCircle className="h-5 w-5 text-red-400" />
                   </div>
                   <div className="ml-3">
                     <h3 className="text-sm font-medium text-red-800">Warning</h3>
                     <div className="mt-2 text-sm text-red-700">
                       <p>Are you sure you want to delete this user? This action cannot be undone.</p>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
             
             <div className="mt-6 flex justify-end space-x-3">
                               <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  disabled={isUpdating === true}
                >
                 Cancel
               </button>
                               <button
                  onClick={handleDeleteUserConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={isUpdating === true}
                >
                 {isUpdating ? (
                   <div className="flex items-center">
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                     Deleting...
                   </div>
                 ) : (
                   'Delete User'
                 )}
               </button>
             </div>
           </div>
         </div>
       )}


       {/* Document Preview Modal */}
       {showDocumentPreviewModal && previewDocument && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
           <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
             {/* Header */}
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                   <FileText className="h-5 w-5 text-blue-600" />
                   </div>
                 <div>
                   <h3 className="text-xl font-semibold text-gray-900">{previewDocument.name}</h3>
                   <p className="text-sm text-gray-500">Document Preview</p>
                 </div>
               </div>
               <button
                 onClick={() => setShowDocumentPreviewModal(false)}
                 className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
               >
                 <X className="h-6 w-6" />
               </button>
                       </div>

             {/* Document Content */}
             <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
               {previewDocument.url.match(/\.(pdf)$/i) ? (
                 // PDF Document Preview
                 <div className="w-full h-[70vh] border border-gray-200 rounded-lg overflow-hidden">
                   <div className="h-full flex flex-col">
                     {/* PDF Header */}
                     <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                         <FileText className="h-4 w-4 text-red-500" />
                         <span className="text-sm font-medium text-gray-700">PDF Document</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <a
                           href={previewDocument.url}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                         >
                           <Download className="h-3 w-3 mr-1" />
                           下載
                         </a>
                       </div>
                       </div>
                     
                     {/* PDF Content */}
                     <div className="flex-1 relative">
                       <iframe
                         src={`${previewDocument.url}#toolbar=1&navpanes=1&scrollbar=1`}
                         className="w-full h-full border-0"
                         title={previewDocument.name}
                         onError={(e) => {
                           console.log('PDF iframe failed to load:', previewDocument.url);
                           const target = e.target as HTMLIFrameElement;
                           target.style.display = 'none';
                           
                           // Show fallback message
                           const fallbackDiv = target.nextElementSibling as HTMLElement;
                           if (fallbackDiv) {
                             fallbackDiv.style.display = 'flex';
                           }
                         }}
                       />
                       
                       {/* Fallback for iframe failure */}
                       <div className="absolute inset-0 flex items-center justify-center bg-gray-50" style={{display: 'none'}}>
                         <div className="text-center">
                           <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                           <h4 className="text-lg font-medium text-gray-900 mb-2">PDF 無法在瀏覽器中顯示</h4>
                           <p className="text-gray-500 mb-4">請下載文件或在新標籤頁中打開</p>
                           <div className="flex justify-center space-x-3">
                             <a
                               href={previewDocument.url}
                           target="_blank"
                           rel="noopener noreferrer"
                               className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                             >
                               <Eye className="h-4 w-4 mr-2" />
                               在新標籤頁打開
                             </a>
                             <a
                               href={previewDocument.url}
                               download
                               className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                             >
                               <Download className="h-4 w-4 mr-2" />
                               下載文件
                             </a>
                           </div>
                       </div>
                     </div>
                 </div>
               </div>
               </div>
               ) : previewDocument.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                 // Image Document Preview
                 <div className="flex justify-center">
                   <img
                     src={previewDocument.url}
                     alt={previewDocument.name}
                     className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                     onLoad={() => {
                       console.log('Image loaded successfully:', previewDocument.url);
                     }}
                     onError={(e) => {
                       console.log('Image failed to load:', previewDocument.url);
                       const target = e.target as HTMLImageElement;
                       target.style.display = 'none';
                       
                       // Show fallback content
                       const fallbackDiv = target.nextElementSibling as HTMLElement;
                       if (fallbackDiv) {
                         fallbackDiv.style.display = 'block';
                       }
                     }}
                   />
                   
                   {/* Fallback for image failure */}
                   <div className="text-center py-20" style={{display: 'none'}}>
                     <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <FileText className="h-12 w-12 text-gray-400" />
                 </div>
                     <h4 className="text-lg font-medium text-gray-900 mb-2">Image Preview Not Available</h4>
                     <p className="text-gray-500 mb-4">This image cannot be displayed.</p>
                     <a
                       href={previewDocument.url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                     >
                       <Download className="h-4 w-4 mr-2" />
                       Download File
                     </a>
                   </div>
                 </div>
               ) : (
                 // Generic file preview
                 <div className="text-center py-20">
                   <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <FileText className="h-12 w-12 text-gray-400" />
                   </div>
                   <h4 className="text-lg font-medium text-gray-900 mb-2">File Preview Not Available</h4>
                   <p className="text-gray-500 mb-4">This file type cannot be previewed directly.</p>
                   <a
                     href={previewDocument.url}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                   >
                     <Download className="h-4 w-4 mr-2" />
                     Download File
                   </a>
                 </div>
               )}
             </div>

             {/* Footer Actions */}
             <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
               <a
                 href={previewDocument.url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
               >
                 <Download className="h-4 w-4" />
                 <span>Download</span>
               </a>
               <button
                 onClick={() => setShowDocumentPreviewModal(false)}
                 className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Verification Reason Modal */}
       <VerificationReasonModal
         isOpen={showReasonModal}
         onClose={handleReasonClose}
         onConfirm={handleReasonConfirm}
         action={selectedUser?.verificationStatus === 'approved' ? 'revoke' : 'reject'}
         userEmail={selectedUser?.email || ''}
         isLoading={isUpdating}
       />
     </div>
   );
 } 