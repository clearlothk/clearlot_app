# 🔥 Firebase Storage 規則部署指南

## **問題說明**
您遇到的錯誤 "Firebase Storage: User does not have permission to access" 是因為 Firebase Storage 規則沒有正確配置。這個指南將幫助您部署正確的存儲規則。

---

## **方法 1：使用 Firebase Console（推薦 - 最簡單）**

### **步驟 1：登入 Firebase Console**
1. 打開瀏覽器，前往 [Firebase Console](https://console.firebase.google.com/)
2. 登入您的 Google 帳戶
3. 選擇您的項目 `clearlot-65916`

### **步驟 2：導航到 Storage**
1. 在左側菜單中點擊 **"Storage"**
2. 點擊頂部的 **"Rules"** 標籤
3. 您會看到當前的存儲規則

### **步驟 3：更新存儲規則**
將以下規則複製並貼上到規則編輯器中：

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload and manage their own offer images
    match /offers/{userId}/{fileName} {
      allow read: if true; // 任何人都可以讀取優惠圖片
      allow write: if request.auth != null && request.auth.uid == userId; // 只有登入用戶可以上傳自己的圖片
    }
    
    // Allow users to manage their own profile images
    match /users/{userId}/profile/{fileName} {
      allow read: if true; // 公開讀取
      allow write: if request.auth != null && request.auth.uid == userId; // 只有文件所有者可以寫入
    }
    
    // Allow users to manage their own company logos
    match /users/{userId}/company-logo/{fileName} {
      allow read: if true; // 公開讀取
      allow write: if request.auth != null && request.auth.uid == userId; // 只有文件所有者可以寫入
    }
    
    // Allow users to manage their own general files
    match /users/{userId}/{fileType}/{fileName} {
      allow read: if true; // 公開讀取
      allow write: if request.auth != null && request.auth.uid == userId; // 只有文件所有者可以寫入
    }
    
    // Default rule - deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### **步驟 4：發布規則**
1. 點擊 **"Publish"** 按鈕
2. 等待規則部署完成（通常幾秒鐘）

---

## **方法 2：使用 Firebase CLI**

### **步驟 1：安裝 Firebase CLI**
```bash
npm install -g firebase-tools
```

### **步驟 2：登入 Firebase**
```bash
firebase login
```

### **步驟 3：初始化 Firebase 項目**
```bash
firebase init storage
```

### **步驟 4：部署存儲規則**
```bash
firebase deploy --only storage
```

---

## **規則說明**

### **offer 圖片上傳規則**
```javascript
match /offers/{userId}/{fileName} {
  allow read: if true; // 任何人都可以讀取優惠圖片
  allow write: if request.auth != null && request.auth.uid == userId; // 只有登入用戶可以上傳自己的圖片
}
```

### **用戶文件規則**
```javascript
match /users/{userId}/{fileType}/{fileName} {
  allow read: if true; // 公開讀取
  allow write: if request.auth != null && request.auth.uid == userId; // 只有文件所有者可以寫入
}
```

---

## **驗證規則是否工作**

### **步驟 1：重新測試上傳**
1. 回到您的應用程序
2. 重新嘗試上傳優惠
3. 檢查是否還有權限錯誤

### **步驟 2：檢查控制台**
1. 按 F12 打開開發者工具
2. 點擊 "Console" 標籤
3. 檢查是否還有 "storage/unauthorized" 錯誤

### **步驟 3：測試功能**
1. 上傳圖片
2. 填寫表單
3. 點擊 "發布優惠"
4. 確認成功上傳到 Firestore

---

## **常見問題解決**

### **問題 1：規則部署失敗**
- 檢查規則語法是否正確
- 確保沒有語法錯誤
- 重新嘗試部署

### **問題 2：仍然有權限錯誤**
- 確保用戶已登入
- 檢查用戶 ID 是否正確
- 清除瀏覽器緩存後重試

### **問題 3：圖片路徑問題**
- 確保圖片路徑格式正確：`offers/{userId}/{fileName}`
- 檢查文件名是否包含特殊字符

---

## **完成後的效果**

規則部署完成後：
- ✅ 不再有 "storage/unauthorized" 錯誤
- ✅ 圖片上傳正常工作
- ✅ 優惠可以成功保存到 Firestore
- ✅ 圖片可以正常顯示在市場中

---

## **下一步**

存儲規則部署完成後，您可以：
1. 測試完整的優惠上傳流程
2. 驗證圖片在市場中的顯示
3. 開始正常使用上傳功能
4. 移除調試按鈕（如果不再需要）

如果遇到任何問題，請檢查 Firebase Console 中的錯誤日誌。 