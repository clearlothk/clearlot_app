import React from 'react';
import { X, FileText, Eye, Download, Truck, Package, MapPin, Calendar, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ShippingStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export default function ShippingStatusModal({ 
  isOpen, 
  onClose, 
  transaction 
}: ShippingStatusModalProps) {
  const { user } = useAuth();
  
  if (!isOpen) return null;

  // Determine if current user is the buyer or seller
  const isBuyer = user && transaction.buyerId === user.id;
  const isSeller = user && transaction.sellerId === user.id;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <Truck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">發貨狀態詳情</h2>
              <p className="text-gray-600">查看訂單的發貨狀態和進度</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3">交易信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">訂單編號:</span>
                <span className="ml-2 font-medium">{transaction.id}</span>
              </div>
              <div>
                <span className="text-gray-600">產品:</span>
                <span className="ml-2 font-medium">{transaction.offerTitle}</span>
              </div>
              <div>
                <span className="text-gray-600">數量:</span>
                <span className="ml-2 font-medium">{transaction.quantity} {transaction.unit}</span>
              </div>
              <div>
                <span className="text-gray-600">總金額:</span>
                <span className="ml-2 font-medium text-green-600 font-bold">
                  HK${transaction.totalAmount?.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">
                  {isBuyer ? '賣家:' : isSeller ? '買家:' : '賣家:'}
                </span>
                <span className="ml-2 font-medium">
                  {isBuyer ? (
                    // For buyers, show seller information
                    transaction.seller?.name || 
                    transaction.seller?.company || 
                    transaction.supplier || 
                    '未知賣家'
                  ) : isSeller ? (
                    // For sellers, show buyer information
                    transaction.buyerInfo?.name || 
                    transaction.buyerInfo?.company || 
                    transaction.buyer ||
                    '未知買家'
                  ) : (
                    // Fallback (shouldn't happen in normal flow)
                    transaction.seller?.name || 
                    transaction.seller?.company || 
                    transaction.supplier || 
                    '未知賣家'
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-600">地點:</span>
                <span className="ml-2 font-medium">{transaction.location}</span>
              </div>
            </div>
          </div>

          {/* Shipping Status */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              發貨狀態
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-green-800">當前狀態:</span>
                <span className="font-medium text-green-900">已發貨</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-800">發貨時間:</span>
                <span className="font-medium text-green-900">
                  {(() => {
                    // Get shipping photo upload time from shippingDetails
                    const shippingTime = transaction.shippingDetails?.shippedAt || 
                                       transaction.shippingDetails?.uploadedAt ||
                                       transaction.shippingDate;
                    return shippingTime ? formatDate(shippingTime) : '未知';
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Details */}
          {transaction.shippingDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Package className="h-5 w-4 mr-2" />
                發貨詳情
              </h3>
              
              <div className="space-y-3">
                {transaction.shippingDetails.trackingNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800">追蹤編號:</span>
                    <span className="font-medium text-blue-900">{transaction.shippingDetails.trackingNumber}</span>
                  </div>
                )}
                
                {transaction.shippingDetails.carrier && (
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800">快遞公司:</span>
                    <span className="font-medium text-blue-900">{transaction.shippingDetails.carrier}</span>
                  </div>
                )}
                
                {transaction.shippingDetails.shippingMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800">發貨方式:</span>
                    <span className="font-medium text-blue-900">{transaction.shippingDetails.shippingMethod}</span>
                  </div>
                )}
                
                {transaction.shippingDetails.notes && (
                  <div className="flex items-start justify-between">
                    <span className="text-blue-800">發貨備註:</span>
                    <span className="font-medium text-blue-900 text-right max-w-xs">{transaction.shippingDetails.notes}</span>
                  </div>
                )}

                {transaction.shippingDetails.remarks && (
                  <div className="flex items-start justify-between">
                    <span className="text-blue-800">賣家備註:</span>
                    <div className="text-right max-w-xs">
                      <p className="font-medium text-blue-900 whitespace-pre-wrap">
                        {transaction.shippingDetails.remarks}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Photos */}
          {((transaction.shippingPhotos && transaction.shippingPhotos.length > 0) || 
            (transaction.shippingDetails?.shippingPhotos && transaction.shippingDetails.shippingPhotos.length > 0) ||
            (transaction.shippingDetails?.shippingPhoto)) && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                <FileText className="h-5 w-4 mr-2" />
                發貨照片
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  // Get photos from multiple possible locations
                  const photos = transaction.shippingPhotos || 
                                transaction.shippingDetails?.shippingPhotos || 
                                (transaction.shippingDetails?.shippingPhoto ? [transaction.shippingDetails.shippingPhoto] : []);
                  
                  return photos.map((photo: string, index: number) => (
                    <div key={index} className="relative group">
                      <img 
                        src={photo} 
                        alt={`發貨照片 ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-purple-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <a
                          href={photo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white p-2 rounded-full shadow-lg"
                        >
                          <Eye className="h-4 w-4 text-purple-600" />
                        </a>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">下一步操作</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p>• <strong>追蹤發貨</strong>: 使用追蹤編號監控包裹狀態</p>
              <p>• <strong>等待送達</strong>: 買家確認收到貨物後，訂單將更新為"已送達"</p>
              <p>• <strong>完成訂單</strong>: 買家確認收貨後，訂單將標記為"已完成"</p>
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">狀態說明</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• <strong>已發貨</strong>: 賣家已發貨，包裹正在運輸中</p>
              <p>• <strong>已送達</strong>: 包裹已送達，等待買家確認</p>
              <p>• <strong>已完成</strong>: 買家確認收貨，訂單完成</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
} 