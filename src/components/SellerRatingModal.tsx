import React, { useState } from 'react';
import { X, Star, Package, Building, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ratingService } from '../services/ratingService';
import { Review } from '../types';

interface SellerRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: string;
  offerTitle: string;
  buyerName: string;
  buyerId: string;
  buyerLogo?: string;
  onRatingSubmitted?: () => void;
}

export default function SellerRatingModal({ 
  isOpen, 
  onClose, 
  purchaseId, 
  offerTitle, 
  buyerName,
  buyerId,
  buyerLogo,
  onRatingSubmitted 
}: SellerRatingModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmitRating = async () => {
    if (rating === 0) {
      setError('請選擇評分');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const review: Omit<Review, 'id' | 'createdAt'> = {
        purchaseId,
        reviewerId: user.id,
        reviewerName: user.name || user.company,
        reviewerCompany: user.company,
        targetId: buyerId,
        targetType: 'buyer',
        rating,
        comment: comment.trim(),
        isVerified: user.isVerified
      };

      await ratingService.submitRating(review);
      
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Call the callback if provided
      onRatingSubmitted?.();
      
      // Close modal after showing success
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      setError(error.message || '提交評分時發生錯誤');
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setIsSubmitting(false);
    setIsSubmitted(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return '很差';
      case 2: return '差';
      case 3: return '一般';
      case 4: return '好';
      case 5: return '很好';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">評價買家</h2>
                <p className="text-sm text-blue-100">為您的銷售體驗評分</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-blue-100 hover:text-white transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!isSubmitted ? (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{offerTitle}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      {buyerLogo ? (
                        <img 
                          src={buyerLogo} 
                          alt={buyerName}
                          className="w-4 h-4 mr-2 rounded-full object-cover"
                        />
                      ) : (
                        <Building className="h-4 w-4 mr-1" />
                      )}
                      <span>買家: {buyerName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  您對這位買家的評價如何？ *
                </label>
                <div className="flex items-center space-x-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-all duration-200 transform hover:scale-110"
                    >
                      <Star
                        className={`h-10 w-10 ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <div className="text-center">
                    <span className="text-lg font-semibold text-gray-700">
                      {getRatingText(rating)}
                    </span>
                  </div>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  <MessageSquare className="h-4 w-4 inline mr-2" />
                  分享您的體驗 (可選)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="請分享您對這次交易的體驗，包括買家溝通、付款及時性、合作愉快度等..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  maxLength={500}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {comment.length}/500
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">評價說明</p>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• 您的評價將幫助其他賣家做出更好的選擇</li>
                      <li>• 評價將顯示在買家的公開資料中</li>
                      <li>• 提交後無法修改，請仔細考慮</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Success State */
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">評價已提交！</h3>
              <p className="text-gray-600">
                感謝您的評價，這將幫助其他賣家做出更好的選擇。
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isSubmitted && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                稍後評價
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={isSubmitting || rating === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    提交中...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    提交評價
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
