# Firestore 權限錯誤修復說明

## 問題描述

當用戶註冊後點擊驗證郵件鏈接，在新窗口中完成驗證並跳轉到市場頁面時，原始窗口會顯示 Firestore 權限錯誤：

```
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

## 問題原因分析

### 1. 用戶狀態不同步
- **原始窗口**：用戶還沒有登入（`User state: not logged in`）
- **新窗口**：用戶已經通過 Firebase 驗證頁面完成了驗證
- 這導致兩個窗口的用戶狀態不一致

### 2. 通知服務初始化問題
- `NotificationAppWrapper` 檢測到用戶未登入，所以沒有提供通知上下文
- 但 `firestoreNotificationService` 仍然嘗試建立 Firestore 訂閱
- 由於用戶未登入，Firestore 安全規則拒絕了訪問

### 3. Firestore 安全規則限制
通知集合的規則要求用戶必須已登入：
```javascript
match /notifications/{notificationId} {
  allow read, write: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}
```

當用戶未登入時，`request.auth` 為 `null`，導致權限被拒絕。

### 4. 具體錯誤流程
1. 用戶在原始窗口註冊 → 跳轉到驗證頁面
2. 用戶點擊驗證鏈接 → 打開新窗口
3. 新窗口完成驗證 → 跳轉到市場頁面
4. 原始窗口仍然顯示驗證頁面，但用戶狀態未更新
5. 通知服務嘗試建立訂閱 → 權限被拒絕

## 修復方案

### 1. 修改 `firestoreNotificationService.ts`

在 `subscribeToNotifications` 函數中添加認證檢查：

```typescript
// Subscribe to notifications for real-time updates
subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  console.log('🔔 FirestoreNotificationService: Setting up real-time subscription for user:', userId);
  
  // Check if user is authenticated before setting up subscription
  const { auth } = require('../config/firebase');
  if (!auth.currentUser) {
    console.log('⚠️ FirestoreNotificationService: No authenticated user, skipping subscription setup');
    // Return a no-op unsubscribe function
    return () => {};
  }
  
  // ... 其餘代碼保持不變
}
```

在 `getNotifications` 函數中添加認證檢查：

```typescript
// Get notifications for a user
async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
  try {
    console.log('🔍 FirestoreNotificationService: Getting notifications for user:', userId);
    
    // Check if user is authenticated before querying
    const { auth } = require('../config/firebase');
    if (!auth.currentUser) {
      console.log('⚠️ FirestoreNotificationService: No authenticated user, returning empty notifications');
      return [];
    }
    
    // ... 其餘代碼保持不變
  }
}
```

### 2. 修復效果

**修復前**：
- 通知服務嘗試在用戶未登入時建立 Firestore 訂閱
- Firestore 安全規則拒絕訪問
- 控制台顯示權限錯誤

**修復後**：
- 通知服務檢查用戶認證狀態
- 如果用戶未登入，跳過訂閱設置
- 不再出現權限錯誤

## 技術細節

### 認證檢查邏輯
```typescript
const { auth } = require('../config/firebase');
if (!auth.currentUser) {
  // 用戶未登入，跳過操作
  return;
}
```

### 安全規則說明
Firestore 安全規則確保只有已認證的用戶才能訪問自己的通知：
```javascript
allow read, write: if request.auth != null && 
  resource.data.userId == request.auth.uid;
```

### 錯誤處理
- 當用戶未登入時，返回空數組而不是拋出錯誤
- 提供清晰的日誌信息來幫助調試

## 測試步驟

1. **註冊新用戶**
   - 在原始窗口註冊
   - 應該跳轉到驗證頁面

2. **點擊驗證鏈接**
   - 應該打開新窗口
   - 完成驗證並跳轉到市場頁面

3. **檢查原始窗口**
   - 不應該再出現權限錯誤
   - 控制台應該顯示 "No authenticated user, skipping subscription setup"

4. **檢查新窗口**
   - 應該正常顯示通知
   - 沒有權限錯誤

## 注意事項

- 修復後需要清除瀏覽器緩存以確保新的邏輯生效
- 這個修復不會影響已登入用戶的正常功能
- 權限錯誤只會在用戶未登入時出現，現在會被優雅地處理

## 相關文件

- `src/services/firestoreNotificationService.ts` - 主要修復文件
- `firestore.rules` - Firestore 安全規則
- `src/contexts/NotificationContext.tsx` - 通知上下文
- `src/components/NotificationAppWrapper.tsx` - 通知應用包裝器
