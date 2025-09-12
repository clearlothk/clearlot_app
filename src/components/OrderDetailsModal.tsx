import React, { useState } from 'react';
import { X, Package, MapPin, Calendar, DollarSign, User, Truck, CheckCircle, Clock, AlertCircle, Edit3, MessageCircle } from 'lucide-react';
import EditDeliveryDetailsModal from './EditDeliveryDetailsModal';
import { useAuth } from '../contexts/AuthContext';
import SellerRatingDisplay from './SellerRatingDisplay';
import { useNavigate } from 'react-router-dom';
import { getClearLotAdminId } from '../services/adminService';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any; // PurchaseHistoryItem or SalesHistoryItem
  type: 'purchase' | 'sale';
}

export default function OrderDetailsModal({ isOpen, onClose, transaction, type }: OrderDetailsModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showEditDeliveryModal, setShowEditDeliveryModal] = useState(false);
  const [isContactingClearLot, setIsContactingClearLot] = useState(false);
  
  if (!isOpen || !transaction) return null;

  // Check if buyer can edit delivery details
  const canEditDeliveryDetails = () => {
    // Only buyers can edit delivery details
    if (type !== 'purchase') return false;
    
    // Can only edit before shipping step (status should be 'approved' or earlier)
    const allowedStatuses = ['pending', 'approved'];
    return allowedStatuses.includes(transaction.status) && 
           transaction.deliveryDetails && 
           user?.id === transaction.buyerId;
  };

  const handleEditSuccess = () => {
    // Refresh the transaction data or close and reopen modal
    setShowEditDeliveryModal(false);
    // The parent component should refresh the data
    onClose();
  };

  const handleContactClearLot = async () => {
    if (!user) {
      alert('請先登入以聯絡 ClearLot 客服');
      return;
    }

    setIsContactingClearLot(true);
    
    try {
      // Get the ClearLot admin user ID
      const adminId = await getClearLotAdminId();
      
      if (!adminId) {
        alert('無法找到 ClearLot 客服，請稍後再試');
        return;
      }

      // Check if user is trying to contact themselves (if they're admin)
      if (user.id === adminId) {
        alert('您已經是管理員');
        return;
      }

      // Navigate to messages page with the admin
      navigate(`/hk/${user.id}/messages?startConversation=${adminId}`);
      onClose(); // Close the modal after navigation
    } catch (error) {
      console.error('Error contacting ClearLot:', error);
      alert('無法開啟對話，請重試');
    } finally {
      setIsContactingClearLot(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
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
        return <AlertCircle className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
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
      case 'shipped':
        return '已發貨';
      case 'delivered':
        return '已送達';
      case 'completed':
        return '已完成';
      default:
        return '未知';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {type === 'purchase' ? '購買詳情' : '銷售詳情'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Image and Basic Info */}
          <div className="flex items-start space-x-4">
            {transaction.productImage ? (
              <img
                src={transaction.productImage}
                alt={transaction.offerTitle}
                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {transaction.offerTitle}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <User className="h-4 w-4" />
                <span>
                  {type === 'purchase' ? '供應商: ' : '買家: '}
                  {type === 'purchase' ? transaction.supplier : transaction.buyer}
                </span>
                {type === 'purchase' && transaction.sellerId && (
                  <SellerRatingDisplay 
                    sellerId={transaction.sellerId} 
                    showCount={true}
                    className="ml-2"
                  />
                )}
              </div>
              <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
                {getStatusIcon(transaction.status)}
                <span>{getStatusText(transaction.status)}</span>
              </div>
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">訂單信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">訂單編號:</span>
                    <span className="font-medium">{transaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">優惠編號:</span>
                    <span className="font-medium">{transaction.offerId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">訂單日期:</span>
                    <span className="font-medium">{formatDate(transaction.date)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">產品信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">數量:</span>
                    <span className="font-medium">{transaction.quantity} {transaction.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">地點:</span>
                    <span className="font-medium">{transaction.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">付款信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">總金額:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {formatCurrency(transaction.totalAmount)}
                    </span>
                  </div>
                  {transaction.paymentApprovalStatus && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">付款狀態:</span>
                      <span className={`font-medium ${getStatusColor(transaction.paymentApprovalStatus)}`}>
                        {getStatusText(transaction.paymentApprovalStatus)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Logistics Cost Information */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-start">
                  <Truck className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-900 mb-1">物流費用已包含</h4>
                    <p className="text-sm text-green-700">
                      此訂單價格已包含所有物流費用，賣家負責安排配送，買家無需額外支付運費
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {transaction.deliveryDetails && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      {type === 'purchase' ? '送貨信息' : '買家送貨信息'}
                    </h4>
                    {canEditDeliveryDetails() && (
                      <button
                        onClick={() => setShowEditDeliveryModal(true)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>編輯</span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600 block mb-1">
                        {type === 'purchase' ? '送貨地址:' : '買家送貨地址:'}
                      </span>
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="text-gray-900">
                          <p><span className="font-medium">分區：</span>{transaction.deliveryDetails.district}</p>
                          <p><span className="font-medium">細分地區：</span>{transaction.deliveryDetails.subdivision}</p>
                          <p><span className="font-medium">地址 1：</span>{transaction.deliveryDetails.address1}</p>
                          {transaction.deliveryDetails.address2 && <p><span className="font-medium">地址 2：</span>{transaction.deliveryDetails.address2}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-600 block mb-1">
                          {type === 'purchase' ? '聯絡人:' : '買家聯絡人:'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900">{transaction.deliveryDetails.contactPersonName}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">
                          {type === 'purchase' ? '聯絡電話:' : '買家聯絡電話:'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900">{transaction.deliveryDetails.contactPersonPhone}</span>
                        </div>
                      </div>
                    </div>
                    {transaction.deliveryDetails.remarks && (
                      <div>
                        <span className="text-gray-600 block mb-1">
                          {type === 'purchase' ? '備註:' : '買家備註:'}
                        </span>
                        <span className="text-gray-900">{transaction.deliveryDetails.remarks}</span>
                      </div>
                    )}
                    {transaction.deliveryDetails.confirmedAt && (
                      <div className="pt-2 border-t border-green-200">
                        <span className="text-xs text-green-600">
                          確認時間: {formatDate(transaction.deliveryDetails.confirmedAt)}
                        </span>
                      </div>
                    )}
                    
                    {/* Contact ClearLot Button */}
                    <div className="pt-3 border-t border-green-200">
                      <button
                        onClick={handleContactClearLot}
                        disabled={isContactingClearLot}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isContactingClearLot ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>聯絡中...</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle className="h-4 w-4" />
                            <span>聯絡 ClearLot</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            關閉
          </button>
        </div>
      </div>

      {/* Edit Delivery Details Modal */}
      <EditDeliveryDetailsModal
        isOpen={showEditDeliveryModal}
        onClose={() => setShowEditDeliveryModal(false)}
        transaction={transaction}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
} 