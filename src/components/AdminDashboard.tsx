import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  Activity,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Shield,
  MessageCircle,
  Settings,
  Receipt,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Download,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { formatHKDate, formatHKDateTime, formatHKTime } from '../utils/dateUtils';
import VerificationReasonModal from './VerificationReasonModal';
import ActivityDetailsModal from './ActivityDetailsModal';

interface DashboardStats {
  totalUsers: number;
  totalOffers: number;
  totalTransactions: number;
  totalRevenue: number;
  newUsersToday: number;
  newOffersToday: number;
  activeOffers: number;
  platformFeeTotal: number;
  completedOrders: number;
  salesPerDayPercentage: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'offer' | 'transaction' | 'verification' | 'report' | 'message' | 'delivery_reminder';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  purchaseData?: any;
  userData?: any;
  reportData?: any;
  messageData?: any;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOffers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    newOffersToday: 0,
    activeOffers: 0,
    platformFeeTotal: 0,
    completedOrders: 0,
    salesPerDayPercentage: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [filteredActivity, setFilteredActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter states
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showVerificationReasonModal, setShowVerificationReasonModal] = useState(false);
  const [showImageZoomModal, setShowImageZoomModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageTitle, setSelectedImageTitle] = useState<string>('');
  const [showActivityDetailsModal, setShowActivityDetailsModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    const adminData = localStorage.getItem('adminUser');
    
    if (!isAuthenticated || !adminData) {
      navigate('/hk/admin/login');
      return;
    }

    setAdminUser(JSON.parse(adminData));
    setIsAuthenticated(true);
    setIsLoading(false);
    loadDashboardData();

    // Optional: Set up a periodic check for admin status (less frequent)
    const checkAdminStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', JSON.parse(adminData).id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (!userData.isAdmin) {
            // Admin status revoked, redirect to login
            localStorage.removeItem('adminAuthenticated');
            localStorage.removeItem('adminUser');
            navigate('/hk/admin/login');
          }
        } else {
          // User document doesn't exist, redirect to login
          localStorage.removeItem('adminAuthenticated');
          localStorage.removeItem('adminUser');
          navigate('/hk/admin/login');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        // Don't redirect on error, just log it
      }
    };

    // Check admin status every 5 minutes
    const statusCheckInterval = setInterval(checkAdminStatus, 5 * 60 * 1000);

    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Import and use getAllUsers function to ensure all fields are retrieved
      const { getAllUsers } = await import('../services/firebaseService');
      const users = await getAllUsers();
      setUsers(users); // Store users in state for modal access
      
      const offersSnapshot = await getDocs(collection(db, 'offers'));
      const offers = offersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      const purchasesSnapshot = await getDocs(collection(db, 'purchases'));
      const purchases = purchasesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      const reportsSnapshot = await getDocs(collection(db, 'offerReports'));
      const reports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // Get recent messages for activity feed
      const messagesSnapshot = await getDocs(collection(db, 'messages'));
      const messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const newUsersToday = users.filter(user => {
        const userDate = new Date(user.joinedDate || (user as any).createdAt);
        return userDate >= today;
      }).length;

      const newOffersToday = offers.filter(offer => {
        const offerDate = new Date(offer.createdAt);
        return offerDate >= today;
      }).length;

      const activeOffers = offers.filter(offer => offer.status === 'active' && !offer.deleted).length;

      // Calculate total revenue (Sales Turn) - only include approved/completed transactions
      // This represents the total sales volume including platform fees
      const totalRevenue = purchases.reduce((sum, purchase) => {
        // Only include transactions that are approved, shipped, delivered, or completed
        // Exclude pending, rejected, or cancelled transactions
        if (purchase.status === 'approved' || 
            purchase.status === 'shipped' || 
            purchase.status === 'delivered' || 
            purchase.status === 'completed') {
          return sum + (purchase.totalAmount || 0);
        }
        return sum;
      }, 0);

      // Calculate platform fee total - only from approved/completed transactions
      // This ensures rejected offers don't inflate the platform fee earnings
      const platformFeeTotal = purchases.reduce((sum, purchase) => {
        // Only include platform fees from approved/completed transactions
        if (purchase.status === 'approved' || 
            purchase.status === 'shipped' || 
            purchase.status === 'delivered' || 
            purchase.status === 'completed') {
          return sum + (purchase.platformFee || 0);
        }
        return sum;
      }, 0);

      // Count completed orders (status === 'completed')
      const completedOrders = purchases.filter(purchase => 
        purchase.status === 'completed'
      ).length;

      // Count total transactions (including all statuses for reference)
      const totalTransactions = purchases.length;

      // Calculate sales per day percentage
      // This compares today's sales to the average daily sales over the last 7 days
      const todayForSales = new Date();
      todayForSales.setHours(0, 0, 0, 0);
      
      const sevenDaysAgo = new Date(todayForSales);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Get today's sales (approved transactions)
      const todaySales = purchases.reduce((sum, purchase) => {
        const purchaseDate = new Date(purchase.purchaseDate || purchase.timestamp);
        purchaseDate.setHours(0, 0, 0, 0);
        
        if (purchaseDate.getTime() === todayForSales.getTime() && 
            (purchase.status === 'approved' || 
             purchase.status === 'shipped' || 
             purchase.status === 'delivered' || 
             purchase.status === 'completed')) {
          return sum + (purchase.totalAmount || 0);
        }
        return sum;
      }, 0);
      
      // Get last 7 days sales (approved transactions)
      const last7DaysSales = purchases.reduce((sum, purchase) => {
        const purchaseDate = new Date(purchase.purchaseDate || purchase.timestamp);
        purchaseDate.setHours(0, 0, 0, 0);
        
        if (purchaseDate >= sevenDaysAgo && 
            (purchase.status === 'approved' || 
             purchase.status === 'shipped' || 
             purchase.status === 'delivered' || 
             purchase.status === 'completed')) {
          return sum + (purchase.totalAmount || 0);
        }
        return sum;
      }, 0);
      
      // Calculate average daily sales over last 7 days
      const averageDailySales = last7DaysSales / 7;
      
      // Calculate percentage (today's sales vs average daily sales)
      const salesPerDayPercentage = averageDailySales > 0 
        ? Math.round((todaySales / averageDailySales) * 100) 
        : 0;

      setStats({
        totalUsers: users.length,
        totalOffers: offers.length,
        totalTransactions: totalTransactions,
        totalRevenue,
        newUsersToday,
        newOffersToday,
        activeOffers,
        platformFeeTotal,
        completedOrders,
        salesPerDayPercentage
      });

      // Calculate user statistics
      const offersByUser: { [key: string]: number } = {};
      offers.forEach(offer => {
        if (!offer.deleted && offer.supplierId) {
          offersByUser[offer.supplierId] = (offersByUser[offer.supplierId] || 0) + 1;
        }
      });

      const purchasesByUser: { [key: string]: number } = {};
      purchases.forEach(purchase => {
        if (purchase.buyerId) {
          purchasesByUser[purchase.buyerId] = (purchasesByUser[purchase.buyerId] || 0) + 1;
        }
      });

      const recentUsers = users
        .sort((a, b) => new Date(b.joinedDate || (a as any).createdAt).getTime() - new Date(a.joinedDate || (a as any).createdAt).getTime())
        .slice(0, 5)
        .map(user => {
          const userStats = {
            totalOffers: offersByUser[user.id] || 0,
            totalPurchases: purchasesByUser[user.id] || 0,
            location: user.address || 'N/A'
          };
          
          // Debug: Log user data for modal
          console.log('User data for modal:', {
            id: user.id,
            company: user.company,
            email: user.email,
            address: user.address,
            totalOffers: userStats.totalOffers,
            totalPurchases: userStats.totalPurchases,
            location: userStats.location
          });
          
          return {
            id: user.id,
            type: 'user' as const,
            title: `👤 New User Registration`,
            description: `${user.company} (${user.email})`,
            timestamp: user.joinedDate || (user as any).createdAt,
            status: user.verificationStatus,
            userData: {
              ...user,
              ...userStats
            }
          };
        });

      const recentOffers = offers
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(offer => {
          // Get supplier information from the offer's supplier field
          const supplierName = offer.supplier?.company || 'Unknown Supplier';
          
          // Debug: Log the offer data to see what's available
          console.log('Offer data for modal:', {
            id: offer.id,
            title: offer.title,
            quantity: offer.quantity,
            quantityType: typeof offer.quantity,
            quantityValue: offer.quantity,
            currentPrice: offer.currentPrice,
            originalPrice: offer.originalPrice,
            supplier: offer.supplier,
            allOfferKeys: Object.keys(offer)
          });
          
          return {
            id: offer.id,
            type: 'offer' as const,
            title: `📦 New Offer Posted`,
            description: `${offer.title} (ID: ${offer.id})`,
            timestamp: offer.createdAt,
            status: offer.status,
            offerData: {
              ...offer,
              supplierName, // Include supplier name for display
              price: offer.currentPrice || offer.originalPrice,
              quantity: offer.quantity !== undefined ? offer.quantity : (offer as any).availableQuantity || (offer as any).totalQuantity || 0
            }
          };
        });

      const recentPurchases = purchases
        .sort((a, b) => new Date(b.purchaseDate || b.timestamp).getTime() - new Date(a.purchaseDate || a.timestamp).getTime())
        .slice(0, 5)
        .map(purchase => {
          // Find seller and buyer information
          const seller = users.find(user => user.id === purchase.sellerId);
          const buyer = users.find(user => user.id === purchase.buyerId);
          
          // Find the offer information
          const offer = offers.find(offer => offer.id === purchase.offerId);
          
          const sellerName = seller?.company || 'Unknown Seller';
          const buyerName = buyer?.company || 'Unknown Buyer';
          
          return {
            id: purchase.id,
            type: 'transaction' as const,
            title: `🛒 New Purchase`,
            description: `${sellerName} → ${buyerName} (HK$${purchase.totalAmount?.toLocaleString() || '0'}) ${purchase.paymentReference ? `[Ref: ${purchase.paymentReference}]` : ''} (ID: ${purchase.id})`,
            timestamp: purchase.purchaseDate || purchase.timestamp,
            status: purchase.status,
            purchaseData: {
              ...purchase,
              buyerName,
              sellerName,
              amount: purchase.totalAmount,
              offerTitle: offer?.title || purchase.offerTitle || 'N/A',
              createdAt: purchase.purchaseDate || purchase.createdAt || purchase.timestamp
            }
          };
        });

      // Add payment receipt uploads as separate activities
      const paymentReceiptUploads = purchases
        .filter(purchase => {
          // Check if there's a receipt file and the payment needs review
          const hasReceipt = purchase.paymentDetails?.receiptFile || purchase.paymentDetails?.receiptPreview;
          const needsReview = purchase.paymentApprovalStatus === 'pending' || 
                             purchase.status === 'pending' || 
                             (purchase.paymentDetails?.receiptFile && !purchase.paymentApprovalStatus);
          
          return hasReceipt && needsReview;
        })
        .sort((a, b) => {
          // Use paymentDetails.timestamp for receipt uploads, then other timestamps
          const aTime = new Date(a.paymentDetails?.timestamp || a.updatedAt || a.purchaseDate || a.timestamp).getTime();
          const bTime = new Date(b.paymentDetails?.timestamp || b.updatedAt || b.purchaseDate || b.timestamp).getTime();
          return bTime - aTime;
        })
        .slice(0, 3)
        .map(purchase => {
          // Determine if this is a re-upload based on paymentDetails.timestamp vs purchaseDate
          const isReupload = purchase.paymentDetails?.timestamp && 
                            purchase.paymentDetails.timestamp !== purchase.purchaseDate;
          
          return {
            id: `receipt_${purchase.id}`,
            type: 'transaction' as const,
            title: isReupload ? `📄 Payment Receipt Re-uploaded` : `📄 Payment Receipt Uploaded`,
            description: isReupload 
              ? `Receipt re-uploaded for HK$${purchase.totalAmount || 0} purchase ${purchase.paymentReference ? `[Ref: ${purchase.paymentReference}]` : ''}`
              : `Receipt uploaded for HK$${purchase.totalAmount || 0} purchase ${purchase.paymentReference ? `[Ref: ${purchase.paymentReference}]` : ''}`,
            timestamp: purchase.paymentDetails?.timestamp || purchase.updatedAt || purchase.purchaseDate || purchase.timestamp,
            status: 'pending_review',
            purchaseData: purchase // Include full purchase data for modal
          };
        });

      // Add verification document uploads as separate activities
      const verificationDocumentUploads = users
        .filter(user => {
          // Check if user has uploaded verification documents and needs review
          const hasDocuments = user.verificationDocuments && 
                              Object.keys(user.verificationDocuments).length > 0 &&
                              Object.values(user.verificationDocuments).some(url => {
                                if (typeof url === 'string') {
                                  return url && url.trim() !== '';
                                } else if (Array.isArray(url)) {
                                  return url.length > 0;
                                }
                                return false;
                              });
          
          const needsReview = user.verificationStatus === 'pending' || 
                             (hasDocuments && (!user.verificationStatus || user.verificationStatus === 'not_submitted'));
          
          // Debug logging for all users with documents
          if (hasDocuments) {
            console.log('🔍 User with verification documents:', {
              userId: user.id,
              company: user.company,
              email: user.email,
              verificationStatus: user.verificationStatus,
              verificationDocuments: user.verificationDocuments,
              verificationSubmittedAt: user.verificationSubmittedAt,
              hasDocuments,
              needsReview,
              documentCount: Object.keys(user.verificationDocuments || {}).length
            });
          }
          
          return hasDocuments && needsReview;
        })
        .sort((a, b) => {
          // Sort by verificationSubmittedAt first, then by updatedAt, then by createdAt
          const aTime = new Date(a.verificationSubmittedAt || (a as any).updatedAt || (a as any).createdAt).getTime();
          const bTime = new Date(b.verificationSubmittedAt || (b as any).updatedAt || (b as any).createdAt).getTime();
          return bTime - aTime;
        })
        .slice(0, 3)
        .map(user => ({
          id: `verification_${user.id}`,
          type: 'verification' as const,
          title: `📋 Verification Documents Uploaded`,
          description: `${user.company} (${user.email}) uploaded verification documents`,
          timestamp: user.verificationSubmittedAt || (user as any).updatedAt || (user as any).createdAt,
          status: 'pending_review',
          userData: user // Include full user data for modal
        }));

      // Add offer reports as separate activities
      const recentReports = reports
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(report => {
          // Find reporter information
          const reporter = users.find(user => user.id === report.reporterId);
          const reporterName = reporter?.company || 'Unknown Reporter';
          
          // Map reason to Chinese
          const reasonMap: { [key: string]: string } = {
            'fake-offer': '虛假商品',
            'suspect-seller': '可疑賣家',
            'prohibit-products': '違禁商品',
            'other-reason': '其他原因'
          };
          
          const reasonText = reasonMap[report.reason] || report.reason;
          
          return {
            id: `report_${report.id}`,
            type: 'report' as const,
            title: `🚨 商品舉報`,
            description: `${reporterName} 舉報了商品 "${report.offerTitle}"，原因：${reasonText}`,
            timestamp: report.createdAt,
            status: report.status,
            reportData: report // Include full report data for modal
          };
        });

      // Messages are no longer shown in recent activity
      // const recentMessages = messages
      //   .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      //   .slice(0, 5)
      //   .map(message => {
      //     // Find sender and receiver information
      //     const sender = users.find(user => user.id === message.senderId);
      //     const receiver = users.find(user => user.id === message.receiverId);
      //     
      //     const senderName = sender?.company || 'Unknown Sender';
      //     const receiverName = receiver?.company || 'Unknown Receiver';
      //     
      //     // Truncate message content for display
      //     const truncatedContent = message.content && message.content.length > 30 
      //       ? message.content.substring(0, 30) + '...' 
      //       : message.content || 'No content';
      //     
      //     return {
      //       id: `message_${message.id}`,
      //       type: 'message' as const,
      //       title: `💬 新訊息`,
      //       description: `${senderName} → ${receiverName}: ${truncatedContent}`,
      //       timestamp: message.timestamp,
      //       status: message.isRead ? 'read' : 'unread',
      //       messageData: message // Include full message data for modal
      //     };
      //   });

      // Add delivery reminder activities
      const deliveryReminders: RecentActivity[] = [];
      try {
        const adminNotificationsRef = collection(db, 'adminNotifications');
        const deliveryRemindersDoc = await getDoc(doc(adminNotificationsRef, 'delivery_reminders'));
        
        if (deliveryRemindersDoc.exists()) {
          const deliveryRemindersData = deliveryRemindersDoc.data();
          
          // Convert delivery reminders to activities
          Object.values(deliveryRemindersData).forEach((reminder: any) => {
            if (reminder && typeof reminder === 'object' && reminder.type === 'delivery_reminder') {
              deliveryReminders.push({
                id: reminder.id,
                type: 'delivery_reminder' as const,
                title: reminder.title,
                description: reminder.description,
                timestamp: reminder.timestamp,
                status: reminder.status,
                purchaseData: reminder.purchaseData
              });
            }
          });
        }
      } catch (error) {
        console.error('Error loading delivery reminders:', error);
      }

      const allActivity = [...recentUsers, ...recentOffers, ...recentPurchases, ...paymentReceiptUploads, ...verificationDocumentUploads, ...recentReports, ...deliveryReminders]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      // Debug logging for verification activities
      console.log('📊 Dashboard Activity Summary:', {
        totalUsers: users.length,
        usersWithDocuments: users.filter(u => u.verificationDocuments && Object.keys(u.verificationDocuments).length > 0).length,
        verificationDocumentUploads: verificationDocumentUploads.length,
        totalReports: reports.length,
        recentReports: recentReports.length,
        totalMessages: messages.length,
        allActivityCount: allActivity.length,
        verificationActivities: allActivity.filter(a => a.type === 'verification').length,
        reportActivities: allActivity.filter(a => a.type === 'report').length,
        deliveryReminderActivities: allActivity.filter(a => a.type === 'delivery_reminder').length
      });

      // Additional debug: log all users with any verification data
      const usersWithVerificationData = users.filter(u => 
        u.verificationDocuments || 
        u.verificationStatus || 
        u.verificationSubmittedAt
      );
      console.log('🔍 Users with verification data:', usersWithVerificationData.map(u => ({
        id: u.id,
        company: u.company,
        email: u.email,
        verificationStatus: u.verificationStatus,
        verificationSubmittedAt: u.verificationSubmittedAt,
        hasVerificationDocuments: !!u.verificationDocuments,
        verificationDocumentKeys: u.verificationDocuments ? Object.keys(u.verificationDocuments) : []
      })));

      setRecentActivity(allActivity);
      setFilteredActivity(allActivity); // Initialize filtered activity

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter recent activities
  const filterActivities = () => {
    let filtered = [...recentActivity];

    // Filter by activity type
    if (activityTypeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === activityTypeFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(activity => activity.status === statusFilter);
    }

    // Filter by date range
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      const activityDate = new Date();
      
      switch (dateRangeFilter) {
        case 'today':
          filtered = filtered.filter(activity => {
            activityDate.setTime(new Date(activity.timestamp).getTime());
            return activityDate.toDateString() === now.toDateString();
          });
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(activity => new Date(activity.timestamp) >= weekAgo);
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(activity => new Date(activity.timestamp) >= monthAgo);
          break;
      }
    }

    // Filter by search query
    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.id.toLowerCase().includes(query)
      );
    }

    setFilteredActivity(filtered);
  };

  // Apply filters when filter states change
  useEffect(() => {
    filterActivities();
  }, [recentActivity, activityTypeFilter, statusFilter, dateRangeFilter, searchFilter]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('adminAuthenticated');
      localStorage.removeItem('adminUser');
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handlePaymentReceiptClick = (activity: any) => {
    if (activity.purchaseData) {
      setSelectedPurchase(activity.purchaseData);
      setShowPaymentModal(true);
    }
  };

  const handleVerificationDocumentClick = (activity: any) => {
    if (activity.userData) {
      setSelectedUser(activity.userData);
      setShowVerificationModal(true);
    }
  };

  const handleImageClick = (imageUrl: string, imageTitle: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageTitle(imageTitle);
    setShowImageZoomModal(true);
  };

  const handleActivityClick = (activity: any) => {
    // Don't show modal for payment receipt activities since they have their own review button
    if (activity.id && activity.id.startsWith('receipt_')) {
      return;
    }
    setSelectedActivity(activity);
    setShowActivityDetailsModal(true);
  };

  const handleCloseImageZoom = () => {
    setShowImageZoomModal(false);
    setSelectedImageUrl('');
    setSelectedImageTitle('');
  };

  const handleApprovePayment = async () => {
    if (!selectedPurchase) return;
    
    try {
      setActionLoading(true);
      
      // Debug: Log the complete selectedPurchase object
      console.log('🔍 Complete selectedPurchase object:', selectedPurchase);
      console.log('🔍 Available fields:', Object.keys(selectedPurchase));
      console.log('🔍 sellerId:', selectedPurchase.sellerId);
      console.log('🔍 supplierId:', selectedPurchase.supplierId);
      
      // Update purchase status to approved
      const purchaseRef = doc(db, 'purchases', selectedPurchase.id);
      const { getCurrentHKTimestamp } = await import('../utils/dateUtils');
      await updateDoc(purchaseRef, {
        paymentApprovalStatus: 'approved',
        status: 'approved',
        updatedAt: getCurrentHKTimestamp()
      });
      
      // Send notification to seller about payment approval
      try {
        // Try to get sellerId from different possible field names
        const sellerId = selectedPurchase.sellerId || selectedPurchase.supplierId;
        console.log('🔍 Final sellerId to use:', sellerId);
        
        if (!sellerId) {
          console.error('❌ No sellerId or supplierId found in selectedPurchase:', selectedPurchase);
          return;
        }
        
        const sellerNotificationData = {
          userId: sellerId,
          type: 'payment' as const,
          title: '收到買家付款',
          message: `我們已收到買家付款，請開始準備訂單 ${selectedPurchase.id} 的配送給買家。`,
          isRead: false,
          data: {
            purchaseId: selectedPurchase.id,
            offerId: selectedPurchase.offerId,
            buyerId: selectedPurchase.buyerId,
            amount: selectedPurchase.totalAmount,
            actionUrl: `/hk/my-orders`
          },
          priority: 'high' as const
        };
        
        console.log('📨 Creating seller approval notification:', sellerNotificationData);
        
        // Import notification services
        const { firestoreNotificationService } = await import('../services/firestoreNotificationService');
        const { notificationService } = await import('../services/notificationService');
        const { getCurrentHKTimestamp } = await import('../utils/dateUtils');
        
        // Save notification to Firestore
        console.log('💾 Attempting to save seller approval notification to Firestore...');
        const notificationId = await firestoreNotificationService.addNotification(sellerNotificationData);
        console.log('✅ Seller approval notification saved to Firestore with ID:', notificationId);
        
        // Create notification with ID and trigger real-time notification
        const notificationWithId = {
          ...sellerNotificationData,
          id: notificationId,
          createdAt: getCurrentHKTimestamp()
        };
        
        console.log('📡 Triggering real-time notification for seller...');
        notificationService.trigger(notificationWithId);
        console.log('✅ Seller approval notification sent successfully');
      } catch (notificationError) {
        console.error('❌ Error creating seller approval notification:', notificationError);
      }
      
      // Close modal and refresh data
      setShowPaymentModal(false);
      setSelectedPurchase(null);
      loadDashboardData();
      
    } catch (error) {
      console.error('Error approving payment:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPurchase) return;
    
    try {
      setActionLoading(true);
      // Update purchase status to rejected
      const purchaseRef = doc(db, 'purchases', selectedPurchase.id);
      const { getCurrentHKTimestamp } = await import('../utils/dateUtils');
      await updateDoc(purchaseRef, {
        paymentApprovalStatus: 'rejected',
        status: 'rejected',
        updatedAt: getCurrentHKTimestamp()
      });
      
      // Send notification to seller about payment rejection
      try {
        // Try to get sellerId from different possible field names
        const sellerId = selectedPurchase.sellerId || selectedPurchase.supplierId;
        console.log('🔍 Final sellerId to use (rejection):', sellerId);
        
        if (!sellerId) {
          console.error('❌ No sellerId or supplierId found in selectedPurchase (rejection):', selectedPurchase);
          return;
        }
        
        const sellerNotificationData = {
          userId: sellerId,
          type: 'payment' as const,
          title: '付款被拒絕',
          message: `訂單 ${selectedPurchase.id} 的付款被拒絕，請聯繫買家重新處理付款。`,
          isRead: false,
          data: {
            purchaseId: selectedPurchase.id,
            offerId: selectedPurchase.offerId,
            buyerId: selectedPurchase.buyerId,
            amount: selectedPurchase.totalAmount,
            actionUrl: `/hk/my-orders`
          },
          priority: 'high' as const
        };
        
        console.log('📨 Creating seller rejection notification:', sellerNotificationData);
        
        // Import notification services
        const { firestoreNotificationService } = await import('../services/firestoreNotificationService');
        const { notificationService } = await import('../services/notificationService');
        const { getCurrentHKTimestamp } = await import('../utils/dateUtils');
        
        // Save notification to Firestore
        console.log('💾 Attempting to save seller rejection notification to Firestore...');
        const notificationId = await firestoreNotificationService.addNotification(sellerNotificationData);
        console.log('✅ Seller rejection notification saved to Firestore with ID:', notificationId);
        
        // Create notification with ID and trigger real-time notification
        const notificationWithId = {
          ...sellerNotificationData,
          id: notificationId,
          createdAt: getCurrentHKTimestamp()
        };
        
        console.log('📡 Triggering real-time notification for seller...');
        notificationService.trigger(notificationWithId);
        console.log('✅ Seller rejection notification sent successfully');
      } catch (notificationError) {
        console.error('❌ Error creating seller rejection notification:', notificationError);
      }
      
      // Close modal and refresh data
      setShowPaymentModal(false);
      setSelectedPurchase(null);
      loadDashboardData();
      
    } catch (error) {
      console.error('Error rejecting payment:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerificationAction = (action: 'approve' | 'reject') => {
    if (action === 'reject') {
      setShowVerificationReasonModal(true);
    } else {
      executeVerificationAction(action, 'Verification approved by admin');
    }
  };

  const executeVerificationAction = async (action: 'approve' | 'reject', reason: string) => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      // Import the verification update function
      const { updateUserVerification } = await import('../services/firebaseService');
      
      // Get current Firebase Auth user ID
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      await updateUserVerification(selectedUser.id, action === 'approve', currentUser.uid, reason);
      
      console.log(`✅ Verification ${action}d successfully for user: ${selectedUser.email}`);
      
      // Close modals and refresh data
      setShowVerificationModal(false);
      setShowVerificationReasonModal(false);
      setSelectedUser(null);
      loadDashboardData();
      
    } catch (error) {
      console.error(`Error ${action}ing verification:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerificationReasonConfirm = (reason: string, customReason?: string) => {
    const finalReason = customReason || reason;
    executeVerificationAction('reject', finalReason);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
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
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <BarChart3 className="h-5 w-5" />
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
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <Users className="h-5 w-5 group-hover:text-blue-600" />
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
                <p className="text-sm font-medium text-gray-900 truncate">{adminUser?.username || 'Admin'}</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            <button
              onClick={() => {
                handleLogout();
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
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="bg-blue-100 p-1.5 md:p-2 rounded-lg">
                  <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <h1 className="text-lg md:text-xl font-semibold text-gray-900">Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={loadDashboardData}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-3 md:p-6">
          {/* Stats Cards */}
          <div className="space-y-3 md:space-y-6 mb-4 md:mb-8">
            {/* Upper Row - 3 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="p-1.5 md:p-3 bg-blue-100 rounded-full flex-shrink-0">
                  <Users className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 md:mt-4 flex items-center text-xs md:text-sm">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-1" />
                <span className="text-green-600">+{stats.newUsersToday} today</span>
              </div>
            </div>

            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Total Offers</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalOffers}</p>
                </div>
                <div className="p-1.5 md:p-3 bg-green-100 rounded-full flex-shrink-0">
                  <Package className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 md:mt-4 flex items-center text-xs md:text-sm">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-1" />
                <span className="text-green-600">{stats.activeOffers} active</span>
              </div>
            </div>

            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
                </div>
                <div className="p-1.5 md:p-3 bg-yellow-100 rounded-full flex-shrink-0">
                  <ShoppingCart className="h-4 w-4 md:h-6 md:w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-2 md:mt-4 flex items-center text-xs md:text-sm">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-gray-500 mr-1" />
                <span className="text-gray-600">All transaction types</span>
              </div>
            </div>

            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Sales Turn</p>
                  <p className="text-sm md:text-2xl font-bold text-gray-900">HK${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-1.5 md:p-3 bg-green-100 rounded-full flex-shrink-0">
                  <DollarSign className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 md:mt-4 flex items-center text-xs md:text-sm">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-1" />
                <span className="text-green-600">Approved transactions only</span>
              </div>
            </div>
            </div>

            {/* Lower Row - 3 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Platform Fee Earnings</p>
                  <p className="text-sm md:text-2xl font-bold text-gray-900">HK${stats.platformFeeTotal.toLocaleString()}</p>
                </div>
                <div className="p-1.5 md:p-3 bg-purple-100 rounded-full flex-shrink-0">
                  <DollarSign className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 md:mt-4 flex items-center text-xs md:text-sm">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-1" />
                <span className="text-green-600">3% fee rate (approved only)</span>
              </div>
            </div>

            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Sales per Day</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.salesPerDayPercentage}%</p>
                </div>
                <div className="p-1.5 md:p-3 bg-orange-100 rounded-full flex-shrink-0">
                  <BarChart3 className="h-4 w-4 md:h-6 md:w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-2 md:mt-4 flex items-center text-xs md:text-sm">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-orange-500 mr-1" />
                <span className="text-orange-600">vs 7-day average</span>
              </div>
            </div>

            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Completed Orders</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
                </div>
                <div className="p-1.5 md:p-3 bg-emerald-100 rounded-full flex-shrink-0">
                  <Activity className="h-4 w-4 md:h-6 md:w-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-2 md:mt-4 flex items-center text-xs md:text-sm">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-1" />
                <span className="text-green-600">Successfully delivered</span>
              </div>
            </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent Activity</h3>
                <div className="text-xs md:text-sm text-gray-500">
                  {filteredActivity.length} of {recentActivity.length} activities
                </div>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {/* Activity Type Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Activity Type</label>
                  <select
                    value={activityTypeFilter}
                    onChange={(e) => setActivityTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="user">New Users</option>
                    <option value="offer">New Offers</option>
                    <option value="transaction">Purchases</option>
                    <option value="verification">Verification</option>
                    <option value="report">Reports</option>
                    <option value="delivery_reminder">Delivery Reminders</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>

                {/* Search Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search activities..."
                    className="w-full px-3 py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Clear Filters Button */}
              {(activityTypeFilter !== 'all' || statusFilter !== 'all' || dateRangeFilter !== 'all' || searchFilter.trim()) && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      setActivityTypeFilter('all');
                      setStatusFilter('all');
                      setDateRangeFilter('all');
                      setSearchFilter('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 md:p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredActivity.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {filteredActivity.map((activity) => (
                    <div 
                      key={activity.id} 
                      className={`flex items-start md:items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-gray-50 rounded-lg transition-colors duration-200 ${activity.status === 'pending_review' ? 'border-l-4 border-orange-400 bg-orange-50' : ''} ${
                        activity.id && activity.id.startsWith('receipt_') 
                          ? 'cursor-default' 
                          : 'cursor-pointer hover:bg-gray-100'
                      }`}
                      onClick={() => handleActivityClick(activity)}
                    >
                      <div className="flex-shrink-0">
                        {activity.type === 'user' ? (
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                        ) : activity.type === 'offer' ? (
                          <div className="p-2 bg-green-100 rounded-full">
                            <Package className="h-4 w-4 text-green-600" />
                          </div>
                        ) : activity.type === 'verification' ? (
                          <div className="p-2 bg-purple-100 rounded-full">
                            <FileText className="h-4 w-4 text-purple-600" />
                          </div>
                        ) : activity.type === 'delivery_reminder' ? (
                          <div className="p-2 bg-yellow-100 rounded-full">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          </div>
                        ) : activity.type === 'report' ? (
                          <div className="p-2 bg-red-100 rounded-full">
                            <FileText className="h-4 w-4 text-red-600" />
                          </div>
                        ) : activity.status === 'pending_review' ? (
                          <div className="p-2 bg-orange-100 rounded-full">
                            <Receipt className="h-4 w-4 text-orange-600" />
                          </div>
                        ) : (
                          <div className="p-2 bg-yellow-100 rounded-full">
                            <ShoppingCart className="h-4 w-4 text-yellow-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm md:text-base font-semibold text-gray-900 mb-1">{activity.title}</p>
                        <p className="text-xs md:text-sm text-gray-600 truncate">{activity.description}</p>
                        {activity.status === 'pending_review' && activity.type === 'transaction' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePaymentReceiptClick(activity);
                            }}
                            className="mt-2 inline-flex items-center px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-medium rounded-lg transition-colors duration-200"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Review Payment Receipt
                          </button>
                        )}
                        {activity.type === 'verification' && activity.status === 'pending_review' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerificationDocumentClick(activity);
                            }}
                            className="mt-2 inline-flex items-center px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-medium rounded-lg transition-colors duration-200"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Review Verification Documents
                          </button>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-gray-500">
                          {formatHKDate(new Date(activity.timestamp))}
                        </p>
                        <p className="text-xs text-gray-400 hidden md:block">
                          {formatHKTime(new Date(activity.timestamp))}
                        </p>
                        {activity.status && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                            activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            activity.status === 'pending_review' ? 'bg-orange-100 text-orange-800' :
                            activity.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.status === 'approved' ? 'Approved' :
                             activity.status === 'pending' ? 'Pending' :
                             activity.status === 'pending_review' ? 'Review Required' :
                             activity.status === 'active' ? 'Active' :
                             activity.status === 'rejected' ? 'Rejected' :
                             activity.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  {recentActivity.length === 0 ? (
                    <p className="text-gray-500">No recent activity</p>
                  ) : (
                    <div>
                      <p className="text-gray-500">No activities match your filters</p>
                      <button
                        onClick={() => {
                          setActivityTypeFilter('all');
                          setStatusFilter('all');
                          setDateRangeFilter('all');
                          setSearchFilter('');
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Clear filters to see all activities
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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

      {/* Payment Receipt Review Modal */}
      {showPaymentModal && selectedPurchase && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPaymentModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Receipt className="h-5 w-5 mr-2 text-orange-600" />
                    Payment Receipt Review
                  </h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Purchase Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Purchase Details</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Purchase ID:</span>
                        <span className="text-sm font-medium">{selectedPurchase.id}</span>
                      </div>
                      {selectedPurchase.paymentReference && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Payment Reference:</span>
                          <span className="text-sm font-medium text-blue-600 font-mono">{selectedPurchase.paymentReference}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Amount:</span>
                        <span className="text-sm font-medium">HK${selectedPurchase.totalAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Platform Fee:</span>
                        <span className="text-sm font-medium">HK${selectedPurchase.platformFee?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payment Method:</span>
                        <span className="text-sm font-medium capitalize">{selectedPurchase.paymentMethod?.replace('-', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Purchase Date:</span>
                        <span className="text-sm font-medium">{formatHKDateTime(new Date(selectedPurchase.purchaseDate || selectedPurchase.timestamp))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Seller:</span>
                        <span className="text-sm font-medium">
                          {users.find(user => user.id === selectedPurchase.sellerId)?.company || 'Unknown Seller'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Buyer:</span>
                        <span className="text-sm font-medium">
                          {users.find(user => user.id === selectedPurchase.buyerId)?.company || 'Unknown Buyer'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Receipt */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Payment Receipt</h4>
                    {selectedPurchase.paymentDetails?.receiptPreview ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        {selectedPurchase.paymentDetails.receiptFile && selectedPurchase.paymentDetails.receiptFile.match(/\.(pdf)$/i) ? (
                          // PDF Document Preview
                          <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <div className="h-full flex flex-col">
                              {/* PDF Header */}
                              <div className="bg-red-50 px-3 py-2 border-b border-red-200 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-red-500" />
                                  <span className="text-sm font-medium text-red-700">PDF 收據</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      if (selectedPurchase.paymentDetails?.receiptPreview) {
                                        console.log('Opening PDF in new window:', selectedPurchase.paymentDetails.receiptPreview);
                                        
                                        // Try to open in new window
                                        const newWindow = window.open(selectedPurchase.paymentDetails.receiptPreview, '_blank', 'noopener,noreferrer');
                                        
                                        // Check if popup was blocked
                                        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                          console.warn('Popup blocked, trying alternative method');
                                          
                                          // Alternative 1: Try with different window features
                                          const altWindow = window.open(selectedPurchase.paymentDetails.receiptPreview, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
                                          
                                          if (!altWindow || altWindow.closed || typeof altWindow.closed == 'undefined') {
                                            console.warn('Alternative popup also blocked, using direct navigation');
                                            
                                            // Alternative 2: Create a temporary link and click it
                                            const link = document.createElement('a');
                                            link.href = selectedPurchase.paymentDetails.receiptPreview;
                                            link.target = '_blank';
                                            link.rel = 'noopener noreferrer';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            
                                          }
                                        } else {
                                          console.log('PDF opened successfully in new window');
                                        }
                                      } else {
                                        console.error('No PDF URL available');
                                        alert('PDF文件不可用');
                                      }
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 flex items-center px-2 py-1 rounded border border-red-200 hover:bg-red-100 transition-colors duration-200"
                                    title="在新視窗中打開PDF"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    新視窗預覽
                                  </button>
                                </div>
                              </div>
                              
                              {/* PDF Content */}
                              <div className="flex-1 relative bg-gray-100">
                                <iframe
                                  src={`${selectedPurchase.paymentDetails.receiptPreview}#toolbar=0&navpanes=0&scrollbar=1&zoom=fit&view=FitH`}
                                  className="w-full h-full border-0"
                                  title="付款收據 PDF"
                                  onError={(e) => {
                                    console.log('PDF iframe failed to load:', selectedPurchase.paymentDetails?.receiptPreview);
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
                                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">PDF 無法預覽</h4>
                                    <p className="text-xs text-gray-500 mb-3">請點擊預覽按鈕查看</p>
                                    <button
                                      onClick={() => {
                                        if (selectedPurchase.paymentDetails?.receiptPreview) {
                                          console.log('Opening PDF in new window (fallback):', selectedPurchase.paymentDetails.receiptPreview);
                                          
                                          // Try to open in new window
                                          const newWindow = window.open(selectedPurchase.paymentDetails.receiptPreview, '_blank', 'noopener,noreferrer');
                                          
                                          // Check if popup was blocked
                                          if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                            console.warn('Popup blocked, trying alternative method (fallback)');
                                            
                                            // Alternative: Create a temporary link and click it
                                            const link = document.createElement('a');
                                            link.href = selectedPurchase.paymentDetails.receiptPreview;
                                            link.target = '_blank';
                                            link.rel = 'noopener noreferrer';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            
                                          } else {
                                            console.log('PDF opened successfully in new window (fallback)');
                                          }
                                        }
                                      }}
                                      className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors duration-200"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      在新標籤頁打開
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Image Document Preview
                          <img
                            src={selectedPurchase.paymentDetails.receiptPreview}
                            alt="Payment Receipt"
                            className="w-full h-auto rounded-lg border border-gray-200"
                            onError={(e) => {
                              console.log('Image failed to load:', selectedPurchase.paymentDetails?.receiptPreview);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              
                              // Show fallback content
                              const fallbackDiv = target.nextElementSibling as HTMLElement;
                              if (fallbackDiv) {
                                fallbackDiv.style.display = 'flex';
                              }
                            }}
                          />
                        )}
                        
                        {/* Fallback for image failure */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200" style={{display: 'none'}}>
                          <div className="text-center">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <h4 className="text-sm font-medium text-gray-900 mb-2">圖片無法顯示</h4>
                            <p className="text-xs text-gray-500 mb-3">請檢查文件格式</p>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Receipt File: {selectedPurchase.paymentDetails.receiptFile}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No receipt preview available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectPayment}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 flex items-center"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </button>
                  <button
                    onClick={handleApprovePayment}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200 flex items-center"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Document Review Modal */}
      {showVerificationModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-[60]">
          <div className="relative top-10 mx-auto p-5 max-w-4xl">
            <div className="bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Verification Documents Review</h3>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-4">
                {/* User Information */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">User Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Company:</span>
                      <p className="font-medium">{selectedUser.company}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p className="font-medium capitalize">{selectedUser.verificationStatus || 'Pending'}</p>
                    </div>
                  </div>
                </div>

                {/* Verification Documents */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Verification Documents</h4>
                  {selectedUser.verificationDocuments ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(selectedUser.verificationDocuments).map(([docType, docUrl]) => {
                        const isImage = typeof docUrl === 'string' && 
                          (docUrl.toLowerCase().includes('.jpg') || 
                           docUrl.toLowerCase().includes('.jpeg') || 
                           docUrl.toLowerCase().includes('.png') || 
                           docUrl.toLowerCase().includes('.gif') || 
                           docUrl.toLowerCase().includes('.webp'));
                        
                        const isPdf = typeof docUrl === 'string' && docUrl.toLowerCase().includes('.pdf');
                        
                        return (
                          <div key={docType} className="border rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-3 capitalize">
                              {docType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </h5>
                            <div className="bg-gray-50 rounded-lg p-3">
                              {isImage ? (
                                <div className="space-y-2">
                                  <img
                                    src={docUrl as string}
                                    alt={`${docType} document`}
                                    className="w-full h-auto max-h-64 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                                    onClick={() => handleImageClick(docUrl as string, docType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()))}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                  <div className="hidden text-center">
                                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 mb-2">Image preview not available</p>
                                    <a
                                      href={docUrl as string}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View Document
                                    </a>
                                  </div>
                                  <div className="text-center">
                                    <a
                                      href={docUrl as string}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View Full Size
                                    </a>
                                  </div>
                                </div>
                              ) : isPdf ? (
                                <div className="space-y-2">
                                  {/* PDF Document Preview */}
                                  <div className="w-full h-64 border border-gray-200 rounded-lg overflow-hidden bg-white">
                                    <div className="h-full flex flex-col">
                                      <div className="bg-red-50 px-3 py-2 border-b border-red-200 flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <FileText className="h-4 w-4 text-red-500" />
                                          <span className="text-sm font-medium text-red-700">PDF 文件</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => {
                                              console.log('Opening verification PDF in new window:', docUrl);
                                              const newWindow = window.open(docUrl as string, '_blank', 'noopener,noreferrer');
                                              if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                                const link = document.createElement('a');
                                                link.href = docUrl as string;
                                                link.target = '_blank';
                                                link.rel = 'noopener noreferrer';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                              }
                                            }}
                                            className="text-xs text-red-600 hover:text-red-800 flex items-center px-2 py-1 rounded border border-red-200 hover:bg-red-100 transition-colors duration-200"
                                            title="在新視窗中打開PDF"
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            預覽PDF
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {/* PDF Content */}
                                      <div className="flex-1 relative bg-gray-100">
                                        <iframe
                                          src={`${docUrl}#toolbar=0&navpanes=0&scrollbar=1&zoom=fit&view=FitH`}
                                          className="w-full h-full border-0"
                                          title={`${docType} PDF`}
                                          onError={(e) => {
                                            console.log('PDF iframe failed to load:', docUrl);
                                            const target = e.target as HTMLIFrameElement;
                                            target.style.display = 'none';
                                            const fallback = target.nextElementSibling as HTMLElement;
                                            if (fallback) {
                                              fallback.style.display = 'flex';
                                            }
                                          }}
                                        />
                                        
                                        {/* Fallback for iframe failure */}
                                        <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center text-center p-6" style={{ display: 'none' }}>
                                          <FileText className="h-12 w-12 text-gray-400 mb-4" />
                                          <h4 className="text-sm font-medium text-gray-900 mb-2">PDF 無法預覽</h4>
                                          <p className="text-xs text-gray-500 mb-3">請點擊預覽按鈕查看</p>
                                          <button
                                            onClick={() => {
                                              const newWindow = window.open(docUrl as string, '_blank', 'noopener,noreferrer');
                                              if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                                const link = document.createElement('a');
                                                link.href = docUrl as string;
                                                link.target = '_blank';
                                                link.rel = 'noopener noreferrer';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                              }
                                            }}
                                            className="text-xs text-red-600 hover:text-red-800 flex items-center px-3 py-2 rounded border border-red-200 hover:bg-red-100 transition-colors duration-200"
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            在新標籤頁打開
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Download Button */}
                                  <div className="text-center">
                                    <a
                                      href={docUrl as string}
                                      download
                                      className="inline-flex items-center px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      下載
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <div className="bg-gray-100 rounded-lg p-4 mb-3">
                                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-700 font-medium">Document</p>
                                    <p className="text-xs text-gray-500">Click to view</p>
                                  </div>
                                  <a
                                    href={docUrl as string}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Document
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No verification documents uploaded.</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleVerificationAction('reject')}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 flex items-center"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerificationAction('approve')}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200 flex items-center"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Reason Modal */}
      {showVerificationReasonModal && selectedUser && (
        <VerificationReasonModal
          isOpen={showVerificationReasonModal}
          onClose={() => setShowVerificationReasonModal(false)}
          onConfirm={handleVerificationReasonConfirm}
          action="reject"
          userEmail={selectedUser.email}
          isLoading={actionLoading}
        />
      )}

      {/* Image Zoom Modal */}
      {showImageZoomModal && selectedImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[70]">
          <div className="relative max-w-7xl max-h-[90vh] w-full mx-4">
            {/* Close button */}
            <button
              onClick={handleCloseImageZoom}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Main image */}
            <div className="flex items-center justify-center h-full">
              <img
                src={selectedImageUrl}
                alt={selectedImageTitle}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
            
            {/* Image title */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">{selectedImageTitle}</p>
            </div>
          </div>
        </div>
      )}

      {/* Activity Details Modal */}
      <ActivityDetailsModal
        isOpen={showActivityDetailsModal}
        onClose={() => setShowActivityDetailsModal(false)}
        activity={selectedActivity}
      />
    </div>
  );
}