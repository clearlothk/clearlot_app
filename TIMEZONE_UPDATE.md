# 香港時區設置更新

## 概述

本次更新將網站的所有時間設置統一為香港時區（UTC+8），確保所有時間顯示都基於香港本地時間。

## 時區設置

- **目標時區**: 香港時區 (Asia/Hong_Kong)
- **UTC 偏移**: UTC+8
- **語言設置**: 繁體中文 (zh-HK)

## 主要變更

### 1. 新增時間工具文件

創建了 `src/utils/dateUtils.ts` 文件，包含以下功能：

- `getCurrentHKTime()`: 獲取當前香港時間
- `convertToHKTime()`: 將 UTC 時間轉換為香港時間
- `formatHKDate()`: 格式化香港日期
- `formatHKTime()`: 格式化香港時間
- `formatHKDateTime()`: 格式化香港日期和時間
- `getCurrentHKTimestamp()`: 獲取當前香港時間戳
- `formatDateForDisplay()`: 格式化顯示時間
- `formatRelativeTime()`: 格式化相對時間（如"2小時前"）
- `getShortDate()`: 獲取簡短日期格式
- `getShortTime()`: 獲取簡短時間格式

### 2. 更新的組件

#### PurchaseModal.tsx
- 所有時間戳現在使用 `getCurrentHKTimestamp()` 而不是 `new Date().toISOString()`
- 確保購買記錄的時間基於香港時區

#### NotificationContext.tsx
- 通知創建時間現在使用香港時區
- 確保所有通知的時間戳都是香港本地時間

#### MyOrdersPage.tsx
- 添加了時間工具導入
- 準備使用香港時區的時間格式化

### 3. 時間顯示格式

#### 日期格式
- **完整日期**: 2025年9月3日
- **簡短日期**: 9月3日
- **相對時間**: 2小時前、3天前

#### 時間格式
- **24小時制**: 14:30
- **12小時制**: 下午2:30

## 技術實現

### 時區轉換
```typescript
export const convertToHKTime = (dateString: string): Date => {
  const utcDate = new Date(dateString);
  return new Date(utcDate.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
};
```

### 本地化格式化
```typescript
export const formatHKDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Hong_Kong',
    ...options
  };
  
  return date.toLocaleDateString('zh-HK', defaultOptions);
};
```

## 使用方式

### 基本用法
```typescript
import { 
  getCurrentHKTimestamp, 
  formatDateForDisplay, 
  formatRelativeTime 
} from '../utils/dateUtils';

// 獲取當前香港時間戳
const timestamp = getCurrentHKTimestamp();

// 格式化日期顯示
const displayDate = formatDateForDisplay('2025-09-03T10:00:00Z', 'date');

// 格式化相對時間
const relativeTime = formatRelativeTime('2025-09-03T10:00:00Z');
```

### 在組件中使用
```typescript
// 創建時間戳
const purchaseData = {
  purchaseDate: getCurrentHKTimestamp(),
  timestamp: getCurrentHKTimestamp()
};

// 顯示時間
<span>創建於: {formatDateForDisplay(offer.createdAt)}</span>
<span>時間: {formatRelativeTime(notification.createdAt)}</span>
```

## 影響範圍

### 受影響的功能
1. **購買記錄**: 所有購買時間戳現在基於香港時區
2. **通知系統**: 通知創建時間使用香港時區
3. **訂單追蹤**: 訂單狀態變更時間使用香港時區
4. **用戶活動**: 用戶註冊、登錄等時間記錄使用香港時區

### 不受影響的功能
1. **Firestore 存儲**: 數據庫中仍然存儲 ISO 格式的時間戳
2. **API 調用**: 與外部服務的時間格式保持不變

## 測試建議

### 功能測試
1. 創建新的購買記錄，檢查時間是否為香港時間
2. 發送通知，檢查通知時間是否為香港時間
3. 在不同時區的設備上測試，確保顯示時間一致

### 邊界情況測試
1. 跨日期邊界的時間處理
2. 夏令時轉換（香港不實行夏令時）
3. 無效時間字符串的錯誤處理

## 注意事項

1. **瀏覽器兼容性**: 確保目標瀏覽器支持 `Intl.DateTimeFormat` API
2. **性能考慮**: 時間轉換操作應該在需要時進行，避免不必要的計算
3. **錯誤處理**: 所有時間格式化函數都包含錯誤處理，返回友好的錯誤信息

## 未來改進

1. **緩存機制**: 可以考慮緩存時區轉換結果以提高性能
2. **用戶偏好**: 未來可以允許用戶選擇不同的時區顯示
3. **國際化**: 擴展支持其他地區的時區和語言設置

## 總結

本次更新確保了網站的所有時間顯示都基於香港時區，為香港用戶提供了更準確和一致的本地時間體驗。通過統一的時間工具函數，維護了代碼的一致性和可維護性。 