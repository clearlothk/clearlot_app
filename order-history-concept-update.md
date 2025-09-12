# Order History Concept Update

## 🎯 **New Concept Overview**

The order management system has been updated to implement a clear separation between **active orders** and **completed history**:

### **1. 我的訂單 (My Orders) - Active Orders**
- **Status**: `pending`, `approved`, `shipped`
- **Purpose**: Shows orders that are still in progress
- **Action Required**: User can interact with these orders (upload receipts, confirm delivery, etc.)
- **Visibility**: Disappears when status changes to `delivered`

### **2. 我的銷售 (My Sales) - Active Sales**
- **Status**: `pending`, `approved`, `shipped`
- **Purpose**: Shows sales that are still in progress
- **Action Required**: Seller can interact with these sales (upload shipping photos, etc.)
- **Visibility**: Disappears when status changes to `completed`

### **3. 購買歷史 (Purchase History) - Completed Purchases**
- **Status**: `delivered`
- **Purpose**: Shows completed purchases for buyers
- **Action Required**: No actions needed - read-only history
- **Visibility**: Appears when order status changes to `delivered`

### **4. 銷售歷史 (Sales History) - Completed Sales**
- **Status**: `completed`
- **Purpose**: Shows completed sales for sellers
- **Action Required**: No actions needed - read-only history
- **Visibility**: Appears when sale status changes to `completed`

## 🔄 **Status Flow**

### **Buyer Side (Purchase Flow)**
```
pending → approved → shipped → delivered → [Moves to 購買歷史]
   ↓         ↓         ↓         ↓
我的訂單  我的訂單  我的訂單  我的訂單   [Disappears from 我的訂單]
```

### **Seller Side (Sales Flow)**
```
pending → approved → shipped → delivered → completed → [Moves to 銷售歷史]
   ↓         ↓         ↓         ↓         ↓
我的銷售  我的銷售  我的銷售  我的銷售  我的銷售   [Disappears from 我的銷售]
```

## 📊 **Stats Cards Updated**

The dashboard now shows more meaningful metrics:

1. **活躍訂單 (Active Orders)**: Count of orders in `pending`, `approved`, `shipped` status
2. **活躍銷售 (Active Sales)**: Count of sales in `pending`, `approved`, `shipped` status  
3. **購買歷史 (Purchase History)**: Count of delivered orders
4. **銷售歷史 (Sales History)**: Count of completed sales

## 🎨 **UI Changes**

### **Tab Navigation**
- **我的銷售**: Shows active sales (pending, approved, shipped)
- **我的訂單**: Shows active orders (pending, approved, shipped)
- **銷售歷史**: Shows completed sales (completed status)
- **購買歷史**: Shows delivered orders (delivered status)

### **Search Placeholders**
- **我的銷售**: "搜索活躍銷售..."
- **我的訂單**: "搜索活躍訂單..."
- **銷售歷史**: "搜索銷售歷史..."
- **購買歷史**: "搜索購買歷史..."

### **Empty State Messages**
- **我的銷售**: "沒有活躍銷售" + "您目前沒有待處理、已付款或已發貨的銷售。"
- **我的訂單**: "沒有活躍訂單" + "您目前沒有待處理、已付款或已發貨的訂單。"
- **銷售歷史**: "沒有銷售歷史" + "已完成的銷售將顯示在這裡。"
- **購買歷史**: "沒有購買歷史" + "已送達的訂單將顯示在這裡。"

## 🔧 **Technical Implementation**

### **New Functions Added**
1. **`fetchActiveOrders()`**: Fetches orders with status `['pending', 'approved', 'shipped']`
2. **`fetchActiveSales()`**: Fetches sales with status `['pending', 'approved', 'shipped']`
3. **`fetchPurchaseHistory()`**: Fetches orders with status `['delivered']`
4. **`fetchSalesHistory()`**: Fetches sales with status `['completed']`

