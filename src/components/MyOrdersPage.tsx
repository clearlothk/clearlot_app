import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Purchase, Offer } from '../types';
import { formatDateForDisplay, getShortDate, getShortTime, convertToHKTime, formatHKDate, formatHKTime } from '../utils/dateUtils';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Building, 
  CheckCircle, 
  Clock,
  Filter,
  Search,
  ArrowUpDown,
  Eye,
  Loader2,
  XCircle,
  Truck,
  ArrowRight,
  Lock,
  AlertCircle
} from 'lucide-react';
import { canAccessMyOrders, getRestrictionMessage } from '../utils/userUtils';
import ShippingPhotoModal from './ShippingPhotoModal';
import DeliveryConfirmModal from './DeliveryConfirmModal';
import OrderDetailsModal from './OrderDetailsModal';
import PaymentReceiptModal from './PaymentReceiptModal';
import ShippingStatusModal from './ShippingStatusModal';
import ClearlotPaymentModal from './ClearlotPaymentModal';
import OrderRatingModal from './OrderRatingModal';
import SellerRatingModal from './SellerRatingModal';


interface PurchaseHistoryItem {
  id: string;
  offerTitle: string;
  supplier: string;
  quantity: number;
  unit: string;
  totalAmount: number;
  status: string;
  date: string;
  location: string;
  offerId: string;
  productImage?: string | null;
  paymentDetails?: any;
  paymentApprovalStatus?: string;
  shippingApprovalStatus?: string;
  shippingDetails?: any;
  deliveryDetails?: any;
  buyerId?: string;
  sellerId?: string;
  hasRating?: boolean;
  seller?: {
    name: string;
    company: string;
    avatar?: string;
    companyLogo?: string;
    email: string;
    phone: string;
  };
}

interface SalesHistoryItem {
  id: string;
  offerTitle: string;
  buyer: string; // Keep this for backward compatibility with existing code
  quantity: number;
  unit: string;
  totalAmount: number;
  status: string;
  date: string;
  location: string;
  offerId: string;
  productImage?: string;
  paymentDetails?: any;
  paymentApprovalStatus?: string;
  shippingApprovalStatus?: string;
  deliveryDetails?: any;
  shippingDetails?: any;
  sellerId?: string;
  hasRating?: boolean;
  buyerId?: string;
  buyerInfo?: { // Renamed to avoid conflict
    name: string;
    company: string;
    avatar?: string;
    companyLogo?: string;
    email: string;
    phone: string;
  };
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'mySales'>('mySales');
  const [searchTerm, setSearchTerm] = useState('');

  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
  const [salesHistory, setSalesHistory] = useState<SalesHistoryItem[]>([]);
  const [activeOrders, setActiveOrders] = useState<PurchaseHistoryItem[]>([]);
  const [activeSales, setActiveSales] = useState<SalesHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
  const [selectedPurchaseData, setSelectedPurchaseData] = useState<any>(null);
  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState<'purchase' | 'sale'>('purchase');
  const [paymentReceiptModalOpen, setPaymentReceiptModalOpen] = useState(false);
  const [selectedPaymentTransaction, setSelectedPaymentTransaction] = useState<any>(null);
  const [shippingStatusModalOpen, setShippingStatusModalOpen] = useState(false);
  const [clearlotPaymentModalOpen, setClearlotPaymentModalOpen] = useState(false);
  const [sellerRatingModalOpen, setSellerRatingModalOpen] = useState(false);
  const [selectedBuyerForRating, setSelectedBuyerForRating] = useState<any>(null);


  // Fetch purchase history from Firestore (only delivered orders)
  const fetchPurchaseHistory = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching purchase history for user:', user.id);
      
      const purchasesRef = collection(db, 'purchases');
      
      // First, let's check what statuses exist for this buyer
      const allPurchasesQuery = query(
        purchasesRef,
        where('buyerId', '==', user.id),
        orderBy('purchaseDate', 'desc')
      );
      const allPurchasesSnapshot = await getDocs(allPurchasesQuery);
      
      // Check if we have any purchases at all
      if (allPurchasesSnapshot.docs.length === 0) {
        console.log('No purchases found for this buyer');
        setPurchaseHistory([]);
        return;
      }
      
      // Log all statuses to see what we have
      const allStatuses = allPurchasesSnapshot.docs.map(doc => doc.data().status);
      console.log('All statuses found:', [...new Set(allStatuses)]);
      
      // Try to find delivered orders, or fall back to completed orders
      let deliveredOrders = allPurchasesSnapshot.docs.filter(doc => 
        doc.data().status === 'delivered' || doc.data().status === 'completed'
      );
      
      if (deliveredOrders.length === 0) {
        console.log('No delivered or completed orders found, showing all orders');
        deliveredOrders = allPurchasesSnapshot.docs;
      }
      
