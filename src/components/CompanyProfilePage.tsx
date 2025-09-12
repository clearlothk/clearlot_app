import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building, 
  Calendar, 
  Users, 
  Star, 
  Package, 
  MessageSquare, 
  MapPin, 
  CheckCircle,
  Heart,
  ShoppingCart,
  TrendingUp,
  Filter,
  Briefcase,
  Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserById, getOffersBySupplierId } from '../services/firebaseService';
import { User, Offer, Review } from '../types';
import OfferCard from './OfferCard';
import OfferModal from './OfferModal';
import PurchaseModal from './PurchaseModal';
import SellerRatingDisplay from './SellerRatingDisplay';
import { formatDateForDisplay } from '../utils/dateUtils';
import { getSellerReviews } from '../services/ratingService';

export default function CompanyProfilePage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [company, setCompany] = useState<User | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewUsers, setReviewUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'offers' | 'comments'>('offers');
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-high' | 'price-low'>('newest');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch company information
        const companyData = await getUserById(companyId);
        if (!companyData) {
          setError('Company not found');
          return;
        }
        
        setCompany(companyData);
        
        // Fetch company's offers
        const companyOffers = await getOffersBySupplierId(companyId);
        setOffers(companyOffers);
        
        // Fetch company's reviews
        const companyReviews = await getSellerReviews(companyId);
        setReviews(companyReviews);
        
        // Fetch user data for reviewers
        const userData: Record<string, User> = {};
        for (const review of companyReviews) {
          if (review.reviewerId && !userData[review.reviewerId]) {
            try {
              const user = await getUserById(review.reviewerId);
              if (user) {
                userData[review.reviewerId] = user;
              }
            } catch (error) {
              console.error('Error fetching user data for review:', error);
            }
          }
        }
        setReviewUsers(userData);
        
      } catch (error) {
        console.error('Error fetching company data:', error);
        setError('Failed to load company information');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId]);

  const handleOfferClick = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOffer(null);
  };

  const handlePurchaseComplete = (purchaseId: string) => {
    console.log('Purchase completed:', purchaseId);
    setIsPurchaseModalOpen(false);
    setSelectedOffer(null);
    // You can add additional logic here like showing a success message
  };

  const handleLocationFilter = (location: string) => {
    // Handle location filter if needed
    console.log('Location filter:', location);
  };

  // Filter and sort offers based on selected filters and search
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.offerId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && !offer.deleted) ||
                         (filterStatus === 'inactive' && offer.deleted);
    
    return matchesSearch && matchesStatus;
  });

  // Sort offers
  const sortedOffers = [...filteredOffers].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'price-high':
        return b.currentPrice - a.currentPrice;
      case 'price-low':
        return a.currentPrice - b.currentPrice;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入公司資料中...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Building className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">找不到公司</h1>
          <p className="text-gray-600 mb-6">{error || '您尋找的公司不存在。'}</p>
          <button
            onClick={() => navigate('/hk/marketplace')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回市場
          </button>
        </div>
      </div>
    );
  }

  const isOwnCompany = currentUser?.id === company.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      {/* Cover Photo */}
      <div className="relative h-64 overflow-hidden">
        {company.companyCoverPhoto ? (
          <img
            src={company.companyCoverPhoto}
            alt="Company Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-blue-800"></div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end">
          <div className="pb-8">
            <h1 className="text-4xl font-bold text-white mb-2">{company.company}</h1>
            <p className="text-blue-100 text-lg">{company.email}</p>
          </div>
        </div>
      </div>

      {/* Company Info Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-start space-x-6">
            {/* Company Logo */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {company.companyLogo ? (
                <img
                  src={company.companyLogo}
                  alt={company.company}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building className="h-12 w-12 text-white" />
              )}
            </div>

            {/* Company Details */}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{company.company}</h2>
                {company.verificationStatus === 'approved' && (
                  <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm font-medium text-green-700">已認證公司</span>
                  </div>
                )}
                <SellerRatingDisplay 
                  sellerId={company.id} 
                  showCount={true}
                  showText={true}
                />
              </div>

              {/* Company Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">加入於 {formatDateForDisplay(company.createdAt || new Date().toISOString())}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Package className="h-5 w-5" />
                  <span className="text-sm">{offers.length} 個活躍優惠</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">公司規模: {company.companySize || '未指定'}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Briefcase className="h-5 w-5" />
                  <span className="text-sm">業務類型: {company.industry || '未指定'}</span>
                </div>
              </div>

              {/* Company Bio/Introduction */}
              {company.companyBio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">關於 {company.company}</h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{company.companyBio}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('offers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'offers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>優惠 ({offers.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'comments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>評價與評論 ({reviews.length})</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Search and Filters Bar for Offers Tab */}
          {activeTab === 'offers' && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Search */}
                <div className="flex-1 w-full lg:w-auto">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索優惠標題、描述或LOT編號..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex gap-3">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-white"
                  >
                    <option value="all">所有狀態</option>
                    <option value="active">活躍</option>
                    <option value="inactive">已刪除</option>
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-white"
                  >
                    <option value="newest">最新</option>
                    <option value="oldest">最舊</option>
                    <option value="price-high">價格高到低</option>
                    <option value="price-low">價格低到高</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'offers' && (
              <div>
                {sortedOffers.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchQuery || filterStatus !== 'all' ? '沒有找到優惠' : '沒有活躍優惠'}
                    </h3>
                    <p className="text-gray-500">
                      {searchQuery || filterStatus !== 'all' 
                        ? '嘗試調整搜索條件或篩選器以發現更多優惠。'
                        : '此公司目前沒有任何活躍優惠。'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedOffers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        onClick={handleOfferClick}
                        onLocationFilter={handleLocationFilter}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暫無評價</h3>
                    <p className="text-gray-500">此公司尚未收到任何評價。</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => {
                      const reviewer = reviewUsers[review.reviewerId || ''];
                      return (
                        <div key={review.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                              {reviewer?.avatar ? (
                                <img
                                  src={reviewer.avatar}
                                  alt={reviewer.name || reviewer.company}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {(reviewer?.name || reviewer?.company || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-semibold text-gray-900">
                                  {reviewer?.name || reviewer?.company || review.reviewerName || '匿名用戶'}
                                </span>
                                <div className="flex items-center space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {formatDateForDisplay(review.createdAt)}
                                </span>
                              </div>
                              {review.comment && (
                                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offer Modal */}
      {selectedOffer && (
        <OfferModal
          offer={selectedOffer}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onBuyNow={() => {
            setIsModalOpen(false);
            setIsPurchaseModalOpen(true);
          }}
        />
      )}

      {/* Purchase Modal */}
      {selectedOffer && (
        <PurchaseModal
          offer={selectedOffer}
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </div>
  );
}
