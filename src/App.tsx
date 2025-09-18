import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { Offer, SearchFilters } from './types';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { auth } from './config/firebase';
import { SearchProvider, useSearch } from './contexts/SearchContext';
import { Search, X } from 'lucide-react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import HorizontalFilters from './components/HorizontalFilters';
import Footer from './components/Footer';
import OfferCard from './components/OfferCard';
import FeedCard from './components/FeedCard';
import OfferModal from './components/OfferModal';
import WatchlistPage from './components/WatchlistPage';
import PurchaseModal from './components/PurchaseModal';
import ReviewModal from './components/ReviewModal';

import UploadOfferPage from './components/UploadOfferPage';
import MyOffersPage from './components/MyOffersPage';
import EditOfferPage from './components/EditOfferPage';
import BrowseOffersPage from './components/BrowseOffersPage';
import HowItWorksPage from './components/HowItWorksPage';
import BecomeSellerPage from './components/BecomeSellerPage';
import SuccessStoriesPage from './components/SuccessStoriesPage';
import HelpCenterPage from './components/HelpCenterPage';
import FranchisePage from './components/FranchisePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

import CompanySettingsPage from './components/CompanySettingsPage';
import MyOrdersPage from './components/MyOrdersPage';
import NotificationAppWrapper from './components/NotificationAppWrapper';
import NotificationsPage from './components/NotificationsPage';
import MessagesPage from './components/MessagesPage';
import AdminLoginPage from './components/AdminLoginPage';
import AdminDashboard from './components/AdminDashboard';
import AdminUsersPage from './components/AdminUsersPage';
import AdminOffersPage from './components/AdminOffersPage';
import AdminEditOfferPage from './components/AdminEditOfferPage';
import AdminTransactionsPage from './components/AdminTransactionsPage';
import AdminMessagesPage from './components/AdminMessagesPage';
import AdminInvoicePage from './components/AdminInvoicePage';
import LandingPage from './components/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import UserProfilePage from './components/UserProfilePage';
import CompanyProfilePage from './components/CompanyProfilePage';
import SlugTestPage from './components/SlugTestPage';
import EmailVerificationPage from './components/EmailVerificationPage';
import { Package, AlertCircle, Lock } from 'lucide-react';
import { getOffers, searchOffers } from './services/firebaseService';
import { canAccessMarketplace, getRestrictionMessage, isUserActive } from './utils/userUtils';

// Login Wrapper Component
function LoginWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authView, setAuthView] = useState<'login' | 'register'>(
    location.pathname === '/hk/register' ? 'register' : 'login'
  );

  const handleLoginSuccess = () => {
    // 登入成功後，重定向到根頁面，AuthenticatedRedirect 會根據用戶狀態決定最終目的地
    navigate('/');
  };

  const handleRegisterSuccess = () => {
    // 註冊成功後，重定向到電子郵件驗證頁面
    navigate('/hk/verify-email');
  };

  const handleNavigateToRegister = () => {
    setAuthView('register');
    navigate('/hk/register');
  };

  const handleNavigateToLogin = () => {
    setAuthView('login');
    navigate('/hk/login');
  };

  if (authView === 'login') {
    return (
      <LoginPage
        onNavigateToRegister={handleNavigateToRegister}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  } else {
    return (
      <RegisterPage
        onNavigateToLogin={handleNavigateToLogin}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }
}

// Main Layout Component
function MainLayout({ children, showNavigation = false }: { children: React.ReactNode; showNavigation?: boolean }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Header />
      {showNavigation && <Navigation />}
      {children}
      <Footer />
    </div>
  );
}

