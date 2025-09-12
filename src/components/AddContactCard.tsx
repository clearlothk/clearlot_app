import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Plus, 
  Save, 
  X, 
  Camera
} from 'lucide-react';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { filterPhoneInput } from '../utils/phoneUtils';

interface ContactPerson {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  department?: string;
  photo?: string;
}

interface AddContactCardProps {
  onAdd: (contact: ContactPerson) => void;
  onCancel: () => void;
}

export default function AddContactCard({ onAdd, onCancel }: AddContactCardProps) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    department: '',
    photo: ''
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle photo upload similar to company logo
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('請選擇有效的圖片文件');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片文件大小不能超過 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `contact-photos/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update form data with new photo URL
      setFormData(prev => ({ ...prev, photo: downloadURL }));
      
      console.log('Contact photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading contact photo:', error);
      alert('照片上傳失敗，請重試');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.name.trim() || !formData.title.trim() || 
        !formData.email.trim() || !formData.phone.trim() || !formData.department.trim()) {
      alert('請填寫所有必填字段');
      return;
    }

    // Email validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      alert('請輸入有效的郵箱地址');
      return;
    }

    // Phone validation
    if (formData.phone.length !== 8) {
      alert('電話號碼必須為8位數字');
      return;
    }

    // Create new contact with proper data validation
    const newContact: ContactPerson = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name.trim(),
      title: formData.title.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      department: formData.department.trim(),
      photo: formData.photo || null // Use null instead of undefined for Firestore
    };

    onAdd(newContact);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filteredValue = filterPhoneInput(e.target.value);
    setFormData(prev => ({ ...prev, phone: filteredValue }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-blue-300 overflow-hidden">
      {/* Add Contact Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-900 text-xl">添加新聯繫人</h4>
          <div className="flex space-x-2">
            <button
              onClick={handleSubmit}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
              title="保存"
            >
              <Save className="h-5 w-5" />
            </button>
            <button
              onClick={onCancel}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              title="取消"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Form */}
      <div className="p-6 space-y-4">
        {/* Photo Upload Section */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            {formData.photo ? (
              <img
                src={formData.photo}
                alt="聯繫人照片"
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                <Plus className="h-8 w-8" />
              </div>
            )}
            {/* Upload Button Overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -top-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-200 shadow-lg"
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">聯繫人照片</p>
            <p className="text-xs text-gray-500">點擊相機圖標上傳照片</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">姓名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="輸入姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">職位 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="輸入職位"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">郵箱 *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="輸入郵箱地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">電話 *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">+852</span>
              </div>
              <input
                type="text"
                value={formData.phone}
                onChange={handlePhoneChange}
                maxLength={8}
                className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12345678"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">部門 *</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">選擇部門</option>
              <option value="行政">行政 (Administration)</option>
              <option value="銷售">銷售 (Sales)</option>
              <option value="市場營銷">市場營銷 (Marketing)</option>
              <option value="客戶服務">客戶服務 (Customer Service)</option>
              <option value="財務">財務 (Finance)</option>
              <option value="人力資源">人力資源 (Human Resources)</option>
              <option value="技術支持">技術支持 (Technical Support)</option>
              <option value="採購">採購 (Procurement)</option>
              <option value="物流">物流 (Logistics)</option>
              <option value="研發">研發 (Research & Development)</option>
              <option value="質量控制">質量控制 (Quality Control)</option>
              <option value="法律">法律 (Legal)</option>
              <option value="其他">其他 (Others)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}