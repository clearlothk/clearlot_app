# ClearLot 通知系統

## 概述

ClearLot 通知系統是一個全面的實時通知平台，為用戶提供訂單狀態更新、價格下降提醒、購買通知等服務。

## 主要功能

### 1. 訂單狀態變更通知
- **買家通知**：當訂單狀態改變時（待付款→已付款→已發貨→已送達→已完成）
- **賣家通知**：當收到新訂單、付款確認、發貨狀態更新等
- **實時監控**：使用 Firestore 的 `onSnapshot` 實現實時狀態監控

### 2. 價格下降提醒
- **Watchlist 監控**：自動監控用戶願望清單中商品的價格變化
- **智能閾值**：可配置的價格下降閾值（默認 5%）
- **批量通知**：當價格下降時，通知所有將該商品加入願望清單的用戶

### 3. 購買通知
- **新訂單提醒**：賣家收到新訂單時立即通知
- **訂單詳情**：包含買家信息、訂單金額、商品標題等

### 4. 系統通知
- **歡迎消息**：新用戶註冊後的歡迎通知
- **系統更新**：重要系統變更和維護通知

## 技術架構

### 服務層
1. **`notificationService.ts`** - 核心通知觸發服務
2. **`firestoreNotificationService.ts`** - Firestore 數據持久化服務
3. **`orderNotificationService.ts`** - 訂單相關通知服務
4. **`priceMonitoringService.ts`** - 價格監控服務

### 數據層
- **Firestore Collections**：
  - `notifications` - 存儲所有通知
  - `purchases` - 訂單數據
  - `offers` - 優惠商品數據
  - `watchlist` - 用戶願望清單

### 前端組件
- **`NotificationContext.tsx`** - React Context 提供者
- **`NotificationsPage.tsx`** - 通知頁面
- **`NotificationDropdown.tsx`** - 通知下拉菜單

## 通知類型

| 類型 | 描述 | 優先級 | 觸發條件 |
|------|------|--------|----------|
| `order_status` | 訂單狀態變更 | 高/中 | 訂單狀態改變 |
| `price_drop` | 價格下降提醒 | 中 | 商品價格下降 ≥5% |
| `offer_purchased` | 新訂單通知 | 高 | 賣家收到新訂單 |
| `system` | 系統通知 | 低 | 系統事件 |
| `purchase` | 購買成功 | 高 | 購買完成 |
| `payment` | 付款通知 | 中 | 付款狀態更新 |

## 使用方法

### 1. 基本通知觸發

```typescript
import { notificationService } from '../services/notificationService';

// 觸發訂單狀態變更通知
notificationService.triggerOrderStatusChange(
  userId, 
  offerTitle, 
  status, 
  purchaseId, 
  offerId
);

// 觸發價格下降通知
notificationService.triggerPriceDrop(
  userId, 
  offerTitle, 
  percentage, 
  offerId, 
  previousPrice, 
  newPrice
);
```

### 2. 設置訂單監控

```typescript
import { orderNotificationService } from '../services/orderNotificationService';

// 監控特定訂單
const unsubscribe = orderNotificationService.setupOrderStatusMonitoring(purchaseId);

// 監控用戶所有訂單
const unsubscribe = orderNotificationService.setupUserOrderMonitoring(userId, 'buyer');

// 清理監控
unsubscribe();
```

### 3. 設置價格監控

```typescript
import { priceMonitoringService } from '../services/priceMonitoringService';

// 監控特定商品
const unsubscribe = priceMonitoringService.setupOfferPriceMonitoring(offerId);

// 監控用戶願望清單
await priceMonitoringService.monitorUserWatchlist(userId);

// 設置價格變化閾值
priceMonitoringService.setPriceChangeThreshold(0.1); // 10%
```

### 4. 在 React 組件中使用

