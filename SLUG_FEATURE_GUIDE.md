# ClearLot Slug 功能指南

## 什麼是 Slug？

Slug 是一個用戶專屬的 URL 結構，讓每個用戶都有自己專屬的個人頁面鏈接。格式為：

```
domain/hk/userId/pageName
```

## URL 結構說明

### 基本格式
- **域名**: `yourdomain.com`
- **地區前綴**: `/hk/` (香港地區)
- **用戶 ID**: 每個用戶的唯一標識符
- **頁面名稱**: 不同的頁面類型

### 頁面類型
1. **個人資料頁面**: `/hk/{userId}/profile`
2. **優惠商品頁面**: `/hk/{userId}/offers`
3. **聯絡頁面**: `/hk/{userId}/contact` (未來功能)
4. **評價頁面**: `/hk/{userId}/reviews` (未來功能)
5. **關於頁面**: `/hk/{userId}/about` (未來功能)
6. **圖片庫頁面**: `/hk/{userId}/gallery` (未來功能)

## 功能特點

### 🎯 用戶專屬
- 每個註冊用戶自動獲得專屬的個人頁面
- 頁面內容根據用戶資料自動生成
- 無需手動創建或維護

### 🔗 易於分享
- 簡潔的 URL 結構，便於記憶和分享
- 可以直接分享給客戶、合作夥伴
- 支持社交媒體、名片、宣傳材料等使用場景

### 📱 響應式設計
- 所有頁面都支持桌面和移動設備
- 美觀的現代化界面設計
- 優化的用戶體驗

### 🔄 自動更新
- 頁面內容會根據用戶資料變化自動更新
- 優惠商品會實時顯示最新狀態
- 無需手動刷新或維護

## 如何使用

### 對於用戶（賣家）

#### 1. 查看個人鏈接
- 登入後進入「公司設定」頁面
- 點擊「個人鏈接」標籤
- 查看您的專屬鏈接

#### 2. 分享鏈接
- 複製個人資料頁面鏈接分享給客戶
- 複製優惠商品頁面鏈接展示商品
- 在社交媒體、名片等地方使用

#### 3. 管理頁面內容
- 更新公司資料會自動反映在個人頁面
- 上傳新優惠商品會自動顯示在優惠頁面
- 所有更改都是即時的

### 對於訪客（買家）

#### 1. 訪問個人頁面
- 直接點擊分享的鏈接
- 在瀏覽器中輸入完整的 URL
- 通過其他用戶的分享發現

#### 2. 瀏覽內容
- 查看公司詳細資料
- 瀏覽所有優惠商品
- 了解公司背景和聯絡方式

#### 3. 進行交易
- 點擊優惠商品查看詳情
- 直接進入購買流程
- 與賣家建立聯繫

## 技術實現

### 路由配置
```typescript
// 用戶個人資料頁面路由
<Route path="/hk/:userId/profile" element={<UserProfilePage />} />
<Route path="/hk/:userId/offers" element={<UserProfilePage />} />
```

### 工具函數
```typescript
// 生成 slug URL
export const generateUserSlug = (userId: string, pageName: string): string => {
  return `/hk/${userId}/${pageName}`;
};

// 解析 slug URL
export const parseUserSlug = (slugPath: string): { userId: string; pageName: string } | null => {
  const slugPattern = /^\/hk\/([^\/]+)\/([^\/]+)$/;
  const match = slugPath.match(slugPattern);
  
  if (match) {
    return {
      userId: match[1],
      pageName: match[2]
    };
  }
  
  return null;
};
```

### 數據獲取
```typescript
// 獲取用戶資料
const profileUser = await getUserById(userId);

// 獲取用戶優惠商品
const userOffers = await getOffersByUserId(userId);
```

## 頁面內容

### 個人資料頁面 (`/profile`)
- 公司基本信息
- 聯絡方式
- 業務類型
- 公司規模
- 聯絡人列表
- 社交媒體鏈接

### 優惠商品頁面 (`/offers`)
- 所有活躍優惠商品
- 商品圖片和詳情
- 價格和折扣信息
- 數量和地點
- 直接購買鏈接

## 安全考慮

### 訪問控制
- 個人資料頁面對所有用戶開放
- 優惠商品頁面對所有用戶開放
- 敏感信息（如銀行詳情）不會顯示

### 數據驗證
- 用戶 ID 驗證
- 頁面名稱驗證
- 錯誤處理和用戶友好的錯誤頁面

## 未來擴展

### 計劃中的功能
- 聯絡頁面 (`/contact`)
- 評價頁面 (`/reviews`)
- 關於頁面 (`/about`)
- 圖片庫頁面 (`/gallery`)

### 自定義選項
- 用戶可選擇顯示哪些頁面
- 自定義頁面標題和描述
- 頁面佈局選項

## 常見問題

### Q: 如何獲得我的個人鏈接？
A: 註冊並登入後，進入「公司設定」頁面，點擊「個人鏈接」標籤即可查看。

### Q: 可以修改 URL 嗎？
A: 目前不支持自定義 URL，但未來可能會添加此功能。

### Q: 頁面會自動更新嗎？
A: 是的，所有頁面內容都會根據您的資料變化自動更新。

### Q: 可以設置頁面為私密嗎？
A: 目前所有頁面都是公開的，未來可能會添加私密選項。

### Q: 如何分享給客戶？
A: 複製鏈接後，可以通過任何方式分享：社交媒體、郵件、即時通訊等。

## 聯繫支持

如果您在使用 Slug 功能時遇到任何問題，請聯繫我們的技術支持團隊。

---

*本指南會根據功能更新持續更新，請定期查看最新版本。* 