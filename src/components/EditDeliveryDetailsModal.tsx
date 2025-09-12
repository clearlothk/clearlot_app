import React, { useState, useEffect } from 'react';
import { X, MapPin, User, Phone, MessageSquare } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { LOCATIONS, DISTRICT_SUBDIVISIONS } from '../constants/categories';
import { firestoreNotificationService } from '../services/firestoreNotificationService';
import { getCurrentHKTimestamp } from '../utils/dateUtils';

interface DeliveryDetails {
  district: string;
  subdivision: string;
  address1: string;
  address2?: string;
  contactPersonName: string;
  contactPersonPhone: string;
  remarks?: string;
}

interface EditDeliveryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onSuccess: () => void;
}

export default function EditDeliveryDetailsModal({ 
  isOpen, 
  onClose, 
  transaction, 
  onSuccess 
}: EditDeliveryDetailsModalProps) {
  const [formData, setFormData] = useState<DeliveryDetails>({
    district: '',
    subdivision: '',
    address1: '',
    address2: '',
    contactPersonName: '',
    contactPersonPhone: '',
    remarks: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && transaction?.deliveryDetails) {
      setFormData({
        district: transaction.deliveryDetails.district || '',
        subdivision: transaction.deliveryDetails.subdivision || '',
        address1: transaction.deliveryDetails.address1 || '',
        address2: transaction.deliveryDetails.address2 || '',
        contactPersonName: transaction.deliveryDetails.contactPersonName || '',
        contactPersonPhone: transaction.deliveryDetails.contactPersonPhone || '',
        remarks: transaction.deliveryDetails.remarks || ''
      });
    }
  }, [isOpen, transaction]);

  const handleInputChange = (field: keyof DeliveryDetails, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction?.id) {
      setError('交易信息不完整');
      return;
    }

    // Validation
    if (!formData.district || !formData.subdivision || !formData.address1 || 
        !formData.contactPersonName || !formData.contactPersonPhone) {
      setError('請填寫所有必填欄位');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const purchaseRef = doc(db, 'purchases', transaction.id);
      
      // Filter out undefined values to avoid Firebase errors
      const cleanDeliveryDetails = Object.fromEntries(
        Object.entries({
          ...formData,
          updatedAt: new Date().toISOString(),
          updatedBy: 'buyer'
        }).filter(([_, value]) => value !== undefined)
      );

      await updateDoc(purchaseRef, {
        deliveryDetails: cleanDeliveryDetails
      });

      console.log('Delivery details updated successfully');

      // Send notification to seller about delivery details update
      try {
        // Get purchase details to find seller information
        const purchaseDoc = await getDoc(purchaseRef);
        if (purchaseDoc.exists()) {
          const purchaseData = purchaseDoc.data();
          const { sellerId, offerId, offerTitle } = purchaseData;
          
          if (sellerId && offerId) {
            // Get offer details if offerTitle is not available
            let finalOfferTitle = offerTitle;
            if (!finalOfferTitle) {
              const offerRef = doc(db, 'offers', offerId);
              const offerDoc = await getDoc(offerRef);
              if (offerDoc.exists()) {
                const offerData = offerDoc.data();
                finalOfferTitle = offerData.title || '商品';
              }
            }
            
            // Create notification for seller
            const notificationData = {
              userId: sellerId,
              type: 'order_status' as const,
              title: '📦 買家已更新送貨信息',
              message: `買家已更新訂單 "${finalOfferTitle}" 的送貨地址信息，請檢查新的送貨詳情。`,
              isRead: false,
              data: {
                purchaseId: transaction.id,
                offerId: offerId,
                offerTitle: finalOfferTitle,
                actionUrl: `/hk/${sellerId}/my-orders`
              },
              priority: 'medium' as const
            };
            
            console.log('📨 Creating seller delivery update notification:', notificationData);
            
            // Send notification to seller
            await firestoreNotificationService.addNotification(notificationData);
            console.log('✅ Seller delivery update notification sent successfully');
          }
        }
      } catch (notificationError) {
        console.error('❌ Failed to send delivery update notification to seller:', notificationError);
        // Don't fail the main operation if notification fails
      }

      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error updating delivery details:', error);
      setError('更新送貨地址失敗，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      district: '',
      subdivision: '',
      address1: '',
      address2: '',
      contactPersonName: '',
      contactPersonPhone: '',
      remarks: ''
    });
    setError(null);
    onClose();
  };

  // Get subdivisions for selected district
  const availableSubdivisions = formData.district ? 
    (DISTRICT_SUBDIVISIONS[formData.district as keyof typeof DISTRICT_SUBDIVISIONS] || []) : [];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">編輯送貨地址</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* District Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分區 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.district}
              onChange={(e) => {
                handleInputChange('district', e.target.value);
                handleInputChange('subdivision', ''); // Reset subdivision when district changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">請選擇分區</option>
              {LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Subdivision Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              細分地區 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.subdivision}
              onChange={(e) => handleInputChange('subdivision', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!formData.district}
            >
              <option value="">請選擇細分地區</option>
              {availableSubdivisions.map((subdivision) => (
                <option key={subdivision} value={subdivision}>
                  {subdivision}
                </option>
              ))}
            </select>
          </div>

          {/* Address 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              地址 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address1}
              onChange={(e) => handleInputChange('address1', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="請輸入詳細地址"
              required
            />
          </div>

          {/* Address 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              地址 2
            </label>
            <input
              type="text"
              value={formData.address2}
              onChange={(e) => handleInputChange('address2', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="請輸入額外地址信息（可選）"
            />
          </div>

          {/* Contact Person Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              聯絡人姓名 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.contactPersonName}
                onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="請輸入聯絡人姓名"
                required
              />
            </div>
          </div>

          {/* Contact Person Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              聯絡電話 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={formData.contactPersonPhone}
                onChange={(e) => handleInputChange('contactPersonPhone', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="請輸入聯絡電話"
                required
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              備註
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="請輸入備註（可選）"
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>更新中...</span>
                </>
              ) : (
                <span>更新送貨地址</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
