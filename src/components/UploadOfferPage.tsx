import React, { useState } from 'react';
import { Upload, X, Plus, AlertCircle, CheckCircle, Camera, DollarSign, Package, MapPin, Clock, Tag, Building, Loader, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { uploadOffer } from '../services/firebaseService';
import { CATEGORIES, LOCATIONS } from '../constants/categories';
import { canUploadOffers, getRestrictionMessage } from '../utils/userUtils';

interface OfferFormData {
  title: string;
  description: string;
  category: string;
  originalPrice: string;
  currentPrice: string;
  quantity: string;
  unit: string;
  location: string;
  type: 'clearance';
  minOrderQuantity: string;
  shippingEstimateDays: string;
  tags: string[];
  images: File[];
}

export default function UploadOfferPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/hk/login');
    }
  }, [user, navigate]);

  // Show loading while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">正在檢查登入狀態...</p>
        </div>
      </div>
    );
  }

  // Check if user can upload offers
  if (!canUploadOffers(user)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center bg-white rounded-xl shadow-sm border border-red-200 p-12">
          <div className="text-red-500 mb-6">
            <Lock className="h-24 w-24 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">上傳受限</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            {getRestrictionMessage(user)}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
              <span className="text-red-800 font-semibold">帳戶狀態：{user?.status || '未知'}</span>
            </div>
            <p className="text-red-700 text-sm">
              只有活躍用戶才能上傳優惠。如需恢復帳戶訪問權限，請聯繫客服支援。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState<OfferFormData>({
    title: '',
    description: '',
    category: '',
    originalPrice: '',
    currentPrice: '',
    quantity: '',
    unit: '件',
    location: '',
    type: 'clearance',
    minOrderQuantity: '',
    shippingEstimateDays: '',
    tags: [],
    images: []
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const units = ['件', '套', '米', '公斤', '升', '箱', '托盤', '捆'];

  const handleInputChange = (field: keyof OfferFormData, value: string) => {
    // Special validation for numeric fields to prevent negative values
    if (field === 'minOrderQuantity' || field === 'quantity' || field === 'shippingEstimateDays') {
      const numValue = parseInt(value);
      if (value !== '' && (isNaN(numValue) || numValue < 1)) {
        // Don't update the form data if the value is invalid
        setErrors(prev => ({ ...prev, [field]: `${field === 'minOrderQuantity' ? '最小訂購數量' : field === 'quantity' ? '可售數量' : '運輸預估天數'}必須大於0` }));
        return;
      }
    }
    
    if (field === 'originalPrice' || field === 'currentPrice') {
      const numValue = parseFloat(value);
      if (value !== '' && (isNaN(numValue) || numValue < 0.01)) {
        // Don't update the form data if the value is invalid
        setErrors(prev => ({ ...prev, [field]: `${field === 'originalPrice' ? '原價' : '現價'}必須大於0` }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newImages = Array.from(files).slice(0, 5 - formData.images.length);
    
    // Validate file types and sizes
    const validImages = newImages.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        setErrors(prev => ({ ...prev, images: '只支援 JPG、PNG 和 WebP 格式的圖片' }));
        return false;
      }
      
      if (!isValidSize) {
        setErrors(prev => ({ ...prev, images: '圖片大小不能超過 5MB' }));
        return false;
      }
      
      return true;
    });
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validImages]
    }));
    
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Drag and drop functions for image reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setFormData(prev => {
      const newImages = [...prev.images];
      const draggedImage = newImages[draggedIndex];
      
      // Remove the dragged image from its original position
      newImages.splice(draggedIndex, 1);
      
      // Insert the dragged image at the new position
      newImages.splice(dropIndex, 0, draggedImage);
      
      return {
        ...prev,
        images: newImages
      };
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '請輸入優惠標題';
    } else if (formData.title.length < 5) {
      newErrors.title = '標題至少需要5個字符';
    }

    if (!formData.description.trim()) {
      newErrors.description = '請輸入優惠描述';
    } else if (formData.description.length < 20) {
      newErrors.description = '描述至少需要20個字符';
    }

    if (!formData.category) {
      newErrors.category = '請選擇類別';
    }

    if (!formData.originalPrice) {
      newErrors.originalPrice = '請輸入原價';
    } else if (parseFloat(formData.originalPrice) <= 0) {
      newErrors.originalPrice = '原價必須大於0';
    }

    if (!formData.currentPrice) {
      newErrors.currentPrice = '請輸入現價';
    } else if (parseFloat(formData.currentPrice) <= 0) {
      newErrors.currentPrice = '現價必須大於0';
    } else if (parseFloat(formData.currentPrice) >= parseFloat(formData.originalPrice)) {
      newErrors.currentPrice = '現價必須低於原價';
    }

    if (!formData.quantity) {
      newErrors.quantity = '請輸入數量';
    } else if (parseInt(formData.quantity) <= 0) {
      newErrors.quantity = '數量必須大於0';
    }

    if (!formData.location) {
      newErrors.location = '請選擇地點';
    }

    if (!formData.minOrderQuantity) {
      newErrors.minOrderQuantity = '請輸入最小訂購數量';
    } else if (parseInt(formData.minOrderQuantity) <= 0) {
      newErrors.minOrderQuantity = '最小訂購數量必須大於0';
    } else if (parseInt(formData.minOrderQuantity) > parseInt(formData.quantity)) {
      newErrors.minOrderQuantity = '最小訂購數量不能超過總數量';
    }

    if (!formData.shippingEstimateDays) {
      newErrors.shippingEstimateDays = '請輸入預計運送天數';
    } else if (parseInt(formData.shippingEstimateDays) <= 0) {
      newErrors.shippingEstimateDays = '預計運送天數必須大於0';
    }

    if (formData.images.length === 0) {
      newErrors.images = '請至少上傳一張圖片';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started'); // Debug log
    
    if (!user) {
      setErrors({ general: '請先登入' });
      return;
    }
    
    if (!validateForm()) {
      console.log('Form validation failed'); // Debug log
      return;
    }

    console.log('Form validation passed, starting submission'); // Debug log
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      // Prepare offer data for upload
      const offerData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        originalPrice: parseFloat(formData.originalPrice),
        currentPrice: parseFloat(formData.currentPrice),
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        location: formData.location,
        type: formData.type as 'clearance',
        minOrderQuantity: parseInt(formData.minOrderQuantity),
        shippingEstimateDays: parseInt(formData.shippingEstimateDays),
        tags: formData.tags,
        images: [] // This will be populated by the uploadOffer function
      };

      console.log('Calling uploadOffer with data:', offerData); // Debug log
      
      // Upload offer to Firebase
      const offerId = await uploadOffer(offerData, formData.images);
      
      console.log('Upload successful, offerId:', offerId); // Debug log
      
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        category: '',
        originalPrice: '',
        currentPrice: '',
        quantity: '',
        unit: '件',
        location: '',
        type: 'clearance',
        minOrderQuantity: '',
        shippingEstimateDays: '',
        tags: [],
        images: []
      });
      
      setIsSubmitting(false);
      setUploadProgress(100);
      
      // Redirect to marketplace smoothly without notification
      navigate(`/hk/${user.id}/marketplace`);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setIsSubmitting(false);
      setUploadProgress(0);
      setErrors({ general: error.message || '上傳失敗。請重試。' });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  // Calculate discount percentage with validation
  const discountPercentage = formData.originalPrice && formData.currentPrice 
    ? Math.max(0, Math.min(100, Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.currentPrice)) / parseFloat(formData.originalPrice)) * 100)))
    : 0;

  // Calculate savings amount with validation
  const savingsAmount = formData.originalPrice && formData.currentPrice 
    ? Math.max(0, parseFloat(formData.originalPrice) - parseFloat(formData.currentPrice))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">上傳新優惠</h1>
          <p className="text-xl text-gray-600">列出您的清倉優惠以接觸數千名B2B買家</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 ml-4">基本信息</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Title */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  優惠標題 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="例如：優質LED燈具 - 倉庫清倉"
                />
                {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  類別 *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">選擇類別</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                  地點 *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 ${
                    errors.location ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">選擇地點</option>
                  {LOCATIONS.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
              </div>

              {/* Description */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  描述 *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="提供您的優惠詳細描述、條件、規格和任何買家應知的重要資訊..."
                />
                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
              </div>


            </div>
          </div>

          {/* Pricing & Quantity */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 p-3 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 ml-4">價格與數量</h2>
              {discountPercentage > 0 && (
                <div className="ml-auto bg-red-500 text-white px-4 py-2 rounded-lg font-bold">
                  -{discountPercentage}% OFF
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Original Price */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  原價 (HKD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 ${
                    errors.originalPrice ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  min="0.01"
                />
                {errors.originalPrice && <p className="text-red-600 text-sm mt-1">{errors.originalPrice}</p>}
              </div>

              {/* Current Price */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  現價 (HKD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentPrice}
                  onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 ${
                    errors.currentPrice ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  min="0.01"
                />
                {errors.currentPrice && <p className="text-red-600 text-sm mt-1">{errors.currentPrice}</p>}
                {formData.originalPrice && formData.currentPrice && parseFloat(formData.currentPrice) >= parseFloat(formData.originalPrice) && (
                  <p className="text-red-600 text-sm mt-1">現價必須低於原價</p>
                )}
              </div>

              {/* Savings Display */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  每單位節省
                </label>
                <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">
                    HKD {savingsAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-700">每 {formData.unit}</div>
                  {discountPercentage > 0 && (
                    <div className="text-xs text-green-600 mt-1 font-medium">
                      ({discountPercentage}%折扣)
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  可售數量 *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  onKeyDown={(e) => {
                    // Prevent negative sign, minus key, and other invalid inputs
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 ${
                    errors.quantity ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="1"
                  step="1"
                />
                {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  單位
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              {/* Min Order Quantity */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  最小訂購數量 *
                </label>
                <input
                  type="number"
                  value={formData.minOrderQuantity}
                  onChange={(e) => handleInputChange('minOrderQuantity', e.target.value)}
                  onKeyDown={(e) => {
                    // Prevent negative sign, minus key, and other invalid inputs
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 ${
                    errors.minOrderQuantity ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="1"
                  min="1"
                  step="1"
                />
                {errors.minOrderQuantity && <p className="text-red-600 text-sm mt-1">{errors.minOrderQuantity}</p>}
              </div>

              {/* Shipping Estimate Days */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  運輸預估 (天) *
                </label>
                <input
                  type="number"
                  value={formData.shippingEstimateDays}
                  onChange={(e) => handleInputChange('shippingEstimateDays', e.target.value)}
                  onKeyDown={(e) => {
                    // Prevent negative sign, minus key, and other invalid inputs
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 ${
                    errors.shippingEstimateDays ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="3-5"
                  min="1"
                  max="30"
                />
                {errors.shippingEstimateDays && <p className="text-red-600 text-sm mt-1">{errors.shippingEstimateDays}</p>}
              </div>
            </div>

            {/* Logistics Responsibility Reminder */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    📦 物流費用提醒
                  </h3>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    請注意：賣家需要負責安排配送和承擔物流費用。建議在定價時將物流成本考慮在內來控制成本。
                  </p>
                </div>
              </div>
            </div>
          </div>



          {/* Images */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-3 rounded-xl">
                <Camera className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 ml-4">產品圖片</h2>
              <span className="ml-auto text-sm text-gray-500">
                {formData.images.length}/5張圖片
              </span>
            </div>

            {/* Image Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : errors.images 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleFileDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                拖放圖片或點擊選擇
              </p>
              <p className="text-sm text-gray-500 mb-4">
                上傳最多5張高品質圖片 (JPG, PNG, 每張最大10MB)
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer inline-block font-semibold"
              >
                選擇圖片
              </label>
            </div>

            {errors.images && <p className="text-red-600 text-sm mt-2">{errors.images}</p>}

            {/* Image Preview */}
            {formData.images.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">已上傳圖片</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">💡 提示：</span>
                    <span>第一張圖片將作為市場卡片的顯示圖片</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {formData.images.map((image, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`relative group cursor-move transition-all duration-200 ${
                        draggedIndex === index ? 'opacity-50 scale-95' : ''
                      } ${
                        dragOverIndex === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className={`w-full h-24 object-cover rounded-lg border-2 transition-all duration-200 ${
                            index === 0 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        />
                        {/* Position indicator */}
                        <div className={`absolute top-1 left-1 px-2 py-1 rounded-full text-xs font-bold ${
                          index === 0 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        {/* Main image indicator */}
                        {index === 0 && (
                          <div className="absolute top-1 right-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            主圖
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {/* Drag handle */}
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        ↕ 拖拽排序
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  💡 拖拽圖片可以調整順序，第一張圖片將作為市場卡片的顯示圖片
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-100 p-3 rounded-xl">
                <Tag className="h-6 w-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 ml-4">標籤</h2>
              <span className="ml-auto text-sm text-gray-500">
                {formData.tags.length}/10個標籤
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                placeholder="添加標籤 (例如：優質, 高品質, 批發)"
                disabled={formData.tags.length >= 10}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!newTag.trim() || formData.tags.length >= 10}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Error Display */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800 font-medium">{errors.general}</p>
              </div>
            </div>
          )}



          {/* Submit Button */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="text-center md:text-left">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">準備好發布了嗎？</h3>
                <p className="text-sm md:text-base text-gray-600">您的優惠將在24小時內審核並發布。</p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 px-6 md:px-8 py-3 md:py-4 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-200 font-bold text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white mr-2 md:mr-3" />
                    發布中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />
                    發布優惠
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}