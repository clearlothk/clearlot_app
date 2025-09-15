import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Users,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Package,
  ShoppingCart,
  Loader,
  File
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  sendMessage, 
  uploadMessageFile, 
  markMessagesAsRead, 
  listenToConversationMessages, 
  listenToUserConversations,
  Message,
  ConversationWithUser
} from '../services/messagingService';
import { getClearLotAdminId } from '../services/adminService';
import { formatHKDate } from '../utils/dateUtils';

export default function AdminMessagesPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithUser | null>(null);
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check admin authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    const adminData = localStorage.getItem('adminUser');
    
    if (!isAuthenticated || !adminData) {
      navigate('/hk/admin/login');
      return;
    }
    
    setAdminUser(JSON.parse(adminData));
    setIsLoading(false);
  }, [navigate]);

  // Get admin user ID
  useEffect(() => {
    const getAdminId = async () => {
      try {
        const adminId = await getClearLotAdminId();
        setAdminUserId(adminId);
      } catch (error) {
        console.error('Error getting admin ID:', error);
      }
    };
    
    getAdminId();
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Common emojis for the picker - using more reliable emoji set
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', 
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', 
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', 
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', 
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', 
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', 
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', 
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', 
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', 
    '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', 
    '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', 
    '😾', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', 
    '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', 
    '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', 
    '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', 
    '👁️', '👅', '👄', '💋', '🩸', '❤️', '🧡', '💛', '💚', '💙', 
    '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', 
    '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', 
    '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', 
    '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', 
    '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', 
    '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', 
    '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', 
    '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', 
    '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', 
    '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', 
    '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', 
    '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', 
    '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', 
    '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', 
    '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'
  ];

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Load conversations for admin
  useEffect(() => {
    if (!adminUserId) return;

    const unsubscribe = listenToUserConversations(adminUserId, (conversationsData) => {
      setConversations(conversationsData);
    });

    return () => unsubscribe();
  }, [adminUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      const messagesContainer = messagesEndRef.current.parentElement;
      if (messagesContainer) {
        const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 10;
        if (isAtBottom) {
          scrollToBottom();
        }
      }
    }
  }, [messages]);

  // Auto-scroll to bottom when a conversation is selected
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      // Small delay to ensure messages are rendered
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  const handleConversationSelect = async (conversation: ConversationWithUser, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (selectedConversation?.id !== conversation.id) {
      setSelectedConversation(conversation);
      
      // Mark messages as read and update local state immediately
      if (adminUserId) {
        try {
          await markMessagesAsRead(conversation.id, adminUserId);
          
          // Update local conversations state to reflect unread count change
          setConversations(prevConversations => 
            prevConversations.map(conv => 
              conv.id === conversation.id 
                ? { ...conv, unreadCount: 0 }
                : conv
            )
          );
          } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
    }
  };

  // Set up real-time message listener when conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const unsubscribe = listenToConversationMessages(selectedConversation.id, (messagesData) => {
      setMessages(messagesData);
      // Auto-scroll to bottom when messages are first loaded
      if (messagesData.length > 0) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedConversation || !adminUserId) return;

    setSendingMessage(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let messageType: 'text' | 'image' | 'video' | 'file' = 'text';

      // Upload file if selected
      if (selectedFile) {
        setUploadingFile(true);
        const fileData = await uploadMessageFile(selectedFile, selectedConversation.id, adminUserId);
        fileUrl = fileData.url;
        fileName = fileData.fileName;
        fileSize = fileData.fileSize;
        
        // Determine file type
        if (selectedFile.type.startsWith('image/')) {
          messageType = 'image';
        } else if (selectedFile.type.startsWith('video/')) {
          messageType = 'video';
        } else {
          messageType = 'file';
        }
      }

      // Send message
      await sendMessage(
        selectedConversation.id,
        adminUserId,
        selectedConversation.participant.id,
        messageInput.trim() || (selectedFile ? `Sent ${messageType === 'image' ? 'image' : messageType === 'video' ? 'video' : 'file'}` : ''),
        messageType,
        fileUrl,
        fileName,
        fileSize
      );

      // Clear input and file
      setMessageInput('');
      setSelectedFile(null);
      setFilePreview(null);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message, please try again');
    } finally {
      setSendingMessage(false);
      setUploadingFile(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      return formatHKDate(date);
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.participant.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-blue-100">ClearLot</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {/* Main Navigation */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Main
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    navigate('/hk/admin/dashboard');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <BarChart3 className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Dashboard</span>
                </button>
              </div>
            </div>

            {/* Management */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Management
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    navigate('/hk/admin/users');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <Users className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Users</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/hk/admin/offers');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <Package className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Offers</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/hk/admin/transactions');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <ShoppingCart className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Transactions</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/hk/admin/messages');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Messages</span>
                </button>
              </div>
            </div>

            {/* System */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                System
              </h3>
              <div className="space-y-1">
                <button
                  disabled
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed rounded-lg opacity-50"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </nav>

          {/* User Profile & Logout */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{adminUser.username}</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('adminAuthenticated');
                localStorage.removeItem('adminUser');
                navigate('/');
                setSidebarOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group border border-gray-200"
            >
              <LogOut className="h-5 w-5 group-hover:text-red-600" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 w-full lg:ml-0 overflow-x-hidden">
      {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <button
                onClick={() => navigate('/hk/admin/dashboard')}
                className="hidden lg:block p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Messages Management</h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {conversations.length} Conversations
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Left Sidebar - Conversations */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
                    <MessageCircle className="h-4 w-4 md:h-5 md:w-5 mr-2 text-blue-600" />
                    User Conversations
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {conversations.length}
                  </span>
      </div>

          {/* Search */}
                <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                    placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
              />
          </div>

          {/* Conversations List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                        onClick={(e) => handleConversationSelect(conversation, e)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                          selectedConversation?.id === conversation.id 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                      <div className="flex items-center space-x-3">
                          <div className="relative">
                            {conversation.participant.avatar ? (
                              <img
                                src={conversation.participant.avatar}
                                alt={conversation.participant.name}
                                className="h-10 w-10 rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold ${conversation.participant.avatar ? 'hidden' : 'flex'}`}
                            >
                              {conversation.participant.company.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {conversation.participant.name}
                            </h4>
                              {conversation.unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                                  {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                              {conversation.participant.company}
                          </p>
                          {conversation.lastMessage && (
                              <p className="text-xs text-gray-400 truncate mt-1">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No conversations</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content - Chat */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[500px] md:h-[600px] flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className="relative">
                            {selectedConversation.participant.avatar ? (
                              <img
                                src={selectedConversation.participant.avatar}
                                alt={selectedConversation.participant.name}
                                className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold ${selectedConversation.participant.avatar ? 'hidden' : 'flex'}`}
                            >
                              {selectedConversation.participant.company.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {selectedConversation.participant.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {selectedConversation.participant.company}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderId === adminUserId ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="group relative">
                              <div
                                className={`max-w-xs px-4 py-2 rounded-lg ${
                                  message.senderId === adminUserId
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                {/* Message content based on type */}
                                {message.type === 'text' && (
                                  <p className="text-sm">{message.content}</p>
                                )}
                                
                                {message.type === 'image' && message.fileUrl && (
                                  <div>
                                    <img 
                                      src={message.fileUrl} 
                                      alt="Shared image" 
                                      className="max-w-full h-auto rounded mb-2 cursor-pointer"
                                      onClick={() => window.open(message.fileUrl, '_blank')}
                                    />
                                    {message.content && <p className="text-sm">{message.content}</p>}
                                  </div>
                                )}
                                
                                {message.type === 'video' && message.fileUrl && (
                                  <div>
                                    <video 
                                      src={message.fileUrl} 
                                      controls 
                                      className="max-w-full h-auto rounded mb-2"
                                    />
                                    {message.content && <p className="text-sm">{message.content}</p>}
                                  </div>
                                )}
                                
                                {message.type === 'file' && message.fileUrl && (
                                  <div>
                                    <a 
                                      href={message.fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-2"
                                    >
                                      <File className="h-4 w-4" />
                                      <span className="text-sm">{message.fileName}</span>
                                    </a>
                                    {message.content && <p className="text-sm">{message.content}</p>}
                                  </div>
                                )}
                              </div>
                              <div className={`text-xs text-gray-400 mt-1 ${message.senderId === adminUserId ? 'text-right' : 'text-left'}`}>
                                {formatTime(message.timestamp)}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* File Preview */}
                    {selectedFile && (
                      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                            {filePreview ? (
                              <img src={filePreview} alt="Preview" className="h-10 w-10 rounded object-cover" />
                            ) : (
                              <File className="h-10 w-10 text-gray-400" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                              <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button
                            onClick={removeSelectedFile}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Message Input */}
                    <div className="px-6 py-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileSelect}
                          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                          className="hidden"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                          title="Attach file"
                        >
                          <Paperclip className="h-4 w-4" />
                        </button>
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <div className="relative" ref={emojiPickerRef}>
                          <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            title="選擇表情符號"
                          >
                            <Smile className="h-4 w-4" />
                          </button>
                          
                          {/* Emoji Picker */}
                          {showEmojiPicker && (
                            <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-h-48 overflow-y-auto z-10 w-64 emoji-picker">
                              <div className="grid grid-cols-8 gap-1">
                                {commonEmojis.slice(0, 64).map((emoji, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className="emoji-button p-2 hover:bg-gray-100 rounded text-xl transition-colors duration-200 min-h-[32px] min-w-[32px]"
                                    title={emoji}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              {commonEmojis.length > 64 && (
                                <div className="mt-2 pt-2 border-t border-gray-100 text-center">
                                  <span className="text-xs text-gray-500">更多表情符號即將推出</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSendMessage();
                          }}
                          disabled={(!messageInput.trim() && !selectedFile) || sendingMessage || uploadingFile}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendingMessage || uploadingFile ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Select a conversation</h3>
                      <p className="text-sm text-gray-500">
                        Choose a conversation from the left to start chatting
                      </p>
                    </div>
                  </div>
                )}
              </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}