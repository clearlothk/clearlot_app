import React, { useState } from 'react';
import { X, AlertTriangle, Flag, Shield, Ban, FileText } from 'lucide-react';
import { submitOfferReport } from '../services/reportService';
import { firestoreNotificationService } from '../services/firestoreNotificationService';
import { notificationService } from '../services/notificationService';

interface ReportOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: any;
  reporterId: string;
  onReportSubmitted: () => void;
}

type ReportReason = 'fake-offer' | 'suspect-seller' | 'prohibit-products' | 'other-reason';

const reportReasons = [
  {
    id: 'fake-offer' as ReportReason,
    title: '虛假商品',
    description: '商品信息不實或存在欺詐行為',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  {
    id: 'suspect-seller' as ReportReason,
    title: '可疑賣家',
    description: '賣家行為可疑或信用問題',
    icon: Flag,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    id: 'prohibit-products' as ReportReason,
    title: '違禁商品',
    description: '商品違反平台規定或法律法規',
    icon: Ban,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    id: 'other-reason' as ReportReason,
    title: '其他原因',
    description: '其他需要舉報的問題',
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
];

export default function ReportOfferModal({ 
  isOpen, 
  onClose, 
  offer, 
  reporterId, 
  onReportSubmitted 
}: ReportOfferModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customReason, setCustomReason] = useState('');

  if (!isOpen || !offer) return null;

  const handleReasonSelect = (reason: ReportReason) => {
    setSelectedReason(reason);
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      const reportData = {
        offerId: offer.id,
        offerTitle: offer.title,
        sellerId: offer.supplierId,
        sellerName: offer.supplier?.company || 'Unknown Seller',
        reporterId: reporterId,
        reason: selectedReason,
        customReason: selectedReason === 'other-reason' ? customReason : ''
      };

      // Submit report using service
      const reportId = await submitOfferReport(reportData);

      // Send admin notification
      try {
        const adminNotificationData = {
          userId: 'admin', // This will be handled by the notification service
          type: 'report' as const,
          title: '新商品舉報',
          message: `用戶舉報了商品 "${offer.title}"，原因：${selectedReasonData?.title || selectedReason}`,
          isRead: false,
          data: {
            reportId: reportId,
            offerId: offer.id,
            offerTitle: offer.title,
            sellerId: offer.supplierId,
            sellerName: offer.supplier?.company || 'Unknown Seller',
            reporterId: reporterId,
            reason: selectedReason,
            customReason: selectedReason === 'other-reason' ? customReason : '',
            actionUrl: `/hk/admin/reports`
          },
          priority: 'high' as const
        };

        // Save to Firestore and trigger real-time notification
        const notificationId = await firestoreNotificationService.addNotification(adminNotificationData);
        
        // Create notification with ID and trigger real-time notification
        const notificationWithId = {
          ...adminNotificationData,
          id: notificationId,
          createdAt: new Date().toISOString()
        };
        
        // Trigger real-time notification
        notificationService.trigger(notificationWithId);
      } catch (notificationError) {
        console.error('Error sending admin notification:', notificationError);
        // Don't fail the report submission if notification fails
      }

      // Show success message
      alert('舉報已提交，我們會盡快處理。感謝您的反饋！');
      
      // Reset form
      setSelectedReason(null);
      setCustomReason('');
      
      // Close modal and trigger callback
      onReportSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('提交舉報時發生錯誤，請重試。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setCustomReason('');
    onClose();
  };

  const selectedReasonData = reportReasons.find(r => r.id === selectedReason);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-3 rounded-xl">
              <Flag className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">舉報商品</h2>
              <p className="text-gray-600">請選擇舉報原因</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Offer Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">被舉報商品</h3>
            <div className="text-sm text-gray-600">
              <p><strong>商品名稱:</strong> {offer.title}</p>
              <p><strong>賣家:</strong> {offer.supplier?.company || 'Unknown Seller'}</p>
              <p><strong>商品ID:</strong> {offer.id}</p>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">請選擇舉報原因</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reportReasons.map((reason) => {
                const IconComponent = reason.icon;
                const isSelected = selectedReason === reason.id;
                
                return (
                  <button
                    key={reason.id}
                    onClick={() => handleReasonSelect(reason.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? `${reason.borderColor} ${reason.bgColor} border-2`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <IconComponent className={`h-5 w-5 mt-0.5 ${isSelected ? reason.color : 'text-gray-400'}`} />
                      <div>
                        <h4 className={`font-medium ${isSelected ? reason.color : 'text-gray-900'}`}>
                          {reason.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {reason.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'other-reason' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                請詳細說明舉報原因
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="請詳細描述您發現的問題..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">重要提醒</p>
                <p className="text-yellow-700">
                  請確保您的舉報內容真實有效。惡意舉報可能導致您的帳戶受到限制。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 space-x-3">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || (selectedReason === 'other-reason' && !customReason.trim()) || isSubmitting}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? '提交中...' : '提交舉報'}
          </button>
        </div>
      </div>
    </div>
  );
}
