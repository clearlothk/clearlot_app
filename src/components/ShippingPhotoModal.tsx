import React, { useState, useCallback, useEffect } from 'react';
import { X, Upload, Camera, Trash2, Plus, MapPin, User, Phone, MessageSquare } from 'lucide-react';
import { uploadShippingPhotos } from '../services/firebaseService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface ShippingPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: string;
  onSuccess: () => void;
}

interface PhotoFile {
  file: File;
  previewUrl: string;
  id: string;
}

export default function ShippingPhotoModal({ isOpen, onClose, purchaseId, onSuccess }: ShippingPhotoModalProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [remarks, setRemarks] = useState('');

  const MAX_PHOTOS = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Fetch delivery details when modal opens
  useEffect(() => {
    if (isOpen && purchaseId) {
      fetchDeliveryDetails();
    }
  }, [isOpen, purchaseId]);

  const fetchDeliveryDetails = async () => {
    try {
      setLoadingDetails(true);
      const purchaseRef = doc(db, 'purchases', purchaseId);
      const purchaseDoc = await getDoc(purchaseRef);
      
      if (purchaseDoc.exists()) {
        const purchaseData = purchaseDoc.data();
        setDeliveryDetails(purchaseData.deliveryDetails || null);
      }
    } catch (error) {
      console.error('Error fetching delivery details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return '請選擇圖片文件';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return '圖片大小不能超過 5MB';
    }

    if (selectedPhotos.length >= MAX_PHOTOS) {
      return `最多只能上傳 ${MAX_PHOTOS} 張照片`;
    }

    return null;
  };

  const addPhoto = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const newPhoto: PhotoFile = {
        file,
        previewUrl: e.target?.result as string,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };
      setSelectedPhotos(prev => [...prev, newPhoto]);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        addPhoto(file);
      });
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const removePhoto = (photoId: string) => {
    setSelectedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      Array.from(e.dataTransfer.files).forEach(file => {
        addPhoto(file);
      });
    }
  }, []);

  const handleUpload = async () => {
    if (selectedPhotos.length === 0) {
      setError('請選擇至少一張發貨照片');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await uploadShippingPhotos(purchaseId, selectedPhotos.map(p => p.file), remarks.trim());
      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedPhotos([]);
    setError(null);
    setDeliveryDetails(null);
    setRemarks('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">上傳發貨照片</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Delivery Details Section */}
          {loadingDetails ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ) : deliveryDetails ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                配送地址詳情
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700">
                      {deliveryDetails.district} {deliveryDetails.subdivision}
                    </p>
                    <p className="text-gray-700">
                      {deliveryDetails.address1}
                      {deliveryDetails.address2 && `, ${deliveryDetails.address2}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">聯繫人：{deliveryDetails.contactPersonName}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">電話：{deliveryDetails.contactPersonPhone}</span>
                </div>
                {deliveryDetails.remarks && (
                  <div className="flex items-start">
                    <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700 font-medium">備註：</p>
                      <p className="text-gray-600">{deliveryDetails.remarks}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ 無法載入配送地址詳情，請確認訂單信息。
              </p>
            </div>
          )}

          {/* Photo Count Display */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              已選擇 {selectedPhotos.length} / {MAX_PHOTOS} 張照片
            </span>
            {selectedPhotos.length > 0 && (
              <button
                onClick={() => setSelectedPhotos([])}
                className="text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                清除所有
              </button>
            )}
          </div>

          {/* File Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : selectedPhotos.length >= MAX_PHOTOS 
                  ? 'border-gray-300 bg-gray-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="shipping-photo-input"
              disabled={selectedPhotos.length >= MAX_PHOTOS}
            />
            <label 
              htmlFor="shipping-photo-input" 
              className={`cursor-pointer ${selectedPhotos.length >= MAX_PHOTOS ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {selectedPhotos.length === 0 ? (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Camera className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">選擇發貨照片</p>
                  <p className="text-xs text-gray-500">支持 JPG, PNG, GIF 格式，最大 5MB，最多 {MAX_PHOTOS} 張</p>
                  <p className="text-xs text-blue-600">拖拽照片到此處或點擊選擇</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Plus className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedPhotos.length >= MAX_PHOTOS ? '已達最大數量' : '點擊添加更多照片'}
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Photo Grid */}
          {selectedPhotos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.previewUrl}
                    alt="發貨照片預覽"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                    {photo.file.name.length > 20 
                      ? photo.file.name.substring(0, 20) + '...' 
                      : photo.file.name
                    }
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Remarks Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              給買家的備註
            </h3>
            <div className="space-y-2">
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="請輸入給買家的備註信息（可選，最多300字）..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows={4}
                maxLength={300}
                disabled={isUploading}
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>例如：包裹已妥善包裝，請注意查收</span>
                <span className={remarks.length > 250 ? 'text-red-500' : 'text-gray-500'}>
                  {remarks.length}/300
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>提示：</strong>請上傳清晰的發貨證明照片，包含包裹、快遞單號(如果有)、配送地址等信息。建議上傳多角度照片以便審核。請確保照片中包含上述配送地址詳情。
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isUploading}
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedPhotos.length === 0 || isUploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                上傳中... ({selectedPhotos.length} 張)
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                確認發貨 ({selectedPhotos.length} 張)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 