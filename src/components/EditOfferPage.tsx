import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getOfferById, updateOffer } from '../services/firebaseService';
import { Offer } from '../types';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Plus, 
  Save, 
  Loader, 
  AlertCircle,
  Camera,
  Package,
  MapPin,
  DollarSign,
  Tag,
  Calendar,
  Truck,
  GripVertical
} from 'lucide-react';
import { CATEGORIES, LOCATIONS } from '../constants/categories';

const EditOfferPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { offerId } = useParams<{ offerId: string }>();
  const location = useLocation();
  const existingOffer = location.state?.offer as Offer;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<Offer | null>(existingOffer || null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    originalPrice: 0,
    currentPrice: 0,
    quantity: 0,
    unit: '',
    location: '',
    minOrderQuantity: 0,
    shippingEstimateDays: 0,
    tags: [] as string[]
  });

  const [newTag, setNewTag] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedType, setDraggedType] = useState<'existing' | 'new' | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/hk/login');
      return;
    }
  }, [user, navigate]);

  // Load offer data
  useEffect(() => {
    if (offerId && !existingOffer) {
      loadOffer();
    } else if (existingOffer) {
      initializeForm(existingOffer);
    }
  }, [offerId, existingOffer]);

  const loadOffer = async () => {
    if (!offerId) return;

    try {
      setLoading(true);
      setError(null);
      const offerData = await getOfferById(offerId);
      
      if (!offerData) {
        setError('優惠不存在');
        return;
      }

      // Check if user owns this offer
      if (offerData.supplierId !== user?.id) {
        setError('您沒有權限編輯此優惠');
        return;
      }

      setOffer(offerData);
      initializeForm(offerData);
    } catch (err: any) {
      setError(err.message || '載入優惠失敗');
    } finally {
      setLoading(false);
    }
  };

  const initializeForm = (offerData: Offer) => {
    setFormData({
      title: offerData.title,
      description: offerData.description,
      category: offerData.category,
      originalPrice: offerData.originalPrice,
      currentPrice: offerData.currentPrice,
      quantity: offerData.quantity,
      unit: offerData.unit,
      location: offerData.location,
      minOrderQuantity: offerData.minOrderQuantity,
      shippingEstimateDays: offerData.shippingEstimateDays,
      tags: [...offerData.tags]
    });
    setExistingImages([...offerData.images]);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const currentImageCount = existingImages.filter(img => !removedImages.includes(img)).length + newImages.length;
    const fileArray = Array.from(files);
    
    // Check if adding these files would exceed the 5-image limit
    if (currentImageCount + fileArray.length > 5) {
      alert(`最多只能上傳5張圖片，目前已有${currentImageCount}張`);
      return;
    }

    const validFiles = fileArray.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!isValidType) {
        alert('只支持 JPG, PNG, GIF, WebP 格式的圖片');
        return false;
      }
      if (!isValidSize) {
        alert('圖片大小不能超過 10MB');
        return false;
      }
      return true;
    });

    setNewImages(prev => [...prev, ...validFiles]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(img => img !== imageUrl));
    setRemovedImages(prev => [...prev, imageUrl]);
  };

  const addTag = () => {
    if (newTag.trim() && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  // Drag and drop functions for image reordering
  const handleDragStart = (e: React.DragEvent, index: number, type: 'existing' | 'new') => {
    setDraggedIndex(index);
    setDraggedType(type);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number, type: 'existing' | 'new') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Only allow dragging within the same section
    if (draggedIndex !== null && draggedIndex !== index && draggedType === type) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number, type: 'existing' | 'new') => {
    e.preventDefault();
    if (draggedIndex === null || draggedType === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDraggedType(null);
      return;
    }

    // Handle same section reordering
    if (draggedType === type) {
      if (draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        setDraggedType(null);
        return;
      }

      if (type === 'existing') {
        setExistingImages(prev => {
          const newImages = [...prev];
          const draggedImage = newImages[draggedIndex];
          
          // Remove the dragged image from its original position
          newImages.splice(draggedIndex, 1);
          
          // Insert the dragged image at the new position
          newImages.splice(dropIndex, 0, draggedImage);
          
          return newImages;
        });
      } else if (type === 'new') {
        setNewImages(prev => {
          const newImages = [...prev];
          const draggedImage = newImages[draggedIndex];
          
          // Remove the dragged image from its original position
          newImages.splice(draggedIndex, 1);
          
          // Insert the dragged image at the new position
          newImages.splice(dropIndex, 0, draggedImage);
          
          return newImages;
        });
      }
    } else {
      // Handle cross-section movement
      if (draggedType === 'existing' && type === 'new') {
        // Move from existing to new - this should not be allowed
        // Existing images are already uploaded to Firebase Storage
        // Moving them to "new" would cause them to be re-uploaded unnecessarily
        console.warn('Cannot move existing images to new section. Existing images are already uploaded.');
        return;
      } else if (draggedType === 'new' && type === 'existing') {
        // Move from new to existing - this should not be allowed
        // New images should stay as files to be uploaded to Firebase Storage
        // We'll just reorder within the new images section instead
        console.warn('Cannot move new images to existing section. New images must be uploaded first.');
        return;
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggedType(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggedType(null);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('請輸入優惠標題');
      return false;
    }
    if (!formData.description.trim()) {
      setError('請輸入優惠描述');
      return false;
    }
    if (!formData.category) {
      setError('請選擇類別');
      return false;
    }
    if (formData.originalPrice <= 0) {
      setError('請輸入有效的原價');
      return false;
    }
    if (formData.currentPrice <= 0) {
      setError('請輸入有效的現價');
      return false;
    }
    if (formData.currentPrice >= formData.originalPrice) {
      setError('現價必須低於原價');
      return false;
    }
    if (formData.quantity <= 0) {
      setError('請輸入有效的數量');
      return false;
    }
    if (!formData.unit.trim()) {
      setError('請輸入單位');
      return false;
    }
    if (!formData.location.trim()) {
      setError('請輸入地點');
      return false;
    }
    if (formData.minOrderQuantity <= 0) {
      setError('請輸入有效的最小訂購量');
      return false;
    }
    if (formData.shippingEstimateDays <= 0) {
      setError('請輸入有效的運輸時間');
      return false;
    }
    // Check if there are any images to save (existing that aren't removed, or new images)
    const remainingExistingImages = existingImages.filter(img => !removedImages.includes(img));
    if (remainingExistingImages.length === 0 && newImages.length === 0) {
      setError('請至少上傳一張圖片');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);

      // Prepare final images array (existing - removed + new)
      const finalImages = [
        ...existingImages.filter(img => !removedImages.includes(img))
      ];

      await updateOffer(offerId!, {
        ...formData,
        images: finalImages
      }, newImages);

      alert('優惠更新成功！');
      navigate(`/hk/${user?.id}/my-offers`);
    } catch (err: any) {
      setError(err.message || '更新優惠失敗');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">載入優惠資料中...</p>
        </div>
      </div>
    );
  }

  if (error && !offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(`/hk/${user?.id}/my-offers`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回我的優惠
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/hk/${user?.id}/my-offers`)}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">編輯優惠</h1>
                <p className="text-xl text-gray-600">修改您的優惠內容</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                {offer?.offerId}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 ml-4">基本資訊</h2>
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
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 border-gray-300"
                  placeholder="例如：優質LED燈具 - 倉庫清倉"
                />
              </div>

              {/* Category */}
              <div className="category-dropdown-container">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  類別 *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="category-dropdown w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 border-gray-300"
                >
                  <option value="">選擇類別</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
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
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 border-gray-300"
                >
                  <option value="">選擇地點</option>
                  {LOCATIONS.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
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
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 resize-none border-gray-300"
                  placeholder="提供您的優惠詳細描述、條件、規格和任何買家應知的重要資訊..."
                />
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
              {formData.originalPrice && formData.currentPrice && (
                <div className="ml-auto bg-red-500 text-white px-4 py-2 rounded-lg font-bold">
                  -{Math.round(((formData.originalPrice - formData.currentPrice) / formData.originalPrice) * 100)}% OFF
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
                  onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 border-gray-300"
                  placeholder="0.00"
                  min="0"
                />
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
                  onChange={(e) => handleInputChange('currentPrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 border-gray-300"
                  placeholder="0.00"
                  min="0"
                />
                {formData.originalPrice && formData.currentPrice && formData.currentPrice >= formData.originalPrice && (
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
                    HKD {Math.max(0, formData.originalPrice - formData.currentPrice).toFixed(2)}
                  </div>
                  <div className="text-sm text-green-700">每 {formData.unit}</div>
                  {formData.originalPrice && formData.currentPrice && (
                    <div className="text-xs text-green-600 mt-1 font-medium">
                      ({Math.round(((formData.originalPrice - formData.currentPrice) / formData.originalPrice) * 100)}%折扣)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quantity and Shipping */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Total Quantity */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                  <Package className="h-4 w-4 mr-2 text-blue-600" />
                  可售數量 *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 border-gray-300"
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  單位
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 border-gray-300"
                >
                  <option value="">選擇單位</option>
                  <option value="件">件</option>
                  <option value="套">套</option>
                  <option value="米">米</option>
                  <option value="公斤">公斤</option>
                  <option value="升">升</option>
                  <option value="箱">箱</option>
                  <option value="托盤">托盤</option>
                  <option value="捆">捆</option>
                </select>
              </div>

              {/* Minimum Order Quantity */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  最小訂購數量 *
                </label>
                <input
                  type="number"
                  value={formData.minOrderQuantity}
                  onChange={(e) => handleInputChange('minOrderQuantity', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 border-gray-300"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Shipping Estimate */}
            <div className="mt-6">
              <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                <Truck className="h-4 w-4 mr-2 text-blue-600" />
                運輸預估 (天) *
              </label>
              <input
                type="number"
                value={formData.shippingEstimateDays}
                onChange={(e) => handleInputChange('shippingEstimateDays', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 border-gray-300"
                placeholder="1"
                min="1"
              />
            </div>
          </div>



          {/* Tags */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Tag className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 ml-4">標籤 (最多10個)</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 border-gray-300"
                  placeholder="添加標籤(例如:優質,高品質,批發)"
                  disabled={formData.tags.length >= 10}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!newTag.trim() || formData.tags.length >= 10}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-3 rounded-xl">
                <Camera className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 ml-4">產品圖片</h2>
              <span className="ml-auto text-sm text-gray-500 font-medium">
                {existingImages.filter(img => !removedImages.includes(img)).length + newImages.length}/5張圖片
              </span>
            </div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 提示：您可以拖拽圖片來重新排列順序。現有圖片和新上傳的圖片只能在各自區域內重新排序。第一張圖片將作為主要展示圖片
              </p>
            </div>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">現有圖片</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((imageUrl, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index, 'existing')}
                      onDragOver={(e) => handleDragOver(e, index, 'existing')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index, 'existing')}
                      onDragEnd={handleDragEnd}
                      className={`relative group cursor-move transition-all duration-200 ${
                        draggedIndex === index && draggedType === 'existing' ? 'opacity-50 scale-95' : ''
                      } ${
                        dragOverIndex === index && draggedType === 'existing' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={imageUrl}
                          alt={`圖片 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl"
                        />
                        {!removedImages.includes(imageUrl) && (
                          <>
                            <div className="absolute top-2 left-2 p-1 bg-black bg-opacity-50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExistingImage(imageUrl)}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {removedImages.includes(imageUrl) && (
                          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-xl flex items-center justify-center">
                            <span className="text-white text-sm font-medium">已移除</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Drop zone at the end of existing images */}
                  <div
                    onDragOver={(e) => handleDragOver(e, existingImages.length, 'existing')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, existingImages.length, 'existing')}
                    className={`min-h-[128px] border-2 border-dashed rounded-xl flex items-center justify-center transition-all duration-200 ${
                      dragOverIndex === existingImages.length && draggedType === 'existing' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-gray-500 text-sm">拖拽到這裡</span>
                  </div>
                </div>
              </div>
            )}

            {/* New Images */}
            {newImages.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">新上傳的圖片</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newImages.map((file, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index, 'new')}
                      onDragOver={(e) => handleDragOver(e, index, 'new')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index, 'new')}
                      onDragEnd={handleDragEnd}
                      className={`relative group cursor-move transition-all duration-200 ${
                        draggedIndex === index && draggedType === 'new' ? 'opacity-50 scale-95' : ''
                      } ${
                        dragOverIndex === index && draggedType === 'new' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`新圖片 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl"
                        />
                        <div className="absolute top-2 left-2 p-1 bg-black bg-opacity-50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Drop zone at the end of new images */}
                  <div
                    onDragOver={(e) => handleDragOver(e, newImages.length, 'new')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, newImages.length, 'new')}
                    className={`min-h-[128px] border-2 border-dashed rounded-xl flex items-center justify-center transition-all duration-200 ${
                      dragOverIndex === newImages.length && draggedType === 'new' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-gray-500 text-sm">拖拽到這裡</span>
                  </div>
                </div>
              </div>
            )}

            {/* Upload New Images */}
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-4">
                上傳新圖片
              </label>
                             <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors duration-200">
                 <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                 <p className="text-lg text-gray-600 mb-2 font-medium">
                   拖放圖片文件到這裡，或點擊選擇文件
                 </p>
                 <p className="text-sm text-gray-500 mb-4">
                   上傳最多5張高品質圖片(JPG, PNG, 每張最大10MB)
                 </p>
                                 <input
                   type="file"
                   multiple
                   accept="image/*"
                   onChange={(e) => handleImageUpload(e.target.files)}
                   className="hidden"
                   id="image-upload"
                   disabled={existingImages.filter(img => !removedImages.includes(img)).length + newImages.length >= 5}
                 />
                                 <label
                   htmlFor="image-upload"
                   className={`inline-flex items-center px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg ${
                     existingImages.filter(img => !removedImages.includes(img)).length + newImages.length >= 5
                       ? 'bg-gray-400 text-white cursor-not-allowed'
                       : 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer hover:shadow-xl'
                   }`}
                 >
                   <Camera className="h-5 w-5 mr-2" />
                   選擇圖片
                 </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-8">
            <button
              type="button"
              onClick={() => navigate(`/hk/${user?.id}/my-offers`)}
              className="px-8 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <>
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存更改
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOfferPage; 