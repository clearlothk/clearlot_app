import React from 'react';
import { Offer } from '../types';
import { Clock, MapPin, Package, TrendingDown, CheckCircle, AlertCircle, Heart, ShoppingCart, Building, Calendar, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SellerRatingDisplay from './SellerRatingDisplay';

interface FeedCardProps {
  offer: Offer;
  onClick: (offer: Offer) => void;
  onLocationFilter?: (location: string) => void;
}

export default function FeedCard({ offer, onClick, onLocationFilter }: FeedCardProps) {
  const { user, isInWatchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const navigate = useNavigate();
  const discountPercentage = Math.round(((offer.originalPrice - offer.currentPrice) / offer.originalPrice) * 100);
  const inWatchlist = isInWatchlist(offer.id);
  const isOwnOffer = user && offer.supplierId === user.id;
  
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
      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer group mb-6"
    >
      {/* Header - Supplier Info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Company Logo */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden">
              {offer.supplier.logo ? (
                <img
                  src={offer.supplier.logo}
                  alt={offer.supplier.company}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building className="h-5 w-5 text-white" />
              )}
            </div>
            
            {/* Company Info */}
            <div>
              <h3 
                className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors duration-200"
                onClick={handleCompanyClick}
              >
                {offer.supplier.company}
              </h3>
              <div className="flex items-center space-x-2">
                <SellerRatingDisplay 
                  sellerId={offer.supplierId} 
                  showCount={true}
                />
                {offer.supplier.isVerified && (
                  <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-xs font-medium text-green-700">已認證</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Watchlist Button - Hide for own offers */}
          {!isOwnOffer && (
            <button
              onClick={handleWatchlistToggle}
              className={`p-2 rounded-full transition-all duration-200 ${
                inWatchlist 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
              }`}
            >
              <Heart className={`h-5 w-5 ${inWatchlist ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Image */}
      <div className="relative">
        <img
          src={offer.images[0]}
          alt={offer.title}
          className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          <span className="bg-green-500 text-white px-4 py-2 text-sm font-bold rounded-full shadow-lg">
            ⚡ 清倉
          </span>
          <span className="bg-red-500 text-white px-4 py-2 text-lg font-bold rounded-lg shadow-lg">
            -{discountPercentage}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
          {offer.title}
        </h2>

        {/* Description */}
        <p className="text-gray-700 mb-6 leading-relaxed">
          {offer.description}
        </p>

        {/* Pricing Section - Eye-catching Design */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 p-8 rounded-xl mb-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-5xl font-black text-white mb-2">
                ${offer.currentPrice.toLocaleString()}
              </div>
              <div className="text-lg text-blue-100 font-semibold">每 {offer.unit}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl line-through text-blue-200 font-medium mb-2">
                ${offer.originalPrice.toLocaleString()}
              </div>
              <div className="text-xl text-yellow-300 font-black flex items-center">
                <TrendingDown className="h-6 w-6 mr-2" />
                節省 ${(offer.originalPrice - offer.currentPrice).toLocaleString()}
              </div>
              <div className="text-3xl font-black text-yellow-300 mt-2">
                -{discountPercentage}% 折扣
              </div>
            </div>
          </div>
        </div>

        {/* Logistics Cost Information */}
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center">
            <Truck className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-green-900 mb-1">物流費用已包含</h4>
              <p className="text-sm text-green-700">
                此價格已包含所有物流費用，賣家負責安排配送
              </p>
            </div>
          </div>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Quantity */}
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-sm text-gray-600">可售數量</div>
            <div className="font-bold text-gray-900">{offer.quantity.toLocaleString()} {offer.unit}</div>
          </div>

          {/* Location */}
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <MapPin className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-sm text-gray-600">地點</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLocationFilter?.(offer.location);
              }}
              className="font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {offer.location.split(' ')[0]}
            </button>
          </div>

          {/* Min Order */}
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <AlertCircle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-sm text-gray-600">最小訂購</div>
            <div className="font-bold text-gray-900">{offer.minOrderQuantity} {offer.unit}</div>
          </div>

          {/* Shipping */}
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-sm text-gray-600">運輸</div>
            <div className="font-bold text-gray-900">{offer.shippingEstimateDays} 天</div>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {offer.tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="px-4 py-2 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {!isOwnOffer ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClick(offer);
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
            >
              <ShoppingCart className="h-6 w-6 mr-2" />
              立即購買 - ${(offer.currentPrice * offer.minOrderQuantity * 1.03).toFixed(2)}
            </button>
          ) : (
            <div className="flex-1 bg-gray-100 text-gray-500 py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center">
              <Package className="h-6 w-6 mr-2" />
              您的優惠
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>發布於 {new Date(offer.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 