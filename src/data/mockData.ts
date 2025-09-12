import { Offer, User } from '../types';

export const currentUser: User = {
  id: '1',
  email: 'john.doe@techcorp.com',
  name: 'John Doe',
  company: 'TechCorp Solutions',
  // role field removed - users can both buy and sell
  isVerified: true,
  avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150'
};

export const mockOffers: Offer[] = [
  {
    id: '1',
    title: '工業LED燈具 - 超額庫存',
    description: '高品質LED燈具，完美適用於倉庫和工業空間。全新，來自取消項目的過剩庫存。',
    category: '電子產品',
    originalPrice: 180,
    currentPrice: 89,
    quantity: 500,
    unit: '件',
    location: '中西區',
    supplier: {
      company: '工業照明公司',
      rating: 4.8,
      isVerified: true,
      logo: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    images: ['https://images.pexels.com/photos/1036936/pexels-photo-1036936.jpeg?auto=compress&cs=tinysrgb&w=800'],
    type: 'clearance',
    minOrderQuantity: 50,
    tags: ['LED', '工業', '節能'],
    shippingEstimateDays: 3,
    createdAt: '2025-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: '優質棉布卷 - 即將結束',
    description: '高級棉布卷，各種顏色可供選擇。完美適用於紡織製造商和時尚品牌。',
    category: '紡織品',
    originalPrice: 25,
    currentPrice: 12,
    quantity: 2000,
    unit: '米',
    location: '油尖旺區',
    supplier: {
      company: '南方紡織公司',
      rating: 4.6,
      isVerified: true,
      logo: 'https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    images: ['https://images.pexels.com/photos/6069094/pexels-photo-6069094.jpeg?auto=compress&cs=tinysrgb&w=800'],
    type: 'clearance',
    minOrderQuantity: 100,
    tags: ['棉布', '優質', '多種顏色'],
    shippingEstimateDays: 5,
    createdAt: '2025-01-10T14:20:00Z'
  },
  {
    id: '3',
    title: '餐廳設備套裝 - 快速銷售',
    description: '來自關閉地點的完整餐廳設備套裝。包括商用烤箱、冰箱和準備台。',
    category: '餐廳設備',
    originalPrice: 45000,
    currentPrice: 18500,
    quantity: 1,
    unit: '套',
    location: '灣仔區',
    supplier: {
      company: '廚師大師設備',
      rating: 4.9,
      isVerified: true,
      logo: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    images: ['https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=800'],
    type: 'clearance',
    minOrderQuantity: 1,
    tags: ['商用', '完整套裝', '狀況良好'],
    shippingEstimateDays: 7,
    createdAt: '2025-01-12T09:15:00Z'
  },
  {
    id: '4',
    title: '智能手機殼 - 批量清算',
    description: '各種型號的混合智能手機殼。完美適用於零售商和經銷商。高品質材料。',
    category: '電子產品',
    originalPrice: 15,
    currentPrice: 4,
    quantity: 10000,
    unit: '件',
    location: '深水埗區',
    supplier: {
      company: '移動科技批發',
      rating: 4.7,
      isVerified: false,
      logo: 'https://images.pexels.com/photos/1181472/pexels-photo-1181472.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    images: ['https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=800'],
    type: 'clearance',
    minOrderQuantity: 500,
    tags: ['智能手機', '混合型號', '高品質'],
    shippingEstimateDays: 2,
    createdAt: '2025-01-14T16:45:00Z'
  },
  {
    id: '5',
    title: '辦公傢俱套裝 - 清算',
    description: '來自企業縮編的現代辦公傢俱。桌子、椅子和文件櫃，狀況良好。',
    category: '傢俱',
    originalPrice: 800,
    currentPrice: 320,
    quantity: 150,
    unit: '套',
    location: '東區',
    supplier: {
      company: '企業傢俱解決方案',
      rating: 4.5,
      isVerified: true,
      logo: 'https://images.pexels.com/photos/1181534/pexels-photo-1181534.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    images: ['https://images.pexels.com/photos/1957477/pexels-photo-1957477.jpeg?auto=compress&cs=tinysrgb&w=800'],
    type: 'clearance',
    minOrderQuantity: 10,
    tags: ['現代', '企業', '完整套裝'],
    shippingEstimateDays: 4,
    createdAt: '2025-01-13T11:20:00Z'
  },
  {
    id: '6',
    title: '汽車零件 - 引擎組件',
    description: '全新汽車引擎組件，各種品牌和型號。完美適用於汽車修理廠和零件經銷商。',
    category: '汽車',
    originalPrice: 120,
    currentPrice: 65,
    quantity: 800,
    unit: '件',
    location: '深水埗區',
    supplier: {
      company: '汽車零件直銷',
      rating: 4.4,
      isVerified: true,
      logo: 'https://images.pexels.com/photos/1181540/pexels-photo-1181540.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    images: ['https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=800'],
    type: 'clearance',
    minOrderQuantity: 50,
    tags: ['引擎零件', '各種型號', '全新'],
    shippingEstimateDays: 6,
    createdAt: '2025-01-11T08:30:00Z'
  }
];