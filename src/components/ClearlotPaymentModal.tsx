import React, { useState } from 'react';
import { X, Upload, RefreshCw, DollarSign, Package } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { firestoreNotificationService } from '../services/firestoreNotificationService';
import { getCurrentHKTimestamp } from '../utils/dateUtils';

interface ClearlotPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onPaymentUpdated: () => void;
}

export default function ClearlotPaymentModal({ 
  isOpen, 
  onClose, 
  transaction, 
  onPaymentUpdated 
}: ClearlotPaymentModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [paymentReceipt, setPaymentReceipt] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !transaction) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create file reference
      const fileName = `clearlot-payments/${transaction.id}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);

      // Upload file
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update transaction in Firestore
      const transactionRef = doc(db, 'purchases', transaction.id);
      await updateDoc(transactionRef, {
        status: 'clearlot_paid',
        clearlotPaymentReceipt: downloadURL,
        clearlotPaymentDate: getCurrentHKTimestamp(),
        clearlotPaymentStatus: 'paid'
      });

      // Update local state
      setPaymentReceipt(downloadURL);
      transaction.status = 'clearlot_paid';
      transaction.clearlotPaymentReceipt = downloadURL;
      transaction.clearlotPaymentDate = getCurrentHKTimestamp();

      // Create admin notification for Clearlot payment receipt
      try {
        await firestoreNotificationService.addNotification({
          userId: 'admin', // Admin notification
          type: 'payment',
          title: '💰 Clearlot 付款收據上傳',
          message: `Clearlot 付款收據已上傳 - 訂單: ${transaction.id}`,
          isRead: false,
          data: {
            purchaseId: transaction.id,
            amount: transaction.totalAmount || 0,
            actionUrl: `/admin/purchases/${transaction.id}`
          },
          priority: 'high'
        });
        console.log('✅ Admin notification created for Clearlot payment receipt');
      } catch (notificationError) {
        console.error('❌ Failed to create admin notification:', notificationError);
        // Don't fail the upload if notification fails
      }

      // Notify parent component
      onPaymentUpdated();

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Error uploading payment receipt:', error);
      setIsUploading(false);
      setUploadProgress(0);
      alert('上傳失敗，請重試');
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-3 rounded-xl">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Clearlot 付款給賣家</h2>
              <p className="text-gray-600">上傳付款收據以完成賣家付款流程</p>
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
                <span className="text-gray-600">買家:</span>
                <span className="ml-2 font-medium">{transaction.buyer}</span>
              </div>
              <div>
                <span className="text-gray-600">賣家:</span>
                <span className="ml-2 font-medium">{transaction.supplier}</span>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              當前狀態
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-purple-800">訂單狀態:</span>
                <span className="font-medium text-purple-900">已送達</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-800">買家確認:</span>
                <span className="font-medium text-purple-900">已確認收貨</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-800">下一步:</span>
                <span className="font-medium text-orange-900">等待 Clearlot 付款給賣家</span>
              </div>
            </div>
          </div>

          {/* Payment Receipt Upload */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h3 className="font-semibold text-orange-900 mb-3 flex items-center">
              <Upload className="h-5 w-4 mr-2" />
              上傳付款收據
            </h3>
            
            <p className="text-sm text-orange-700 mb-4">
              請上傳 Clearlot 向賣家付款的收據證明。上傳後，訂單狀態將更新為"已完成"。
            </p>

            <div className="space-y-4">
              {/* File Input */}
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="clearlot-payment-upload"
                />
                <label
                  htmlFor="clearlot-payment-upload"
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                    isUploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>上傳中...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>選擇付款收據</span>
                    </>
                  )}
                </label>

                {isUploading && (
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{uploadProgress}% 完成</p>
                  </div>
                )}
              </div>

              {/* Upload Guidelines */}
              <div className="text-xs text-gray-600 space-y-1">
                <p>• 支持格式: JPG, PNG, PDF</p>
                <p>• 最大文件大小: 10MB</p>
                <p>• 建議上傳清晰的付款證明文件</p>
                <p className="text-orange-600 font-medium">
                  ⚠️ 上傳付款收據後，訂單將標記為完成
                </p>
              </div>
            </div>
          </div>

          {/* Process Flow */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">流程說明</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• <strong>買家確認收貨</strong>: 買家點擊"收到貨物"後，訂單狀態變為"已送達"</p>
              <p>• <strong>Clearlot 付款</strong>: 管理員上傳付款收據，確認已付款給賣家</p>
              <p>• <strong>訂單完成</strong>: 付款確認後，訂單狀態更新為"已完成"</p>
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">狀態說明</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• <strong>已送達</strong>: 買家已確認收到貨物</p>
              <p>• <strong>Clearlot付款給賣家</strong>: 等待管理員上傳付款證明</p>
              <p>• <strong>已完成</strong>: 付款確認後，訂單流程完成</p>
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