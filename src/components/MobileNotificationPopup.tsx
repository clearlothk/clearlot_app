import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Bell, Package, DollarSign, AlertCircle, CheckCircle, Heart, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../types';

interface MobileNotificationPopupProps {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => void;
}

const MobileNotificationPopup: React.FC<MobileNotificationPopupProps> = ({
  notification,
  onClose,
  onMarkAsRead
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Auto-show animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-hide after 5 seconds (longer for message notifications)
  useEffect(() => {
    const hideDelay = notification.type === 'message' ? 7000 : 5000;
    const timer = setTimeout(() => {
      handleClose();
    }, hideDelay);
    return () => clearTimeout(timer);
  }, [notification.type]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleClick = () => {
    // Mark as read if not already read
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate to relevant page if actionUrl is provided
    if (notification.data?.actionUrl) {
      navigate(notification.data.actionUrl);
    }

    handleClose();
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'message':
        return <MessageCircle className="h-5 w-5 text-blue-600" />;
      case 'purchase':
      case 'offer_purchased':
        return <Package className="h-5 w-5 text-green-600" />;
      case 'payment':
      case 'payment_approved':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'order_status':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'price_drop':
        return <Heart className="h-5 w-5 text-red-600" />;
      case 'system':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'verification_status':
        return <User className="h-5 w-5 text-purple-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = () => {
    switch (notification.priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-[9999] transform transition-all duration-300 ease-in-out ${
        isVisible && !isLeaving
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-[-100%] opacity-0 scale-95'
      }`}
      style={{
        // Ensure it appears above everything including modals
        zIndex: 99999
      }}
    >
      <div
        className={`border-l-4 ${getNotificationColor()} bg-white rounded-lg shadow-lg border border-gray-200 p-4 cursor-pointer active:scale-[0.98] transition-transform duration-150`}
        onClick={handleClick}
      >
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getNotificationIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {notification.message}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Time */}
            <div className="mt-2 text-xs text-gray-500">
              {new Date(notification.createdAt).toLocaleTimeString('zh-HK', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </div>
    </div>
  );
};

export default MobileNotificationPopup;
