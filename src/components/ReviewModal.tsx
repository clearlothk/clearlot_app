import React, { useState } from 'react';
import { Review } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, 
  Star, 
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: string;
  offerTitle: string;
  supplierName: string;
}

export default function ReviewModal({ isOpen, onClose, purchaseId, offerTitle, supplierName }: ReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call to submit review
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const review: Review = {
      id: `review_${Date.now()}`,
      purchaseId,
      reviewerId: user.id,
      reviewerName: user.name,
      reviewerCompany: user.company,
      targetId: supplierName,
      targetType: 'supplier',
      rating,
      comment,
      createdAt: new Date().toISOString(),
      isVerified: user.isVerified
    };

    // In a real app, this would be saved to the backend
    console.log('Review submitted:', review);
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Close modal after showing success
    setTimeout(() => {
      onClose();
      resetForm();
    }, 2000);
  };

  const resetForm = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setIsSubmitting(false);
    setIsSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 ml-3">
              {isSubmitted ? 'Review Submitted!' : 'Rate Your Experience'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {!isSubmitted ? (
            <div className="space-y-6">
              {/* Purchase Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{offerTitle}</h3>
                <p className="text-gray-600">Supplier: {supplierName}</p>
              </div>

              {/* Rating Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  How would you rate this supplier? *
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-colors duration-200"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-4 text-sm text-gray-600">
                    {rating > 0 && (
                      <>
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Share your experience (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 resize-none"
                  placeholder="Tell other buyers about your experience with this supplier..."
                />
              </div>

              {/* Verification Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 mb-1">Review Guidelines</p>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Reviews are public and help other buyers make informed decisions</li>
                      <li>• Only verified purchases can leave reviews</li>
                      <li>• Be honest and constructive in your feedback</li>
                      <li>• Reviews cannot be edited once submitted</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitReview}
                disabled={isSubmitting || rating === 0}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting Review...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Success State */
            <div className="text-center py-8">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you for your review!</h3>
              <p className="text-gray-600 mb-4">
                Your feedback helps other buyers make informed decisions.
              </p>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-semibold text-gray-900">{rating}/5</span>
                </div>
                {comment && (
                  <p className="text-sm text-gray-700 italic">"{comment}"</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}