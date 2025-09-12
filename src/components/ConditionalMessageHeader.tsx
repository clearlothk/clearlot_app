import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { listenToTotalUnreadMessageCount } from '../services/messagingService';

interface ConditionalMessageHeaderProps {
  userId: string;
  onMessageClick: () => void;
}

const ConditionalMessageHeader: React.FC<ConditionalMessageHeaderProps> = ({ userId, onMessageClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const messageRef = useRef<HTMLButtonElement>(null);

  // Listen to unread message count changes
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = listenToTotalUnreadMessageCount(userId, (count) => {
      setUnreadCount(count);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId]);

  const handleMessageClick = () => {
    onMessageClick();
  };

  return (
    <>
      {/* Message Button */}
      <button 
        ref={messageRef}
        onClick={handleMessageClick}
        className="relative p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
        title="訊息"
      >
        <MessageCircle className="h-6 w-6" />
        {/* Unread message badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-300 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full min-w-[20px] flex items-center justify-center shadow-sm border border-yellow-400">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
};

export default ConditionalMessageHeader;
