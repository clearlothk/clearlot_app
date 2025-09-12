import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';
import { getOffersByIds } from '../services/firebaseService';
import OfferCard from './OfferCard';
import OfferModal from './OfferModal';
import PurchaseModal from './PurchaseModal';
import { Offer } from '../types';
import { Heart, Package, Loader, AlertCircle, Lock } from 'lucide-react';
import { canAccessWatchlist, getRestrictionMessage } from '../utils/userUtils';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { searchQuery } = useSearch();
  const { user, isInWatchlist, removeSoldOutOffers } = useAuth();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [watchlistOffers, setWatchlistOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch watchlist offers from Firestore with real-time updates
  useEffect(() => {
    if (!user || !user.watchlist || user.watchlist.length === 0) {
      setWatchlistOffers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time monitoring for each offer in the watchlist
    const unsubscribes: (() => void)[] = [];
    const offersMap = new Map<string, Offer>();

    const setupRealTimeMonitoring = () => {
      user.watchlist.forEach((offerId: string) => {
        const offerRef = doc(db, 'offers', offerId);
        const unsubscribe = onSnapshot(offerRef, (doc) => {
          if (doc.exists()) {
            const offerData = { id: doc.id, ...doc.data() } as Offer;
            
            // Check if the offer should still be in the watchlist
            // Remove if quantity is 0, status is 'sold', status is 'expired', or offer is deleted
            if (offerData.quantity <= 0 || 
                offerData.status === 'sold' || 
                offerData.status === 'expired' || 
                offerData.deleted) {
              console.log(`Removing offer ${offerId} from watchlist display: quantity=${offerData.quantity}, status=${offerData.status}, deleted=${offerData.deleted}`);
              offersMap.delete(offerId);
              
              // Clean up this sold out/expired/deleted offer from user's watchlist array
              removeSoldOutOffers([offerId]);
            } else {
              offersMap.set(offerId, offerData);
            }
            
            // Update the watchlist offers state
            const offersArray = Array.from(offersMap.values());
            console.log(`Watchlist offers updated: ${offersArray.length} offers`, offersArray.map(o => ({ id: o.id, title: o.title })));
            setWatchlistOffers(offersArray);
            setLoading(false);
          } else {
            // Offer no longer exists, remove it from the map
            console.log(`Offer ${offerId} no longer exists, removing from watchlist display`);
            offersMap.delete(offerId);
            
            // Clean up this non-existent offer from user's watchlist array
            removeSoldOutOffers([offerId]);
            setWatchlistOffers(Array.from(offersMap.values()));
          }
        }, (error) => {
          console.error('Error monitoring offer:', error);
          setError('獲取願望清單失敗');
          setLoading(false);
        });
        
        unsubscribes.push(unsubscribe);
      });
    };

    setupRealTimeMonitoring();

    // Cleanup function
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user, user?.watchlist]);

  if (!user) return null;

  // Check if user can access watchlist
  if (!canAccessWatchlist(user)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center bg-white rounded-xl shadow-sm border border-red-200 p-12">
          <div className="text-red-500 mb-6">
            <Lock className="h-24 w-24 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">願望清單受限</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            {getRestrictionMessage(user)}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
              <span className="text-red-800 font-semibold">帳戶狀態：{user?.status || '未知'}</span>
            </div>
            <p className="text-red-700 text-sm">
              只有活躍用戶才能訪問願望清單。如需恢復帳戶訪問權限，請聯繫客服支援。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleOfferClick = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const handleBuyNow = () => {
    // Close the offer modal first
    setIsModalOpen(false);
    
    // Open the purchase modal
    setIsPurchaseModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOffer(null);
  };

  const handleClosePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setSelectedOffer(null);
  };

  const handlePurchaseComplete = () => {
    // Close purchase modal
    setIsPurchaseModalOpen(false);
    setSelectedOffer(null);
    
    // Refresh watchlist offers to reflect the purchase
    if (user && user.watchlist) {
      const fetchWatchlistOffers = async () => {
        try {
          const offers = await getOffersByIds(user.watchlist);
          setWatchlistOffers(offers);
        } catch (err: any) {
          console.error('Error refreshing watchlist offers:', err);
        }
      };
      fetchWatchlistOffers();
    }
  };

  const handleLocationFilter = (location: string) => {
    // This could be implemented to filter watchlist by location
    console.log('Filter by location:', location);
  };

  // Filter watchlist offers based on search query and ensure uniqueness
  const filteredWatchlistOffers = watchlistOffers
    .filter((offer, index, self) => 
      // Remove duplicates based on offer ID
      index === self.findIndex(o => o.id === offer.id)
    )
    .filter(offer => {
      if (!searchQuery.trim()) return true;
      
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
      const searchableText = [
        offer.title,
        offer.description,
        offer.category,
        offer.supplier.company,
        ...offer.tags
      ].join(' ').toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center">
          <div className="bg-red-100 p-3 rounded-xl mr-4">
            <Heart className="h-8 w-8 text-red-600" />
          </div>
          我的願望清單
        </h1>
        <p className="text-xl text-gray-600">
          追蹤您喜愛的優惠，絕不錯過任何好交易
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">載入願望清單中...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">載入失敗</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            重新載入
          </button>
        </div>
      )}

      {/* Watchlist Content */}
      {!loading && !error && filteredWatchlistOffers.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <div className="text-gray-400 mb-6">
            <Heart className="h-24 w-24 mx-auto" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">您的願望清單是空的</h3>
          <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
            點擊任何優惠卡片上的愛心圖標開始添加優惠到您的願望清單。
          </p>
          <button
            onClick={() => navigate('/hk/marketplace')}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
          >
            瀏覽優惠
          </button>
        </div>
      )}

      {/* Watchlist Offers */}
      {!loading && !error && filteredWatchlistOffers.length > 0 && (
        <>
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-lg font-bold text-gray-900">{watchlistOffers.length}</span>
                <span className="text-gray-600 ml-2">個優惠在您的願望清單中</span>
              </div>
              <div className="text-sm text-gray-500">
                點擊愛心圖標從願望清單中移除項目
              </div>
            </div>
          </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredWatchlistOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onClick={handleOfferClick}
                onLocationFilter={handleLocationFilter}
              />
            ))}
          </div>
        </>
      )}

      {/* Offer Modal */}
      <OfferModal
        offer={selectedOffer}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onBuyNow={handleBuyNow}
      />

      {/* Purchase Modal */}
      <PurchaseModal
        offer={selectedOffer}
        isOpen={isPurchaseModalOpen}
        onClose={handleClosePurchaseModal}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </div>
  );
}