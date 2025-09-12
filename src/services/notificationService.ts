import { Notification } from '../types';

// Notification service for triggering notifications across the app
class NotificationService {
  private listeners: Array<(notification: Omit<Notification, 'id' | 'createdAt'>) => void> = [];

  // Subscribe to notifications
  subscribe(listener: (notification: Omit<Notification, 'id' | 'createdAt'>) => void) {
    console.log('📝 Adding notification listener. Total listeners:', this.listeners.length + 1);
    this.listeners.push(listener);
    return () => {
      console.log('🗑️ Removing notification listener. Remaining listeners:', this.listeners.length - 1);
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Trigger a notification
  trigger(notification: Notification | Omit<Notification, 'id' | 'createdAt'>) {
    console.log('🚀 NotificationService.trigger called with:', notification);
    console.log('👥 Number of listeners:', this.listeners.length);
    this.listeners.forEach((listener, index) => {
      console.log(`📡 Calling listener ${index + 1}`);
      try {
        listener(notification);
        console.log(`✅ Listener ${index + 1} called successfully`);
      } catch (error) {
        console.error(`❌ Error calling listener ${index + 1}:`, error);
      }
    });
  }

  // Helper methods for common notification types
  triggerPurchaseSuccess(userId: string, offerTitle: string, amount: number, offerId: string, purchaseId: string) {
    this.trigger({
      userId,
      type: 'purchase',
      title: '購買成功！',
      message: `您已成功購買 "${offerTitle}"。`,
      isRead: false,
      data: {
        offerId,
        purchaseId,
        amount
      },
      priority: 'high'
    });
  }

  triggerPaymentReceived(userId: string, amount: number, offerTitle: string) {
    this.trigger({
      userId,
      type: 'payment',
      title: '收到付款',
      message: `您的商品 "${offerTitle}" 已收到 HKD ${amount.toFixed(2)} 的付款。`,
      isRead: false,
      data: {
        amount
      },
      priority: 'medium'
    });
  }

  triggerWatchlistAdded(userId: string, offerTitle: string, offerId: string) {
    this.trigger({
      userId,
      type: 'watchlist',
      title: '已加入願望清單',
      message: `"${offerTitle}" 已加入您的願望清單。`,
      isRead: false,
      data: {
        offerId
      },
      priority: 'low'
    });
  }

  triggerPriceDrop(userId: string, offerTitle: string, percentage: number, offerId: string, previousPrice: number, newPrice: number) {
    this.trigger({
      userId,
      type: 'price_drop',
      title: '價格下降提醒！🎉',
      message: `"${offerTitle}" 的價格已從 HKD ${previousPrice.toFixed(2)} 降至 HKD ${newPrice.toFixed(2)}（${percentage}% 折扣）！`,
      isRead: false,
      data: {
        offerId,
        previousPrice,
        newPrice,
        percentage
      },
      priority: 'medium'
    });
  }

  // Order status change notifications
  triggerOrderStatusChange(userId: string, offerTitle: string, status: string, purchaseId: string, offerId: string) {
    const statusMessages = {
      'pending': '您的訂單正在等待付款審核',
      'approved': '您的付款已獲批准！',
      'shipped': '您的訂單已發貨！',
      'delivered': '您的訂單已送達！',
      'completed': '您的訂單已完成！'
    };

    const statusEmojis = {
      'pending': '⏳',
      'approved': '✅',
      'shipped': '📦',
      'delivered': '🎯',
      'completed': '🎉'
    };

    this.trigger({
      userId,
      type: 'order_status',
      title: `訂單狀態：${status.charAt(0).toUpperCase() + status.slice(1)} ${statusEmojis[status] || '📋'}`,
      message: `${statusMessages[status] || '您的訂單狀態已更新'} "${offerTitle}"。`,
      isRead: false,
      data: {
        offerId,
        purchaseId,
        status,
        actionUrl: `/hk/${userId}/my-orders`
      },
      priority: status === 'delivered' || status === 'completed' ? 'high' : 'medium'
    });
  }

  // Offer purchased notification (for sellers)
  triggerOfferPurchased(userId: string, offerTitle: string, buyerCompany: string, amount: number, offerId: string, purchaseId: string) {
    this.trigger({
      userId,
      type: 'offer_purchased',
      title: '收到新訂單！🎉',
      message: `${buyerCompany} 已購買 "${offerTitle}"，金額為 HKD ${amount.toFixed(2)}。`,
      isRead: false,
      data: {
        offerId,
        purchaseId,
        amount,
        actionUrl: `/hk/${userId}/my-orders`
      },
      priority: 'high'
    });
  }

  triggerSystemMessage(userId: string, title: string, message: string) {
    this.trigger({
      userId,
      type: 'system',
      title,
      message,
      isRead: false,
      priority: 'low'
    });
  }

  triggerNewOffer(userId: string, offerTitle: string, offerId: string) {
    this.trigger({
      userId,
      type: 'offer',
      title: '新優惠商品',
      message: `您感興趣的類別中有一項新優惠 "${offerTitle}" 現已上架。`,
      isRead: false,
      data: {
        offerId
      },
      priority: 'medium'
    });
  }

  // User account status change notifications
  triggerAccountStatusChange(userId: string, status: 'active' | 'inactive' | 'suspended' | 'pending') {
    const statusMessages = {
      'active': '您的帳戶已激活，現在可以正常使用所有功能。',
      'inactive': '您的帳戶已被停用，請聯繫管理員了解詳情。',
      'suspended': '您的帳戶已被暫停，請聯繫管理員了解詳情。',
      'pending': '您的帳戶正在等待審核，請耐心等待。'
    };

    const statusEmojis = {
      'active': '✅',
      'inactive': '❌',
      'suspended': '⚠️',
      'pending': '⏳'
    };

    this.trigger({
      userId,
      type: 'account_status',
      title: `帳戶狀態：${status.charAt(0).toUpperCase() + status.slice(1)} ${statusEmojis[status] || '📋'}`,
      message: statusMessages[status] || '您的帳戶狀態已更新。',
      isRead: false,
      data: {
        status,
        actionUrl: `/hk/${userId}/company-settings`
      },
      priority: 'high'
    });
  }

  // User verification status change notifications
  triggerVerificationStatusChange(userId: string, status: 'approved' | 'rejected' | 'pending' | 'not_submitted') {
    console.log('🔔 Triggering verification status change notification:', { userId, status });
    console.log('🔍 NotificationService.triggerVerificationStatusChange called with:');
    console.log('  - userId:', userId);
    console.log('  - status:', status);
    console.log('  - timestamp:', new Date().toISOString());
    
    const statusMessages = {
      'approved': '恭喜！您的公司認證已獲批准，現在可以享受認證賣家的所有權益。',
      'rejected': '您的公司認證申請被拒絕，請檢查文件並重新提交。',
      'pending': '您的公司認證申請正在審核中，請耐心等待。',
      'not_submitted': '請提交公司認證文件以獲得認證賣家權益。'
    };

    const statusEmojis = {
      'approved': '🎉',
      'rejected': '❌',
      'pending': '⏳',
      'not_submitted': '📝'
    };

    const notification = {
      userId,
      type: 'verification_status' as const,
      title: `認證狀態：${status.charAt(0).toUpperCase() + status.slice(1)} ${statusEmojis[status] || '📋'}`,
      message: statusMessages[status] || '您的認證狀態已更新。',
      isRead: false,
      data: {
        status,
        actionUrl: `/hk/${userId}/company-settings`
      },
      priority: 'high' as const
    };

    console.log('📧 Notification payload created:', notification);
    console.log('📧 Notification details:');
    console.log('  - Title:', notification.title);
    console.log('  - Message:', notification.message);
    console.log('  - Type:', notification.type);
    console.log('  - Priority:', notification.priority);
    console.log('  - Action URL:', notification.data.actionUrl);
    
    console.log('🚀 Calling this.trigger()...');
    this.trigger(notification);
    console.log('✅ this.trigger() completed');
  }

  // Offer sales status notifications (for sellers)
  triggerOfferSalesStatusChange(userId: string, offerTitle: string, status: string, purchaseId: string, offerId: string, buyerCompany?: string) {
    const statusMessages = {
      'pending': `新訂單：${buyerCompany || '買家'} 已購買 "${offerTitle}"，等待付款審核。`,
      'approved': `付款已獲批准：${buyerCompany || '買家'} 的訂單 "${offerTitle}" 已確認付款。`,
      'shipped': `訂單已發貨：${buyerCompany || '買家'} 的訂單 "${offerTitle}" 已發貨。`,
      'delivered': `訂單已送達：${buyerCompany || '買家'} 的訂單 "${offerTitle}" 已送達。`,
      'completed': `訂單已完成：${buyerCompany || '買家'} 的訂單 "${offerTitle}" 已完成。`
    };

    const statusEmojis = {
      'pending': '🆕',
      'approved': '💰',
      'shipped': '📦',
      'delivered': '🎯',
      'completed': '🎉'
    };

    this.trigger({
      userId,
      type: 'offer_sales_status',
      title: `銷售狀態：${status.charAt(0).toUpperCase() + status.slice(1)} ${statusEmojis[status] || '📋'}`,
      message: statusMessages[status] || '您的優惠銷售狀態已更新。',
      isRead: false,
      data: {
        offerId,
        purchaseId,
        status,
        buyerCompany,
        actionUrl: `/hk/${userId}/my-orders`
      },
      priority: status === 'pending' || status === 'completed' ? 'high' : 'medium'
    });
  }

  // Message notifications
  triggerNewMessage(userId: string, senderName: string, senderCompany: string, messageContent: string, conversationId: string, messageId: string, senderId: string) {
    // Truncate message content if too long
    const truncatedContent = messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent;
    
    this.trigger({
      userId,
      type: 'message',
      title: `新訊息來自 ${senderCompany}`,
      message: `${senderName}: ${truncatedContent}`,
      isRead: false,
      data: {
        conversationId,
        messageId,
        senderId,
        senderName,
        senderCompany,
        actionUrl: `/hk/messages?conversation=${conversationId}`
      },
      priority: 'medium'
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService(); 