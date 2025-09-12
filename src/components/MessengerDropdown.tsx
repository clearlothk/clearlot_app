import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, MoreVertical, Send, Paperclip, Smile, ArrowLeft } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    company: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

interface MessengerDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; right: number };
}

export default function MessengerDropdown({ isOpen, onClose, position }: MessengerDropdownProps) {
  const [activeTab, setActiveTab] = useState<'conversations' | 'messages'>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConversation, setShowConversation] = useState(false);

  // Mock data for conversations with full message history
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      participant: {
        id: 'user1',
        name: 'John Smith',
        company: 'TechCorp Solutions',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
        isOnline: true
      },
      lastMessage: {
        id: 'msg1',
        senderId: 'user1',
        receiverId: 'currentUser',
        content: 'Hi! I\'m interested in your LED light fixtures offer. Can we discuss the bulk pricing?',
        timestamp: '2025-01-15T10:30:00Z',
        isRead: false
      },
      unreadCount: 2,
      messages: [
        {
          id: 'msg1',
          senderId: 'user1',
          receiverId: 'currentUser',
          content: 'Hi! I\'m interested in your LED light fixtures offer. Can we discuss the bulk pricing?',
          timestamp: '2025-01-15T10:30:00Z',
          isRead: false
        },
        {
          id: 'msg2',
          senderId: 'currentUser',
          receiverId: 'user1',
          content: 'Hello John! Yes, I\'d be happy to discuss bulk pricing. What quantity are you looking for?',
          timestamp: '2025-01-15T10:25:00Z',
          isRead: true
        },
        {
          id: 'msg3',
          senderId: 'user1',
          receiverId: 'currentUser',
          content: 'I need around 200 pieces. What\'s your best price for that quantity?',
          timestamp: '2025-01-15T10:20:00Z',
          isRead: true
        }
      ]
    },
    {
      id: '2',
      participant: {
        id: 'user2',
        name: 'Sarah Chen',
        company: 'Industrial Lighting Co.',
        avatar: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=150',
        isOnline: false
      },
      lastMessage: {
        id: 'msg4',
        senderId: 'currentUser',
        receiverId: 'user2',
        content: 'Thank you for your inquiry. I\'ll send you the detailed pricing sheet.',
        timestamp: '2025-01-15T09:15:00Z',
        isRead: true
      },
      unreadCount: 0,
      messages: [
        {
          id: 'msg4',
          senderId: 'currentUser',
          receiverId: 'user2',
          content: 'Thank you for your inquiry. I\'ll send you the detailed pricing sheet.',
          timestamp: '2025-01-15T09:15:00Z',
          isRead: true
        },
        {
          id: 'msg5',
          senderId: 'user2',
          receiverId: 'currentUser',
          content: 'Great! I\'m looking forward to seeing the pricing details.',
          timestamp: '2025-01-15T09:10:00Z',
          isRead: true
        }
      ]
    },
    {
      id: '3',
      participant: {
        id: 'user3',
        name: 'Mike Johnson',
        company: 'Restaurant Equipment Plus',
        avatar: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=150',
        isOnline: true
      },
      lastMessage: {
        id: 'msg6',
        senderId: 'user3',
        receiverId: 'currentUser',
        content: 'Is the restaurant equipment bundle still available?',
        timestamp: '2025-01-15T08:45:00Z',
        isRead: false
      },
      unreadCount: 1,
      messages: [
        {
          id: 'msg6',
          senderId: 'user3',
          receiverId: 'currentUser',
          content: 'Is the restaurant equipment bundle still available?',
          timestamp: '2025-01-15T08:45:00Z',
          isRead: false
        }
      ]
    }
  ]);

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversation) {
      const newMessage: Message = {
        id: `msg${Date.now()}`,
        senderId: 'currentUser',
        receiverId: selectedConversation.participant.id,
        content: messageInput.trim(),
        timestamp: new Date().toISOString(),
        isRead: true
      };

      // Update the selected conversation with the new message
      const updatedConversations = conversations.map(conv => {
        if (conv.id === selectedConversation.id) {
          return {
            ...conv,
            lastMessage: newMessage,
            messages: [...conv.messages, newMessage],
            unreadCount: 0
          };
        }
        return conv;
      });

      setConversations(updatedConversations);
      setSelectedConversation(prev => prev ? {
        ...prev,
        lastMessage: newMessage,
        messages: [...prev.messages, newMessage],
        unreadCount: 0
      } : null);
      setMessageInput('');
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowConversation(true);
    
    // Mark messages as read
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversation.id) {
        return {
          ...conv,
          unreadCount: 0,
          messages: conv.messages.map(msg => ({ ...msg, isRead: true }))
        };
      }
      return conv;
    });
    setConversations(updatedConversations);
  };

  const handleBackToConversations = () => {
    setShowConversation(false);
    setSelectedConversation(null);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1000] backdrop-blur-sm"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showConversation && (
              <button
                onClick={handleBackToConversations}
                className="text-blue-100 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="bg-white p-2 rounded-lg">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {showConversation ? selectedConversation?.participant.name : 'Messages'}
              </h3>
              <p className="text-sm text-blue-100">
                {showConversation ? selectedConversation?.participant.company : 'Stay connected with buyers and sellers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors duration-200"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {!showConversation ? (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'conversations'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Conversations
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'messages'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Messages
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'conversations' ? (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={conversation.participant.avatar}
                          alt={conversation.participant.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        {conversation.participant.isOnline && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {conversation.participant.name}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.participant.company}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-sm truncate ${
                            conversation.lastMessage.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'
                          }`}>
                            {conversation.lastMessage.content}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="ml-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">All messages will appear here</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{filteredConversations.length} conversations</span>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                View All
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Messages View */}
          <div className="max-h-96 overflow-y-auto p-4">
            <div className="space-y-4">
              {selectedConversation?.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === 'currentUser' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.senderId === 'currentUser'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderId === 'currentUser' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                <Smile className="h-4 w-4" />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 