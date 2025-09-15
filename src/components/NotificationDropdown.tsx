import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Settings,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSafeNotifications } from '../hooks/useSafeNotifications';
import { Notification } from '../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; right: number };
  userId: string;
}

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

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationDropdown({ isOpen, onClose, position, userId }: NotificationDropdownProps) {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications,
    testNotifications
  } = useSafeNotifications();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // No navigation - notifications are just for display/information
    // Clicking only marks as read
    // Dropdown stays open for stability
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearAllNotifications();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="fixed w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1000] max-h-[600px] flex flex-col"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`
      }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-2xl flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-white" />
            <div>
              <h3 className="text-lg font-bold text-white">Notifications</h3>
              <p className="text-sm text-blue-100">
                {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'unread'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            Mark all as read
          </button>
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear all
          </button>
        </div>
        <div className="mt-2 flex justify-center">
          <button
            onClick={testNotifications}
            className="text-xs text-purple-600 hover:text-purple-700 transition-colors duration-200 flex items-center"
          >
            🧪 Test Notifications
          </button>
        </div>
      </div>

      {/* Notifications List - This will take remaining space and scroll */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredNotifications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              {activeTab === 'all' ? 'No notifications yet' : 'No unread notifications'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'all' 
                ? 'You\'ll see notifications here when you have updates' 
                : 'All caught up!'
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
                <div className="px-4 py-3">
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
                          <X className="h-4 w-4" />
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
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Always visible at bottom */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </p>
          <button
            onClick={() => {
              // Navigate to full notifications page
              onClose();
              navigate(`/hk/${userId}/notifications`);
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            View All
          </button>
        </div>
      </div>
    </div>
  );
} 