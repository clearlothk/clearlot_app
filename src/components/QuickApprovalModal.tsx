import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Eye, Package, Receipt, Shield } from 'lucide-react';
import { PaymentReceiptNotification, OfferUploadNotification, VerificationDocumentNotification, adminNotificationService } from '../services/adminNotificationService';
import { formatCurrency } from '../utils/currencyUtils';

interface QuickApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'payment_receipt' | 'offer_upload' | 'verification_document';
  notification: PaymentReceiptNotification | OfferUploadNotification | VerificationDocumentNotification;
}

export default function QuickApprovalModal({ isOpen, onClose, type, notification }: QuickApprovalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      if (type === 'payment_receipt') {
        const paymentNotification = notification as PaymentReceiptNotification;
        await adminNotificationService.approvePaymentReceipt(paymentNotification.purchaseId);
      } else if (type === 'offer_upload') {
        const offerNotification = notification as OfferUploadNotification;
        await adminNotificationService.approveOffer(offerNotification.offerId);
      } else if (type === 'verification_document') {
        const verificationNotification = notification as VerificationDocumentNotification;
        await adminNotificationService.approveVerificationDocument(verificationNotification.userId, verificationNotification.documentType);
      }
      
      // Close modal after successful approval
      onClose();
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setIsLoading(true);
    try {
      if (type === 'payment_receipt') {
        const paymentNotification = notification as PaymentReceiptNotification;
        await adminNotificationService.rejectPaymentReceipt(paymentNotification.purchaseId, rejectionReason);
      } else if (type === 'offer_upload') {
        const offerNotification = notification as OfferUploadNotification;
        await adminNotificationService.rejectOffer(offerNotification.offerId, rejectionReason);
      } else if (type === 'verification_document') {
        const verificationNotification = notification as VerificationDocumentNotification;
        await adminNotificationService.rejectVerificationDocument(verificationNotification.userId, verificationNotification.documentType, rejectionReason);
      }
      
      // Close modal after successful rejection
      onClose();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = () => {
    if (type === 'payment_receipt') {
      const paymentNotification = notification as PaymentReceiptNotification;
      // Open receipt in new tab for full view
      window.open(paymentNotification.receiptUrl, '_blank');
    } else {
      const offerNotification = notification as OfferUploadNotification;
      // Navigate to offer details
      // You can implement navigation logic here
      console.log('Navigate to offer:', offerNotification.offerId);
    }
  };

  const renderNotificationContent = () => {
    if (type === 'payment_receipt') {
      const paymentNotification = notification as PaymentReceiptNotification;
      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Receipt Review</h3>
              <p className="text-sm text-gray-600">Review payment receipt for approval</p>
            </div>
          </div>
          
                     <div className="bg-gray-50 rounded-lg p-4 space-y-3">
             <div className="flex justify-between">
               <span className="text-sm font-medium text-gray-600">Buyer Company:</span>
               <span className="text-sm text-gray-900">{paymentNotification.buyerCompany}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-sm font-medium text-gray-600">Total Paid:</span>
               <span className="text-sm font-semibold text-green-600">{formatCurrency(paymentNotification.amount)}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-sm font-medium text-gray-600">Platform Fee:</span>
               <span className="text-sm text-orange-600">{formatCurrency(paymentNotification.platformFee)}</span>
             </div>
             <div className="flex justify-between border-t border-gray-200 pt-2">
               <span className="text-sm font-medium text-gray-600">Amount to Seller:</span>
               <span className="text-sm font-semibold text-blue-600">{formatCurrency(paymentNotification.finalAmount)}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-sm font-medium text-gray-600">Purchase ID:</span>
               <span className="text-sm text-gray-900 font-mono">{paymentNotification.purchaseId}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-sm font-medium text-gray-600">Submitted:</span>
               <span className="text-sm text-gray-900">{new Date(paymentNotification.timestamp).toLocaleString()}</span>
             </div>
             
                           {/* Receipt Preview */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">Receipt Preview:</span>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <img 
                    src={paymentNotification.receiptUrl}
                    alt="Payment Receipt"
                    className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(paymentNotification.receiptUrl, '_blank')}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5SZWNlaXB0IG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPgo=';
                    }}
                  />
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-500">Click image to view full size</p>
                  </div>
                </div>
              </div>
           </div>
        </div>
      );
    } else if (type === 'offer_upload') {
      const offerNotification = notification as OfferUploadNotification;
      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Offer Review</h3>
              <p className="text-sm text-gray-600">Review new offer for approval</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Seller Company:</span>
              <span className="text-sm text-gray-900">{offerNotification.sellerCompany}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Offer Title:</span>
              <span className="text-sm text-gray-900">{offerNotification.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Offer ID:</span>
              <span className="text-sm text-gray-900 font-mono">{offerNotification.offerId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Submitted:</span>
              <span className="text-sm text-gray-900">{new Date(offerNotification.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    } else {
      const verificationNotification = notification as VerificationDocumentNotification;
      const getDocumentTypeName = (documentType: string): string => {
        const typeNames: { [key: string]: string } = {
          businessRegistration: 'Business Registration',
          companyRegistration: 'Company Registration',
          businessLicense: 'Business License',
          taxCertificate: 'Tax Certificate',
          bankStatement: 'Bank Statement'
        };
        return typeNames[documentType] || documentType;
      };
      
      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Verification Document Review</h3>
              <p className="text-sm text-gray-600">Review verification document for approval</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Company:</span>
              <span className="text-sm text-gray-900">{verificationNotification.userCompany}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Document Type:</span>
              <span className="text-sm text-gray-900">{getDocumentTypeName(verificationNotification.documentType)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">User ID:</span>
              <span className="text-sm text-gray-900 font-mono">{verificationNotification.userId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Submitted:</span>
              <span className="text-sm text-gray-900">{new Date(verificationNotification.timestamp).toLocaleString()}</span>
            </div>
            
            {/* Document Preview */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-600">Document Preview:</span>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <img 
                  src={verificationNotification.documentUrl}
                  alt="Verification Document"
                  className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.open(verificationNotification.documentUrl, '_blank')}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Eb2N1bWVudCBub3QgYXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4K';
                  }}
                />
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">Click image to view full size</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-[70]">
      <div className="relative top-10 mx-auto p-5 max-w-md">
        <div className="bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Approval
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4">
            {renderNotificationContent()}
            
            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
                             <button
                 onClick={handleViewDetails}
                 className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
               >
                 <Eye className="h-4 w-4" />
                 <span>{type === 'payment_receipt' ? 'View Receipt' : 'View Details'}</span>
               </button>
              
              <button
                onClick={() => setShowRejectionForm(!showRejectionForm)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject</span>
              </button>
              
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>Approve</span>
              </button>
            </div>
            
            {/* Rejection Form */}
            {showRejectionForm && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <label className="block text-sm font-medium text-red-800 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                />
                <div className="flex space-x-3 mt-3">
                  <button
                    onClick={() => setShowRejectionForm(false)}
                    className="px-4 py-2 text-sm text-red-700 hover:text-red-800 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isLoading || !rejectionReason.trim()}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 