import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Search, Send, Paperclip, Smile, ArrowLeft, Lock, AlertCircle, Image, Video, File, X, Loader, Edit } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canSendMessages, getRestrictionMessage } from '../utils/userUtils';
import { 
  getOrCreateConversation, 
  sendMessage, 
  uploadMessageFile, 
  markMessagesAsRead, 
  listenToConversationMessages, 
  listenToUserConversations,
  deleteMessage,
  editMessage,
  Message,
  ConversationWithUser
} from '../services/messagingService';

// Message and ConversationWithUser interfaces are imported from messagingService

export default function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'conversations' | 'messages'>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithUser | null>(null);
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const processedStartConversation = useRef<string | null>(null);

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

  // Check if user can send messages
  if (!canSendMessages(user)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center bg-white rounded-xl shadow-sm border border-red-200 p-12">
          <div className="text-red-500 mb-6">
            <Lock className="h-24 w-24 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">消息功能受限</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            {getRestrictionMessage(user)}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
              <span className="text-red-800 font-semibold">帳戶狀態：{user?.status || '未知'}</span>
            </div>
            <p className="text-red-700 text-sm">
              只有活躍用戶才能發送和接收消息。如需恢復帳戶訪問權限，請聯繫客服支援。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Load conversations and set up real-time listeners
  useEffect(() => {
    if (!user) return;

    // Reset processed conversation when user changes
    processedStartConversation.current = null;

    const unsubscribe = listenToUserConversations(user.id, (conversationsData) => {
      setConversations(conversationsData);
      if (initialLoad) {
        setLoading(false);
        setInitialLoad(false);
      }
    });

    // Set a timeout to stop loading if no conversations are found
    const loadingTimeout = setTimeout(() => {
      if (initialLoad) {
        setLoading(false);
        setInitialLoad(false);
      }
    }, 2000); // Stop loading after 2 seconds for better UX

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [user]);

  // Handle starting conversation from URL parameter
  useEffect(() => {
    const startConversationUserId = searchParams.get('startConversation');
    if (startConversationUserId && user && !loading && !creatingConversation && 
        processedStartConversation.current !== startConversationUserId) {
      
      console.log('Processing startConversation URL parameter:', startConversationUserId);
      processedStartConversation.current = startConversationUserId;
      
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => 
        conv.participant.id === startConversationUserId
      );
      
      if (existingConversation) {
        console.log('Found existing conversation, selecting it:', existingConversation);
        setSelectedConversation(existingConversation);
        // Clear the URL parameter
        navigate(`/hk/${user.id}/messages`, { replace: true });
      } else {
        console.log('No existing conversation found, creating new one');
        // Create new conversation only if we haven't already started one
        handleStartNewConversation(startConversationUserId);
        // Don't clear URL parameter immediately, wait for conversation to be created
      }
    }
  }, [searchParams, user, loading, creatingConversation, conversations]); // Added conversations back for existing conversation check

  // Auto-select conversation when it appears in the list (for newly created conversations)
  useEffect(() => {
    const startConversationUserId = searchParams.get('startConversation');
    if (startConversationUserId && user && !selectedConversation && conversations.length > 0) {
      const targetConversation = conversations.find(conv => 
        conv.participant.id === startConversationUserId
      );
      
      if (targetConversation) {
        setSelectedConversation(targetConversation);
        console.log('Auto-selected conversation:', targetConversation);
        // Clear the URL parameter after successful auto-selection
        navigate(`/hk/${user.id}/messages`, { replace: true });
      }
    }
  }, [conversations, searchParams, user, selectedConversation]);

  const handleStartNewConversation = async (otherUserId: string) => {
    if (!user || creatingConversation) return;
    
    setCreatingConversation(true);
    
    try {
      const conversationId = await getOrCreateConversation(user.id, otherUserId);
      console.log('Conversation created/retrieved with ID:', conversationId);
      
      // Wait a bit for the real-time listener to pick up the new conversation
      setTimeout(() => {
        // Check if the conversation is now in our list and select it
        const newConversation = conversations.find(conv => 
          conv.participant.id === otherUserId
        );
        
        if (newConversation) {
          setSelectedConversation(newConversation);
          console.log('Conversation selected:', newConversation);
          // Clear the URL parameter after successful selection
          navigate(`/hk/${user.id}/messages`, { replace: true });
        } else {
          console.log('Conversation not found in list yet, will be selected by listener');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('無法開始對話，請重試');
      // Clear URL parameter even on error
      navigate(`/hk/${user.id}/messages`, { replace: true });
    } finally {
      setCreatingConversation(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive (only if user is at bottom)
  useEffect(() => {
    // Only auto-scroll if user hasn't manually scrolled up
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

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedConversation || !user) return;

    setSendingMessage(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let messageType: 'text' | 'image' | 'video' | 'file' = 'text';

      // Upload file if selected
      if (selectedFile) {
        setUploadingFile(true);
        const fileData = await uploadMessageFile(selectedFile, selectedConversation.id, user.id);
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
        user.id,
        selectedConversation.participant.id,
        messageInput.trim() || (selectedFile ? `發送了${messageType === 'image' ? '圖片' : messageType === 'video' ? '視頻' : '文件'}` : ''),
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
      alert('發送消息失敗，請重試');
    } finally {
      setSendingMessage(false);
      setUploadingFile(false);
    }
  };

  const handleConversationSelect = async (conversation: ConversationWithUser, event?: React.MouseEvent) => {
    // Prevent default behavior to avoid page scroll
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Only change conversation if it's different from current one
    if (selectedConversation?.id !== conversation.id) {
      setSelectedConversation(conversation);
      
      // Mark messages as read
      if (user) {
        try {
          await markMessagesAsRead(conversation.id, user.id);
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return '剛剛';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小時前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setEditContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      await editMessage(editingMessage.id, editContent.trim());
      setEditingMessage(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing message:', error);
      alert('編輯消息失敗，請重試');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('確定要刪除這條消息嗎？')) return;

    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('刪除消息失敗，請重試');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredConversations = conversations
    .filter(conv =>
      conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participant.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.lastMessage && conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      // Sort by lastMessageAt if available, otherwise by createdAt
      const aTime = a.lastMessage?.timestamp || a.createdAt || '1970-01-01T00:00:00.000Z';
      const bTime = b.lastMessage?.timestamp || b.createdAt || '1970-01-01T00:00:00.000Z';
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">訊息</h1>
                  <p className="text-sm text-gray-500">與買家和賣家保持聯繫</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'conversations'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                對話
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'messages'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                所有訊息
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索對話..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="h-96 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader className="h-6 w-6 animate-spin text-blue-600 mb-2" />
                  <p className="text-sm text-gray-500">
                    {initialLoad ? '載入對話中...' : '檢查新消息...'}
                  </p>
                </div>
              ) : activeTab === 'conversations' ? (
                <div className="space-y-1">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={(e) => handleConversationSelect(conversation, e)}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
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
                          {conversation.participant.isOnline && (
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {conversation.participant.name}
                            </h4>
                              {conversation.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                              )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.participant.company}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-sm truncate ${
                                conversation.lastMessage && !conversation.lastMessage.isRead ? 'text-gray-900 font-medium' : 'text-gray-600'
                              }`}>
                                {conversation.lastMessage ? (
                                  conversation.lastMessage.type === 'text' ? conversation.lastMessage.content :
                                  conversation.lastMessage.type === 'image' ? '📷 圖片' :
                                  conversation.lastMessage.type === 'video' ? '🎥 視頻' :
                                  conversation.lastMessage.type === 'file' ? '📎 文件' : '消息'
                                ) : '開始對話...'}
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
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="h-8 w-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">歡迎使用訊息功能！</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        您還沒有任何對話。開始與其他用戶交流吧！
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={() => navigate('/hk')}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          瀏覽優惠商品
                        </button>
                        <p className="text-xs text-gray-400">
                          點擊優惠商品頁面的「聯絡賣家」按鈕開始對話
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">所有訊息將在此顯示</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {selectedConversation.participant.avatar ? (
                        <img
                          src={selectedConversation.participant.avatar}
                          alt={selectedConversation.participant.name}
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
                        className={`h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold ${selectedConversation.participant.avatar ? 'hidden' : 'flex'}`}
                      >
                        {selectedConversation.participant.company.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                      {selectedConversation.participant.isOnline && (
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
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
                </div>

                {/* Messages */}
                <div className="h-96 overflow-y-auto p-6">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="group relative">
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                              message.senderId === user?.id
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
                                  className="flex items-center space-x-2 text-sm hover:underline"
                                >
                                  {getFileIcon(message.fileName || '')}
                                  <span>{message.fileName}</span>
                                  {message.fileSize && (
                                    <span className="text-xs opacity-75">
                                      ({formatFileSize(message.fileSize)})
                                    </span>
                                  )}
                                </a>
                                {message.content && <p className="text-sm mt-2">{message.content}</p>}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-1">
                              <p className={`text-xs ${
                                message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatMessageTime(message.timestamp)}
                                {message.isEdited && <span className="ml-1">(已編輯)</span>}
                              </p>
                            </div>
                          </div>
                          
                          {/* Message actions (only for own messages) */}
                          {message.senderId === user?.id && (
                            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleEditMessage(message)}
                                  className="p-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-600 hover:text-gray-800"
                                  title="編輯"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="p-1 bg-red-200 hover:bg-red-300 rounded text-red-600 hover:text-red-800"
                                  title="刪除"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* File Preview */}
                {selectedFile && (
                  <div className="px-6 py-2 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {filePreview ? (
                          <img src={filePreview} alt="Preview" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          getFileIcon(selectedFile.type)
                        )}
                        <span className="text-sm text-gray-700">{selectedFile.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(selectedFile.size)})</span>
                      </div>
                      <button
                        onClick={removeSelectedFile}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Message Modal */}
                {editingMessage && (
                  <div className="px-6 py-2 border-t border-gray-200 bg-yellow-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">編輯消息:</span>
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessage(null);
                          setEditContent('');
                        }}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        取消
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
                      title="附加文件"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="輸入訊息..."
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
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">選擇對話</h3>
                  <p className="text-sm text-gray-500">從側邊欄選擇對話開始發送訊息</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 