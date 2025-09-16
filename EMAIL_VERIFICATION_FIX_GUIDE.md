# 電子郵件驗證修復指南

## 問題分析

根據您提供的截圖和代碼檢查，發現以下問題：

### 1. Firebase 控制台設置問題
- Firebase 驗證郵件模板已正確設置為中文
- 但郵件中的鏈接可能指向錯誤的域名

### 2. 代碼修復已完成
- ✅ 修復了 `firebaseService.ts` 中的語法錯誤
- ✅ 添加了正確的 `sendEmailVerification` 配置
- ✅ 設置了正確的重定向 URL
- ✅ 添加了調試函數

## 需要手動修復的 Firebase 設置

### 步驟 1: 更新 Firebase 驗證郵件模板

1. 登入 Firebase 控制台
2. 前往 **Authentication** > **Templates**
3. 選擇 **Email address verification**
4. 在郵件模板中，將鏈接改為：
   ```
   https://localhost:5173/hk/verify-email?mode=verifyEmail&oobCode=%LINK%
   ```
   或者如果是生產環境：
   ```
   https://yourdomain.com/hk/verify-email?mode=verifyEmail&oobCode=%LINK%
   ```

### 步驟 2: 設置授權域名

1. 在 Firebase 控制台前往 **Authentication** > **Settings**
2. 在 **Authorized domains** 中添加：
   - `localhost` (用於開發)
   - 您的生產域名

### 步驟 3: 檢查 SMTP 設置

1. 在 **Authentication** > **Templates** > **SMTP settings**
2. 確保使用正確的發件人設置：
   - Sender name: ClearLot
   - From: noreply@clearlot.app
   - Reply to: noreply@clearlot.app

## 代碼修復說明

### 1. 註冊流程修復
```typescript
// 現在發送驗證郵件時會包含正確的重定向 URL
await sendEmailVerification(user, {
  url: `${window.location.origin}/hk/verify-email`,
  handleCodeInApp: true
});
```

### 2. 驗證處理修復
- 修復了 `actionCodeInfo.data.uid` 錯誤
- 改為通過郵箱查找用戶 ID
- 正確更新 Firestore 中的用戶狀態

### 3. 調試功能
添加了 `debugEmailVerification()` 函數來幫助調試：
- 顯示用戶狀態
- 檢查 Firestore 數據
- 顯示當前 URL 和預期 URL

## 測試步驟

1. **註冊新用戶**
   - 註冊時應該會發送驗證郵件
   - 檢查控制台日誌確認郵件發送成功

2. **檢查驗證郵件**
   - 查看郵件中的鏈接格式
   - 點擊鏈接應該跳轉到 `/hk/verify-email?mode=verifyEmail&oobCode=...`

3. **驗證流程**
   - 點擊鏈接後應該自動驗證用戶
   - 用戶狀態應該從 `pending_verification` 變為 `active`
   - 發送歡迎通知

## 常見問題解決

### 問題 1: 沒有收到驗證郵件
- 檢查垃圾郵件文件夾
- 確認 Firebase SMTP 設置正確
- 檢查授權域名設置

### 問題 2: 驗證鏈接無效
- 確認 Firebase 模板中的鏈接格式正確
- 檢查授權域名是否包含當前域名

### 問題 3: 驗證後狀態未更新
- 檢查 Firestore 規則是否允許更新
- 查看控制台錯誤日誌

## 下一步

1. 按照上述步驟修復 Firebase 控制台設置
2. 測試完整的註冊和驗證流程
3. 如果仍有問題，使用調試函數檢查詳細信息
