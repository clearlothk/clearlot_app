import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  XCircle,
  Shield,
  DollarSign,
  Calendar,
  ArrowUpDown,
  BarChart3,
  Users,
  Package,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  X,
  MapPin,
  Clock,
  CreditCard,
  Receipt,
  Download,
  AlertTriangle,
  FileText,
  Truck,
  Send,
  Building,
  Camera,
  ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllPurchasesForAdmin,
  getOfferById,
  getUserById,
  updatePurchaseApprovalStatus,
  updatePurchasePaymentStatus,
  updateTransactionApprovalStatus, 
  updateTransactionPaymentStatus,
  updateTransactionWithAdminNotes,
  markLogisticsArranged,
  markPurchaseCompleted
} from '../services/firebaseService';
import { Purchase, Offer, AuthUser } from '../types';
import OrderProgressTracker from './OrderProgressTracker';
import { formatPhoneForDisplay } from '../utils/phoneUtils';
import { convertToHKTime, formatHKDate, formatHKTime } from '../utils/dateUtils';



export default function AdminTransactionsPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('purchaseDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Purchase & {
    offer?: Offer | null;
    buyer?: AuthUser | null;
    seller?: AuthUser | null;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
  } | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showShippingPhotoModal, setShowShippingPhotoModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);

  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [transactions, setTransactions] = useState<Purchase[]>([]);
  const [enhancedTransactions, setEnhancedTransactions] = useState<Array<Purchase & {
    offer?: Offer | null;
    buyer?: AuthUser | null;
    seller?: AuthUser | null;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    const adminData = localStorage.getItem('adminUser');
    
    if (!isAuthenticated || !adminData) {
      navigate('/hk/admin/login');
      return;
    }

    setAdminUser(JSON.parse(adminData));
    fetchTransactions();
  }, [navigate]);

  const fetchEnhancedData = async (purchases: Purchase[]) => {
    const enhanced = await Promise.all(
      purchases.map(async (purchase) => {
        const [offer, buyer, seller] = await Promise.all([
          getOfferById(purchase.offerId),
          getUserById(purchase.buyerId),
          getUserById(purchase.sellerId)
        ]);
        
        return {
          ...purchase,
          offer,
          buyer,
          seller
        };
      })
    );
    
    setEnhancedTransactions(enhanced);
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const transactionsData = await getAllPurchasesForAdmin();
      setTransactions(transactionsData);
      
      // Fetch enhanced data
      await fetchEnhancedData(transactionsData);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setError(error.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = enhancedTransactions.filter(transaction => {
    const offerTitle = transaction.offer?.title || '';
    const buyerName = transaction.buyer?.company || '';
    const sellerName = transaction.seller?.company || '';
    
    const matchesSearch = offerTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.offerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (transaction.paymentDetails?.transactionId && transaction.paymentDetails.transactionId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPaymentStatus = paymentStatusFilter === 'all' || transaction.status === paymentStatusFilter;
    const matchesApprovalStatus = approvalStatusFilter === 'all' || transaction.status === approvalStatusFilter;
    
    return matchesSearch && matchesPaymentStatus && matchesApprovalStatus;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'amount':
        aValue = a.finalAmount;
        bValue = b.finalAmount;
        break;
      case 'transactionDate':
        aValue = new Date(a.purchaseDate);
        bValue = new Date(b.purchaseDate);
        break;
      case 'paymentDate':
        aValue = a.paymentDetails?.timestamp ? new Date(a.paymentDetails.timestamp) : new Date(0);
        bValue = b.paymentDetails?.timestamp ? new Date(b.paymentDetails.timestamp) : new Date(0);
        break;
      default:
        aValue = new Date(a.purchaseDate);
        bValue = new Date(b.purchaseDate);
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Approved</span>;
      case 'shipped':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Shipped</span>;
      case 'delivered':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Delivered</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>;
      case 'refunded':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Refunded</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'fps':
        return <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">FPS</div>;
      case 'payme':
        return <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">PM</div>;
      case 'bank_transfer':
        return <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">BT</div>;
      case 'stripe':
        return <CreditCard className="h-6 w-6 text-blue-600" />;
      default:
        return <DollarSign className="h-6 w-6 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const hkDate = convertToHKTime(dateString);
      return formatHKDate(hkDate);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const hkDate = convertToHKTime(timestamp);
      const now = convertToHKTime(new Date().toISOString());
      const diffInHours = (now.getTime() - hkDate.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        return formatHKDate(hkDate);
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid Time';
    }
  };

  const handleViewReceipt = (transaction: Purchase & {
    offer?: Offer | null;
    buyer?: AuthUser | null;
    seller?: AuthUser | null;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
  }) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  const handleApproveTransaction = async (purchaseId: string) => {
    try {
      setActionLoading(true);
      await updatePurchaseApprovalStatus(purchaseId, 'approved', adminNotes);
      
      // Update the transaction locally without refreshing the entire table
      setEnhancedTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction.id === purchaseId 
            ? { 
                ...transaction, 
                approvalStatus: 'approved',
                status: 'approved'
              }
            : transaction
        )
      );
      
      setAdminNotes('');
    } catch (error: any) {
      console.error('Error approving purchase:', error);
      setError(error.message || 'Failed to approve purchase');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTransaction = async (purchaseId: string) => {
    try {
      setActionLoading(true);
      await updatePurchaseApprovalStatus(purchaseId, 'rejected', adminNotes);
      
      // Update the transaction locally without refreshing the entire table
      setEnhancedTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction.id === purchaseId 
            ? { 
                ...transaction, 
                approvalStatus: 'rejected',
                status: 'rejected'
              }
            : transaction
        )
      );
      
      setAdminNotes('');
    } catch (error: any) {
      console.error('Error rejecting purchase:', error);
      setError(error.message || 'Failed to reject purchase');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle shipping approval
  const handleShippingApproval = async (purchaseId: string) => {
    try {
      setActionLoading(true);
      await updatePurchasePaymentStatus(purchaseId, 'shipped');
      
      // Update the transaction locally
      setEnhancedTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction.id === purchaseId 
            ? { ...transaction, status: 'shipped' }
            : transaction
        )
      );
      
      setShowShippingModal(false);
    } catch (error: any) {
      console.error('Error approving shipping:', error);
      setError(error.message || 'Failed to approve shipping');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delivery completion
  const handleDeliveryCompletion = async (purchaseId: string) => {
    try {
      setActionLoading(true);
      await markPurchaseCompleted(purchaseId);
      
      // Update the transaction locally
      setEnhancedTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction.id === purchaseId 
            ? { ...transaction, status: 'completed' }
            : transaction
        )
      );
      
      setShowDeliveryModal(false);
    } catch (error: any) {
      console.error('Error completing delivery:', error);
      setError(error.message || 'Failed to complete delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentStatusChange = async (purchaseId: string, newStatus: 'pending' | 'approved' | 'rejected' | 'shipped' | 'delivered' | 'completed') => {
    try {
      setActionLoading(true);
      await updatePurchasePaymentStatus(purchaseId, newStatus);
      
      // Update the transaction locally without refreshing the entire table
      setEnhancedTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction.id === purchaseId 
            ? { 
                ...transaction, 
                status: newStatus,
                // If payment status is rejected, also set approval status to rejected
                approvalStatus: newStatus === 'rejected' ? 'rejected' : transaction.approvalStatus
              }
            : transaction
        )
      );
      
      // Clear any previous errors
      setError(null);
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      setError(error.message || 'Failed to update payment status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovalStatusChange = async (purchaseId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      setActionLoading(true);
      await updatePurchaseApprovalStatus(purchaseId, newStatus);
      
      // Update the transaction locally without refreshing the entire table
      setEnhancedTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction.id === purchaseId 
            ? { ...transaction, approvalStatus: newStatus }
            : transaction
        )
      );
      
      // Clear any previous errors
      setError(null);
    } catch (error: any) {
      console.error('Error updating approval status:', error);
      setError(error.message || 'Failed to update approval status');
    } finally {
      setActionLoading(false);
    }
  };



  const handleMarkLogisticsArranged = async () => {
    if (!selectedTransaction) return;
    
    try {
      setActionLoading(true);
      await markLogisticsArranged(selectedTransaction.id);
      await fetchTransactions();
      setShowLogisticsModal(false);
    } catch (error: any) {
      console.error('Error marking logistics arranged:', error);
      setError(error.message || 'Failed to mark logistics arranged');
    } finally {
      setActionLoading(false);
    }
  };



  const openLogisticsModal = (transaction: Purchase & {
    offer?: Offer | null;
    buyer?: AuthUser | null;
    seller?: AuthUser | null;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
  }) => {
    setSelectedTransaction(transaction);
    setShowLogisticsModal(true);
  };

  if (!adminUser) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTransactions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform -translate-x-full transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0">
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
          <nav className="flex-1 px-4 py-6 space-y-2">
            {/* Main Navigation */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Main
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => navigate('/hk/admin/dashboard')}
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
                  onClick={() => navigate('/hk/admin/users')}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <Users className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Users</span>
                </button>
                
                <button
                  onClick={() => navigate('/hk/admin/offers')}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <Package className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Offers</span>
                </button>
                
                <button
                  onClick={() => navigate('/hk/admin/transactions')}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Transactions</span>
                </button>
                
                <button
                  onClick={() => navigate('/hk/admin/messages')}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <MessageCircle className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Messages</span>
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
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/hk/admin/dashboard')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <ShoppingCart className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">Transactions Management</h2>
            </div>
            <div className="flex items-center space-x-4">
              {actionLoading && (
                <div className="flex items-center space-x-1 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-xs">Updating...</span>
                </div>
              )}
              <button
                onClick={fetchTransactions}
                disabled={actionLoading}
                className={`p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Refresh transactions"
              >
                <div className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </button>
              <div className="text-sm text-gray-600">
                {sortedTransactions.length} transactions
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Order Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
              </select>
              
              <select
                value={approvalStatusFilter}
                onChange={(e) => setApprovalStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Approval Details</option>
                <option value="pending">Payment Pending</option>
                <option value="approved">Payment Approved</option>
                <option value="rejected">Payment Rejected</option>
                <option value="shipping_pending">Shipping Pending</option>
                <option value="shipping_approved">Shipping Approved</option>
                <option value="shipping_rejected">Shipping Rejected</option>
              </select>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{sortedTransactions.length} transactions</span>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase ID
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Amount</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Details
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('transactionDate')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {transaction.offer?.images && transaction.offer.images.length > 0 ? (
                              <img 
                                src={transaction.offer.images[0]} 
                                alt="Product"
                                className="h-10 w-10 rounded-lg object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center ${transaction.offer?.images && transaction.offer.images.length > 0 ? 'hidden' : ''}`}>
                              <DollarSign className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.offer?.title || `Offer ID: ${transaction.offerId}`}
                            </div>
                            <div className="text-sm text-gray-500">Qty: {transaction.quantity}</div>
                            <div className="flex items-center mt-1 space-x-2">
                              <span className="text-xs text-gray-500">
                                Buyer: {transaction.buyer?.company || transaction.buyerId}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                Seller: {transaction.seller?.company || transaction.sellerId}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border">
                          {transaction.id}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {transaction.paymentDetails?.transactionId || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(transaction.unitPrice)}</div>
                        <div className="text-sm text-gray-500">Fee: {formatCurrency(transaction.platformFee)}</div>
                        <div className="text-sm font-semibold text-gray-900">Total: {formatCurrency(transaction.finalAmount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(transaction.paymentMethod)}
                          <span className="text-sm text-gray-900 capitalize">
                            {transaction.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <select
                            value={transaction.status}
                            onChange={(e) => handlePaymentStatusChange(transaction.id, e.target.value as 'pending' | 'approved' | 'rejected' | 'shipped' | 'delivered' | 'completed')}
                            disabled={actionLoading}
                            className={`text-xs px-2 py-1 rounded border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="completed">Completed</option>
                          </select>
                          {transaction.shippingDetails?.shippingPhoto && (
                            <div className="text-xs text-green-600 flex items-center">
                              <Camera className="h-3 w-3 mr-1" />
                              Photo uploaded
                            </div>
                          )}
                          {transaction.shippingDetails?.trackingNumber && (
                            <div className="text-xs text-blue-600 flex items-center">
                              <Truck className="h-3 w-3 mr-1" />
                              Tracking: {transaction.shippingDetails.trackingNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getPaymentStatusBadge(transaction.status)}
                          {transaction.paymentApprovalStatus && (
                            <div className={`text-xs flex items-center ${
                              transaction.paymentApprovalStatus === 'approved' ? 'text-green-600' :
                              transaction.paymentApprovalStatus === 'rejected' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Payment: {transaction.paymentApprovalStatus}
                            </div>
                          )}
                          {(transaction.shippingApprovalStatus || transaction.status === 'delivered' || transaction.status === 'completed') && (
                            <div className={`text-xs flex items-center ${
                              transaction.status === 'delivered' || transaction.status === 'completed' ? 'text-green-600' :
                              transaction.shippingApprovalStatus === 'approved' ? 'text-green-600' :
                              transaction.shippingApprovalStatus === 'rejected' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              <Truck className="h-3 w-3 mr-1" />
                              Shipping: {transaction.status === 'delivered' || transaction.status === 'completed' ? 'completed' : transaction.shippingApprovalStatus}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{formatDate(transaction.purchaseDate)}</div>
                        <div className="text-xs">{formatTime(transaction.purchaseDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleViewReceipt(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {transaction.paymentDetails?.receiptPreview && (
                            <button className="text-green-600 hover:text-green-900">
                              <Download className="h-4 w-4" />
                            </button>
                          )}

                          {transaction.status === 'approved' && (
                            <button 
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowShippingModal(true);
                              }}
                              title="View Shipping Details & Approve"
                            >
                              <Truck className="h-4 w-4" />
                            </button>
                          )}
                          {transaction.status === 'shipped' && (
                            <button 
                              className="text-green-600 hover:text-green-900"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowShippingModal(true);
                              }}
                              title="View Delivery Details & Complete"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {transaction.status === 'delivered' && (
                            <button 
                              className="text-purple-600 hover:text-purple-900"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowShippingModal(true);
                              }}
                              title="View Delivery Details"
                            >
                              <Truck className="h-4 w-4" />
                            </button>
                          )}
                          {transaction.status === 'completed' && (
                            <button 
                              className="text-green-600 hover:text-green-900"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowShippingModal(true);
                              }}
                              title="View Completed Order Details"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button className="text-gray-600 hover:text-gray-900">
                            <MoreVertical className="h-4 w-4" />
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
              Showing <span className="font-medium">1</span> to <span className="font-medium">{sortedTransactions.length}</span> of{' '}
              <span className="font-medium">{transactions.length}</span> results
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

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Purchase Receipt</h3>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {selectedTransaction.offer?.title || `Offer ID: ${selectedTransaction.offerId}`}
                  </h4>
                  <p className="text-sm text-gray-500">Purchase ID: {selectedTransaction.id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Unit Price:</span>
                    <p className="font-medium">{formatCurrency(selectedTransaction.unitPrice)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Platform Fee:</span>
                    <p className="font-medium">{formatCurrency(selectedTransaction.platformFee)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <p className="font-medium">{formatCurrency(selectedTransaction.finalAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <p className="font-medium">{selectedTransaction.quantity}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Buyer:</span>
                    <span className="font-medium">{selectedTransaction.buyer?.company || selectedTransaction.buyerId}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Seller:</span>
                    <span className="font-medium">{selectedTransaction.seller?.company || selectedTransaction.sellerId}</span>
                  </div>
                </div>
                
                {selectedTransaction.paymentDetails?.receiptPreview && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Payment Receipt</h4>
                    {selectedTransaction.paymentDetails.receiptFile && selectedTransaction.paymentDetails.receiptFile.match(/\.(pdf)$/i) ? (
                      // PDF Document Preview
                      <div className="w-full h-80 border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <div className="h-full flex flex-col">
                          <div className="bg-red-50 px-3 py-2 border-b border-red-200 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-red-500" />
                              <span className="text-sm font-medium text-red-700">PDF 收據</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  if (selectedTransaction.paymentDetails?.receiptPreview) {
                                    console.log('Opening PDF in new window:', selectedTransaction.paymentDetails.receiptPreview);
                                    
                                    // Try to open in new window
                                    const newWindow = window.open(selectedTransaction.paymentDetails.receiptPreview, '_blank', 'noopener,noreferrer');
                                    
                                    // Check if popup was blocked
                                    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                      console.warn('Popup blocked, trying alternative method');
                                      
                                      // Alternative 1: Try with different window features
                                      const altWindow = window.open(selectedTransaction.paymentDetails.receiptPreview, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
                                      
                                      if (!altWindow || altWindow.closed || typeof altWindow.closed == 'undefined') {
                                        console.warn('Alternative popup also blocked, using direct navigation');
                                        
                                        // Alternative 2: Create a temporary link and click it
                                        const link = document.createElement('a');
                                        link.href = selectedTransaction.paymentDetails.receiptPreview;
                                        link.target = '_blank';
                                        link.rel = 'noopener noreferrer';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }
                                    }
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
                              src={`${selectedTransaction.paymentDetails.receiptPreview}#toolbar=0&navpanes=0&scrollbar=1&zoom=fit&view=FitH`}
                              className="w-full h-full border-0"
                              title="付款收據 PDF"
                              onError={(e) => {
                                console.log('PDF iframe failed to load:', selectedTransaction.paymentDetails?.receiptPreview);
                                const target = e.target as HTMLIFrameElement;
                                target.style.display = 'none';
                                
                                // Show fallback content
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
                                  if (selectedTransaction.paymentDetails?.receiptPreview) {
                                    console.log('Opening PDF in new window (fallback):', selectedTransaction.paymentDetails.receiptPreview);
                                    
                                    // Try to open in new window
                                    const newWindow = window.open(selectedTransaction.paymentDetails.receiptPreview, '_blank', 'noopener,noreferrer');
                                    
                                    // Check if popup was blocked
                                    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                      console.warn('Popup blocked, trying alternative method (fallback)');
                                      
                                      // Alternative: Create a temporary link and click it
                                      const link = document.createElement('a');
                                      link.href = selectedTransaction.paymentDetails.receiptPreview;
                                      link.target = '_blank';
                                      link.rel = 'noopener noreferrer';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }
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
                    ) : (
                      // Image Document Preview
                      <div className="flex justify-center">
                        <img
                          src={selectedTransaction.paymentDetails.receiptPreview}
                          alt="Payment Receipt"
                          className="max-w-full h-80 object-contain rounded-lg border border-gray-200"
                          onError={(e) => {
                            console.log('Image failed to load:', selectedTransaction.paymentDetails?.receiptPreview);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            
                            // Show fallback content
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                        
                        {/* Fallback for image failure */}
                        <div className="max-w-full h-80 flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-lg border border-gray-200" style={{ display: 'none' }}>
                          <FileText className="h-12 w-12 text-gray-400 mb-4" />
                          <h4 className="text-sm font-medium text-gray-900 mb-2">圖片無法載入</h4>
                          <p className="text-xs text-gray-500">請檢查收據文件是否正確</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      

      {/* Logistics Modal */}
      {showLogisticsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Logistics Arrangement</h3>
                <button
                  onClick={() => setShowLogisticsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {selectedTransaction.offer?.title || `Offer ID: ${selectedTransaction.offerId}`}
                  </h4>
                  <p className="text-sm text-gray-500">Purchase ID: {selectedTransaction.id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Seller:</span>
                    <p className="font-medium">{selectedTransaction.seller?.company || selectedTransaction.sellerId}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Contact:</span>
                    <p className="font-medium">{selectedTransaction.seller?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium">{selectedTransaction.seller?.phone ? formatPhoneForDisplay(selectedTransaction.seller.phone) : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <p className="font-medium">{selectedTransaction.offer?.location || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Send className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-blue-900">Seller Notification</h5>
                      <p className="text-sm text-blue-700 mt-1">
                        The seller has been notified about the approved purchase and should arrange logistics for delivery.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleMarkLogisticsArranged}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Truck className="h-4 w-4" />
                    )}
                    <span>Mark Arranged</span>
                  </button>
                  <button
                    onClick={() => setShowLogisticsModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Shipping Approval Modal */}
      {showShippingModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 max-w-4xl">
            <div className="bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Shipping Approval & Tracking</h3>
                <button
                  onClick={() => setShowShippingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                {/* Order Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Left Column - Order Details */}
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-3">Order Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Product:</span>
                          <span className="font-medium">{selectedTransaction.offer?.title || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{selectedTransaction.quantity} {selectedTransaction.offer?.unit || 'units'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-medium">{formatCurrency(selectedTransaction.finalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order Date:</span>
                          <span className="font-medium">{formatDate(selectedTransaction.purchaseDate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Buyer & Seller Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-3 flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Buyer
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{selectedTransaction.buyer?.company || selectedTransaction.buyerId}</p>
                          <p className="text-gray-600">{selectedTransaction.buyer?.email || 'N/A'}</p>
                          <p className="text-gray-600">{selectedTransaction.buyer?.phone ? formatPhoneForDisplay(selectedTransaction.buyer.phone) : 'N/A'}</p>
                        </div>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          Seller
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{selectedTransaction.seller?.company || selectedTransaction.sellerId}</p>
                          <p className="text-gray-600">{selectedTransaction.seller?.email || 'N/A'}</p>
                          <p className="text-gray-600">{selectedTransaction.seller?.phone ? formatPhoneForDisplay(selectedTransaction.seller.phone) : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Receipt Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                      <Receipt className="h-4 w-4 mr-2" />
                      Payment Receipt
                    </h4>
                    {selectedTransaction.paymentDetails?.receiptPreview ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700 font-medium">Receipt Status:</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Receipt Uploaded
                          </span>
                        </div>
                        <div className="bg-white rounded-lg border border-blue-200 p-3">
                          {selectedTransaction.paymentDetails.receiptFile && selectedTransaction.paymentDetails.receiptFile.match(/\.(pdf)$/i) ? (
                            // PDF Document Preview
                            <div className="w-full h-32 border border-gray-200 rounded overflow-hidden bg-white">
                              <div className="h-full flex flex-col">
                                <div className="bg-red-50 px-2 py-1 border-b border-red-200 flex items-center justify-between">
                                  <div className="flex items-center space-x-1">
                                    <FileText className="h-3 w-3 text-red-500" />
                                    <span className="text-xs font-medium text-red-700">PDF</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      console.log('Opening payment receipt PDF in new window:', selectedTransaction.paymentDetails?.receiptPreview);
                                      const newWindow = window.open(selectedTransaction.paymentDetails?.receiptPreview, '_blank', 'noopener,noreferrer');
                                      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                        const link = document.createElement('a');
                                        link.href = selectedTransaction.paymentDetails?.receiptPreview || '';
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
                                    src={`${selectedTransaction.paymentDetails.receiptPreview}#toolbar=0&navpanes=0&scrollbar=1&zoom=fit&view=FitH`}
                                    className="w-full h-full border-0"
                                    title="Payment Receipt PDF"
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
                                        const newWindow = window.open(selectedTransaction.paymentDetails?.receiptPreview, '_blank', 'noopener,noreferrer');
                                        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                          const link = document.createElement('a');
                                          link.href = selectedTransaction.paymentDetails?.receiptPreview || '';
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
                            // Image Document Preview
                            <img 
                              src={selectedTransaction.paymentDetails.receiptPreview}
                              alt="Payment Receipt"
                              className="w-full h-32 object-cover rounded border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QYXltZW50IHJlY2VpcHQgbm90IGF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+';
                              }}
                            />
                          )}
                          <div className="mt-2 text-xs text-gray-600 text-center">
                            <span>Receipt Preview</span>
                          </div>
                        </div>
                        {selectedTransaction.paymentDetails?.receiptFile && (
                          <div className="text-xs text-gray-600">
                            <strong>File:</strong> {selectedTransaction.paymentDetails.receiptFile}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No payment receipt uploaded yet</p>
                        <p className="text-xs text-gray-400 mt-1">Buyer needs to upload payment proof</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Shipping Details */}
                  <div className="space-y-4">
                    {/* Shipping Photo */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Camera className="h-4 w-4 mr-2" />
                        Shipping Photo
                      </h4>
                      {selectedTransaction.shippingDetails?.shippingPhotos && selectedTransaction.shippingDetails.shippingPhotos.length > 0 ? (
                        <div className="space-y-3">
                          {/* Show first photo as main preview */}
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            {(() => {
                              const firstPhoto = selectedTransaction.shippingDetails.shippingPhotos[0];
                              const isPdf = firstPhoto.match(/\.(pdf)$/i);
                              
                              return isPdf ? (
                                // PDF Document Preview
                                <div className="w-full h-32 border border-gray-200 rounded overflow-hidden bg-white">
                                  <div className="h-full flex flex-col">
                                    <div className="bg-red-50 px-2 py-1 border-b border-red-200 flex items-center justify-between">
                                      <div className="flex items-center space-x-1">
                                        <FileText className="h-3 w-3 text-red-500" />
                                        <span className="text-xs font-medium text-red-700">PDF</span>
                                      </div>
                                      <button
                                        onClick={() => {
                                          console.log('Opening shipping PDF in new window:', firstPhoto);
                                          const newWindow = window.open(firstPhoto, '_blank', 'noopener,noreferrer');
                                          if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                            const link = document.createElement('a');
                                            link.href = firstPhoto;
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
                                        src={`${firstPhoto}#toolbar=0&navpanes=0&scrollbar=1&zoom=fit&view=FitH`}
                                        className="w-full h-full border-0"
                                        title="Shipping PDF"
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
                                            const newWindow = window.open(firstPhoto, '_blank', 'noopener,noreferrer');
                                            if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                                              const link = document.createElement('a');
                                              link.href = firstPhoto;
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
                                // Image Document Preview
                                <img 
                                  src={firstPhoto}
                                  alt="Shipping Photo"
                                  className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => {
                                    setShowShippingPhotoModal(true);
                                  }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaGlwcGluZyBwaG90byBub3QgYXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4K';
                                  }}
                                />
                              );
                            })()}
                            <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                              <span>Click to view full size</span>
                              <button
                                onClick={() => {
                                  setShowShippingPhotoModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                View All Photos ({selectedTransaction.shippingDetails.shippingPhotos.length})
                              </button>
                            </div>
                          </div>
                          
                          {/* Show photo count and upload info */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{selectedTransaction.shippingDetails.shippingPhotos.length} photo(s) uploaded</span>
                            <span>Uploaded: {selectedTransaction.shippingDetails.shippedAt ? formatDate(selectedTransaction.shippingDetails.shippedAt) : 'N/A'}</span>
                          </div>
                        </div>
                      ) : selectedTransaction.shippingDetails?.shippingPhoto ? (
                        // Fallback to old single photo field for backward compatibility
                        <div className="space-y-3">
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <img 
                              src={selectedTransaction.shippingDetails.shippingPhoto}
                              alt="Shipping Photo"
                              className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                setShowShippingPhotoModal(true);
                              }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaGlwcGluZyBwaG90byBub3QgYXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4K';
                            }}
                          />
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                            <span>Click to view full size</span>
                            <button
                              onClick={() => {
                                setShowShippingPhotoModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Full Photo
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Uploaded: {selectedTransaction.shippingDetails.shippedAt ? formatDate(selectedTransaction.shippingDetails.shippedAt) : 'N/A'}
                        </p>
                      </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No shipping photo uploaded yet</p>
                        </div>
                      )}
                    </div>

                    {/* Order Progress Tracker */}
                    <OrderProgressTracker 
                      status={selectedTransaction.status} 
                      shippingDetails={selectedTransaction.shippingDetails}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  {selectedTransaction.status === 'approved' && (
                    <button
                      onClick={() => handleShippingApproval(selectedTransaction.id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Truck className="h-4 w-4" />
                      )}
                      <span>Approve Shipping</span>
                    </button>
                  )}
                  {selectedTransaction.status === 'shipped' && (
                    <button
                      onClick={() => handleDeliveryCompletion(selectedTransaction.id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <span>Mark as Delivered</span>
                    </button>
                  )}
                  {(selectedTransaction.status === 'delivered' || selectedTransaction.status === 'completed') && (
                    <div className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>
                        {selectedTransaction.status === 'delivered' ? 'Order Delivered' : 'Order Completed'}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setShowShippingModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Completion Modal */}
      {showDeliveryModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 max-w-md">
            <div className="bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Complete Delivery</h3>
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="text-center mb-4">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900">Confirm Delivery</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Are you sure you want to mark this order as completed?
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800">
                    <strong>Order:</strong> {selectedTransaction.offer?.title || 'N/A'}<br/>
                    <strong>Buyer:</strong> {selectedTransaction.buyer?.company || selectedTransaction.buyerId}<br/>
                    <strong>Amount:</strong> {formatCurrency(selectedTransaction.finalAmount)}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDeliveryCompletion(selectedTransaction.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span>Complete Order</span>
                  </button>
                  <button
                    onClick={() => setShowDeliveryModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Photo Modal */}
      {showShippingPhotoModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-[60]">
          <div className="relative top-10 mx-auto p-5 max-w-4xl">
            <div className="bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Shipping Photos</h3>
                <button
                  onClick={() => setShowShippingPhotoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-4">
                {/* Photo Display */}
                <div className="flex justify-center mb-6">
                  {(() => {
                    const photos = selectedTransaction.shippingDetails?.shippingPhotos || 
                                  (selectedTransaction.shippingDetails?.shippingPhoto ? [selectedTransaction.shippingDetails.shippingPhoto] : []);
                    
                    if (photos.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No shipping photos available</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-4">
                        {/* Main Photo Display */}
                <div className="flex justify-center">
                  <img 
                            src={photos[currentPhotoIndex]}
                            alt={`Shipping Photo ${currentPhotoIndex + 1}`}
                    className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaGlwcGluZyBwaG90byBub3QgYXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4K';
                    }}
                  />
                </div>
                
                        {/* Photo Navigation (if multiple photos) */}
                        {photos.length > 1 && (
                          <div className="flex items-center justify-center space-x-4">
                                                         <button
                               onClick={() => setCurrentPhotoIndex((prev: number) => prev > 0 ? prev - 1 : photos.length - 1)}
                               className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                               disabled={photos.length <= 1}
                             >
                               <ChevronLeft className="h-5 w-5 text-gray-600" />
                             </button>
                            
                            <span className="text-sm text-gray-600 font-medium">
                              {currentPhotoIndex + 1} / {photos.length}
                            </span>
                            
                                                         <button
                               onClick={() => setCurrentPhotoIndex((prev: number) => prev < photos.length - 1 ? prev + 1 : 0)}
                               className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                               disabled={photos.length <= 1}
                             >
                               <ChevronLeft className="h-5 w-5 text-gray-600 rotate-180" />
                             </button>
                          </div>
                        )}
                        
                        {/* Photo Thumbnails (if multiple photos) */}
                        {photos.length > 1 && (
                          <div className="flex justify-center space-x-2">
                            {photos.map((photo: string, index: number) => (
                              <button
                                key={index}
                                onClick={() => setCurrentPhotoIndex(index)}
                                className={`w-16 h-16 rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                                  index === currentPhotoIndex 
                                    ? 'border-blue-500 ring-2 ring-blue-200' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <img 
                                  src={photo}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaGlwcGluZyBwaG90byBub3QgYXJpbGxhYmxlPC90ZXh0Pgo8L3N2Zz4K';
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Order Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Order Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Purchase ID:</span> {selectedTransaction.id}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Product:</span> {selectedTransaction.offer?.title || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Shipped Date:</span> {selectedTransaction.shippingDetails?.shippedAt ? formatDate(selectedTransaction.shippingDetails.shippedAt) : 'N/A'}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Total Photos:</span> {(() => {
                          const photos = selectedTransaction.shippingDetails?.shippingPhotos || 
                                        (selectedTransaction.shippingDetails?.shippingPhoto ? [selectedTransaction.shippingDetails.shippingPhoto] : []);
                          return photos.length;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 