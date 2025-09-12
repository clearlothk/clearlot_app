import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Star, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { confirmDelivery } from '../services/firebaseService';
import OrderRatingModal from './OrderRatingModal';

interface DeliveryConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: string;
  onSuccess: () => void;
  offerTitle?: string;
  supplierName?: string;
  supplierId?: string;
}

export default function DeliveryConfirmModal({ 
  isOpen, 
  onClose, 
  purchaseId, 
  onSuccess, 
  offerTitle, 
  supplierName, 
  supplierId 
}: DeliveryConfirmModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError(null);

    try {
      await confirmDelivery(purchaseId);
      onSuccess();
      onClose();
      
      // Show rating modal after successful delivery confirmation
      if (offerTitle && supplierName && supplierId) {
        setShowRatingModal(true);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleRatingModalClose = () => {
    setShowRatingModal(false);
  };

  const handleContactSeller = () => {
    // Navigate to messages with the seller
    if (supplierId) {
      navigate(`/hk/${user?.id}/messages?startConversation=${supplierId}`);
      onClose(); // Close the modal after navigation
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">確認收貨</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Icon */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">確認已收到貨物</h3>
            <p className="text-sm text-gray-600">
              請確認您已經收到賣家發送的貨物，並且貨物狀態良好。
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">重要提醒</p>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• 請仔細檢查貨物的數量和品質</li>
                  <li>• 確認收貨後，訂單將標記為已完成</li>
                  <li>• 如有問題，請及時聯繫賣家或客服</li>
                </ul>
                {supplierId && (
                  <button
                    onClick={handleContactSeller}
                    className="mt-3 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-1"
                    disabled={isConfirming}
                  >
                    <MessageCircle className="h-3 w-3" />
                    <span>聯繫賣家</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isConfirming}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isConfirming ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                確認中...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                確認收貨
              </>
            )}
          </button>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && offerTitle && supplierName && supplierId && (
        <OrderRatingModal
          isOpen={showRatingModal}
          onClose={handleRatingModalClose}
          purchaseId={purchaseId}
          offerTitle={offerTitle}
          supplierName={supplierName}
          supplierId={supplierId}
        />
      )}
    </div>
  );
} 