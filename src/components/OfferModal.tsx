import React, { useState } from 'react';
import { Offer } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Clock, 
  MapPin, 
  Package, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle,
  Building,
  Calendar,
  Tag,
  Heart,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  MessageCircle,
  Flag,
  Truck
} from 'lucide-react';
import SellerRatingDisplay from './SellerRatingDisplay';
import ReportOfferModal from './ReportOfferModal';

interface OfferModalProps {
  offer: Offer | null;
  isOpen: boolean;
  onClose: () => void;
  onBuyNow?: () => void;
}

export default function OfferModal({ offer, isOpen, onClose, onBuyNow }: OfferModalProps) {
  const { user, isInWatchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPhotoPopupOpen, setIsPhotoPopupOpen] = useState(false);
  const [isContactingSeller, setIsContactingSeller] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  if (!isOpen || !offer) return null;

  const inWatchlist = isInWatchlist(offer.id);
  const isOwnOffer = user && offer.supplierId === user.id;
  const discountPercentage = Math.round(((offer.originalPrice - offer.currentPrice) / offer.originalPrice) * 100);
  

  const handleWatchlistToggle = () => {
    if (inWatchlist) {
      removeFromWatchlist(offer.id);
    } else {
      addToWatchlist(offer.id);
    }
  };

  const handleCompanyClick = () => {
    navigate(`/hk/company/${offer.supplierId}`);
  };

  const handleBuyNow = () => {
    onBuyNow?.();
  };

  const handleMessageSeller = async () => {
    // Check if user is authenticated
    if (!user) {
      alert('請先登入以聯絡賣家');
      navigate('/hk/login');
      return;
    }
    
    // Check if user is trying to message themselves
    if (user.id === offer.supplierId) {
      alert('您無法聯絡自己');
      return;
    }
    
    setIsContactingSeller(true);
    
    try {
      // Navigate to messages page with the seller
      navigate(`/hk/${user.id}/messages?startConversation=${offer.supplierId}`);
    } catch (error) {
      console.error('Error navigating to messages:', error);
      alert('無法開啟對話，請重試');
    } finally {
      setIsContactingSeller(false);
    }
  };

  const handleReportOffer = () => {
    if (!user) {
      alert('請先登入以舉報商品');
      navigate('/hk/login');
      return;
    }
    
    // Check if user is trying to report their own offer
    if (user.id === offer.supplierId) {
      alert('您無法舉報自己的商品');
      return;
    }
    
    setIsReportModalOpen(true);
  };

  const handleReportSubmitted = () => {
    // This will be called after a report is successfully submitted
    console.log('Report submitted successfully');
  };

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  const openPhotoPopup = () => {
    setIsPhotoPopupOpen(true);
  };

  const closePhotoPopup = () => {
    setIsPhotoPopupOpen(false);
  };

  const goToPreviousImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? offer.images.length - 1 : prev - 1
    );
  };

  const goToNextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === offer.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isPhotoPopupOpen) return;
    
    switch (e.key) {
      case 'Escape':
        closePhotoPopup();
        break;
      case 'ArrowLeft':
        goToPreviousImage();
        break;
      case 'ArrowRight':
        goToNextImage();
        break;
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  offer.type === 'clearance'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                清倉銷售
              </span>
              <span className="bg-red-500 text-white px-3 py-1 text-sm font-bold rounded">
                -{discountPercentage}% 折扣
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Image and Gallery */}
              <div>
                {/* Main Image Display */}
                <div 
                  className="relative h-80 mb-4 rounded-lg overflow-hidden bg-gray-100 group cursor-pointer"
                  onClick={openPhotoPopup}
                >
                  <img
                    src={offer.images[selectedImageIndex]}
                    alt={`${offer.title} - 圖片 ${selectedImageIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Zoom Icon Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  {/* Image Counter */}
                  {offer.images.length > 1 && (
                    <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {selectedImageIndex + 1} / {offer.images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {offer.images.length > 1 && (
                  <div className="mb-4">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {offer.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => handleImageSelect(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            index === selectedImageIndex
                              ? 'border-blue-500 shadow-lg'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`縮圖 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional info cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Package className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="font-medium text-gray-900">可售數量</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      {offer.quantity.toLocaleString()} {offer.unit}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="font-medium text-gray-900">地點</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {offer.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div>
                {/* Offer ID and Message Button */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded">
                    LOT編號: {offer.offerId}
                  </span>
                  <button
                    onClick={handleMessageSeller}
                    disabled={isContactingSeller}
                    className={`flex items-center px-3 py-1 rounded transition-colors duration-200 text-sm font-medium ${
                      isContactingSeller
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {isContactingSeller ? (
                      <>
                        <div className="h-4 w-4 mr-1 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        開啟對話中...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4 mr-1" />
                        聯絡賣家
                      </>
                    )}
                  </button>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">{offer.title}</h1>

                {/* Supplier Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {/* Company Logo */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3 overflow-hidden">
                        {offer.supplier.logo ? (
                          <img
                            src={offer.supplier.logo}
                            alt={offer.supplier.company}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <span 
                        className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors duration-200"
                        onClick={handleCompanyClick}
                      >
                        {offer.supplier.company}
                      </span>
                      {offer.supplier.isVerified && (
                        <div className="ml-3 flex items-center bg-green-100 px-3 py-1 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm font-semibold text-green-700">已認證供應商</span>
                        </div>
                      )}
                    </div>
                    <SellerRatingDisplay 
                      sellerId={offer.supplierId} 
                      showText={true}
                      showCount={true}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {offer.supplier.isVerified 
                      ? '此供應商已通過我們平台的真實性和可靠性驗證。' 
                      : `${offer.supplier.company} - 驗證待處理`
                    }
                  </p>
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ${offer.currentPrice.toLocaleString()}
                    </span>
                    <div className="text-right">
                      <div className="text-lg line-through text-gray-500">
                        ${offer.originalPrice.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600 font-semibold flex items-center">
                        <TrendingDown className="h-4 w-4 mr-1" />
                        節省 ${(offer.originalPrice - offer.currentPrice).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600">每 {offer.unit}</p>
                  
                  {/* Logistics Cost Information */}
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Truck className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-green-900 mb-1">物流費用已包含</h4>
                        <p className="text-sm text-green-700">
                          此價格已包含所有物流費用，賣家負責安排配送，買家無需額外支付運費
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">描述</h3>
                  <p className="text-gray-700 leading-relaxed break-words whitespace-pre-wrap">{offer.description}</p>
                </div>

                {/* Tags */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    標籤
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {offer.tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Important Details */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 mb-1">重要詳情</p>
                      <p className="text-yellow-700 font-mono">
                        LOT編號: {offer.offerId}
                      </p>
                      <p className="text-yellow-700">
                        最小訂購數量: {offer.minOrderQuantity.toLocaleString()} {offer.unit}
                      </p>
                      <p className="text-yellow-700">
                        類別: {offer.category}
                      </p>
                      <p className="text-yellow-700 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        運輸估計: {offer.shippingEstimateDays} 天
                      </p>
                      <p className="text-yellow-700 flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        發布於: {new Date(offer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {!isOwnOffer ? (
                    <button 
                      onClick={handleBuyNow}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg flex items-center justify-center"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      立即購買
                    </button>
                  ) : (
                    <div className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-semibold text-lg flex items-center justify-center">
                      <Package className="h-5 w-5 mr-2" />
                      您的優惠
                    </div>
                  )}
                  {/* Watchlist Button - Hide for own offers */}
                  {!isOwnOffer && (
                    <button 
                      onClick={handleWatchlistToggle}
                      className={`w-full border py-2 px-6 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center ${
                        inWatchlist
                          ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${inWatchlist ? 'fill-current' : ''}`} />
                      {inWatchlist ? '從願望清單移除' : '加入願望清單'}
                    </button>
                  )}
                  
                  {/* Report Button - Hide for own offers */}
                  {!isOwnOffer && (
                    <button 
                      onClick={handleReportOffer}
                      className="w-full border border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium flex items-center justify-center"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      舉報此商品
                    </button>
                  )}
                  
                  <div className="text-xs text-gray-500 text-center mt-2">
                    * 平台佣金適用於已完成的交易
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

       {/* Photo Popup Modal */}
       {isPhotoPopupOpen && (
         <div
           className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
           onClick={closePhotoPopup}
           onKeyDown={handleKeyDown}
           tabIndex={0}
         >
           <div
             className="relative max-w-6xl w-full max-h-[90vh] flex items-center justify-center"
             onClick={(e) => e.stopPropagation()}
           >
             {/* Close Button */}
             <button
               onClick={closePhotoPopup}
               className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors duration-200 bg-black bg-opacity-50 rounded-full p-2"
             >
               <X className="h-6 w-6" />
             </button>
             
             {/* Main Image */}
             <img
               src={offer.images[selectedImageIndex]}
               alt={`${offer.title} - 圖片 ${selectedImageIndex + 1}`}
               className="max-w-full max-h-full object-contain"
             />
             
             {/* Navigation Buttons */}
             {offer.images.length > 1 && (
               <>
                 <button
                   onClick={goToPreviousImage}
                   className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-opacity duration-200"
                   aria-label="Previous image"
                 >
                   <ChevronLeft className="h-6 w-6" />
                 </button>
                 <button
                   onClick={goToNextImage}
                   className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-opacity duration-200"
                   aria-label="Next image"
                 >
                   <ChevronRight className="h-6 w-6" />
                 </button>
               </>
             )}
             
             {/* Image Counter */}
             {offer.images.length > 1 && (
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium">
                 {selectedImageIndex + 1} / {offer.images.length}
               </div>
             )}
           </div>
         </div>
       )}

       {/* Report Offer Modal */}
       {isReportModalOpen && user && (
         <ReportOfferModal
           isOpen={isReportModalOpen}
           onClose={() => setIsReportModalOpen(false)}
           offer={offer}
           reporterId={user.id}
           onReportSubmitted={handleReportSubmitted}
         />
       )}
    </>
  );
}