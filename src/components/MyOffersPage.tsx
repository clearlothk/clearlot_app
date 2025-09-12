import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserOffers, deleteOffer } from '../services/firebaseService';
import { Offer, Purchase } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Plus, 
  Search, 
  Calendar,
  Package,
  MapPin,
  Loader,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingDown,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const MyOffersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-high' | 'price-low'>('newest');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingOffer, setDeletingOffer] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [offerOrderStatuses, setOfferOrderStatuses] = useState<Record<string, {
    hasOrders: boolean;
    hasPendingOrders: boolean;
    orderCount: number;
    latestStatus?: string;
    latestOrderDate?: string;
  }>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/hk/login');
      return;
    }
    fetchOffers();
  }, [user, navigate]);

  const fetchOffers = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const userOffers = await getUserOffers(user.id);
      setOffers(userOffers);
      
      // Fetch order statuses for each offer
      await fetchOfferOrderStatuses(userOffers);
    } catch (err: any) {
      setError(err.message || '獲取優惠失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferOrderStatuses = async (offers: Offer[]) => {
    if (!user) return;
    
    try {
    const statuses: Record<string, {
      hasOrders: boolean;
      hasPendingOrders: boolean;
      orderCount: number;
      latestStatus?: string;
      latestOrderDate?: string;
    }> = {};
      
      for (const offer of offers) {
        const purchasesRef = collection(db, 'purchases');
        const q = query(
          purchasesRef,
          where('offerId', '==', offer.id),
          where('sellerId', '==', user.id)
        );
        
        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => doc.data() as Purchase);
        
        if (orders.length > 0) {
          // Sort orders by date to get the latest
          const sortedOrders = orders.sort((a, b) => 
            new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
          );
          
          // Check if there are any pending orders (not completed or rejected)
          const hasPendingOrders = orders.some(order => 
            order.status !== 'completed' && order.status !== 'rejected'
          );
          
          statuses[offer.id] = {
            hasOrders: true,
            hasPendingOrders: hasPendingOrders,
            orderCount: orders.length,
            latestStatus: sortedOrders[0].status,
            latestOrderDate: sortedOrders[0].purchaseDate
          };
        } else {
          statuses[offer.id] = {
            hasOrders: false,
            hasPendingOrders: false,
            orderCount: 0
          };
        }
      }
      
      setOfferOrderStatuses(statuses);
    } catch (error) {
      console.error('Error fetching offer order statuses:', error);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      setDeletingOffer(offerId);
      await deleteOffer(offerId);
      setOffers(offers.filter(offer => offer.id !== offerId));
      setShowDeleteModal(false);
      setSelectedOffer(null);
    } catch (err: any) {
      setError(err.message || '刪除優惠失敗');
    } finally {
      setDeletingOffer(null);
    }
  };

  const handleEditOffer = (offer: Offer) => {
    navigate(`/hk/${user?.id}/edit-offer/${offer.id}`, { state: { offer } });
  };

  const handleViewOffer = async (offer: Offer) => {
    // Fetch fresh offer data to ensure we have the latest images
    try {
      const freshOffers = await getUserOffers(user!.id);
      const freshOffer = freshOffers.find(o => o.id === offer.id);
      if (freshOffer) {
        setSelectedOffer(freshOffer);
        // Update the cached offers list with fresh data
        setOffers(freshOffers);
      } else {
        setSelectedOffer(offer);
      }
    } catch (error) {
      console.error('Error fetching fresh offer data:', error);
      // Fallback to cached data if fetch fails
      setSelectedOffer(offer);
    }
  };

  // Photo modal functions
  const handlePhotoClick = (imageUrl: string, index: number) => {
    setSelectedPhoto(imageUrl);
    setSelectedPhotoIndex(index);
    setShowPhotoModal(true);
  };

  const handlePreviousPhoto = () => {
    if (selectedOffer && selectedPhotoIndex > 0) {
      const newIndex = selectedPhotoIndex - 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(selectedOffer.images[newIndex]);
    }
  };

  const handleNextPhoto = () => {
    if (selectedOffer && selectedPhotoIndex < selectedOffer.images.length - 1) {
      const newIndex = selectedPhotoIndex + 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(selectedOffer.images[newIndex]);
    }
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedPhoto('');
    setSelectedPhotoIndex(0);
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.offerId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && !offer.deleted) ||
                         (filterStatus === 'inactive' && offer.deleted);
    
    // Only hide offers that are completely sold out (quantity = 0) or have status = 'sold'
    // Offers with remaining quantity should always be visible, regardless of order status
    const isSoldOut = offer.quantity <= 0 || offer.status === 'sold';
    
    if (isSoldOut) {
      return false;
    }
    
    return matchesSearch && matchesStatus;
  });

  const sortedOffers = [...filteredOffers].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'price-high':
        return b.currentPrice - a.currentPrice;
      case 'price-low':
        return a.currentPrice - b.currentPrice;
      default:
        return 0;
    }
  });

  const getStatusBadge = (offer: Offer) => {
    if (offer.deleted) {
      return (
        <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-lg bg-red-500 text-white">
          <XCircle className="h-3 w-3 mr-1" />
          已刪除
        </span>
      );
    }
    
    const orderStatus = offerOrderStatuses[offer.id];
    
    if (orderStatus?.hasOrders) {
      // Show order status with different colors based on status
      const getStatusColor = (status: string) => {
        switch (status) {
          case 'pending':
            return 'bg-yellow-500';
          case 'approved':
            return 'bg-blue-500';
          case 'shipped':
            return 'bg-purple-500';
          case 'delivered':
            return 'bg-green-500';
          case 'completed':
            return 'bg-green-600';
          default:
            return 'bg-gray-500';
        }
      };
      
      const getStatusText = (status: string) => {
        switch (status) {
          case 'pending':
            return '待付款';
          case 'approved':
            return '已付款';
          case 'shipped':
            return '已發貨';
          case 'delivered':
            return '已送達';
          case 'completed':
            return '已完成';
          default:
            return '處理中';
        }
      };
      
      return (
        <div className="space-y-1">
          <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-lg ${getStatusColor(orderStatus.latestStatus || '')} text-white`}>
            <CheckCircle className="h-3 w-3 mr-1" />
            {getStatusText(orderStatus.latestStatus || '')}
          </span>
          <div className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-full">
            {orderStatus.orderCount} 個訂單
          </div>
        </div>
      );
    }
    
    return (
      <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-lg bg-green-500 text-white">
        <CheckCircle className="h-3 w-3 mr-1" />
        活躍
      </span>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          我的優惠
        </h1>
        <p className="text-xl text-gray-600 flex items-center flex-wrap gap-4">
          <span className="text-green-600 font-semibold flex items-center">
            📦 管理您上傳的所有優惠
          </span>
          <span className="text-blue-600 text-sm">
            💡 已售完的優惠將自動隱藏，有剩餘庫存的優惠會繼續顯示
          </span>
          {searchQuery && (
            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
              搜索結果 "{searchQuery}"
            </span>
          )}
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索優惠標題、描述或LOT編號..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-white"
            >
              <option value="all">所有狀態</option>
              <option value="active">活躍</option>
              <option value="inactive">已刪除</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-white"
            >
              <option value="newest">最新</option>
              <option value="oldest">最舊</option>
              <option value="price-high">價格高到低</option>
              <option value="price-low">價格低到高</option>
            </select>

            {/* Upload New Offer Button */}
            <button
              onClick={() => navigate(`/hk/${user?.id}/upload`)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              上傳新優惠
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <div className="text-gray-400 mb-6">
            <Loader className="h-24 w-24 mx-auto animate-spin" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">載入中...</h3>
          <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
            請稍候，我們正在為您加載優惠。
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <div className="text-red-400 mb-6">
            <AlertCircle className="h-24 w-24 mx-auto" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">載入失敗</h3>
          <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={fetchOffers}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
          >
            重試
          </button>
        </div>
      ) : sortedOffers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <div className="text-gray-400 mb-6">
            <Package className="h-24 w-24 mx-auto" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            {searchQuery || filterStatus !== 'all' ? '沒有找到優惠' : '您還沒有上傳任何優惠'}
          </h3>
          <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
            {searchQuery || filterStatus !== 'all' 
              ? '嘗試調整搜索條件或篩選器以發現更多優惠。'
              : '開始上傳您的第一個優惠，讓更多買家發現您的商品。'
            }
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <button
              onClick={() => navigate(`/hk/${user?.id}/upload`)}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
            >
              <Plus className="h-5 w-5 mr-2 inline" />
              上傳第一個優惠
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedOffers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 group transform hover:-translate-y-1 flex flex-col h-full">
              {/* Image Section - Fixed Height */}
              <div className="relative h-48 overflow-hidden flex-shrink-0">
                {offer.images && offer.images.length > 0 ? (
                  <img
                    src={offer.images[0]}
                    alt={offer.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  {getStatusBadge(offer)}
                </div>

                {/* Discount Badge */}
                {!offer.deleted && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-red-500 text-white px-3 py-1.5 text-sm font-bold rounded-lg shadow-lg">
                      -{Math.round(((offer.originalPrice - offer.currentPrice) / offer.originalPrice) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Content Section - Flexible Height */}
              <div className="p-6 flex flex-col flex-1">
                {/* Offer ID and Title - Fixed Height */}
                <div className="h-16 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {offer.offerId}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">
                    {offer.title}
                  </h3>
                </div>

                {/* Price Section - Fixed Height */}
                <div className="mb-4 bg-gray-50 p-4 rounded-lg h-20 flex items-center">
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <span className="text-2xl font-bold text-blue-600">
                        ${offer.currentPrice.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-600 ml-2 font-medium">每 {offer.unit}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm line-through text-gray-500 font-medium">
                        ${offer.originalPrice.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600 font-bold flex items-center justify-end">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        <span>節省 ${(offer.originalPrice - offer.currentPrice).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantity and Location - Fixed Height */}
                <div className="flex items-center justify-between text-sm text-gray-700 mb-4 h-8">
                  <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
                    <Package className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-semibold">{offer.quantity.toLocaleString()} {offer.unit}</span>
                  </div>
                  <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg">
                    <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                    <span className="font-medium">{offer.location}</span>
                  </div>
                </div>

                {/* Tags Section - Fixed Height */}
                <div className="mb-4 min-h-8">
                  {offer.tags && offer.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {offer.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {offer.tags.length > 2 && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">
                          +{offer.tags.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">無標籤</div>
                  )}
                </div>

                                 {/* Actions - Fixed at Bottom */}
                 {!offer.deleted && (
                   <div className="mt-auto space-y-2">
                     {/* Creation Date - Above View/Edit buttons */}
                     <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg h-10">
                       <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                       <span className="font-medium">創建於 {new Date(offer.createdAt).toLocaleDateString()}</span>
                     </div>
                     
                     {/* Order Status Info */}
                     {offerOrderStatuses[offer.id]?.hasOrders && (
                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-blue-800 font-medium">
                             📦 {offerOrderStatuses[offer.id].orderCount} 個訂單
                           </span>
                           <span className="text-blue-600">
                             最新狀態: {offerOrderStatuses[offer.id].latestStatus === 'pending' ? '待付款' :
                                       offerOrderStatuses[offer.id].latestStatus === 'approved' ? '已付款' :
                                       offerOrderStatuses[offer.id].latestStatus === 'shipped' ? '已發貨' :
                                       offerOrderStatuses[offer.id].latestStatus === 'delivered' ? '已送達' :
                                       offerOrderStatuses[offer.id].latestStatus === 'completed' ? '已完成' : '處理中'}
                           </span>
                         </div>
                         {offerOrderStatuses[offer.id].latestOrderDate && (
                           <div className="text-xs text-blue-600 mt-1">
                             最新訂單: {new Date(offerOrderStatuses[offer.id].latestOrderDate!).toLocaleDateString()}
                           </div>
                         )}
                       </div>
                     )}
                     
                     <div className="flex gap-2">
                       <button
                         onClick={() => handleViewOffer(offer)}
                         className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                       >
                         <Eye className="h-4 w-4 mr-1" />
                         查看
                       </button>
                       <button
                         onClick={() => handleEditOffer(offer)}
                         disabled={offerOrderStatuses[offer.id]?.hasPendingOrders || offer.quantity <= 0}
                         className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                           offerOrderStatuses[offer.id]?.hasPendingOrders || offer.quantity <= 0
                             ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                             : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                         }`}
                         title={offerOrderStatuses[offer.id]?.hasPendingOrders ? '有進行中的訂單時無法編輯' : offer.quantity <= 0 ? '已售完無法編輯' : '編輯優惠'}
                       >
                         <Edit className="h-4 w-4 mr-1" />
                         編輯
                       </button>
                     </div>
                     <button
                       onClick={() => {
                         setSelectedOffer(offer);
                         setShowDeleteModal(true);
                       }}
                       disabled={offerOrderStatuses[offer.id]?.hasPendingOrders || offer.quantity <= 0}
                       className={`w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                         offerOrderStatuses[offer.id]?.hasPendingOrders || offer.quantity <= 0
                           ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                           : 'text-red-700 bg-red-100 hover:bg-red-200'
                       }`}
                       title={offerOrderStatuses[offer.id]?.hasPendingOrders ? '有進行中的訂單時無法刪除' : offer.quantity <= 0 ? '已售完無法刪除' : '刪除優惠'}
                     >
                       <Trash2 className="h-4 w-4 mr-1" />
                       刪除優惠
                     </button>
                     
                     {/* Warning message for offers with pending orders or sold out */}
                     {(offerOrderStatuses[offer.id]?.hasPendingOrders || offer.quantity <= 0) && (
                       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                         <p className="text-xs text-yellow-800 text-center">
                           {offerOrderStatuses[offer.id]?.hasPendingOrders 
                             ? '⚠️ 此優惠有進行中的訂單，無法編輯或刪除'
                             : '⚠️ 此優惠已售完，無法編輯或刪除'
                           }
                         </p>
                       </div>
                     )}
                   </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Offer Modal */}
      {selectedOffer && !showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">優惠詳情</h2>
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Offer Images */}
              {selectedOffer.images && selectedOffer.images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    產品圖片 ({selectedOffer.images.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedOffer.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => handlePhotoClick(image, index)}
                      >
                        <img
                          src={image}
                          alt={`${selectedOffer.title} - 圖片 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-white bg-opacity-90 rounded-full p-2">
                              <ZoomIn className="h-4 w-4 text-gray-700" />
                            </div>
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Offer Details */}
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    LOT編號: {selectedOffer.offerId}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedOffer.title}</h3>
                  <p className="text-gray-600 mt-2">{selectedOffer.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">當前價格</label>
                    <p className="text-2xl font-bold text-blue-600">${selectedOffer.currentPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">原價</label>
                    <p className="text-lg line-through text-gray-500">${selectedOffer.originalPrice.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">數量</label>
                    <p className="text-gray-900">{selectedOffer.quantity.toLocaleString()} {selectedOffer.unit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">地點</label>
                    <p className="text-gray-900">{selectedOffer.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">最小訂購量</label>
                    <p className="text-gray-900">{selectedOffer.minOrderQuantity} {selectedOffer.unit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">運輸時間</label>
                    <p className="text-gray-900">{selectedOffer.shippingEstimateDays} 天</p>
                  </div>
                </div>

                {selectedOffer.tags && selectedOffer.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">標籤</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedOffer.tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">創建時間</label>
                  <p className="text-gray-900">{new Date(selectedOffer.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleEditOffer(selectedOffer)}
                  className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  編輯優惠
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  刪除優惠
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">確認刪除</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                您確定要刪除優惠 "{selectedOffer.title}" 嗎？此操作無法撤銷。
              </p>
              {(offerOrderStatuses[selectedOffer.id]?.hasPendingOrders || selectedOffer.quantity <= 0) && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    {offerOrderStatuses[selectedOffer.id]?.hasPendingOrders 
                      ? '⚠️ 此優惠有進行中的訂單，無法刪除'
                      : '⚠️ 此優惠已售完，無法刪除'
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                disabled={deletingOffer === selectedOffer.id}
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteOffer(selectedOffer.id)}
                className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                disabled={deletingOffer === selectedOffer.id || offerOrderStatuses[selectedOffer.id]?.hasPendingOrders || selectedOffer.quantity <= 0}
              >
                {deletingOffer === selectedOffer.id ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    刪除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    確認刪除
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Zoom Modal */}
      {showPhotoModal && selectedPhoto && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
            {/* Close Button */}
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Previous Button */}
            {selectedOffer.images.length > 1 && selectedPhotoIndex > 0 && (
              <button
                onClick={handlePreviousPhoto}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Next Button */}
            {selectedOffer.images.length > 1 && selectedPhotoIndex < selectedOffer.images.length - 1 && (
              <button
                onClick={handleNextPhoto}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Main Image */}
            <img
              src={selectedPhoto}
              alt={`${selectedOffer.title} - 圖片 ${selectedPhotoIndex + 1}`}
              className="w-full h-full object-contain rounded-lg"
            />

            {/* Image Counter */}
            {selectedOffer.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                {selectedPhotoIndex + 1} / {selectedOffer.images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOffersPage; 