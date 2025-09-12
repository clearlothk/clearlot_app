import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: string;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: string;
  replyTo?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageAt: string;
  unreadCount: { [userId: string]: number };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithUser {
  id: string;
  participant: {
    id: string;
    name: string;
    company: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage?: Message;
  unreadCount: number;
  messages: Message[];
  createdAt?: string;
  updatedAt?: string;
}

// Create or get conversation between two users
export const getOrCreateConversation = async (userId1: string, userId2: string): Promise<string> => {
  try {
    console.log(`Creating/getting conversation between ${userId1} and ${userId2}`);
    
    // Check if conversation already exists
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId1),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.docs.length} existing conversations for user ${userId1}`);
    
    for (const docSnapshot of querySnapshot.docs) {
      const conversation = docSnapshot.data() as Conversation;
      if (conversation.participants.includes(userId2)) {
        console.log(`Found existing conversation: ${docSnapshot.id}`);
        return docSnapshot.id;
      }
    }
    
    // Create new conversation if none exists
    const newConversation: Omit<Conversation, 'id'> = {
      participants: [userId1, userId2],
      lastMessageAt: new Date().toISOString(),
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Creating new conversation with data:', newConversation);
    const docRef = await addDoc(conversationsRef, newConversation);
    console.log(`Created new conversation with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    throw new Error('Failed to create or get conversation');
  }
};

// Send a text message
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
  type: 'text' | 'image' | 'video' | 'file' = 'text',
  fileUrl?: string,
  fileName?: string,
  fileSize?: number,
  replyTo?: string
): Promise<string> => {
  try {
    console.log('Sending message with data:', {
      conversationId,
      senderId,
      receiverId,
      content,
      type,
      fileUrl,
      fileName,
      fileSize,
      replyTo
    });
    
    const messagesRef = collection(db, 'messages');
    const newMessage: any = {
      conversationId,
      senderId,
      receiverId,
      content,
      type,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    
    // Only add optional fields if they have values
    if (fileUrl) newMessage.fileUrl = fileUrl;
    if (fileName) newMessage.fileName = fileName;
    if (fileSize) newMessage.fileSize = fileSize;
    if (replyTo) newMessage.replyTo = replyTo;
    
    console.log('Final message data to save:', newMessage);
    
    const docRef = await addDoc(messagesRef, newMessage);
    
    // Update conversation with last message
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: {
        id: docRef.id,
        ...newMessage
      },
      lastMessageAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      [`unreadCount.${receiverId}`]: 1
    });
    
    // Send notification to receiver about new message
    try {
      // Get sender information for notification
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      if (senderDoc.exists()) {
        const senderData = senderDoc.data();
        const senderName = senderData.name || senderData.company || 'Unknown User';
        const senderCompany = senderData.company || 'Unknown Company';
        
        // Import notification services
        const { notificationService } = await import('./notificationService');
        const { firestoreNotificationService } = await import('./firestoreNotificationService');
        const { getCurrentHKTimestamp } = await import('../utils/dateUtils');
        
        // Create notification data
        const notificationData = {
          userId: receiverId,
          type: 'message' as const,
          title: `新訊息來自 ${senderCompany}`,
          message: `${senderName}: ${content.length > 50 ? content.substring(0, 50) + '...' : content}`,
          isRead: false,
          data: {
            conversationId,
            messageId: docRef.id,
            senderId,
            senderName,
            senderCompany,
            actionUrl: `/hk/messages?conversation=${conversationId}`
          },
          priority: 'medium' as const
        };
        
        console.log('📨 Creating message notification:', notificationData);
        
        // Save notification to Firestore
        const notificationId = await firestoreNotificationService.addNotification(notificationData);
        console.log('✅ Message notification saved to Firestore with ID:', notificationId);
        
        // Create notification with ID and trigger real-time notification
        const notificationWithId = {
          ...notificationData,
          id: notificationId,
          createdAt: getCurrentHKTimestamp()
        };
        
        console.log('📡 Triggering real-time message notification...');
        notificationService.trigger(notificationWithId);
        console.log('✅ Message notification sent successfully');
      } else {
        console.warn('Sender document not found for notification:', senderId);
      }
    } catch (notificationError) {
      console.error('❌ Error creating message notification:', notificationError);
      // Don't throw error here - message was sent successfully, notification is optional
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
};

// Upload file (image, video, or document)
export const uploadMessageFile = async (
  file: File,
  conversationId: string,
  senderId: string
): Promise<{ url: string; fileName: string; fileSize: number }> => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `messages/${conversationId}/${senderId}/${fileName}`;
    const fileRef = ref(storage, filePath);
    
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    
    return {
      url: downloadURL,
      fileName: file.name,
      fileSize: file.size
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

// Get conversations for a user
export const getUserConversations = async (userId: string): Promise<ConversationWithUser[]> => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      where('isActive', '==', true),
      orderBy('lastMessageAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const conversations: ConversationWithUser[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const conversation = docSnapshot.data() as Conversation;
      const otherUserId = conversation.participants.find(id => id !== userId);
      
      if (otherUserId) {
        // Get user data
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Try different possible logo field names
          const possibleLogoFields = [
            userData.companyLogo,
            userData.logo,
            userData.avatar,
            userData.profileImage,
            userData.profilePicture,
            userData.image,
            userData.photo
          ];
          
          const logoUrl = possibleLogoFields.find(field => field && field.trim() !== '') || '';
          
          conversations.push({
            id: docSnapshot.id,
            participant: {
              id: otherUserId,
              name: userData.name || userData.company || 'Unknown User',
              company: userData.company || '',
              avatar: logoUrl,
              isOnline: userData.isOnline || false
            },
            lastMessage: conversation.lastMessage,
            unreadCount: conversation.unreadCount[userId] || 0,
            messages: [], // Will be loaded separately
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt
          });
        } else {
          // If user document doesn't exist, create a fallback entry
          console.warn(`User document not found for ID: ${otherUserId}`);
          conversations.push({
            id: docSnapshot.id,
            participant: {
              id: otherUserId,
              name: 'Unknown User',
              company: '',
              avatar: '',
              isOnline: false
            },
            lastMessage: conversation.lastMessage,
            unreadCount: conversation.unreadCount[userId] || 0,
            messages: [], // Will be loaded separately
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt
          });
        }
      }
    }
    
    return conversations;
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw new Error('Failed to get conversations');
  }
};