```typescript
import { useNotifications } from '../contexts/NotificationContext';

function MyComponent() {
  const { 
    notifications, 
    unreadCount, 
    addNotification, 
    markAsRead 
  } = useNotifications();

  // 添加自定義通知
  const handleCustomNotification = () => {
    addNotification({
      userId: 'user123',
      type: 'system',
      title: '自定義通知',
      message: '這是一個自定義通知',
      isRead: false,
      priority: 'medium'
    });
  };

  return (
    <div>
      <p>未讀通知: {unreadCount}</p>
      <button onClick={handleCustomNotification}>
        發送通知
      </button>
    </div>
  );
}
```

## 配置選項

### 價格監控配置
```typescript
// 設置價格變化閾值（0.05 = 5%）
priceMonitoringService.setPriceChangeThreshold(0.05);

// 獲取當前閾值
const threshold = priceMonitoringService.getPriceChangeThreshold();
```

### 通知優先級
- **`high`**：重要通知，如訂單完成、價格大幅下降
- **`medium`**：一般通知，如訂單狀態更新、價格下降
- **`low`**：低優先級通知，如系統消息、歡迎通知

## 數據結構

### Notification 接口
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'purchase' | 'sale' | 'payment' | 'offer' | 'system' | 'watchlist' | 'order_status' | 'price_drop' | 'offer_purchased';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    offerId?: string;
    purchaseId?: string;
    amount?: number;
    actionUrl?: string;
    status?: string;
    previousPrice?: number;
    newPrice?: number;
    percentage?: number;
  };
  priority: 'low' | 'medium' | 'high';
}
```

## 性能優化

### 1. 實時監控優化
- 使用 Firestore 的 `onSnapshot` 實現實時更新
- 智能清理不需要的監聽器
- 批量處理多個訂單的監控

### 2. 數據清理
- 自動清理 30 天前的舊通知
- 定期清理價格歷史數據
- 智能過濾和分頁

### 3. 緩存策略
- 本地狀態管理減少重複請求
- 智能更新避免不必要的重新渲染
- 批量操作減少 API 調用

## 錯誤處理

### 1. 網絡錯誤
- 自動重試機制
- 離線狀態處理
- 錯誤回退到本地狀態

### 2. 權限錯誤
- 用戶權限檢查
- 管理員權限驗證
- 安全規則配置

### 3. 數據驗證
- 輸入數據驗證
- 類型檢查
- 邊界條件處理

## 部署注意事項

### 1. Firestore 規則
```firestore
match /notifications/{notificationId} {
  allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
  allow read: if isAdmin();
}
```

### 2. 索引配置
- `notifications` 集合：`userId` + `createdAt` (降序)
- `notifications` 集合：`userId` + `isRead` + `createdAt` (降序)

### 3. 環境變量
```env
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_API_KEY=your-api-key
```

## 測試

### 1. 單元測試
```bash
npm test -- --testPathPattern=notification
```

### 2. 集成測試
```bash
npm run test:integration
```

### 3. 手動測試
- 創建測試訂單
- 修改訂單狀態
- 調整商品價格
- 檢查通知觸發

## 故障排除

### 常見問題

1. **通知不顯示**
   - 檢查 Firestore 連接
   - 驗證用戶權限
   - 檢查通知上下文是否正確提供

2. **實時更新不工作**
   - 檢查 Firestore 規則
   - 驗證 `onSnapshot` 監聽器
   - 檢查網絡連接

3. **價格監控失效**
   - 檢查商品數據結構
   - 驗證價格字段格式
   - 檢查監控服務狀態

### 調試工具

```typescript
// 啟用詳細日誌
console.log('Notification Debug:', {
  notifications,
  unreadCount,
  userId
});

// 檢查 Firestore 連接
console.log('Firestore Status:', db);
```

## 未來改進

### 1. 功能增強
- 推送通知支持
- 電子郵件通知
- 短信通知
- 通知偏好設置

### 2. 性能優化
- 虛擬滾動
- 懶加載
- 智能緩存
- 離線支持

### 3. 用戶體驗
- 通知分類
- 自定義過濾器
- 批量操作
- 通知歷史

## 貢獻指南

1. Fork 項目
2. 創建功能分支
3. 提交更改
4. 創建 Pull Request

## 許可證

MIT License 