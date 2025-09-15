import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageCircle, User, Menu, X, ShoppingCart, TrendingUp, ChevronDown, Plus, LogOut, Heart, Settings, Clock, Store, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ConditionalNotificationHeader from './ConditionalNotificationHeader';
import ConditionalMessageHeader from './ConditionalMessageHeader';
import { canAccessMarketplace, canUploadOffers, canSendMessages, canAccessWatchlist, canAccessMyOrders } from '../utils/userUtils';
import SellerRatingDisplay from './SellerRatingDisplay';
import { useSafeNotifications } from '../hooks/useSafeNotifications';
import { listenToTotalUnreadMessageCount } from '../services/messagingService';



export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  
  // Get notification count from context (with safety check for logout)
  const notifications = useSafeNotifications();
  const unreadNotificationCount = notifications.unreadCount;

  // Listen to unread message count changes
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = listenToTotalUnreadMessageCount(user.id, (count) => {
      setUnreadMessageCount(count);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.id]);

  // Close dropdown when clicking outside and update position on scroll
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleScroll = () => {
      if (isProfileOpen && profileRef.current) {
        const rect = profileRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right
        });
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isProfileOpen]);

  const handleSignOut = async () => {
    try {
      setIsProfileOpen(false);
      await logout();
      // Wait a bit for the user state to be cleared
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even if logout fails
      navigate('/');
    }
  };



  const handleProfileClick = () => {
    if (profileRef.current) {
      const rect = profileRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
    setIsProfileOpen(!isProfileOpen);
  };

  const handleNavigation = (path: string) => {
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    navigate(path);
  };

  // Profile photo component
  const ProfilePhoto = ({ size = 'h-10 w-10', className = '' }: { size?: string, className?: string }) => {
    // Priority: companyLogo > avatar > initials
    if (user?.companyLogo) {
      return (
        <img
          src={user.companyLogo}
          alt={user.company || '公司'}
          className={`${size} rounded-full object-cover border-2 border-gray-200 ${className}`}
        />
      );
    }
    
    if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.company || '公司'}
          className={`${size} rounded-full object-cover border-2 border-gray-200 ${className}`}
        />
      );
    }
    
    // Default profile photo with company initials
    const initials = user?.company 
      ? user.company.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : user?.name 
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : 'U';
    
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold border-2 border-gray-200 ${className}`}>
        {initials}
      </div>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 relative">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity duration-200">
            <div className="bg-blue-600 p-2 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900">ClearLot</span>
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">出貨通</span>
          </Link>

          {/* Spacer for layout balance */}
          <div className="hidden md:flex flex-1 mx-8"></div>

          {/* Navigation - Desktop */}
          <div className="hidden md:flex items-center space-x-4 relative">
            {user ? (
              <>
                {/* Conditional Notification Header */}
                <ConditionalNotificationHeader userId={user.id} />

                {/* Messages Button */}
                {canSendMessages(user) ? (
                  <ConditionalMessageHeader 
                    userId={user.id}
                    onMessageClick={() => handleNavigation(`/hk/${user.id}/messages`)}
                  />
                ) : (
                  <button 
                    disabled={true}
                    className="p-2 text-gray-400 cursor-not-allowed rounded-lg transition-colors duration-200"
                    title="訊息功能受限"
                  >
                    <MessageCircle className="h-6 w-6" />
                  </button>
                )}
                
                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center space-x-3 border-l border-blue-200 pl-6 hover:bg-blue-50 rounded-lg p-2 transition-colors duration-200"
                  >
                    <ProfilePhoto />
                    <div className="text-sm text-left">
                      <div className="font-semibold text-gray-900 flex items-center">
                        {user.company || '公司'}
                        {user.verificationStatus === 'approved' && (
                          <div className="ml-2 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                
                {isProfileOpen && user && (
                  <div 
                    className="fixed w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-4 z-[1000] min-w-max backdrop-blur-sm"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      right: `${dropdownPosition.right}px`
                    }}
                  >
                    {/* User Info Section */}
                    <div className="px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-2xl">
                      <div className="flex items-center space-x-3">
                        <ProfilePhoto size="h-12 w-12" className="border-3 border-white shadow-md" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{user.company || '公司'}</p>
                          <p className="text-xs text-blue-100">{user.email || 'user@example.com'}</p>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                              user.verificationStatus === 'approved'
                                ? 'bg-green-400 text-green-900' 
                                : user.verificationStatus === 'pending'
                                ? 'bg-yellow-400 text-yellow-900'
                                : user.verificationStatus === 'rejected'
                                ? 'bg-red-400 text-red-900'
                                : 'bg-gray-400 text-gray-900'
                            }`}>
                              {user.verificationStatus === 'approved' ? '✓ 已認證' : 
                               user.verificationStatus === 'pending' ? '審核中' : 
                               user.verificationStatus === 'rejected' ? '認證失敗' : 
                               '未認證'}
                            </span>
                            {/* Seller Rating Display */}
                            <SellerRatingDisplay 
                              sellerId={user.id} 
                              showCount={true}
                              className="text-white"
                            />
                            {user.status === 'inactive' && (
                              <span className="text-xs px-2 py-1 rounded-full font-bold bg-red-500 text-white">
                                非活躍
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="px-4 py-2 space-y-1">
                      <button 
                        onClick={() => canAccessMarketplace(user) && handleNavigation(`/hk/${user.id}/marketplace`)}
                        disabled={!canAccessMarketplace(user)}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center rounded-lg group ${
                          canAccessMarketplace(user) 
                            ? 'text-gray-700 hover:bg-green-50 hover:text-green-900' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200 ${
                          canAccessMarketplace(user) 
                            ? 'bg-green-100 group-hover:bg-green-200' 
                            : 'bg-gray-100'
                        }`}>
                          <Store className={`h-4 w-4 ${
                            canAccessMarketplace(user) 
                              ? 'text-green-600 group-hover:text-green-700' 
                              : 'text-gray-400'
                          }`} />
                        </div>
                        市場
                      </button>
                      
                      <button 
                        onClick={() => canUploadOffers(user) && handleNavigation(`/hk/${user.id}/upload`)}
                        disabled={!canUploadOffers(user)}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center rounded-lg group ${
                          canUploadOffers(user) 
                            ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-900' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200 ${
                          canUploadOffers(user) 
                            ? 'bg-blue-100 group-hover:bg-blue-200' 
                            : 'bg-gray-100'
                        }`}>
                          <Plus className={`h-4 w-4 ${
                            canUploadOffers(user) 
                              ? 'text-blue-600 group-hover:text-blue-700' 
                              : 'text-gray-400'
                          }`} />
                        </div>
                        上傳優惠
                      </button>
                      
                      <button 
                        onClick={() => canAccessMyOrders(user) && handleNavigation(`/hk/${user.id}/my-orders`)}
                        disabled={!canAccessMyOrders(user)}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center rounded-lg group ${
                          canAccessMyOrders(user) 
                            ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-900' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200 ${
                          canAccessMyOrders(user) 
                            ? 'bg-blue-100 group-hover:bg-blue-200' 
                            : 'bg-gray-100'
                        }`}>
                          <Package className={`h-4 w-4 ${
                            canAccessMyOrders(user) 
                              ? 'text-blue-600 group-hover:text-blue-700' 
                              : 'text-gray-400'
                          }`} />
                        </div>
                        我的訂單
                      </button>
                      
                      <button 
                        onClick={() => handleNavigation(`/hk/${user.id}/my-offers`)}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 transition-all duration-200 flex items-center rounded-lg group"
                      >
                        <div className="w-8 h-8 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                          <Package className="h-4 w-4 text-purple-600 group-hover:text-purple-700" />
                        </div>
                        我的優惠
                      </button>
                      
                      <button 
                        onClick={() => canAccessWatchlist(user) && handleNavigation(`/hk/${user.id}/watchlist`)}
                        disabled={!canAccessWatchlist(user)}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center rounded-lg group ${
                          canAccessWatchlist(user) 
                            ? 'text-gray-700 hover:bg-red-50 hover:text-red-900' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200 ${
                          canAccessWatchlist(user) 
                            ? 'bg-red-100 group-hover:bg-red-200' 
                            : 'bg-gray-100'
                        }`}>
                          <Heart className={`h-4 w-4 ${
                            canAccessWatchlist(user) 
                              ? 'text-red-600 group-hover:text-red-700' 
                              : 'text-gray-400'
                          }`} />
                        </div>
                        願望清單
                      </button>
                      
                      <button 
                        onClick={() => handleNavigation(`/hk/${user.id}/company-settings`)}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all duration-200 flex items-center rounded-lg group"
                      >
                        <div className="w-8 h-8 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                          <Settings className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
                        </div>
                        公司設定
                      </button>
                    </div>

                    {/* Sign Out Section */}
                    <div className="px-4 py-3 border-t border-gray-100">
                      <button 
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 flex items-center rounded-lg group"
                      >
                        <div className="w-8 h-8 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                          <LogOut className="h-4 w-4" />
                        </div>
                        登出
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </>
            ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/hk/login"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                登入
              </Link>
              <Link
                to="/hk/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                註冊
              </Link>
            </div>
          )}
        </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            
            {user ? (
              <div className="px-3 py-2 space-y-2">
                {/* User Info */}
                <div className="flex items-center space-x-3 py-2">
                  <ProfilePhoto size="h-10 w-10" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 flex items-center">
                      {user.company || '公司'}
                      {user.verificationStatus === 'approved' && (
                        <div className="ml-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        user.verificationStatus === 'approved'
                          ? 'bg-green-400 text-green-900' 
                          : user.verificationStatus === 'pending'
                          ? 'bg-yellow-400 text-yellow-900'
                          : user.verificationStatus === 'rejected'
                          ? 'bg-red-400 text-red-900'
                          : 'bg-gray-400 text-gray-900'
                      }`}>
                        {user.verificationStatus === 'approved' ? '✓ 已認證' : 
                         user.verificationStatus === 'pending' ? '審核中' : 
                         user.verificationStatus === 'rejected' ? '認證失敗' : 
                         '未認證'}
                      </span>
                      {/* Seller Rating Display */}
                      <SellerRatingDisplay 
                        sellerId={user.id} 
                        showCount={true}
                        className="text-gray-600"
                      />
                      {user.status === 'inactive' && (
                        <span className="text-xs px-2 py-1 rounded-full font-bold bg-red-500 text-white">
                          非活躍
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Menu Items */}
                <div className="space-y-1">
                  <button 
                    onClick={() => handleNavigation(`/hk/${user.id}/marketplace`)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center"
                  >
                    <Store className="h-4 w-4 mr-3" />
                    市場
                  </button>
                  
                  <button 
                    onClick={() => handleNavigation(`/hk/${user.id}/notifications`)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center relative"
                  >
                    <Bell className="h-4 w-4 mr-3" />
                    通知
                    {unreadNotificationCount > 0 && (
                      <span className="absolute right-3 bg-yellow-300 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full min-w-[20px] flex items-center justify-center shadow-sm border border-yellow-400">
                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => canSendMessages(user) && handleNavigation(`/hk/${user.id}/messages`)}
                    disabled={!canSendMessages(user)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center relative ${
                      canSendMessages(user) 
                        ? 'text-gray-700 hover:bg-gray-50' 
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <MessageCircle className="h-4 w-4 mr-3" />
                    訊息
                    {canSendMessages(user) && unreadMessageCount > 0 && (
                      <span className="absolute right-3 bg-yellow-300 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full min-w-[20px] flex items-center justify-center shadow-sm border border-yellow-400">
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </span>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => canUploadOffers(user) && handleNavigation(`/hk/${user.id}/upload`)}
                    disabled={!canUploadOffers(user)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center ${
                      canUploadOffers(user) 
                        ? 'text-gray-700 hover:bg-gray-50' 
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="h-4 w-4 mr-3" />
                    上傳優惠
                  </button>
                  
                  <button 
                    onClick={() => canAccessMyOrders(user) && handleNavigation(`/hk/${user.id}/my-orders`)}
                    disabled={!canAccessMyOrders(user)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center ${
                      canAccessMyOrders(user) 
                        ? 'text-gray-700 hover:bg-gray-50' 
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Package className="h-4 w-4 mr-3" />
                    我的訂單
                  </button>
                  
                  <button 
                    onClick={() => handleNavigation(`/hk/${user.id}/my-offers`)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center"
                  >
                    <Package className="h-4 w-4 mr-3" />
                    我的優惠
                  </button>
                  
                  <button 
                    onClick={() => canAccessWatchlist(user) && handleNavigation(`/hk/${user.id}/watchlist`)}
                    disabled={!canAccessWatchlist(user)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center ${
                      canAccessWatchlist(user) 
                        ? 'text-gray-700 hover:bg-gray-50' 
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Heart className="h-4 w-4 mr-3" />
                    願望清單
                  </button>
                  
                  <button 
                    onClick={() => handleNavigation(`/hk/${user.id}/company-settings`)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    公司設定
                  </button>
                  
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    登出
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 px-3 py-2">
                <Link
                  to="/hk/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-center"
                >
                  登入
                </Link>
                <Link
                  to="/hk/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-center"
                >
                  註冊
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}