// Marketplace Component
function Marketplace({ defaultTab = 'all' }: { defaultTab?: string }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { searchQuery, setSearchQuery } = useSearch();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentPurchaseId, setCurrentPurchaseId] = useState('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'feed'>('grid');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger
  const [filters, setFilters] = useState<SearchFilters>({
    category: '所有類別',
    location: '所有地點',
    priceRange: [0, 999999],
    minQuantity: 0,
    sortBy: 'discount',
    selectedTag: undefined
  });

  // Check if user can access marketplace
  if (!canAccessMarketplace(user)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center bg-white rounded-xl shadow-sm border border-red-200 p-12">
          <div className="text-red-500 mb-6">
            <Lock className="h-24 w-24 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">訪問受限</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            {getRestrictionMessage(user)}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
              <span className="text-red-800 font-semibold">帳戶狀態：{user?.status || '未知'}</span>
            </div>
            <p className="text-red-700 text-sm">
              如需恢復帳戶訪問權限，請聯繫客服支援。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch offers from Firestore
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const firestoreFilters = {
          category: filters.category !== '所有類別' ? filters.category : undefined,
          location: filters.location !== '所有地點' ? filters.location : undefined,
          priceRange: filters.priceRange,
          minQuantity: filters.minQuantity,
          sortBy: filters.sortBy,
          verifiedOnly: filters.verifiedOnly
        };
        
        let fetchedOffers: Offer[];
        if (searchQuery.trim()) {
          fetchedOffers = await searchOffers(searchQuery, firestoreFilters);
        } else {
          fetchedOffers = await getOffers(firestoreFilters);
        }
        
        setOffers(fetchedOffers);
      } catch (err: any) {
        console.error('Error fetching offers:', err);
        setError(err.message || '獲取優惠失敗');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, [filters, searchQuery, refreshTrigger]); // Add refreshTrigger to dependencies

  // Filter offers based on search query and tags
  const filteredOffers = useMemo(() => {
    let filtered = offers;
    
    // Apply tag filtering if a tag is selected
    if (filters.selectedTag) {
      filtered = filtered.filter(offer => 
        offer.tags && offer.tags.includes(filters.selectedTag!)
      );
    }
    
    return filtered;
  }, [offers, filters.selectedTag]);

  const handleOfferClick = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOffer(null);
  };



  const handleLocationFilter = (location: string) => {
    setFilters(prev => ({
      ...prev,
      location: location
    }));
    // Scroll to top to show filtered results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Function to refresh offers after purchase
  const handlePurchaseComplete = () => {
    setRefreshTrigger(prev => prev + 1); // Trigger refresh
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          所有優惠
        </h1>
        <p className="text-xl text-gray-600 flex items-center flex-wrap gap-4">
          {searchQuery && (
            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
              搜索結果 "{searchQuery}"
            </span>
          )}
          <span className="text-green-600 font-semibold flex items-center">
            💰 批發價格節省高達80%
          </span>
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={(e) => { e.preventDefault(); }} className="w-full max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索清倉優惠、類別或供應商..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors duration-200 text-lg"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Horizontal Filters */}
      <HorizontalFilters
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredOffers.length}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        offers={offers}
      />

      {/* Offers Display */}
      {isLoading ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <div className="text-gray-400 mb-6">
            <Package className="h-24 w-24 mx-auto" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">加載中...</h3>
          <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
            請稍候，我們正在為您加載優惠。
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <div className="text-red-400 mb-6">
            <Package className="h-24 w-24 mx-auto" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">加載失敗</h3>
          <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={() => setFilters({
              category: '所有類別',
              location: '所有地點',
              priceRange: [0, 999999],
              minQuantity: 0,
              sortBy: 'discount'
            })}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
          >
            清除所有篩選
          </button>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <div className="text-gray-400 mb-6">
            <Package className="h-24 w-24 mx-auto" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">未找到優惠</h3>
          <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
            嘗試調整您的篩選條件或搜索詞以發現更多令人驚嘆的優惠。
          </p>
          <button
            onClick={() => setFilters({
              category: '所有類別',
              location: '所有地點',
              priceRange: [0, 999999],
              minQuantity: 0,
              sortBy: 'discount'
            })}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
          >
            清除所有篩選
          </button>
        </div>
      ) : displayMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onClick={handleOfferClick}
              onLocationFilter={handleLocationFilter}
            />
          ))}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {filteredOffers.map((offer) => (
            <FeedCard
              key={offer.id}
              offer={offer}
              onClick={handleOfferClick}
              onLocationFilter={handleLocationFilter}
            />
          ))}
        </div>
      )}

      {/* Offer Modal */}
      <OfferModal
        offer={selectedOffer}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onBuyNow={() => {
          setIsModalOpen(false);
          setIsPurchaseModalOpen(true);
        }}
      />
      
      {/* Purchase Modal */}
              <PurchaseModal
          offer={selectedOffer}
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          onPurchaseComplete={handlePurchaseComplete}
        />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        purchaseId={currentPurchaseId}
        offerTitle={selectedOffer?.title || ''}
        supplierName={selectedOffer?.supplier.company || ''}
      />
    </div>
  );
}

