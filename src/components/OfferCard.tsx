import React, { useState, useEffect } from 'react';
import { Offer } from '../types';
import { Clock, MapPin, Package, TrendingDown, CheckCircle, AlertCircle, Heart, ShoppingCart, Building, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SellerRatingDisplay from './SellerRatingDisplay';

interface OfferCardProps {
  offer: Offer;
  onClick: (offer: Offer) => void;
  onLocationFilter?: (location: string) => void;
}

export default function OfferCard({ offer, onClick, onLocationFilter }: OfferCardProps) {
  const { user, isInWatchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const navigate = useNavigate();
  const discountPercentage = Math.round(((offer.originalPrice - offer.currentPrice) / offer.originalPrice) * 100);
  const inWatchlist = isInWatchlist(offer.id);
  const isOwnOffer = user && offer.supplierId === user.id;
  
  // Debug logging for watchlist status
  useEffect(() => {
    if (offer.id) {
      console.log(`OfferCard ${offer.id} (${offer.title}): inWatchlist=${inWatchlist}, user.watchlist=`, user?.watchlist);
    }
  }, [offer.id, offer.title, inWatchlist, user?.watchlist]);
  
  // Photo carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // Auto-advance photos when hovering
  useEffect(() => {
    if (!isHovering || offer.images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % offer.images.length);
    }, 2000); // Switch every 2 seconds
    
    return () => clearInterval(interval);
  }, [isHovering, offer.images.length]);
  
  const getTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;
    
    if (diff <= 0) return '已結束';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}天 ${hours}小時`;
    if (hours > 0) return `${hours}小時 ${minutes}分鐘`;
    return `${minutes}分鐘`;
  };

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(offer.id);
    } else {
      addToWatchlist(offer.id);
    }
  };

  const handleCompanyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/hk/company/${offer.supplierId}`);
  };

  return (
    <div
      onClick={() => onClick(offer)}
      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 flex flex-col h-full"
    >
      {/* Image Section - Fixed Height with Carousel */}
      <div 
        className="relative h-48 overflow-hidden flex-shrink-0"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setCurrentImageIndex(0); // Reset to first image when leaving
        }}
      >
        {/* Main Image with Smooth Transition */}
        <img
          src={offer.images[currentImageIndex]}
          alt={`${offer.title} - 圖片 ${currentImageIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-700 ease-in-out"
        />
        
        {/* Image Counter (only show if more than 1 image) */}
        {offer.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-medium">
            {currentImageIndex + 1} / {offer.images.length}
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-lg ${
              offer.type === 'clearance'
                ? 'bg-green-500 text-white'
                : 'bg-orange-500 text-white'
            }`}
          >
            {offer.type === 'clearance' ? '⚡ 清倉' : '⏰ 即將結束'}
          </span>
        </div>
        
        <div className="absolute top-4 right-4">
          <span className="bg-red-500 text-white px-3 py-1.5 text-sm font-bold rounded-lg shadow-lg">
            -{discountPercentage}%
          </span>
        </div>
        
        {/* Watchlist Heart - Hide for own offers */}
        {!isOwnOffer && (
          <button
            onClick={handleWatchlistToggle}
            className={`absolute top-16 right-4 p-2 rounded-full shadow-lg transition-all duration-200 ${
              inWatchlist 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${inWatchlist ? 'fill-current' : ''}`} />
          </button>
        )}
        

      </div>

      {/* Content Section - Flexible Height */}
      <div className="p-6 flex flex-col flex-1">
        {/* Offer ID and Title - Fixed Height */}
        <div className="h-16 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {offer.offerId}
            </span>
          </div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">
            {offer.title}
          </h3>
        </div>

        {/* Supplier Info - Fixed Height */}
        <div className="flex items-center justify-between mb-4 h-8">
          <div className="flex items-center text-sm text-gray-700 flex-1 min-w-0">
            {/* Company Logo */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-2 flex-shrink-0 overflow-hidden">
              {offer.supplier.logo ? (
                <img
                  src={offer.supplier.logo}
                  alt={offer.supplier.company}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building className="h-3 w-3 text-white" />
              )}
            </div>
            <span 
              className="font-semibold truncate flex-1 hover:text-blue-600 cursor-pointer transition-colors duration-200"
              onClick={handleCompanyClick}
            >
              {offer.supplier.company}
            </span>
            {offer.supplier.isVerified && (
              <div className="ml-2 flex items-center bg-green-100 px-2 py-1 rounded-full">
                <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs font-medium text-green-700">已認證</span>
              </div>
            )}
          </div>
          <div className="ml-2 flex-shrink-0">
            <SellerRatingDisplay 
              sellerId={offer.supplierId} 
              showCount={true}
            />
          </div>
        </div>

        {/* Price Section - Fixed Height */}
        <div className="mb-4 bg-gray-50 p-4 rounded-lg h-20 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div>
              <span className="text-2xl font-bold text-blue-600">
                ${offer.currentPrice.toLocaleString()}
              </span>
              <span className="text-sm text-gray-600 ml-2 font-medium">每 {offer.unit}</span>
            </div>
            <div className="text-right">
              <div className="text-sm line-through text-gray-500 font-medium">
                ${offer.originalPrice.toLocaleString()}
              </div>
              <div className="text-xs text-green-600 font-bold flex items-center justify-end">
                <TrendingDown className="h-3 w-3 mr-1" />
                <span>節省 ${(offer.originalPrice - offer.currentPrice).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logistics Cost Information */}
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <Truck className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
            <span className="text-sm text-green-800 font-medium">物流費用已包含</span>
          </div>
        </div>

        {/* Quantity and Location - Fixed Height */}
        <div className="flex items-center justify-between text-sm text-gray-700 mb-4 h-8">
          <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
            <Package className="h-4 w-4 mr-2 text-blue-600" />
            <span className="font-semibold">{offer.quantity.toLocaleString()} {offer.unit}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLocationFilter?.(offer.location);
            }}
            className="flex items-center bg-gray-100 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer group max-w-32"
          >
            <MapPin className="h-4 w-4 mr-2 text-gray-600 flex-shrink-0" />
            <span className="font-medium group-hover:text-blue-600 truncate">{offer.location}</span>
          </button>
        </div>

        {/* Tags Section - Fixed Height */}
        <div className="mb-4 h-8">
          <div className="flex flex-wrap gap-1">
            {offer.tags.slice(0, 2).map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
            {offer.tags.length > 2 && (
              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">
                +{offer.tags.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Min Order - Fixed Height */}
        <div className="flex items-center text-sm text-orange-700 mb-3 bg-orange-50 p-2 rounded-lg h-10">
          <AlertCircle className="h-4 w-4 mr-2 text-orange-600 flex-shrink-0" />
          <span className="font-medium">最小訂購: {offer.minOrderQuantity} {offer.unit}</span>
        </div>

        {/* Shipping Estimate - Fixed Height */}
        <div className="flex items-center text-sm text-green-700 mb-4 bg-green-50 p-2 rounded-lg h-10">
          <Clock className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
          <span className="font-medium">運輸: {offer.shippingEstimateDays} 天</span>
        </div>

        {/* Buy Now Button - Fixed at Bottom */}
        <div className="mt-auto">
          {!isOwnOffer ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClick(offer);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <ShoppingCart className="h-5 w-5 mr-2 inline" />
              立即購買
            </button>
          ) : (
            <div className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-xl font-bold text-lg flex items-center justify-center">
              <Package className="h-5 w-5 mr-2" />
              您的優惠
            </div>
          )}
        </div>
      </div>
    </div>
  );
}