### **Data Structure**
```typescript
interface PurchaseHistoryItem {
  id: string;
  offerTitle: string;
  supplier: string;
  quantity: number;
  unit: string;
  totalAmount: number;
  status: string;
  date: string;
  location: string;
  offerId: string;
  productImage?: string | null;
  paymentDetails?: any;
}

interface SalesHistoryItem {
  id: string;
  offerTitle: string;
  buyer: string;
  quantity: number;
  unit: string;
  totalAmount: number;
  status: string;
  date: string;
  location: string;
  offerId: string;
  productImage?: string | null;
  paymentDetails?: any;
}
```

### **State Management**
```typescript
const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
const [salesHistory, setSalesHistory] = useState<SalesHistoryItem[]>([]);
const [activeOrders, setActiveOrders] = useState<PurchaseHistoryItem[]>([]);
const [activeSales, setActiveSales] = useState<SalesHistoryItem[]>([]);
```

## 🎯 **Benefits of New Concept**

### **1. Clear Separation**
- **Active vs History**: Users can easily distinguish between ongoing and completed transactions
- **Action Required**: Active tabs show what needs attention
- **Historical Record**: History tabs provide complete transaction records

### **2. Better User Experience**
- **No Confusion**: Users know exactly where to find their active orders/sales
- **Focused Actions**: Active tabs only show actionable items
- **Clean Interface**: Each tab has a specific purpose

### **3. Improved Workflow**
- **Status Progression**: Clear understanding of order/sale progression
- **Action Points**: Users know when and where to take action
- **Completion Tracking**: Easy to see what's been completed

## 🚀 **Usage Examples**

### **For Buyers**
1. **Check Active Orders**: Go to "我的訂單" to see pending, approved, and shipped orders
2. **Upload Receipts**: Use "我的訂單" to upload payment receipts for pending orders
3. **Confirm Delivery**: Use "我的訂單" to confirm delivery for shipped orders
4. **View History**: Go to "購買歷史" to see all delivered orders

### **For Sellers**
1. **Check Active Sales**: Go to "我的銷售" to see pending, approved, and shipped sales
2. **Upload Shipping Photos**: Use "我的銷售" to upload shipping photos for approved sales
3. **Track Progress**: Monitor sales progression through different statuses
4. **View History**: Go to "銷售歷史" to see all completed sales

## 🔍 **Status Definitions**

### **Order Statuses**
- **`pending`**: Order created, waiting for payment approval
- **`approved`**: Payment approved, waiting for shipping
- **`shipped`**: Order shipped, waiting for delivery confirmation
- **`delivered`**: Order delivered and confirmed by buyer
- **`completed`**: Order fully completed (for seller after Clearlot payment)

### **Payment Approval Status**
- **`pending`**: Waiting for admin approval
- **`approved`**: Payment approved by admin
- **`rejected`**: Payment rejected by admin

### **Shipping Approval Status**
- **`pending`**: Waiting for admin approval
- **`approved`**: Shipping approved by admin
- **`rejected`**: Shipping rejected by admin

## 📱 **Mobile Responsiveness**

The new concept works seamlessly across all devices:
- **Desktop**: Full tab navigation with all features
- **Tablet**: Optimized layout for medium screens
- **Mobile**: Responsive design with touch-friendly interactions

## 🔮 **Future Enhancements**

Potential improvements for the next iteration:
1. **Email Notifications**: Alert users when orders move between tabs
2. **Export Functionality**: Allow users to export their transaction history
3. **Advanced Filtering**: Add date range, amount range, and status filters
4. **Analytics Dashboard**: Show trends and insights from transaction data
5. **Integration**: Connect with accounting and inventory systems

## ✅ **Testing Checklist**

After implementation, verify:
- [ ] Active orders show only pending/approved/shipped status
- [ ] Active sales show only pending/approved/shipped status
- [ ] Purchase history shows only delivered orders
- [ ] Sales history shows only completed sales
- [ ] Stats cards display correct counts
- [ ] Search functionality works for each tab
- [ ] Empty states show appropriate messages
- [ ] Tab switching works smoothly
- [ ] Data refreshes after status changes
- [ ] Mobile responsiveness maintained 