// Redirect component for authenticated users
function AuthenticatedRedirect() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin via localStorage first
    const isAdminAuthenticated = localStorage.getItem('adminAuthenticated');
    if (isAdminAuthenticated) {
      console.log('🔄 AuthenticatedRedirect: Admin session detected in localStorage, redirecting to admin dashboard');
      navigate('/hk/admin/dashboard', { replace: true });
      return;
    }

    if (!isLoading && user) {
      console.log('🔄 AuthenticatedRedirect: User loaded, checking status...');
      console.log('🔄 AuthenticatedRedirect: User emailVerified:', user.emailVerified);
      console.log('🔄 AuthenticatedRedirect: User status:', user.status);
      console.log('🔄 AuthenticatedRedirect: User isAdmin:', user.isAdmin);
      
      // Check if user is admin - admins should go to admin dashboard
      if (user.isAdmin) {
        console.log('🔄 AuthenticatedRedirect: Admin user detected, redirecting to admin dashboard');
        navigate('/hk/admin/dashboard', { replace: true });
        return;
      }
      
      // Check if user just completed email verification
      const firebaseUser = auth.currentUser;
      if (firebaseUser && firebaseUser.emailVerified && !user.emailVerified) {
        console.log('🔄 AuthenticatedRedirect: User just completed email verification, syncing status...');
        // Force a page reload to sync the user status
        window.location.reload();
        return;
      }
      
      // Redirect authenticated users based on their status
      if (isUserActive(user)) {
        console.log('🔄 AuthenticatedRedirect: User is active, redirecting to marketplace');
        // Active users go to marketplace
        navigate(`/hk/${user.id}/marketplace`, { replace: true });
      } else {
        console.log('🔄 AuthenticatedRedirect: User is not active, redirecting to company settings');
        // Inactive users go to company settings
        navigate(`/hk/${user.id}/company-settings`, { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">重定向到市場...</p>
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <MainLayout>
      <LandingPage />
    </MainLayout>
  );
}

// App Content Component that uses AuthContext
function AppContent() {
  console.log('📱 AppContent: Rendering app content...');
  
  // Initialize app services when user is authenticated
  const { user, isInitialized } = useAuth();
  
  useEffect(() => {
    const initializeApp = async () => {
      if (user && isInitialized) {
        try {
          console.log('🚀 Initializing app services for authenticated user...');
          const { appInitializationService } = await import('./services/appInitializationService');
          await appInitializationService.initialize();
        } catch (error) {
          console.error('❌ Error initializing app services:', error);
        }
      }
    };
    
    initializeApp();
  }, [user, isInitialized]);

  return (
    <Router>
      <ScrollToTop />
      <NotificationAppWrapper>
        <SearchProvider>
          <Routes>
        {/* Main landing page route - redirects authenticated users to marketplace */}
        <Route path="/" element={<AuthenticatedRedirect />} />
        
        {/* Marketplace route */}
        <Route path="/hk/:userId/marketplace" element={
          <ProtectedRoute>
            <MainLayout showNavigation={true}>
              <Marketplace />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/hk/:userId/clearance" element={
          <ProtectedRoute>
            <MainLayout showNavigation={true}>
              <Marketplace defaultTab="clearance" />
            </MainLayout>
          </ProtectedRoute>
        } />
        

        
        {/* Quick Links routes */}
        <Route path="/hk/browse-offers" element={
          <MainLayout>
            <BrowseOffersPage />
          </MainLayout>
        } />
        
        <Route path="/hk/how-it-works" element={
          <MainLayout>
            <HowItWorksPage />
          </MainLayout>
        } />
        
        <Route path="/hk/become-seller" element={
          <MainLayout>
            <BecomeSellerPage />
          </MainLayout>
        } />
        
        <Route path="/hk/success-stories" element={
          <MainLayout>
            <SuccessStoriesPage />
          </MainLayout>
        } />
        
        <Route path="/hk/help-center" element={
          <MainLayout>
            <HelpCenterPage />
          </MainLayout>
        } />
        
        <Route path="/hk/franchise" element={
          <MainLayout>
            <FranchisePage />
          </MainLayout>
        } />

        {/* Authentication routes */}
        <Route path="/hk/login" element={<LoginWrapper />} />
        
        <Route path="/hk/register" element={<LoginWrapper />} />
        
        <Route path="/hk/verify-email" element={<EmailVerificationPage />} />

        {/* Other app routes */}
        <Route path="/hk/:userId/watchlist" element={
          <ProtectedRoute>
            <MainLayout>
              <WatchlistPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        

        
        <Route path="/hk/:userId/upload" element={
          <ProtectedRoute>
            <MainLayout>
              <UploadOfferPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/hk/:userId/my-offers" element={
          <ProtectedRoute>
            <MainLayout>
              <MyOffersPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/hk/:userId/edit-offer/:offerId" element={
          <ProtectedRoute>
            <MainLayout>
              <EditOfferPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/hk/:userId/company-settings" element={
          <ProtectedRoute>
            <MainLayout>
              <CompanySettingsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/hk/:userId/my-orders" element={
          <ProtectedRoute>
            <MainLayout>
              <MyOrdersPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/hk/:userId/notifications" element={
          <ProtectedRoute>
            <MainLayout>
              <NotificationsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/hk/:userId/messages" element={
          <ProtectedRoute>
            <MainLayout>
              <MessagesPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* User Profile Slug Routes */}
        <Route path="/hk/:userId/profile" element={
          <MainLayout>
            <UserProfilePage />
          </MainLayout>
        } />
        
        <Route path="/hk/:userId/offers" element={
          <MainLayout>
            <UserProfilePage />
          </MainLayout>
        } />

        {/* Company Profile Route */}
        <Route path="/hk/company/:companyId" element={
          <MainLayout>
            <CompanyProfilePage />
          </MainLayout>
        } />

        {/* Slug Test Route */}
        <Route path="/hk/slug-test" element={
          <MainLayout>
            <SlugTestPage />
          </MainLayout>
        } />

        {/* Admin Routes */}
        <Route path="/hk/admin/login" element={<AdminLoginPage />} />
        <Route path="/hk/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/hk/admin/users" element={<AdminUsersPage />} />
        <Route path="/hk/admin/offers" element={<AdminOffersPage />} />
        <Route path="/hk/admin/offers/edit/:offerId" element={<AdminEditOfferPage />} />
        <Route path="/hk/admin/transactions" element={<AdminTransactionsPage />} />
        <Route path="/hk/admin/messages" element={<AdminMessagesPage />} />
        <Route path="/hk/admin/invoices" element={<AdminInvoicePage />} />
        

        

        


        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SearchProvider>
      </NotificationAppWrapper>
      </Router>
  );
}

function App() {
  console.log('🚀 App: Starting app initialization...');

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;