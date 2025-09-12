import React, { useState } from 'react';
import { X, Upload, FileText, Eye, RefreshCw, CheckCircle } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { firestoreNotificationService } from '../services/firestoreNotificationService';
import { getCurrentHKTimestamp } from '../utils/dateUtils';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onReceiptUpdated: () => void;
}

export default function PaymentReceiptModal({ 
  isOpen, 
  onClose, 
  transaction, 
  onReceiptUpdated 
}: PaymentReceiptModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isOpen) return null;

  // Debug: Log transaction data to see what's available
  console.log('PaymentReceiptModal - Transaction data:', transaction);
  console.log('PaymentReceiptModal - paymentReceipt:', transaction.paymentReceipt);
  console.log('PaymentReceiptModal - paymentDetails:', transaction.paymentDetails);
  console.log('PaymentReceiptModal - receiptPreview:', transaction.paymentDetails?.receiptPreview);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !transaction) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create file reference
      const fileName = `receipts/${transaction.id}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);

      // Upload file
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update transaction in Firestore - replace the original receiptPreview
      const transactionRef = doc(db, 'purchases', transaction.id);
      await updateDoc(transactionRef, {
        'paymentDetails.receiptPreview': downloadURL,
        'paymentDetails.receiptFile': file.name,
        'paymentDetails.timestamp': getCurrentHKTimestamp(),
        paymentApprovalStatus: 'pending' // Reset approval status for new receipt
      });

      // Update local state
      if (transaction.paymentDetails) {
        transaction.paymentDetails.receiptPreview = downloadURL;
        transaction.paymentDetails.receiptFile = file.name;
        transaction.paymentDetails.timestamp = getCurrentHKTimestamp();
      }
      transaction.paymentApprovalStatus = 'pending';

      // Create admin notification for receipt re-upload
      try {
        await firestoreNotificationService.addNotification({
          userId: 'admin', // Admin notification
          type: 'payment',
          title: '📄 付款收據重新上傳',
          message: `用戶重新上傳了付款收據 - 訂單: ${transaction.id}`,
          isRead: false,
          data: {
            purchaseId: transaction.id,
            amount: transaction.totalAmount || 0,
            actionUrl: `/admin/purchases/${transaction.id}`
          },
          priority: 'high'
        });
        console.log('✅ Admin notification created for receipt re-upload');
      } catch (notificationError) {
        console.error('❌ Failed to create admin notification:', notificationError);
        // Don't fail the upload if notification fails
      }

      // Notify parent component
      onReceiptUpdated();

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Error uploading receipt:', error);
      setIsUploading(false);
      setUploadProgress(0);
      alert('上傳失敗，請重試');
    }
  };

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
            <div className="bg-blue-100 p-3 rounded-xl">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">我的支付收據</h2>
              <p className="text-gray-600">查看和管理您的支付收據</p>
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
                <span className="text-gray-600">賣家:</span>
                <span className="ml-2 font-medium">{transaction.supplier || transaction.seller || transaction.sellerName || '未知賣家'}</span>
              </div>
              <div>
                <span className="text-gray-600">地點:</span>
                <span className="ml-2 font-medium">{transaction.location}</span>
              </div>
            </div>
          </div>

          {/* Current Receipt */}
          {(transaction.paymentReceipt || (transaction.paymentDetails?.receiptPreview)) && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                當前支付收據
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">支付收據已上傳</p>
                    <p className="text-sm text-green-700">
                      上傳時間: {transaction.paymentReceiptUpdatedAt ? formatDate(transaction.paymentReceiptUpdatedAt) : 
                                (transaction.paymentDetails?.timestamp ? formatDate(transaction.paymentDetails.timestamp) : '未知')}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <a
                    href={transaction.paymentReceipt || transaction.paymentDetails?.receiptPreview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>查看收據</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Upload New Receipt */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <Upload className="h-5 w-4 mr-2" />
              {(transaction.paymentReceipt || transaction.paymentDetails?.receiptPreview) ? '重新上傳收據' : '上傳支付收據'}
            </h3>
            
            <p className="text-sm text-blue-700 mb-4">
              {(transaction.paymentReceipt || transaction.paymentDetails?.receiptPreview)
                ? '如果您需要更新支付收據，請選擇新文件進行上傳。新文件將替換現有收據。'
                : '請上傳您的支付收據以確認付款。支持 JPG、PNG、PDF 格式，最大 10MB。'
              }
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
                  id="receipt-upload"
                />
                <label
                  htmlFor="receipt-upload"
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                    isUploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
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
                      <span>選擇文件</span>
                    </>
                  )}
                </label>

                {isUploading && (
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                <p>• 建議上傳清晰的收據圖片或 PDF 文件</p>
                {(transaction.paymentReceipt || transaction.paymentDetails?.receiptPreview) && (
                  <p className="text-orange-600 font-medium">
                    ⚠️ 上傳新文件將替換現有收據
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">狀態說明</h3>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>• <strong>待付款</strong>: 您尚未上傳支付收據</p>
              <p>• <strong>已付款</strong>: 您已上傳收據，等待賣家確認</p>
              <p>• <strong>已發貨</strong>: 付款確認後，賣家已發貨</p>
              <p>• <strong>已完成</strong>: 訂單流程完成</p>
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