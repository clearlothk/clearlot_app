import React, { useState, useEffect } from 'react';
import { Bell, ArrowLeft, CheckCircle, AlertCircle, DollarSign, ShoppingCart, TrendingUp, Settings, Trash2, Eye, EyeOff } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useSafeNotifications } from '../hooks/useSafeNotifications';
import type { Notification } from '../types';

export default function NotificationsPage() {
  const { userId } = useParams<{ userId: string }>();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications,
    isLoading 
  } = useSafeNotifications();
  
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCart className="h-5 w-5 text-green-600" />;
      case 'sale':
        return <DollarSign className="h-5 w-5 text-blue-600" />;
      case 'payment':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'offer':
        return <TrendingUp className="h-5 w-5 text-orange-600" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-600" />;
      case 'watchlist':
        return <Bell className="h-5 w-5 text-purple-600" />;
      case 'order_status':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'price_drop':
        return <TrendingUp className="h-5 w-5 text-red-600" />;
      case 'offer_purchased':
        return <ShoppingCart className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-300 bg-white';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return '剛剛';
    if (diffInMinutes < 60) return `${diffInMinutes} 分鐘前`;
    if (diffInHours < 24) return `${diffInHours} 小時前`;
    if (diffInDays < 7) return `${diffInDays} 天前`;
    return date.toLocaleDateString('zh-TW');
  };

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // No navigation - notifications are just for display/information
    // Clicking only marks as read
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入通知中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to={`/hk/${userId}/marketplace`}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">通知</h1>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              全部 ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'unread'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              未讀 ({unreadCount})
            </button>
          </div>

          {/* Actions */}
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                <Eye className="h-4 w-4 mr-1" />
                全部標記為已讀
              </button>
              <button
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                清除全部
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[600px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  {activeTab === 'all' ? '暫無通知' : '暫無未讀通知'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {activeTab === 'all' 
                    ? '當您有更新時，通知會顯示在這裡' 
                    : '全部已讀完！'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative border-l-4 ${
                      notification.isRead 
                        ? 'border-l-gray-300 bg-white'
                        : 'border-l-red-500 bg-red-50'
                    } hover:bg-gray-50 transition-colors duration-200 cursor-pointer`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className={`text-sm font-medium ${
                              notification.isRead ? 'text-gray-700' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors duration-200 ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className={`text-sm mt-1 ${
                            notification.isRead ? 'text-gray-500' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          {notification.data?.amount && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-green-600">
                                HKD {notification.data.amount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {notification.data?.percentage && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-red-600">
                                {notification.data.percentage}% 折扣
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 