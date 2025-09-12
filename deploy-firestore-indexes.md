# Firestore 索引部署指南

## 🔥 **解決 Firestore 索引問題**

您遇到的錯誤 "The query requires an index" 是因為 Firestore 需要複合索引來支持複雜查詢。以下是解決方案：

### **方法 1：使用 Firebase CLI（推薦）**

#### **1. 安裝 Firebase CLI**
```bash
npm install -g firebase-tools
```

#### **2. 登入 Firebase**
```bash
firebase login
```

#### **3. 初始化 Firebase 項目**
```bash
firebase init firestore
```

#### **4. 部署索引**
```bash
firebase deploy --only firestore:indexes
```

### **方法 2：使用 Firebase Console（網頁界面）**

#### **1. 登入 Firebase Console**
- 前往 [Firebase Console](https://console.firebase.google.com/)
- 選擇您的項目 `clearlot-65916`

#### **2. 導航到 Firestore**
- 點擊左側菜單中的 "Firestore Database"
- 點擊 "Indexes" 標籤

#### **3. 創建必要的索引**

點擊 "Create Index" 按鈕，然後創建以下索引：

##### **索引 1：按類別和創建時間**
- Collection ID: `offers`
- Fields:
  - `category` (Ascending)
  - `createdAt` (Descending)

##### **索引 2：按地點和創建時間**
- Collection ID: `offers`
- Fields:
  - `location` (Ascending)
  - `createdAt` (Descending)

##### **索引 3：按認證狀態和創建時間**
- Collection ID: `offers`
- Fields:
  - `supplier.isVerified` (Ascending)
  - `createdAt` (Descending)

##### **索引 4：按類別、地點和創建時間**
- Collection ID: `offers`
- Fields:
  - `category` (Ascending)
  - `location` (Ascending)
  - `createdAt` (Descending)

##### **索引 5：按類別、認證狀態和創建時間**
- Collection ID: `offers`
- Fields:
  - `category` (Ascending)
  - `supplier.isVerified` (Ascending)
  - `createdAt` (Descending)

##### **索引 6：按地點、認證狀態和創建時間**
- Collection ID: `offers`
- Fields:
  - `location` (Ascending)
  - `supplier.isVerified` (Ascending)
  - `createdAt` (Descending)

##### **索引 7：按類別、地點、認證狀態和創建時間**
- Collection ID: `offers`
- Fields:
  - `category` (Ascending)
  - `location` (Ascending)
  - `supplier.isVerified` (Ascending)
  - `createdAt` (Descending)

##### **索引 8：按供應商ID和創建時間**
- Collection ID: `offers`
- Fields:
  - `supplierId` (Ascending)
  - `createdAt` (Descending)

### **方法 3：使用提供的索引文件**

#### **1. 使用 firestore.indexes.json**
如果您已經有 `firestore.indexes.json` 文件，可以直接部署：

```bash
firebase deploy --only firestore:indexes
```

### **索引創建時間**

- **單字段索引**：通常幾秒鐘內完成
- **複合索引**：可能需要幾分鐘到幾小時
- **複雜索引**：可能需要更長時間

您可以在 Firebase Console 的 "Indexes" 標籤中查看索引的創建狀態。

### **臨時解決方案**

在索引創建期間，我已經修改了代碼以使用客戶端過濾來避免複雜的 Firestore 查詢：

1. **簡化查詢**：只使用簡單的等值過濾器
2. **客戶端過濾**：價格範圍和數量過濾在客戶端進行
3. **客戶端排序**：複雜排序在客戶端進行

這樣可以立即解決索引問題，同時保持功能完整。

### **驗證索引**

索引創建完成後，您可以：

1. **重新加載頁面**：檢查錯誤是否消失
2. **測試過濾功能**：嘗試按類別、地點過濾
3. **檢查控制台**：確認沒有索引錯誤

### **性能優化建議**

1. **限制查詢結果**：使用 `limit()` 限制返回的文檔數量
2. **分頁加載**：實現分頁來減少單次查詢的數據量
3. **緩存結果**：在客戶端緩存查詢結果
4. **監控使用量**：定期檢查 Firestore 使用情況

### **常見問題**

**Q: 索引創建需要多長時間？**
A: 通常幾分鐘到幾小時，取決於數據量和索引複雜度。

**Q: 可以刪除不需要的索引嗎？**
A: 可以，但請確保沒有查詢依賴該索引。

**Q: 索引會影響寫入性能嗎？**
A: 會，但影響通常很小，好處遠大於成本。

如果仍有問題，請檢查 Firebase Console 中的錯誤日誌。 