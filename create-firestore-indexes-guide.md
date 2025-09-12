# 🔥 Firestore 索引創建指南

## **問題說明**
您遇到的錯誤 "The query requires an index" 是因為 Firestore 需要複合索引來支持複雜查詢。這個指南將幫助您創建所有必要的索引。

---

## **方法 1：使用 Firebase Console（推薦 - 最簡單）**

### **步驟 1：登入 Firebase Console**
1. 打開瀏覽器，前往 [Firebase Console](https://console.firebase.google.com/)
2. 登入您的 Google 帳戶
3. 選擇您的項目 `clearlot-65916`

### **步驟 2：導航到 Firestore**
1. 在左側菜單中點擊 **"Firestore Database"**
2. 點擊頂部的 **"Indexes"** 標籤
3. 您會看到現有的索引列表

### **步驟 3：創建索引**

點擊 **"Create Index"** 按鈕，然後按照以下順序創建索引：

#### **索引 1：按類別和創建時間**
- **Collection ID**: `offers`
- **Fields**:
  - 點擊 **"Add field"**
  - Field path: `category`
  - Order: **Ascending**
  - 點擊 **"Add field"**
  - Field path: `createdAt`
  - Order: **Descending**
- 點擊 **"Create index"**

#### **索引 2：按地點和創建時間**
- **Collection ID**: `offers`
- **Fields**:
  - Field path: `location`
  - Order: **Ascending**
  - Field path: `createdAt`
  - Order: **Descending**
- 點擊 **"Create index"**

#### **索引 3：按認證狀態和創建時間**
- **Collection ID**: `offers`
- **Fields**:
  - Field path: `supplier.isVerified`
  - Order: **Ascending**
  - Field path: `createdAt`
  - Order: **Descending**
- 點擊 **"Create index"**

#### **索引 4：按類別、地點和創建時間**
- **Collection ID**: `offers`
- **Fields**:
  - Field path: `category`
  - Order: **Ascending**
  - Field path: `location`
  - Order: **Ascending**
  - Field path: `createdAt`
  - Order: **Descending**
- 點擊 **"Create index"**

#### **索引 5：按類別、認證狀態和創建時間**
- **Collection ID**: `offers`
- **Fields**:
  - Field path: `category`
  - Order: **Ascending**
  - Field path: `supplier.isVerified`
  - Order: **Ascending**
  - Field path: `createdAt`
  - Order: **Descending**
- 點擊 **"Create index"**

#### **索引 6：按地點、認證狀態和創建時間**
- **Collection ID**: `offers`
- **Fields**:
  - Field path: `location`
  - Order: **Ascending**
  - Field path: `supplier.isVerified`
  - Order: **Ascending**
  - Field path: `createdAt`
  - Order: **Descending**
- 點擊 **"Create index"**

#### **索引 7：按類別、地點、認證狀態和創建時間**
- **Collection ID**: `offers`
- **Fields**:
  - Field path: `category`
  - Order: **Ascending**
  - Field path: `location`
  - Order: **Ascending**
  - Field path: `supplier.isVerified`
  - Order: **Ascending**
  - Field path: `createdAt`
  - Order: **Descending**
- 點擊 **"Create index"**

#### **索引 8：按供應商ID和創建時間**
- **Collection ID**: `offers`
- **Fields**:
  - Field path: `supplierId`
  - Order: **Ascending**
  - Field path: `createdAt`
  - Order: **Descending**
- 點擊 **"Create index"**

### **步驟 4：等待索引創建完成**
- 索引創建需要時間，您可以在 "Indexes" 頁面查看狀態
- **單字段索引**：通常幾秒鐘內完成
- **複合索引**：可能需要幾分鐘到幾小時
- 狀態會顯示為 "Building" 然後變為 "Enabled"

---

## **方法 2：使用 Firebase CLI（高級用戶）**

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
firebase init firestore
```
- 選擇您的項目 `clearlot-65916`
- 選擇使用現有的 `firestore.rules` 和 `firestore.indexes.json`

### **步驟 4：部署索引**
```bash
firebase deploy --only firestore:indexes
```

---

## **驗證索引是否工作**

### **步驟 1：重新加載應用程序**
1. 回到您的應用程序頁面
2. 按 **F5** 或 **Ctrl+R** 重新加載頁面

### **步驟 2：檢查控制台**
1. 按 **F12** 打開開發者工具
2. 點擊 **"Console"** 標籤
3. 檢查是否還有 "The query requires an index" 錯誤

### **步驟 3：測試功能**
1. 嘗試按類別過濾優惠
2. 嘗試按地點過濾優惠
3. 嘗試搜索優惠
4. 確認所有功能正常工作

---

## **索引狀態說明**

在 Firebase Console 的 "Indexes" 頁面，您會看到以下狀態：

- **Building**: 索引正在創建中
- **Enabled**: 索引已創建完成，可以使用
- **Error**: 索引創建失敗，需要檢查錯誤

---

## **常見問題解決**

### **問題 1：索引創建失敗**
- 檢查字段名稱是否正確
- 確保 Collection ID 是 `offers`
- 重新嘗試創建索引

### **問題 2：索引創建時間過長**
- 這是正常的，複雜索引需要時間
- 可以繼續使用應用程序，客戶端過濾會暫時處理

### **問題 3：仍然有錯誤**
- 確保所有 8 個索引都已創建
- 檢查索引狀態是否為 "Enabled"
- 清除瀏覽器緩存後重試

---

## **完成後的效果**

索引創建完成後：
- ✅ 不再有 "The query requires an index" 錯誤
- ✅ 過濾功能正常工作
- ✅ 搜索功能正常工作
- ✅ 優惠列表正常顯示
- ✅ 應用程序性能提升

---

## **下一步**

索引創建完成後，您可以：
1. 測試上傳新優惠功能
2. 測試搜索和過濾功能
3. 監控應用程序性能
4. 開始正常使用應用程序

如果遇到任何問題，請檢查 Firebase Console 中的錯誤日誌或聯繫支持。 