// Get messages for a conversation
export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const messages: Message[] = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as Message);
    });
    
    return messages;
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    throw new Error('Failed to get messages');
  }
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId: string, userId: string): Promise<void> => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      where('receiverId', '==', userId),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });
    
    await batch.commit();
    
    // Update conversation unread count
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      [`unreadCount.${userId}`]: 0,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw new Error('Failed to mark messages as read');
  }
};

// Listen to conversation messages in real-time
export const listenToConversationMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as Message);
    });
    callback(messages);
  }, (error) => {
    console.error('Error listening to conversation messages:', error);
    // Call callback with empty array on error to prevent UI issues
    callback([]);
  });
};

// Listen to user conversations in real-time
export const listenToUserConversations = (
  userId: string,
  callback: (conversations: ConversationWithUser[]) => void
): (() => void) => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    where('isActive', '==', true),
    orderBy('lastMessageAt', 'desc')
  );
  
  return onSnapshot(q, async (querySnapshot) => {
    const conversations: ConversationWithUser[] = [];
    
    console.log(`Real-time listener: Found ${querySnapshot.docs.length} conversations for user ${userId}`);
    
    // If no conversations found, immediately call callback with empty array
    if (querySnapshot.empty) {
      console.log('No conversations found, calling callback with empty array');
      callback([]);
      return;
    }
    
    for (const docSnapshot of querySnapshot.docs) {
      const conversation = docSnapshot.data() as Conversation;
      const otherUserId = conversation.participants.find(id => id !== userId);
      
      if (otherUserId) {
        try {
          console.log(`Loading user data for participant: ${otherUserId}`);
          // Get user data
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log(`User data loaded for ${otherUserId}:`, {
              name: userData.name,
              company: userData.company,
              avatar: userData.avatar,
              companyLogo: userData.companyLogo,
              profileImage: userData.profileImage,
              fullUserData: userData // Log full data for debugging
            });
            
            // Debug: Check if companyLogo exists in different ways
            console.log(`Debug companyLogo for ${otherUserId}:`, {
              'userData.companyLogo': userData.companyLogo,
              'typeof companyLogo': typeof userData.companyLogo,
              'companyLogo === undefined': userData.companyLogo === undefined,
              'companyLogo === null': userData.companyLogo === null,
              'companyLogo === ""': userData.companyLogo === "",
              'Object.keys(userData)': Object.keys(userData),
              'userData keys containing logo': Object.keys(userData).filter(key => key.toLowerCase().includes('logo'))
            });
            // Try different possible logo field names
            const possibleLogoFields = [
              userData.companyLogo,
              userData.logo,
              userData.avatar,
              userData.profileImage,
              userData.profilePicture,
              userData.image,
              userData.photo
            ];
            
            const logoUrl = possibleLogoFields.find(field => field && field.trim() !== '') || '';
            
            console.log(`Logo resolution for ${otherUserId}:`, {
              possibleLogoFields,
              selectedLogo: logoUrl
            });
            
            conversations.push({
              id: docSnapshot.id,
              participant: {
                id: otherUserId,
                name: userData.name || userData.company || 'Unknown User',
                company: userData.company || '',
                avatar: logoUrl,
                isOnline: userData.isOnline || false
              },
              lastMessage: conversation.lastMessage,
              unreadCount: conversation.unreadCount[userId] || 0,
              messages: [], // Will be loaded separately
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt
            });
          } else {
            // If user document doesn't exist, create a fallback entry
            console.warn(`User document not found for ID: ${otherUserId}`);
            conversations.push({
              id: docSnapshot.id,
              participant: {
                id: otherUserId,
                name: 'Unknown User',
                company: '',
                avatar: '',
                isOnline: false
              },
              lastMessage: conversation.lastMessage,
              unreadCount: conversation.unreadCount[userId] || 0,
              messages: [], // Will be loaded separately
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt
            });
          }
        } catch (error) {
          console.error('Error getting user data for conversation:', error);
        }
      }
    }
    
    console.log(`Real-time listener: Returning ${conversations.length} conversations`);
    callback(conversations);
  }, (error) => {
    console.error('Error listening to conversations:', error);
    // Call callback with empty array on error to stop loading
    callback([]);
  });
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const messageData = messageDoc.data() as Message;
      
      // Delete file from storage if it exists
      if (messageData.fileUrl) {
        try {
          const fileRef = ref(storage, messageData.fileUrl);
          await deleteObject(fileRef);
        } catch (error) {
          console.warn('Failed to delete file from storage:', error);
        }
      }
      
      // Delete message document
      await deleteDoc(messageRef);
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error('Failed to delete message');
  }
};