      const q = query(
        purchasesRef,
        where('buyerId', '==', user.id),
        where('status', 'in', ['delivered', 'completed']),
        orderBy('purchaseDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Purchase history query result:', querySnapshot.docs.length, 'documents');
      
      // Now use the deliveredOrders for processing
      const purchases: PurchaseHistoryItem[] = [];
      
      // Get all unique offer IDs and seller IDs from delivered orders
      const offerIds = [...new Set(deliveredOrders.map(doc => doc.data().offerId))];
      const sellerIds = [...new Set(deliveredOrders.map(doc => doc.data().sellerId))];
      
      // Fetch all offers in one query (only if there are offer IDs)
      const offersMap = new Map();
      if (offerIds.length > 0) {
        const offersQuery = query(collection(db, 'offers'), where('__name__', 'in', offerIds));
        const offersSnapshot = await getDocs(offersQuery);
        offersSnapshot.docs.forEach(doc => {
          offersMap.set(doc.id, doc.data() as Offer);
        });
      }
      
      // Fetch all seller user data in one query (only if there are seller IDs)
      const sellersMap = new Map();
      if (sellerIds.length > 0) {
        const sellersQuery = query(collection(db, 'users'), where('__name__', 'in', sellerIds));
        const sellersSnapshot = await getDocs(sellersQuery);
        sellersSnapshot.docs.forEach(doc => {
          sellersMap.set(doc.id, doc.data());
        });
      }
      
      for (const doc of deliveredOrders) {
        const purchaseData = doc.data() as Purchase;
        const offerData = offersMap.get(purchaseData.offerId);
        const sellerData = sellersMap.get(purchaseData.sellerId);
        
        if (offerData) {
          purchases.push({
            id: purchaseData.id,
            offerTitle: offerData.title,
            supplier: offerData.supplier.company,
            quantity: purchaseData.quantity,
            unit: offerData.unit,
            totalAmount: purchaseData.finalAmount,
            status: purchaseData.status,
            date: purchaseData.purchaseDate,
            location: offerData.location,
            offerId: purchaseData.offerId,
            productImage: offerData.images && offerData.images.length > 0 ? offerData.images[0] : undefined,
            paymentApprovalStatus: purchaseData.paymentApprovalStatus,
            shippingApprovalStatus: purchaseData.shippingApprovalStatus,
            paymentDetails: purchaseData.paymentDetails,
            deliveryDetails: purchaseData.deliveryDetails,
            shippingDetails: purchaseData.shippingDetails,
            buyerId: purchaseData.buyerId,
            sellerId: purchaseData.sellerId,
            hasRating: purchaseData.hasRating,
            seller: sellerData ? {
              name: sellerData.name || '',
              company: sellerData.company || '',
              avatar: sellerData.avatar || '',
              companyLogo: sellerData.companyLogo || '',
              email: sellerData.email || '',
              phone: sellerData.phone || ''
            } : undefined
          });
        } else {
          // Add purchase with fallback info if offer not found
          const sellerData = sellersMap.get(purchaseData.sellerId);
          purchases.push({
            id: purchaseData.id,
            offerTitle: '優惠已下架',
            supplier: sellerData?.company || '未知供應商',
            quantity: purchaseData.quantity,
            unit: '件',
            totalAmount: purchaseData.finalAmount,
            status: purchaseData.status,
            date: purchaseData.purchaseDate,
            location: '未知地點',
            offerId: purchaseData.offerId,
            productImage: undefined,
            paymentDetails: purchaseData.paymentDetails,
            deliveryDetails: purchaseData.deliveryDetails,
            shippingDetails: purchaseData.shippingDetails,
            buyerId: purchaseData.buyerId,
            sellerId: purchaseData.sellerId,
            hasRating: purchaseData.hasRating,
            seller: sellerData ? {
              name: sellerData.name || '',
              company: sellerData.company || '',
              avatar: sellerData.avatar || '',
              companyLogo: sellerData.companyLogo || '',
              email: sellerData.email || '',
              phone: sellerData.phone || ''
            } : undefined
          });
        }
      }
      
      console.log('Final purchase history:', purchases);
      setPurchaseHistory(purchases);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      setError('Failed to load purchase history');
    }
  };

  // Fetch sales history from Firestore (only completed orders)
  const fetchSalesHistory = async () => {
    if (!user) return;
    
    try {
      const purchasesRef = collection(db, 'purchases');
      const q = query(
        purchasesRef,
        where('sellerId', '==', user.id),
        where('status', '==', 'completed'),
        orderBy('purchaseDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sales: SalesHistoryItem[] = [];
      
      // Get all unique offer IDs and buyer IDs
      const offerIds = [...new Set(querySnapshot.docs.map(doc => doc.data().offerId))];
      const buyerIds = [...new Set(querySnapshot.docs.map(doc => doc.data().buyerId))];
      
      // Fetch all offers in one query (only if there are offer IDs)
      const offersMap = new Map();
      if (offerIds.length > 0) {
        const offersQuery = query(collection(db, 'offers'), where('__name__', 'in', offerIds));
        const offersSnapshot = await getDocs(offersQuery);
        offersSnapshot.docs.forEach(doc => {
          offersMap.set(doc.id, doc.data() as Offer);
        });
      }
      
      // Fetch all buyers in one query (only if there are buyer IDs)
      const buyersMap = new Map();
      if (buyerIds.length > 0) {
        const buyersQuery = query(collection(db, 'users'), where('__name__', 'in', buyerIds));
        const buyersSnapshot = await getDocs(buyersQuery);
        buyersSnapshot.docs.forEach(doc => {
          buyersMap.set(doc.id, doc.data());
        });
      }
      
      for (const doc of querySnapshot.docs) {
        const purchaseData = doc.data() as Purchase;
        const offerData = offersMap.get(purchaseData.offerId);
        const buyerData = buyersMap.get(purchaseData.buyerId);
        
        if (offerData) {
          sales.push({
            id: purchaseData.id,
            offerTitle: offerData.title,
            buyer: buyerData?.company || '未知買家',
            quantity: purchaseData.quantity,
            unit: offerData.unit,
            totalAmount: purchaseData.finalAmount,
            status: purchaseData.status,
            date: purchaseData.purchaseDate,
            location: offerData.location,
            offerId: purchaseData.offerId,
            productImage: offerData.images && offerData.images.length > 0 ? offerData.images[0] : null,
            paymentApprovalStatus: purchaseData.paymentApprovalStatus,
            shippingApprovalStatus: purchaseData.shippingApprovalStatus,
            paymentDetails: purchaseData.paymentDetails,
            deliveryDetails: purchaseData.deliveryDetails,
            shippingDetails: purchaseData.shippingDetails,
            sellerId: purchaseData.sellerId,
            buyerId: purchaseData.buyerId,
            buyerInfo: buyerData ? {
              name: buyerData.name || '',
              company: buyerData.company || '',
              avatar: buyerData.avatar || '',
              companyLogo: buyerData.companyLogo || '',
              email: buyerData.email || '',
              phone: buyerData.phone || ''
            } : undefined,
            hasRating: purchaseData.hasRating || false
          });
        } else {
          // Add sale with fallback info if offer not found
          sales.push({
            id: purchaseData.id,
            offerTitle: '優惠已下架',
            buyer: buyerData?.company || '未知買家',
            quantity: purchaseData.quantity,
            unit: '件',
            totalAmount: purchaseData.finalAmount,
            status: purchaseData.status,
            date: purchaseData.purchaseDate,
            location: '未知地點',
            offerId: purchaseData.offerId,
            productImage: undefined,
            paymentDetails: purchaseData.paymentDetails,
            deliveryDetails: purchaseData.deliveryDetails,
            shippingDetails: purchaseData.shippingDetails,
            sellerId: purchaseData.sellerId,
            buyerId: purchaseData.buyerId,
            buyerInfo: buyerData ? {
              name: buyerData.name || '',
              company: buyerData.company || '',
              avatar: buyerData.avatar || '',
              companyLogo: buyerData.companyLogo || '',
              email: buyerData.email || '',
              phone: buyerData.phone || ''
            } : undefined,
            hasRating: purchaseData.hasRating || false
          });
        }
      }
      
      setSalesHistory(sales);
    } catch (error) {
      console.error('Error fetching sales history:', error);
      setError('Failed to load sales history');
    }
  };

  // Fetch active orders (all statuses for buyers - no more moving to purchase history)
  const fetchActiveOrders = async () => {
    if (!user) return;
    
    try {
      const purchasesRef = collection(db, 'purchases');
      // Note: Firestore doesn't support 'in' with multiple status values in a single query
      // We'll fetch all orders and filter by status in JavaScript
      const q = query(
        purchasesRef,
        where('buyerId', '==', user.id),
        orderBy('purchaseDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders: PurchaseHistoryItem[] = [];
      
      // Include all orders for buyers (pending, approved, shipped, delivered, completed)
      const activeOrdersDocs = querySnapshot.docs;
      
      // Get all unique offer IDs
      const offerIds = [...new Set(activeOrdersDocs.map(doc => doc.data().offerId))];
      
      // Fetch all offers in one query (only if there are offer IDs)
      const offersMap = new Map();
      if (offerIds.length > 0) {
        const offersQuery = query(collection(db, 'offers'), where('__name__', 'in', offerIds));
        const offersSnapshot = await getDocs(offersQuery);
        offersSnapshot.docs.forEach(doc => {
          offersMap.set(doc.id, doc.data() as Offer);
        });
      }
      
      for (const doc of activeOrdersDocs) {
        const purchaseData = doc.data() as Purchase;
        const offerData = offersMap.get(purchaseData.offerId);
        
        if (offerData) {
          orders.push({
            id: purchaseData.id,
            offerTitle: offerData.title,
            supplier: offerData.supplier.company,
            quantity: purchaseData.quantity,
            unit: offerData.unit,
            totalAmount: purchaseData.finalAmount,
            status: purchaseData.status,
            date: purchaseData.purchaseDate,
            location: offerData.location,
            offerId: purchaseData.offerId,
            productImage: offerData.images && offerData.images.length > 0 ? offerData.images[0] : null,
            paymentApprovalStatus: purchaseData.paymentApprovalStatus,
            shippingApprovalStatus: purchaseData.shippingApprovalStatus,
            paymentDetails: purchaseData.paymentDetails,
            deliveryDetails: purchaseData.deliveryDetails,
            shippingDetails: purchaseData.shippingDetails,
            buyerId: purchaseData.buyerId,
            sellerId: purchaseData.sellerId,
            hasRating: purchaseData.hasRating
          });
        } else {
          // Add order with fallback info if offer not found
          orders.push({
            id: purchaseData.id,
            offerTitle: '優惠已下架',
            supplier: '未知供應商',
            quantity: purchaseData.quantity,
            unit: '件',
            totalAmount: purchaseData.finalAmount,
            status: purchaseData.status,
            date: purchaseData.purchaseDate,
            location: '未知地點',
            offerId: purchaseData.offerId,
            productImage: null,
            paymentDetails: purchaseData.paymentDetails,
            deliveryDetails: purchaseData.deliveryDetails,
            shippingDetails: purchaseData.shippingDetails,
            buyerId: purchaseData.buyerId,
            sellerId: purchaseData.sellerId,
            hasRating: purchaseData.hasRating
          });
        }
      }
      
      setActiveOrders(orders);
    } catch (error) {
      console.error('Error fetching active orders:', error);
      setError('Failed to load active orders');
    }
  };

  // Fetch active sales (all statuses for sellers - no more moving to sales history)
  const fetchActiveSales = async () => {
    if (!user) return;
    
    try {
      const purchasesRef = collection(db, 'purchases');
      // Note: Firestore doesn't support 'in' with multiple status values in a single query
      // We'll fetch all sales and filter by status in JavaScript
      const q = query(
        purchasesRef,
        where('sellerId', '==', user.id),
        orderBy('purchaseDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sales: SalesHistoryItem[] = [];
      
      // Include all sales for sellers (pending, approved, shipped, delivered, completed)
      const activeSalesDocs = querySnapshot.docs;
      
      // Get all unique offer IDs and buyer IDs
      const offerIds = [...new Set(activeSalesDocs.map(doc => doc.data().offerId))];
      const buyerIds = [...new Set(activeSalesDocs.map(doc => doc.data().buyerId))];
      
      // Fetch all offers in one query (only if there are offer IDs)
      const offersMap = new Map();
      if (offerIds.length > 0) {
        const offersQuery = query(collection(db, 'offers'), where('__name__', 'in', offerIds));
        const offersSnapshot = await getDocs(offersQuery);
        offersSnapshot.docs.forEach(doc => {
          offersMap.set(doc.id, doc.data() as Offer);
        });
      }
      
      // Fetch all buyers in one query (only if there are buyer IDs)
      const buyersMap = new Map();
      if (buyerIds.length > 0) {
        const buyersQuery = query(collection(db, 'users'), where('__name__', 'in', buyerIds));
        const buyersSnapshot = await getDocs(buyersQuery);
        buyersSnapshot.docs.forEach(doc => {
          buyersMap.set(doc.id, doc.data());
        });
      }
      
      for (const doc of activeSalesDocs) {
        const purchaseData = doc.data() as Purchase;
        const offerData = offersMap.get(purchaseData.offerId);
        const buyerData = buyersMap.get(purchaseData.buyerId);
        
        if (offerData) {
          sales.push({
            id: purchaseData.id,
            offerTitle: offerData.title,
            buyer: buyerData?.company || '未知買家',
            quantity: purchaseData.quantity,
            unit: offerData.unit,
            totalAmount: purchaseData.finalAmount,
            status: purchaseData.status,
            date: purchaseData.purchaseDate,
            location: offerData.location,
            offerId: purchaseData.offerId,
            productImage: offerData.images && offerData.images.length > 0 ? offerData.images[0] : null,
            paymentApprovalStatus: purchaseData.paymentApprovalStatus,
            shippingApprovalStatus: purchaseData.shippingApprovalStatus,
            paymentDetails: purchaseData.paymentDetails,
            deliveryDetails: purchaseData.deliveryDetails,
            shippingDetails: purchaseData.shippingDetails,
            sellerId: purchaseData.sellerId,
            buyerId: purchaseData.buyerId,
            buyerInfo: buyerData ? {
              name: buyerData.name || '',
              company: buyerData.company || '',
              avatar: buyerData.avatar || '',
              companyLogo: buyerData.companyLogo || '',
              email: buyerData.email || '',
              phone: buyerData.phone || ''
            } : undefined,
            hasRating: purchaseData.hasRating || false
          });
        } else {
          // Add sale with fallback info if offer not found
          sales.push({
            id: purchaseData.id,
            offerTitle: '優惠已下架',
            buyer: buyerData?.company || '未知買家',
            quantity: purchaseData.quantity,
            unit: '件',
            totalAmount: purchaseData.finalAmount,
            status: purchaseData.status,
            date: purchaseData.purchaseDate,
            location: '未知地點',
            offerId: purchaseData.offerId,
            productImage: undefined,
            paymentDetails: purchaseData.paymentDetails,
            deliveryDetails: purchaseData.deliveryDetails,
            shippingDetails: purchaseData.shippingDetails,
            sellerId: purchaseData.sellerId,
            buyerId: purchaseData.buyerId,
            buyerInfo: buyerData ? {
              name: buyerData.name || '',
              company: buyerData.company || '',
              avatar: buyerData.avatar || '',
              companyLogo: buyerData.companyLogo || '',
              email: buyerData.email || '',
              phone: buyerData.phone || ''
            } : undefined,
            hasRating: purchaseData.hasRating || false
          });
        }
      }
      
      setActiveSales(sales);
    } catch (error) {
      console.error('Error fetching active sales:', error);
      setError('Failed to load active sales');
    }
  };

  // Load data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setError(null);
      
      Promise.all([
        fetchActiveOrders(), 
        fetchActiveSales()
      ]).finally(() => setIsLoading(false));
    }
  }, [user]);

  if (!user) return null;

  // Check if user can access my orders
  if (!canAccessMyOrders(user)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center bg-white rounded-xl shadow-sm border border-red-200 p-12">
          <div className="text-red-500 mb-6">
            <Lock className="h-24 w-24 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">我的訂單受限</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            {getRestrictionMessage(user)}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
              <span className="text-red-800 font-semibold">帳戶狀態：{user?.status || '未知'}</span>
            </div>
            <p className="text-red-700 text-sm">
              只有活躍用戶才能訪問我的訂單。如需恢復帳戶訪問權限，請聯繫客服支援。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return '已批准';
      case 'pending':
        return '待處理';
      case 'rejected':
        return '已拒絕';
      case 'processing':
        return '處理中';
      default:
        return '未知';
    }
  };

  const getOrderStatus = (status: string, paymentApprovalStatus?: string, shippingApprovalStatus?: string, userRole?: 'buyer' | 'seller' | 'admin') => {
    // Check if payment is pending approval
    if (status === 'pending' && paymentApprovalStatus === 'pending') {
      return {
        step: 1,
        text: '待付款',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: <Clock className="h-4 w-4" />
      };
    }
    
    // Check if payment is approved but shipping is pending
    if (status === 'approved' && shippingApprovalStatus === 'pending') {
      return {
        step: 2,
        text: '已付款',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: <CheckCircle className="h-4 w-4" />
      };
    }
    
    // Check if shipping is approved
    if (status === 'shipped' && shippingApprovalStatus === 'approved') {
      return {
        step: 3,
        text: '已發貨',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: <Truck className="h-4 w-4" />
      };
    }
    
    // Check if order is delivered (buyer confirmed receipt)
    if (status === 'delivered') {
      if (userRole === 'buyer') {
        // Buyer sees completed immediately after confirming receipt
        return {
          step: 7,
          text: '已完成',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: <CheckCircle className="h-4 w-4" />
        };
      } else if (userRole === 'seller') {
        // Seller sees delivered and waits for Clearlot payment
        return {
          step: 5,
          text: '已送達',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          icon: <Package className="h-4 w-4" />
        };
      } else {
        // Admin sees delivered
        return {
          step: 4,
          text: '已送達',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          icon: <Package className="h-4 w-4" />
        };
      }
    }
    
    // Check if Clearlot has paid the seller
    if (status === 'clearlot_paid') {
      if (userRole === 'buyer') {
        // Buyer still sees completed
        return {
          step: 7,
          text: '已完成',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: <CheckCircle className="h-4 w-4" />
        };
      } else if (userRole === 'seller') {
        // Seller sees completed after Clearlot payment
        return {
          step: 7,
          text: '已完成',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: <CheckCircle className="h-4 w-4" />
        };
      } else {
        // Admin sees completed
        return {
          step: 7,
          text: '已完成',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: <CheckCircle className="h-4 w-4" />
        };
      }
    }
    
    // Check if order is completed
    if (status === 'completed') {
      return {
        step: 7,
        text: '已完成',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: <CheckCircle className="h-4 w-4" />
      };
    }
    
    switch (status) {
      case 'pending':
        return {
          step: 1,
          text: '待付款',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          icon: <Clock className="h-4 w-4" />
        };
      case 'approved':
        return {
          step: 2,
          text: '已付款',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          icon: <CheckCircle className="h-4 w-4" />
        };
      case 'processing':
        return {
          step: 2,
          text: '已付款',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          icon: <CheckCircle className="h-4 w-4" />
        };
      case 'shipped':
        return {
          step: 3,
          text: '已發貨',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: <Truck className="h-4 w-4" />
        };
      case 'delivered':
        return {
          step: 4,
          text: '已送達',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          icon: <Package className="h-4 w-4" />
        };
      case 'completed':
        return {
          step: 5,
          text: '已完成',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: <CheckCircle className="h-4 w-4" />
        };
      case 'rejected':
        return {
          step: 0,
          text: '已取消',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: <XCircle className="h-4 w-4" />
        };
      default:
        return {
          step: 1,
          text: '未知狀態',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: <Clock className="h-4 w-4" />
        };
    }
  };

  // Function to get date and time for each step based on Firestore structure
  const getStepDateTime = (transaction: any, stepNumber: number, activeTab: string) => {
    const formatDateTime = (dateString: string) => {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date string:', dateString);
          return null;
        }
        
        // Convert to Hong Kong timezone
        const hkDate = convertToHKTime(dateString);
        
        // 添加時區調試信息
        console.log('時間轉換調試 (HK時區):', {
          originalDateString: dateString,
          parsedDate: date.toISOString(),
          hkDate: hkDate.toISOString(),
          hkDateFormatted: formatHKDate(hkDate, { month: 'short', day: 'numeric' }),
          hkTimeFormatted: formatHKTime(hkDate, { hour: '2-digit', minute: '2-digit' })
        });
        
        return {
          date: formatHKDate(hkDate, { month: 'short', day: 'numeric' }),
          time: formatHKTime(hkDate, { hour: '2-digit', minute: '2-digit' })
        };
      } catch (error) {
        console.error('Error formatting date:', error, dateString);
        return null;
      }
    };

    // Debug logging
    console.log('getStepDateTime called:', {
      stepNumber,
      activeTab,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        purchaseDate: transaction.purchaseDate,
        paymentDetails: transaction.paymentDetails,
        shippingDetails: transaction.shippingDetails,
        date: transaction.date
      }
    });
    
    // 額外的調試信息 - 檢查所有步驟
    console.log(`=== 步驟 ${stepNumber} 調試 ===`);
    console.log('stepNumber:', stepNumber);
    console.log('activeTab:', activeTab);
    console.log('transaction.paymentDetails:', transaction.paymentDetails);
    console.log('transaction.paymentDetails?.approvedAt:', transaction.paymentDetails?.approvedAt);
    console.log('transaction.shippingDetails:', transaction.shippingDetails);
    console.log('transaction.shippingDetails?.shippedAt:', transaction.shippingDetails?.shippedAt);
    console.log('================================');

    // For buyer orders (activeTab === 'orders')
    if (activeTab === 'orders') {
      switch (stepNumber) {
        case 1: // 待付款 - 使用 purchaseDate
          if (transaction.purchaseDate) {
            const formatted = formatDateTime(transaction.purchaseDate);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          break;
        case 2: // 已付款 - 使用 paymentDetails.approvedAt (管理員批准付款的時間)
          if (transaction.paymentDetails?.approvedAt) {
            const formatted = formatDateTime(transaction.paymentDetails.approvedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          break;
        case 3: // 已發貨 - 使用 shippingDetails.shippedAt，但確保不早於付款時間
          // 如果沒有 shippedAt，使用付款時間作為發貨時間
          if (!transaction.shippingDetails?.shippedAt && transaction.paymentDetails?.approvedAt) {
            console.log('已發貨步驟：沒有 shippedAt，使用付款時間作為發貨時間');
            const formatted = formatDateTime(transaction.paymentDetails.approvedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          
          if (transaction.shippingDetails?.shippedAt) {
            const shippedTime = new Date(transaction.shippingDetails.shippedAt);
            const paymentTime = transaction.paymentDetails?.approvedAt ? new Date(transaction.paymentDetails.approvedAt) : null;
            
            // 詳細調試信息
            console.log('已發貨步驟調試信息 (買家):', {
              stepNumber,
              activeTab,
              transactionId: transaction.id,
              shippedAt: transaction.shippingDetails.shippedAt,
              shippedTime: shippedTime.toISOString(),
              paymentApprovedAt: transaction.paymentDetails?.approvedAt,
              paymentTime: paymentTime ? paymentTime.toISOString() : null,
              hasPaymentDetails: !!transaction.paymentDetails,
              paymentDetailsKeys: transaction.paymentDetails ? Object.keys(transaction.paymentDetails) : []
            });
            
            // 如果發貨時間早於付款時間，使用付款時間作為發貨時間
            let displayTime = transaction.shippingDetails.shippedAt;
            if (paymentTime && shippedTime < paymentTime) {
              console.warn('發貨時間早於付款時間，使用付款時間作為發貨時間', {
                shippedAt: transaction.shippingDetails.shippedAt,
                paymentApprovalStatus: transaction.paymentDetails.approvedAt,
                shippedTimeISO: shippedTime.toISOString(),
                paymentTimeISO: paymentTime.toISOString()
              });
              displayTime = transaction.paymentDetails.approvedAt;
            } else {
              console.log('時間順序正常，使用原始發貨時間');
            }
            
            const formatted = formatDateTime(displayTime);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          break;
        case 4: // 已送達 - 使用 shippingDetails.deliveredAt
          if (transaction.shippingDetails?.deliveredAt) {
            const formatted = formatDateTime(transaction.shippingDetails.deliveredAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          // 如果沒有 deliveredAt，使用 deliveryConfirmedAt
          if (transaction.shippingDetails?.deliveryConfirmedAt) {
            console.log('已送達步驟：沒有 deliveredAt，使用 deliveryConfirmedAt');
            const formatted = formatDateTime(transaction.shippingDetails.deliveryConfirmedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          // 如果沒有 shippingDetails，使用付款時間
          if (!transaction.shippingDetails && transaction.paymentDetails?.approvedAt) {
            console.log('已送達步驟：沒有 shippingDetails，使用付款時間');
            const formatted = formatDateTime(transaction.paymentDetails.approvedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          break;
        case 5: // 已完成 - 对于买家，如果状态是delivered，使用deliveredAt；如果是completed，使用deliveryConfirmedAt
          if (transaction.status === 'delivered' && transaction.shippingDetails?.deliveredAt) {
            // 买家端：已送達状态直接跳到已完成，使用deliveredAt时间
            const formatted = formatDateTime(transaction.shippingDetails.deliveredAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          if (transaction.shippingDetails?.deliveryConfirmedAt) {
            const formatted = formatDateTime(transaction.shippingDetails.deliveryConfirmedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          // 如果沒有 shippingDetails，使用付款時間
          if (!transaction.shippingDetails && transaction.paymentDetails?.approvedAt) {
            console.log('已完成步驟：沒有 shippingDetails，使用付款時間');
            const formatted = formatDateTime(transaction.paymentDetails.approvedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          break;
      }
    }
    
    // For seller sales (activeTab === 'mySales')
    if (activeTab === 'mySales') {
      switch (stepNumber) {
        case 1: // 待付款 - 使用 purchaseDate
          if (transaction.purchaseDate) {
            const formatted = formatDateTime(transaction.purchaseDate);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          break;
        case 2: // 已付款 - 使用 paymentDetails.approvedAt (管理員批准付款的時間)
          if (transaction.paymentDetails?.approvedAt) {
            const formatted = formatDateTime(transaction.paymentDetails.approvedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          break;
        case 3: // 已發貨 - 使用 shippingDetails.shippedAt，但確保不早於付款時間
          // 如果沒有 shippedAt，使用付款時間作為發貨時間
          if (!transaction.shippingDetails?.shippedAt && transaction.paymentDetails?.approvedAt) {
            console.log('已發貨步驟：沒有 shippedAt，使用付款時間作為發貨時間');
            const formatted = formatDateTime(transaction.paymentDetails.approvedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          
          if (transaction.shippingDetails?.shippedAt) {
            const shippedTime = new Date(transaction.shippingDetails.shippedAt);
            const paymentTime = transaction.paymentDetails?.approvedAt ? new Date(transaction.paymentDetails.approvedAt) : null;
            
            // 詳細調試信息
            console.log('已發貨步驟調試信息 (賣家):', {
              stepNumber,
              activeTab,
              transactionId: transaction.id,
              shippedAt: transaction.shippingDetails.shippedAt,
              shippedTime: shippedTime.toISOString(),
              paymentApprovedAt: transaction.paymentDetails?.approvedAt,
              paymentTime: paymentTime ? paymentTime.toISOString() : null,
              hasPaymentDetails: !!transaction.paymentDetails,
              paymentDetailsKeys: transaction.paymentDetails ? Object.keys(transaction.paymentDetails) : []
            });
            
            // 如果發貨時間早於付款時間，使用付款時間作為發貨時間
            let displayTime = transaction.shippingDetails.shippedAt;
            if (paymentTime && shippedTime < paymentTime) {
              console.warn('發貨時間早於付款時間，使用付款時間作為發貨時間', {
                shippedAt: transaction.shippingDetails.shippedAt,
                paymentApprovedAt: transaction.paymentDetails.approvedAt,
                shippedTimeISO: paymentTime.toISOString(),
                paymentTimeISO: paymentTime.toISOString()
              });
              displayTime = transaction.paymentDetails.approvedAt;
            } else {
              console.log('時間順序正常，使用原始發貨時間');
            }
            
            const formatted = formatDateTime(displayTime);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          break;
        case 4: // 已送達 - 使用 shippingDetails.deliveredAt
          console.log('已送達步驟調試 (賣家):', {
            hasShippingDetails: !!transaction.shippingDetails,
            shippingDetailsKeys: transaction.shippingDetails ? Object.keys(transaction.shippingDetails) : [],
            deliveredAt: transaction.shippingDetails?.deliveredAt,
            deliveryConfirmedAt: transaction.shippingDetails?.deliveryConfirmedAt
          });
          
          if (transaction.shippingDetails?.deliveredAt) {
            console.log('已送達步驟：使用 deliveredAt');
            const formatted = formatDateTime(transaction.shippingDetails.deliveredAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          // 如果沒有 deliveredAt，使用 deliveryConfirmedAt
          if (transaction.shippingDetails?.deliveryConfirmedAt) {
            console.log('已送達步驟：沒有 deliveredAt，使用 deliveryConfirmedAt');
            const formatted = formatDateTime(transaction.shippingDetails.deliveryConfirmedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          // 如果沒有 shippingDetails，使用付款時間
          if (!transaction.shippingDetails && transaction.paymentDetails?.approvedAt) {
            console.log('已送達步驟：沒有 shippingDetails，使用付款時間');
            const formatted = formatDateTime(transaction.paymentDetails.approvedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          break;
        case 5: // Clearlot付款給賣家 - 对于卖家，如果状态是delivered，使用deliveryConfirmedAt；如果是clearlot_paid，使用clearlotPaidAt
          if (transaction.status === 'delivered' && transaction.shippingDetails?.deliveryConfirmedAt) {
            // 卖家端：买家确认收货后，显示买家确认时间
            const formatted = formatDateTime(transaction.shippingDetails.deliveryConfirmedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          if (transaction.shippingDetails?.deliveryConfirmedAt) {
            const formatted = formatDateTime(transaction.shippingDetails.deliveryConfirmedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          // 如果沒有 shippingDetails，使用付款時間
          if (!transaction.shippingDetails && transaction.paymentDetails?.approvedAt) {
            console.log('Clearlot付款步驟：沒有 shippingDetails，使用付款時間');
            const formatted = formatDateTime(transaction.paymentDetails.approvedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          break;
        case 6: // 已完成 - 使用 deliveryConfirmedAt (買家確認收貨時間)
          if (transaction.shippingDetails?.deliveryConfirmedAt) {
            const formatted = formatDateTime(transaction.shippingDetails.deliveryConfirmedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          // 如果沒有 shippingDetails，使用付款時間
          if (!transaction.shippingDetails && transaction.paymentDetails?.approvedAt) {
            console.log('已完成步驟：沒有 shippingDetails，使用付款時間');
            const formatted = formatDateTime(transaction.paymentDetails.approvedAt);
            if (formatted) {
              return `${formatted.date} ${formatted.time}`;
            }
          }
          break;
      }
    }
    
    // Fallback: try to get any available date
    if (transaction.purchaseDate) {
      const formatted = formatDateTime(transaction.purchaseDate);
      if (formatted) {
        return `${formatted.date} ${formatted.time}`;
      }
    }
    
    if (transaction.date) {
      const formatted = formatDateTime(transaction.date);
      if (formatted) {
        return `${formatted.date} ${formatted.time}`;
      }
    }
    
    console.warn('No date found for step:', stepNumber, 'activeTab:', activeTab, 'transaction:', transaction);
    return '時間未知';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-HK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle shipping photo upload
  const handleShippingClick = (purchaseId: string) => {
    setSelectedPurchaseId(purchaseId);
    setShippingModalOpen(true);
  };

  // Handle delivery confirmation
  const handleDeliveryClick = (purchaseId: string, transaction?: any) => {
    setSelectedPurchaseId(purchaseId);
    if (transaction) {
      setSelectedPurchaseData(transaction);
    }
    setDeliveryModalOpen(true);
  };

  // Handle rating click for completed orders
  const handleRatingClick = (transaction: any) => {
    setSelectedPurchaseId(transaction.id);
    setSelectedPurchaseData(transaction);
    setRatingModalOpen(true);
  };

  // Handle seller rating click for completed orders
  const handleSellerRatingClick = (transaction: any) => {
    setSelectedBuyerForRating(transaction);
    setSellerRatingModalOpen(true);
  };

  const handlePaymentReceiptClick = (transaction: any) => {
    setSelectedPaymentTransaction(transaction);
    setPaymentReceiptModalOpen(true);
  };

  const handleShippingStatusClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShippingStatusModalOpen(true);
  };

  const handleClearlotPaymentClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setClearlotPaymentModalOpen(true);
  };



  // Refresh data after successful action
  const handleActionSuccess = () => {
    fetchPurchaseHistory();
    fetchSalesHistory();
    fetchActiveOrders();
    fetchActiveSales();
  };

  const handleViewOrderDetails = (transaction: any, type: 'purchase' | 'sale') => {
    setSelectedTransaction(transaction);
    setSelectedTransactionType(type);
    setOrderDetailsModalOpen(true);
  };

  const handleOrderDetailsClose = () => {
    setOrderDetailsModalOpen(false);
    // Refresh data when modal closes in case delivery details were updated
    handleActionSuccess();
  };

  // Filter and sort current history
  const getFilteredAndSortedHistory = () => {
    let currentHistory;
    
    switch (activeTab) {
      case 'orders':
        currentHistory = activeOrders; // All orders for buyers (all statuses)
        break;
      case 'mySales':
        currentHistory = activeSales; // All sales for sellers (all statuses)
        break;
      default:
        currentHistory = activeSales;
    }
    
    // Filter by search term
    let filtered = currentHistory.filter(item => 
      item.offerTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activeTab === 'orders' ? (item as PurchaseHistoryItem).supplier : (item as SalesHistoryItem).buyer).toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  const currentHistory = getFilteredAndSortedHistory();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">載入中...</h3>
            <p className="text-gray-600">正在載入您的交易歷史</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">載入失敗</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">我的訂單</h1>
          <p className="text-xl text-gray-600">查看您的訂單狀態和交易歷史</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">我的訂單</p>
                <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-xl">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">我的銷售</p>
                <p className="text-2xl font-bold text-gray-900">{activeSales.length}</p>
              </div>
            </div>
          </div>


        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8 py-4">
              <button
                onClick={() => setActiveTab('mySales')}
                className={`flex items-center space-x-2 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'mySales'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="h-5 w-5" />
                <span>我的銷售</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center space-x-2 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'orders'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <Package className="h-5 w-5" />
                <span>我的訂單</span>
              </button>

            </nav>
          </div>

          {/* Filters and Search */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={
                      activeTab === 'orders' ? "搜索我的訂單、賣家或訂單編號..." : 
                      "搜索我的銷售、買家或訂單編號..."
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                >
                  <option value="date">按日期排序</option>
                  <option value="amount">按金額排序</option>
                  <option value="status">按狀態排序</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="p-4 md:p-8">
            <div className="space-y-4 md:space-y-6">
              {currentHistory.map((transaction) => (
                <div key={transaction.id} className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                  {activeTab === 'orders' || activeTab === 'mySales' ? (
                    // Modern Order Display
                    <div>
                      {/* Mobile-optimized header */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 space-y-3 md:space-y-0">
                        <div className="flex items-center space-x-3 md:space-x-4">
                          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${
                            activeTab === 'mySales' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {(transaction as any).productImage ? (
                              <img 
                                src={(transaction as any).productImage} 
                                alt={transaction.offerTitle}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to icon if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`${(transaction as any).productImage ? 'hidden' : ''} flex items-center justify-center w-full h-full`}>
                              {activeTab === 'mySales' ? (
                                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                              ) : (
                                <Package className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">{transaction.offerTitle}</h3>
                            <p className="text-xs md:text-sm text-gray-600">
                              {activeTab === 'mySales' ? '銷售編號: ' : '訂單編號: '}
                              {transaction.id.slice(-8)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:block md:text-right">
                          <div className="md:hidden">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (() => {
                                const orderStatus = getOrderStatus(
                                  transaction.status, 
                                  (transaction as any).paymentApprovalStatus, 
                                  (transaction as any).shippingApprovalStatus,
                                  activeTab === 'orders' ? 'buyer' : activeTab === 'mySales' ? 'seller' : 'buyer'
                                );
                                
                                if (activeTab === 'orders') {
                                  if (orderStatus.step === 7) return 'bg-green-100 text-green-800';
                                  if (orderStatus.step === 5) return 'bg-green-100 text-green-800';
                                  if (orderStatus.step === 4) return 'bg-purple-100 text-purple-800';
                                  if (orderStatus.step === 3) return 'bg-green-100 text-green-800';
                                  if (orderStatus.step === 2) return 'bg-blue-100 text-blue-800';
                                  if (orderStatus.step === 1) return 'bg-yellow-100 text-yellow-800';
                                } else {
                                  if (orderStatus.step === 7) return 'bg-green-100 text-green-800';
                                  if (orderStatus.step === 6) return 'bg-green-100 text-green-800';
                                  if (orderStatus.step === 5) return 'bg-orange-100 text-orange-800';
                                  if (orderStatus.step === 4) return 'bg-purple-100 text-purple-800';
                                  if (orderStatus.step === 3) return 'bg-green-100 text-green-800';
                                  if (orderStatus.step === 2) return 'bg-blue-100 text-blue-800';
                                  if (orderStatus.step === 1) return 'bg-yellow-100 text-yellow-800';
                                }
                                return 'bg-red-100 text-red-800';
                              })()
                            }`}>
                              {getOrderStatus(
                                transaction.status, 
                                (transaction as any).paymentApprovalStatus, 
                                (transaction as any).shippingApprovalStatus,
                                activeTab === 'orders' ? 'buyer' : activeTab === 'mySales' ? 'seller' : 'buyer'
                              ).text}
                            </div>
                          </div>
                          <div>
                            <p className="text-lg md:text-xl font-bold text-gray-900">{formatCurrency(transaction.totalAmount)}</p>
                            <p className="text-xs md:text-sm text-gray-500">{formatDate(transaction.date)}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Order Progress Steps */}
                      <div className="mb-4 md:mb-6">
                        {/* Status Header - Hidden on mobile as status is shown in header */}
                        <div className="hidden md:flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-700">
                            {activeTab === 'mySales' ? '銷售進度' : '訂單進度'}
                          </h4>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            (() => {
                              const orderStatus = getOrderStatus(
                                transaction.status, 
                                (transaction as any).paymentApprovalStatus, 
                                (transaction as any).shippingApprovalStatus,
                                activeTab === 'orders' ? 'buyer' : activeTab === 'mySales' ? 'seller' : 'buyer'
                              );
                              
                              if (activeTab === 'orders') {
                                // 買家端：5個步驟 + 完成狀態
                                if (orderStatus.step === 7) return 'bg-green-100 text-green-800'; // 已完成
                                if (orderStatus.step === 5) return 'bg-green-100 text-green-800';
                                if (orderStatus.step === 4) return 'bg-purple-100 text-purple-800';
                                if (orderStatus.step === 3) return 'bg-green-100 text-green-800';
                                if (orderStatus.step === 2) return 'bg-blue-100 text-blue-800';
                                if (orderStatus.step === 1) return 'bg-yellow-100 text-yellow-800';
                              } else {
                                // 賣家端：6個步驟 + 完成狀態
                                if (orderStatus.step === 7) return 'bg-green-100 text-green-800'; // 已完成
                                if (orderStatus.step === 6) return 'bg-green-100 text-green-800';
                                if (orderStatus.step === 5) return 'bg-orange-100 text-orange-800';
                                if (orderStatus.step === 4) return 'bg-purple-100 text-purple-800';
                                if (orderStatus.step === 3) return 'bg-green-100 text-green-800';
                                if (orderStatus.step === 2) return 'bg-blue-100 text-blue-800';
                                if (orderStatus.step === 1) return 'bg-yellow-100 text-yellow-800';
                              }
                              return 'bg-red-100 text-red-800';
                            })()
                          }`}>
                            {getOrderStatus(
                              transaction.status, 
                              (transaction as any).paymentApprovalStatus, 
                              (transaction as any).shippingApprovalStatus,
                              activeTab === 'orders' ? 'buyer' : activeTab === 'mySales' ? 'seller' : 'buyer'
                            ).text}
                          </div>
                        </div>
                        
                        {/* Mobile progress title */}
                        <div className="md:hidden mb-3">
                          <h4 className="text-sm font-medium text-gray-700">
                            {activeTab === 'mySales' ? '銷售進度' : '訂單進度'}
                          </h4>
                        </div>
                        
                        <div className="flex items-center justify-between overflow-x-auto pb-2 md:pb-0">
                          {(() => {
                            // 根據用戶角色顯示不同的步驟
                            if (activeTab === 'orders') {
                              // 買家端：不顯示 Clearlot 付款步驟
                              return [
                                { 
                                  step: 1, 
                                  text: '待付款', 
                                  icon: <Clock className="h-4 w-4" />, 
                                  color: 'text-yellow-600', 
                                  bgColor: 'bg-yellow-100', 
                                  borderColor: 'border-yellow-300',
                                  gradient: 'from-yellow-400 to-yellow-500',
                                  hoverColor: 'hover:bg-yellow-200',
                                  tooltip: '等待買家付款'
                                },
                                { 
                                  step: 2, 
                                  text: '已付款', 
                                  icon: <CheckCircle className="h-4 w-4" />, 
                                  color: 'text-blue-600', 
                                  bgColor: 'bg-blue-100', 
                                  borderColor: 'border-blue-300',
                                  gradient: 'from-blue-400 to-blue-500',
                                  hoverColor: 'hover:bg-blue-200',
                                  tooltip: '付款已確認'
                                },
                                { 
                                  step: 3, 
                                  text: '已發貨', 
                                  icon: <Truck className="h-4 w-4" />, 
                                  color: 'text-green-600', 
                                  bgColor: 'bg-green-100', 
                                  borderColor: 'border-green-300',
                                  gradient: 'from-green-400 to-green-500',
                                  hoverColor: 'hover:bg-green-200',
                                  tooltip: '商品已發貨'
                                },
                                { 
                                  step: 4, 
                                  text: '已送達', 
                                  icon: <Package className="h-4 w-4" />, 
                                  color: 'text-purple-600', 
                                  bgColor: 'bg-purple-100', 
                                  borderColor: 'border-purple-300',
                                  gradient: 'from-purple-400 to-purple-500',
                                  hoverColor: 'hover:bg-purple-200',
                                  tooltip: '商品已送達'
                                },
                                { 
                                  step: 5, 
                                  text: '已完成', 
                                  icon: <CheckCircle className="h-4 w-4" />, 
                                  color: 'text-green-600', 
                                  bgColor: 'bg-green-100', 
                                  borderColor: 'border-green-300',
                                  gradient: 'from-green-400 to-green-500',
                                  hoverColor: 'hover:bg-green-200',
                                  tooltip: '訂單已完成'
                                }
                              ];
                            } else {
                              // 賣家端：顯示完整的6個步驟
                              return [
                                { 
                                  step: 1, 
                                  text: '待付款', 
                                  icon: <Clock className="h-4 w-4" />, 
                                  color: 'text-yellow-600', 
                                  bgColor: 'bg-yellow-100', 
                                  borderColor: 'border-yellow-300',
                                  gradient: 'from-yellow-400 to-yellow-500',
                                  hoverColor: 'hover:bg-yellow-200',
                                  tooltip: '等待買家付款'
                                },
                                { 
                                  step: 2, 
                                  text: '已付款', 
                                  icon: <CheckCircle className="h-4 w-4" />, 
                                  color: 'text-blue-600', 
                                  bgColor: 'bg-blue-100', 
                                  borderColor: 'border-blue-300',
                                  gradient: 'from-blue-400 to-blue-500',
                                  hoverColor: 'hover:bg-blue-200',
                                  tooltip: '付款已確認'
                                },
                                { 
                                  step: 3, 
                                  text: '已發貨', 
                                  icon: <Truck className="h-4 w-4" />, 
                                  color: 'text-green-600', 
                                  bgColor: 'bg-green-100', 
                                  borderColor: 'border-green-300',
                                  gradient: 'from-green-400 to-green-500',
                                  hoverColor: 'hover:bg-green-200',
                                  tooltip: '商品已發貨'
                                },
                                { 
                                  step: 4, 
                                  text: '已送達', 
                                  icon: <Package className="h-4 w-4" />, 
                                  color: 'text-purple-600', 
                                  bgColor: 'bg-purple-100', 
                                  borderColor: 'border-purple-300',
                                  gradient: 'from-purple-400 to-purple-500',
                                  hoverColor: 'hover:bg-purple-200',
                                  tooltip: '商品已送達'
                                },
                                { 
                                  step: 5, 
                                  text: 'Clearlot付款給賣家', 
                                  icon: <DollarSign className="h-4 w-4" />, 
                                  color: 'text-orange-600', 
                                  bgColor: 'bg-orange-100', 
                                  borderColor: 'border-orange-300',
                                  gradient: 'from-orange-400 to-orange-500',
                                  hoverColor: 'hover:bg-orange-200',
                                  tooltip: '等待平台付款'
                                },
                                { 
                                  step: 6, 
                                  text: '已完成', 
                                  icon: <CheckCircle className="h-4 w-4" />, 
                                  color: 'text-green-600', 
                                  bgColor: 'bg-green-100', 
                                  borderColor: 'border-green-300',
                                  gradient: 'from-green-400 to-green-500',
                                  hoverColor: 'hover:bg-green-200',
                                  tooltip: '訂單已完成'
                                }
                              ];
                            }
                          })().map((step, index) => {
                            const orderStatus = getOrderStatus(
                              transaction.status, 
                              (transaction as any).paymentApprovalStatus, 
                              (transaction as any).shippingApprovalStatus,
                              activeTab === 'orders' ? 'buyer' : activeTab === 'mySales' ? 'seller' : 'buyer'
                            );
                            // 修复步骤判断逻辑 - 根据订单状态和用户角色确定当前步骤
                            let currentStepNumber = 1;
                            if (activeTab === 'orders') {
                              // 买家端逻辑 - 已送達后直接跳到已完成
                              if (transaction.status === 'pending') currentStepNumber = 1;
                              else if (transaction.status === 'approved') currentStepNumber = 2;
                              else if (transaction.status === 'shipped') currentStepNumber = 3;
                              else if (transaction.status === 'delivered') currentStepNumber = 5; // 直接跳到已完成
                              else if (transaction.status === 'completed') currentStepNumber = 5;
                            } else {
                              // 卖家端逻辑 - 买家确认收货后，卖家应该在Clearlot付款步骤
                              if (transaction.status === 'pending') currentStepNumber = 1;
                              else if (transaction.status === 'approved') currentStepNumber = 2;
                              else if (transaction.status === 'shipped') currentStepNumber = 3;
                              else if (transaction.status === 'delivered') currentStepNumber = 5; // 买家确认收货后，卖家在Clearlot付款步骤
                              else if (transaction.status === 'clearlot_paid') currentStepNumber = 5;
                              else if (transaction.status === 'completed') currentStepNumber = 6;
                            }
                            
                            const isCompleted = currentStepNumber > step.step;
                            const isCurrent = currentStepNumber === step.step;
                            const isPending = currentStepNumber < step.step;
                            const shouldShowPadding = isCurrent && !(step.step === 6 && transaction.status === 'completed');
                            
                            const isClickable = (step.step === 1 && transaction.status === 'pending' && activeTab === 'orders') ||
                                (step.step === 3 && transaction.status === 'approved' && activeTab === 'mySales') ||
                                (step.step === 3 && transaction.status === 'shipped' && activeTab === 'mySales') ||
                                (step.step === 3 && transaction.status === 'shipped' && activeTab === 'orders') ||
                                (step.step === 4 && transaction.status === 'shipped' && activeTab === 'orders') ||
                                (step.step === 4 && transaction.status === 'approved' && activeTab === 'mySales') || 
                                (step.step === 5 && (transaction.status === 'delivered' || transaction.status === 'completed') && activeTab === 'orders' && !transaction.hasRating) ||
                                (step.step === 6 && transaction.status === 'completed' && activeTab === 'mySales' && !transaction.hasRating);

                            return (
                              <div key={step.step} className="flex items-center group flex-shrink-0">
                                <div className={`flex flex-col items-center min-w-[60px] md:min-w-0 ${index < (activeTab === 'orders' ? 4 : 5) ? 'flex-1' : ''} ${shouldShowPadding ? 'pt-2 md:pt-4 pb-1 md:pb-2' : ''}`}>
                                  {/* Step Circle with Enhanced Effects - Mobile optimized */}
                                  <div 
                                    className={`relative w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 md:mb-3 border-2 md:border-3 transition-all duration-500 ease-in-out transform step-hover overflow-visible ${
                                      isCompleted 
                                        ? `${step.bgColor} ${step.borderColor} shadow-lg md:shadow-xl ring-2 md:ring-4 ring-green-200 scale-105 progress-glow bounce-in` 
                                        : isCurrent 
                                          ? `${step.bgColor} ${step.borderColor} shadow-md md:shadow-lg ring-3 md:ring-6 ring-blue-200 step-pulse scale-110` 
                                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    } ${isClickable ? 'cursor-pointer hover:scale-110 md:hover:scale-125 hover:shadow-xl md:hover:shadow-2xl hover:ring-4 md:hover:ring-8 hover:ring-blue-300 active:scale-95' : ''} ${
                                      isCurrent ? 'animate-bounce' : ''
                                    }`}
                                    title={step.tooltip}
                                    onClick={() => {
                                      if (step.step === 1 && transaction.status === 'pending' && activeTab === 'orders') {
                                        // 買家點擊"待付款" - 查看已上傳的收據
                                        handlePaymentReceiptClick(transaction);
                                      } else if (step.step === 3 && transaction.status === 'approved' && activeTab === 'mySales') {
                                        // 賣家點擊"已發貨" - 發貨相關操作
                                        handleShippingClick(transaction.id);
                                      } else if (step.step === 3 && transaction.status === 'shipped' && activeTab === 'mySales') {
                                        // 賣家點擊"已發貨" - 查看發貨狀態
                                        handleShippingStatusClick(transaction);
                                      } else if (step.step === 3 && transaction.status === 'shipped' && activeTab === 'orders') {
                                        // 買家點擊"已發貨" - 查看發貨照片
                                        handleShippingStatusClick(transaction);
                                      } else if (step.step === 4 && transaction.status === 'shipped' && activeTab === 'orders') {
                                        // 買家點擊"已送達" - 確認送達
                                        handleDeliveryClick(transaction.id, transaction);
                                      } else if (step.step === 5 && (transaction.status === 'delivered' || transaction.status === 'completed') && activeTab === 'orders' && !transaction.hasRating) {
                                        // 買家點擊"已完成" - 評分賣家
                                        handleRatingClick(transaction);
                                      } else if (step.step === 6 && transaction.status === 'completed' && activeTab === 'mySales' && !transaction.hasRating) {
                                        // 賣家點擊"已完成" - 評分買家
                                        handleSellerRatingClick(transaction);
                                      }
                                    }}
                                  >
                                    {/* Enhanced Icon with Animation - Mobile optimized */}
                                    <div className={`relative transition-all duration-300 transform ${
                                      isCompleted ? `${step.color} scale-110` : 
                                      isCurrent ? `${step.color} scale-125 icon-jump` : 
                                      'text-gray-400'
                                    }`}>
                                      {isCompleted || isCurrent ? (
                                        <div className="w-3 h-3 md:w-4 md:h-4">
                                          {step.icon}
                                        </div>
                                      ) : (
                                        <div className="w-3 h-3 md:w-4 md:h-4" />
                                      )}
                                    </div>
                                    
                                    {/* Stable Completion Checkmark - Mobile optimized */}
                                    {isCompleted && (
                                      <div className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-3 h-3 md:w-5 md:h-5 bg-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-2 h-2 md:w-3 md:h-3 text-white" />
                                      </div>
                                    )}
                                    
                                    {/* Rating indicator for completed orders - Mobile optimized */}
                                    {step.step === 5 && isCompleted && transaction.hasRating && (
                                      <div className="absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 w-3 h-3 md:w-4 md:h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-white font-bold">★</span>
                                      </div>
                                    )}
                                    
                                    {/* Clickable indicator - Mobile optimized */}
                                    {isClickable && (
                                      <div className="absolute -top-1 -left-1 md:-top-2 md:-left-2 w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full animate-pulse opacity-75">
                                        <div className="w-full h-full bg-blue-400 rounded-full animate-ping"></div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Enhanced Step Text - Mobile optimized */}
                                  <span className={`text-[10px] md:text-sm font-bold text-center transition-all duration-300 transform leading-tight ${
                                    isCompleted 
                                      ? `${step.color} scale-105` 
                                      : isCurrent 
                                        ? `${step.color} scale-110 animate-pulse` 
                                        : 'text-gray-400 hover:text-gray-600'
                                  } ${isClickable ? 'cursor-pointer' : ''}`}>
                                    {step.text}
                                  </span>
                                  
                                  {/* Action hint for clickable steps - Hidden on mobile to save space */}
                                  {isClickable && (
                                    <span className="hidden md:block text-xs text-blue-600 font-medium mt-1 animate-pulse">
                                      {step.step === 1 ? '點擊查看' : 
                                       step.step === 3 ? '點擊操作' : 
                                       step.step === 4 ? '點擊確認' : 
                                       step.step === 5 ? '點擊評分' : '點擊查看'}
                                    </span>
                                  )}
                                  
                                  {/* Step Date and Time - Hidden on mobile to save space */}
                                  {(isCompleted || (step.step === 6 && transaction.status === 'completed') || (step.step === 5 && activeTab === 'orders' && (transaction.status === 'delivered' || transaction.status === 'completed'))) && (
                                    <div className="hidden md:block text-xs text-center mt-1">
                                      <div className={`font-medium ${
                                        step.step === 1 ? 'text-yellow-600' :
                                        step.step === 2 ? 'text-blue-600' :
                                        step.step === 3 ? 'text-purple-600' :
                                        step.step === 4 ? 'text-green-600' :
                                        step.step === 5 ? 'text-green-700' : 'text-gray-600'
                                      }`}>
                                        {getStepDateTime(transaction, step.step, activeTab)}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Step Number - Mobile optimized */}
                                  <span className={`text-xs mt-0.5 md:mt-1 transition-all duration-300 ${
                                    isCompleted 
                                      ? 'text-green-600 font-bold' 
                                      : isCurrent 
                                        ? step.color 
                                        : 'text-gray-400'
                                  }`}>
                                    {isCompleted ? '✓' : step.step}
                                  </span>
                                </div>
                                
                                {/* Enhanced Arrow and Progress Line - Mobile optimized */}
                                {index < (activeTab === 'orders' ? 4 : 5) && (
                                  <div className="flex items-center flex-1 mx-1 md:mx-4 min-w-[20px] md:min-w-0">
                                    {/* Enhanced Progress Line - Mobile optimized */}
                                    <div className={`flex-1 h-2 md:h-3 rounded-full transition-all duration-700 ease-in-out relative overflow-hidden ${
                                      isCompleted 
                                        ? `bg-gradient-to-r ${step.gradient} shadow-md md:shadow-lg` 
                                        : 'bg-gray-200'
                                    }`}>
                                      {/* Animated progress fill */}
                                      {isCompleted && (
                                        <div className={`absolute inset-0 bg-gradient-to-r ${step.gradient} animate-pulse`}></div>
                                      )}
                                      {/* Shimmer effect for completed steps */}
                                      {isCompleted && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 shimmer"></div>
                                      )}
                                    </div>
                                    
                                    {/* Enhanced Arrow Container - Mobile optimized */}
                                    <div className={`ml-1 md:ml-4 p-0.5 md:p-2 rounded-full transition-all duration-500 transform ${
                                      isCompleted 
                                        ? `bg-gradient-to-r ${step.gradient} border-2 border-white shadow-lg md:shadow-xl scale-105 md:scale-110` 
                                        : isCurrent
                                          ? 'bg-gradient-to-r from-blue-400 to-blue-500 border-2 border-white shadow-md md:shadow-lg scale-105 md:scale-110 animate-bounce'
                                          : 'bg-gray-100 border-2 border-gray-200 hover:bg-gray-200'
                                    }`}>
                                      <ArrowRight className={`h-2 w-2 md:h-5 md:w-5 transition-all duration-300 ${
                                        isCompleted 
                                          ? 'text-white' 
                                          : isCurrent
                                            ? 'text-white'
                                            : 'text-gray-400'
                                      }`} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Order Details - Mobile optimized */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-sm border-t pt-3 md:pt-4">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 text-sm md:text-base">{transaction.quantity} {transaction.unit}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 text-sm md:text-base">{transaction.location}</span>
                        </div>
                        <div className="flex justify-start md:justify-end mt-2 md:mt-0">
                          <button 
                            onClick={() => handleViewOrderDetails(transaction, activeTab === 'orders' ? 'purchase' : 'sale')}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors duration-200"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="text-sm">查看詳情</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Original Transaction Display
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            {activeTab === 'orders' ? (
                              <ShoppingCart className="h-6 w-6 text-blue-600" />
                            ) : (
                              <Package className="h-6 w-6 text-green-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{transaction.offerTitle}</h3>
                            <p className="text-sm text-gray-600">
                              {activeTab === 'orders' ? '供應商: ' : '買家: '}
                              {activeTab === 'orders' ? (transaction as PurchaseHistoryItem).supplier : (transaction as SalesHistoryItem).buyer}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">{formatCurrency(transaction.totalAmount)}</p>
                          <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {getStatusIcon(transaction.status)}
                            <span>{getStatusText(transaction.status)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{formatDate(transaction.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{transaction.quantity} {transaction.unit}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{transaction.location}</span>
                        </div>
                        <div className="flex justify-end">
                          <button 
                            onClick={() => handleViewOrderDetails(transaction, activeTab === 'orders' ? 'purchase' : 'sale')}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Eye className="h-4 w-4" />
                            <span>查看詳情</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {currentHistory.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'orders' ? '沒有訂單' : '沒有銷售'}
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'orders' ? '您目前沒有訂單。' : '您目前沒有銷售。'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ShippingPhotoModal
        isOpen={shippingModalOpen}
        onClose={() => setShippingModalOpen(false)}
        purchaseId={selectedPurchaseId}
        onSuccess={handleActionSuccess}
      />
      
      <DeliveryConfirmModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        purchaseId={selectedPurchaseId}
        onSuccess={handleActionSuccess}
        offerTitle={selectedPurchaseData?.offerTitle}
        supplierName={selectedPurchaseData?.supplier}
        supplierId={selectedPurchaseData?.sellerId}
      />
      
      <OrderDetailsModal
        isOpen={orderDetailsModalOpen}
        onClose={handleOrderDetailsClose}
        transaction={selectedTransaction}
        type={selectedTransactionType}
      />
      
      <PaymentReceiptModal
        isOpen={paymentReceiptModalOpen}
        onClose={() => setPaymentReceiptModalOpen(false)}
        transaction={selectedPaymentTransaction}
        onReceiptUpdated={handleActionSuccess}
      />
      
      <ShippingStatusModal
        isOpen={shippingStatusModalOpen}
        onClose={() => setShippingStatusModalOpen(false)}
        transaction={selectedTransaction}
      />
      
      <ClearlotPaymentModal
        isOpen={clearlotPaymentModalOpen}
        onClose={() => setClearlotPaymentModalOpen(false)}
        transaction={selectedTransaction}
        onPaymentUpdated={handleActionSuccess}
      />

      {/* Rating Modal */}
      {ratingModalOpen && selectedPurchaseData && (
        <OrderRatingModal
          isOpen={ratingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          purchaseId={selectedPurchaseId}
          offerTitle={selectedPurchaseData.offerTitle}
          supplierName={selectedPurchaseData.supplier}
          supplierId={selectedPurchaseData.sellerId}
          supplierLogo={selectedPurchaseData.seller?.avatar || selectedPurchaseData.seller?.companyLogo}
          onRatingSubmitted={() => {
            // Close the rating modal immediately
            setRatingModalOpen(false);
            // Update the local state to mark this purchase as rated
            if (selectedPurchaseData) {
              selectedPurchaseData.hasRating = true;
              
              // Also update the transaction in the activeOrders array
              setActiveOrders(prevOrders => 
                prevOrders.map(order => 
                  order.id === selectedPurchaseData.id 
                    ? { ...order, hasRating: true }
                    : order
                )
              );
              
              // Update in purchaseHistory if it exists there
              setPurchaseHistory(prevHistory => 
                prevHistory.map(purchase => 
                  purchase.id === selectedPurchaseData.id 
                    ? { ...purchase, hasRating: true }
                    : purchase
                )
              );
            }
            // Refresh the data after rating is submitted
            handleActionSuccess();
          }}
        />
      )}

      {/* Seller Rating Modal */}
      {sellerRatingModalOpen && selectedBuyerForRating && (
        <SellerRatingModal
          isOpen={sellerRatingModalOpen}
          onClose={() => setSellerRatingModalOpen(false)}
          purchaseId={selectedBuyerForRating.id}
          offerTitle={selectedBuyerForRating.offerTitle}
          buyerName={selectedBuyerForRating.buyerInfo?.name || selectedBuyerForRating.buyer || '未知買家'}
          buyerId={selectedBuyerForRating.buyerId}
          buyerLogo={selectedBuyerForRating.buyerInfo?.avatar || selectedBuyerForRating.buyerInfo?.companyLogo}
          onRatingSubmitted={() => {
            // Close the rating modal immediately
            setSellerRatingModalOpen(false);
            // Update the local state to mark this purchase as rated
            if (selectedBuyerForRating) {
              selectedBuyerForRating.hasRating = true;
              
              // Also update the transaction in the activeSales array
              setActiveSales(prevSales => 
                prevSales.map(sale => 
                  sale.id === selectedBuyerForRating.id 
                    ? { ...sale, hasRating: true }
                    : sale
                )
              );
              
              // Update in salesHistory if it exists there
              setSalesHistory(prevHistory => 
                prevHistory.map(sale => 
                  sale.id === selectedBuyerForRating.id 
                    ? { ...sale, hasRating: true }
                    : sale
                )
              );
            }
            // Refresh the data after rating is submitted
            handleActionSuccess();
          }}
        />
      )}

    </div>
  );
} 