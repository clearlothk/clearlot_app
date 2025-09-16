# 首次登入歡迎通知修復說明

## 問題描述

用戶註冊並驗證郵件後，成功進入市場頁面，但沒有收到首次登入的歡迎通知。

## 問題原因分析

### 1. 通知發送時機問題
- **註冊時**：只發送了驗證郵件的通知
- **驗證成功時**：在 `handleEmailVerification` 函數中發送歡迎通知
- **但是**：當用戶通過 Firebase 驗證頁面點擊「繼續」後，直接跳轉到市場頁面，沒有觸發 `handleEmailVerification` 函數

### 2. 狀態同步問題
- Firebase Auth 的 `emailVerified` 狀態已經更新
- 但 Firestore 中的狀態可能還沒有同步
- 歡迎通知的發送依賴於狀態同步

## 修復方案

### 1. 在 `getCurrentUser` 函數中添加歡迎通知邏輯
```typescript
// 當 Firebase Auth 和 Firestore 狀態同步時，發送歡迎通知
if (user.emailVerified && !userData.emailVerified) {
  console.log('Syncing email verification status from Firebase Auth to Firestore');
  await updateDoc(doc(db, 'users', user.uid), {
    emailVerified: true,
    status: 'active'
  });
  userData.emailVerified = true;
  userData.status = 'active';
  
  // Send welcome notification for newly verified users
  try {
    console.log('Sending welcome notification for newly verified user');
    await firestoreNotificationService.addNotification({
      userId: user.uid,
      type: 'system',
      title: '歡迎來到 ClearLot！🎉',
      message: '您的電子郵件已成功驗證！現在可以開始探索優惠商品並與供應商建立聯繫。',
      isRead: false,
      priority: 'high'
    });
    console.log('Welcome notification sent for newly verified user');
  } catch (notificationError) {
    console.log('Could not send welcome notification for newly verified user:', notificationError);
  }
}
```

### 2. 在 `loginUser` 函數中添加首次登入歡迎通知
```typescript
// 當用戶首次登入且狀態從 pending_verification 變為 active 時
if (userData.status === 'pending_verification') {
  try {
    await updateDoc(doc(db, 'users', user.uid), {
      emailVerified: true,
      status: 'active'
    });
    userData.emailVerified = true;
    userData.status = 'active';
    
    // Send welcome notification for first-time login after verification
    try {
      console.log('Sending welcome notification for first-time login');
      await firestoreNotificationService.addNotification({
        userId: user.uid,
        type: 'system',
        title: '歡迎來到 ClearLot！🎉',
        message: '您的電子郵件已成功驗證！現在可以開始探索優惠商品並與供應商建立聯繫。',
        isRead: false,
        priority: 'high'
      });
      console.log('Welcome notification sent for first-time login');
    } catch (notificationError) {
      console.log('Could not send welcome notification for first-time login:', notificationError);
    }
  } catch (updateError) {
    console.error('Failed to update user status:', updateError);
  }
}
```

### 3. 添加調試函數
```typescript
// 新增 debugWelcomeNotification 函數來幫助調試
export const debugWelcomeNotification = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }

    console.log('🔍 Welcome Notification Debug Info:');
    console.log('- User ID:', user.uid);
    console.log('- Email:', user.email);
    console.log('- Firebase Auth emailVerified:', user.emailVerified);

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('- Firestore emailVerified:', userData.emailVerified);
      console.log('- Firestore status:', userData.status);
      console.log('- Joined Date:', userData.joinedDate);
      
      // Check if user should receive welcome notification
      const shouldSendWelcome = user.emailVerified && userData.emailVerified && userData.status === 'active';
      console.log('- Should send welcome notification:', shouldSendWelcome);
      
      if (shouldSendWelcome) {
        console.log('✅ User is verified and active - welcome notification should be sent');
      } else {
        console.log('❌ User is not ready for welcome notification');
      }
    } else {
      console.log('❌ User not found in Firestore');
    }
  } catch (error) {
    console.error('Debug welcome notification error:', error);
  }
};
```

## 修復效果

### 修復前
1. 用戶註冊 → 收到驗證郵件通知
2. 用戶點擊驗證鏈接 → Firebase 驗證頁面
3. 點擊「繼續」→ 跳轉到市場頁面
4. **沒有收到歡迎通知** ❌

### 修復後
1. 用戶註冊 → 收到驗證郵件通知
2. 用戶點擊驗證鏈接 → Firebase 驗證頁面
3. 點擊「繼續」→ 跳轉到市場頁面
4. **自動發送歡迎通知** ✅

## 多重保障機制

### 1. 狀態同步時發送
- 當 `getCurrentUser` 檢測到 Firebase Auth 和 Firestore 狀態不同步時
- 自動同步狀態並發送歡迎通知

### 2. 首次登入時發送
- 當用戶首次登入且狀態從 `pending_verification` 變為 `active` 時
- 發送歡迎通知

### 3. 驗證完成時發送
- 當用戶通過 `handleEmailVerification` 函數完成驗證時
- 發送歡迎通知

## 測試步驟

1. **註冊新用戶**
   - 註冊時應該收到驗證郵件通知

2. **點擊驗證鏈接**
   - 應該打開 Firebase 驗證頁面

3. **點擊「繼續」按鈕**
   - 應該跳轉到市場頁面
   - 應該收到歡迎通知

4. **檢查通知**
   - 通知標題：「歡迎來到 ClearLot！🎉」
   - 通知內容：「您的電子郵件已成功驗證！現在可以開始探索優惠商品並與供應商建立聯繫。」

## 調試功能

### 使用調試函數
在瀏覽器控制台中調用：
```javascript
// 調試歡迎通知狀態
debugWelcomeNotification();
```

### 檢查控制台日誌
- 查看是否有 "Sending welcome notification for newly verified user" 日誌
- 查看是否有 "Welcome notification sent for newly verified user" 日誌
- 查看是否有任何錯誤日誌

## 注意事項

- 修復後需要清除瀏覽器緩存以確保新的邏輯生效
- 如果仍有問題，可以使用調試函數檢查狀態
- 歡迎通知只會在用戶首次完成驗證時發送一次
- 通知會顯示在應用程式的通知面板中