// Edit a message
export const editMessage = async (messageId: string, newContent: string): Promise<void> => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      content: newContent,
      isEdited: true,
      editedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error editing message:', error);
    throw new Error('Failed to edit message');
  }
};

// Get user by ID (for conversation participants)
export const getUserById = async (userId: string): Promise<any> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log(`getUserById for ${userId}:`, {
        id: userDoc.id,
        company: userData.company,
        companyLogo: userData.companyLogo,
        avatar: userData.avatar,
        allKeys: Object.keys(userData)
      });
      return { id: userDoc.id, ...userData };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error('Failed to get user');
  }
};

// Get total unread message count for a user
export const getTotalUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    let totalUnreadCount = 0;
    
    querySnapshot.forEach((doc) => {
      const conversation = doc.data() as Conversation;
      const userUnreadCount = conversation.unreadCount[userId] || 0;
      totalUnreadCount += userUnreadCount;
    });
    
    return totalUnreadCount;
  } catch (error) {
    console.error('Error getting total unread message count:', error);
    return 0;
  }
};

// Listen to total unread message count for a user
export const listenToTotalUnreadMessageCount = (
  userId: string,
  callback: (count: number) => void
): (() => void) => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    let totalUnreadCount = 0;
    snapshot.forEach((doc) => {
      const conversation = doc.data() as Conversation;
      const userUnreadCount = conversation.unreadCount[userId] || 0;
      totalUnreadCount += userUnreadCount;
    });
    callback(totalUnreadCount);
  }, (error) => {
    console.error('Error listening to total unread message count:', error);
    callback(0);
  });
};
