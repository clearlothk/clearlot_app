import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { ratingService } from '../services/ratingService';
import { SellerRating } from '../types';

interface SellerRatingDisplayProps {
  sellerId: string;
  className?: string;
  showText?: boolean;
  showCount?: boolean;
}

export default function SellerRatingDisplay({ 
  sellerId, 
  className = '', 
  showText = false, 
  showCount = false 
}: SellerRatingDisplayProps) {
  const [rating, setRating] = useState<SellerRating | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const sellerRating = await ratingService.getSellerRating(sellerId);
        setRating(sellerRating);
      } catch (error) {
        console.error('Error fetching seller rating:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRating();
  }, [sellerId]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="flex items-center text-sm text-gray-400">
          <span className="mr-1">★</span>
          <span className="font-semibold">-</span>
        </div>
      </div>
    );
  }

  if (!rating || rating.totalRatings === 0) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="flex items-center text-sm text-gray-400">
          <span className="mr-1">★</span>
          <span className="font-semibold">0</span>
        </div>
        {showText && <span className="text-xs text-gray-500">(無評價)</span>}
      </div>
    );
  }

  const ratingColor = ratingService.getRatingColor(rating.averageRating);
  const ratingText = ratingService.getRatingDisplayText(rating.averageRating);

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={`flex items-center text-sm ${ratingColor}`}>
        <Star className="h-4 w-4 fill-current mr-1" />
        <span className="font-semibold">{rating.averageRating.toFixed(1)}</span>
      </div>
      {showText && (
        <span className="text-xs text-gray-500">({ratingText})</span>
      )}
      {showCount && (
        <span className="text-xs text-gray-500">({rating.totalRatings}評價)</span>
      )}
    </div>
  );
}
