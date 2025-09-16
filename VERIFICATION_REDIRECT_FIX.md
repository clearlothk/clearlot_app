# 驗證郵件跳轉問題修復說明

## 問題描述

用戶註冊後會收到驗證郵件，點擊郵件中的鏈接會打開 Firebase 驗證頁面，顯示「您的電子郵件地址已通過驗證」，但點擊「繼續」按鈕後沒有正確跳轉到市場頁面，而是回到了驗證頁面。

## 問題原因分析

### 1. 狀態同步問題
- **Firebase Auth 狀態**：當用戶點擊驗證鏈接後，Firebase Auth 的 `emailVerified` 立即變為 `true`
- **Firestore 數據**：但 Firestore 中的 `emailVerified` 和 `status` 可能還沒有同步更新
- **AuthContext 檢查**：驗證頁面檢查的是 Firestore 中的 `user.emailVerified`，而不是 Firebase Auth 的狀態

### 2. 跳轉邏輯問題
- 驗證頁面只檢查 Firestore 中的驗證狀態
- 沒有考慮 Firebase Auth 和 Firestore 之間的狀態同步延遲
- 缺少定期檢查機制來處理用戶從 Firebase 驗證頁面返回的情況

## 修復方案

### 1. 修復 `getCurrentUser` 函數
```typescript
// 在 getCurrentUser 中添加狀態同步邏輯
if (user.emailVerified && !userData.emailVerified) {
  console.log('Syncing email verification status from Firebase Auth to Firestore');
  await updateDoc(doc(db, 'users', user.uid), {
    emailVerified: true,
    status: 'active'
  });
  userData.emailVerified = true;
  userData.status = 'active';
}
```

### 2. 改進驗證頁面的狀態檢查
```typescript
// 檢查 Firebase Auth 和 Firestore 兩種狀態
const checkVerificationStatus = async () => {
  if (user) {
    // 檢查 Firebase Auth 狀態
    const firebaseUser = auth.currentUser;
    if (firebaseUser && firebaseUser.emailVerified) {
      console.log('User email verified in Firebase Auth, redirecting to marketplace');
      navigate('/hk');
      return;
    }
    
    // 檢查 Firestore 狀態
    if (user.emailVerified) {
      console.log('User email verified in Firestore, redirecting to marketplace');
      navigate('/hk');
      return;
    }
  }
};
```

### 3. 添加定期檢查機制
```typescript
// 每 2 秒檢查一次驗證狀態
useEffect(() => {
  const checkInterval = setInterval(async () => {
    if (user && !user.emailVerified) {
      const firebaseUser = auth.currentUser;
      if (firebaseUser && firebaseUser.emailVerified) {
        console.log('Periodic check: User email verified in Firebase Auth, redirecting to marketplace');
        navigate('/hk');
      }
    }
  }, 2000);

  return () => clearInterval(checkInterval);
}, [user, navigate]);
```

### 4. 立即跳轉邏輯
```typescript
// 驗證成功後立即跳轉，不等待 3 秒
const handleVerification = async (code: string) => {
  try {
    await handleEmailVerification(code);
    setVerificationStatus('success');
    
    // 立即跳轉到市場頁面
    console.log('Redirecting to marketplace after successful verification');
    navigate('/hk');
  } catch (error) {
    // 錯誤處理
  }
};
```

## 修復效果

### 修復前
1. 用戶點擊驗證鏈接 → Firebase 驗證頁面
2. 點擊「繼續」→ 回到驗證頁面（錯誤）
3. 需要手動刷新或重新登入

### 修復後
1. 用戶點擊驗證鏈接 → Firebase 驗證頁面
2. 點擊「繼續」→ 自動跳轉到市場頁面 ✅
3. 如果沒有立即跳轉，定期檢查機制會在 2 秒內檢測到狀態變化並跳轉

## 技術細節

### 狀態同步機制
- `getCurrentUser` 函數現在會檢查 Firebase Auth 和 Firestore 的狀態差異
- 如果 Firebase Auth 顯示已驗證但 Firestore 未更新，會自動同步狀態

### 多重檢查機制
- 初始載入時檢查
- 定期檢查（每 2 秒）
- 驗證完成後立即檢查

### 錯誤處理
- 保持原有的錯誤處理邏輯
- 添加更詳細的日誌記錄
- 確保用戶體驗的流暢性

## 測試步驟

1. **註冊新用戶**
   - 註冊時應該發送驗證郵件

2. **點擊驗證鏈接**
   - 應該打開 Firebase 驗證頁面
   - 顯示「您的電子郵件地址已通過驗證」

3. **點擊「繼續」按鈕**
   - 應該自動跳轉到市場頁面 `/hk`
   - 不應該回到驗證頁面

4. **檢查狀態同步**
   - Firestore 中的 `emailVerified` 應該為 `true`
   - `status` 應該為 `active`

## 注意事項

- 修復後需要清除瀏覽器緩存以確保新的邏輯生效
- 如果仍有問題，可以檢查控制台日誌來調試
- 定期檢查機制會在用戶離開頁面時自動清理
