import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Camera,
  Upload
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

interface ContactPersonCardProps {
  contact: ContactPerson;
  onUpdate: (contact: ContactPerson) => void;
  onDelete: (contactId: string) => void;
  isEditing: boolean;
  onEdit: (contact: ContactPerson) => void;
  onCancelEdit: () => void;
}

export default function ContactPersonCard({ 
  contact, 
  onUpdate, 
  onDelete, 
  isEditing, 
  onEdit, 
  onCancelEdit 
}: ContactPersonCardProps) {
  const [editingContact, setEditingContact] = useState<ContactPerson>(contact);
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
      
      // Update contact with new photo URL
      const updatedContact = { ...editingContact, photo: downloadURL };
      setEditingContact(updatedContact);
      
      console.log('Contact photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading contact photo:', error);
      alert('照片上傳失敗，請重試');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = () => {
    // Basic validation
    if (!editingContact.name.trim() || !editingContact.title.trim() || 
        !editingContact.email.trim() || !editingContact.phone.trim()) {
      alert('請填寫所有必填字段');
      return;
    }

    // Email validation
    if (!/\S+@\S+\.\S+/.test(editingContact.email)) {
      alert('請輸入有效的郵箱地址');
      return;
    }

    // Phone validation
    if (editingContact.phone.length !== 8) {
      alert('電話號碼必須為8位數字');
      return;
    }

    onUpdate(editingContact);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filteredValue = filterPhoneInput(e.target.value);
    setEditingContact(prev => ({ ...prev, phone: filteredValue }));
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Edit Mode Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-900 text-xl">編輯聯繫人</h4>
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                title="保存"
              >
                <Save className="h-5 w-5" />
              </button>
              <button
                onClick={onCancelEdit}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                title="取消"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="p-6 space-y-4">
          {/* Photo Upload Section */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              {editingContact.photo ? (
                <img
                  src={editingContact.photo}
                  alt="聯繫人照片"
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                  {(editingContact.name || 'C')[0].toUpperCase()}
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
                value={editingContact.name}
                onChange={(e) => setEditingContact(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="輸入姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">職位 *</label>
              <input
                type="text"
                value={editingContact.title}
                onChange={(e) => setEditingContact(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="輸入職位"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">郵箱 *</label>
              <input
                type="email"
                value={editingContact.email}
                onChange={(e) => setEditingContact(prev => ({ ...prev, email: e.target.value }))}
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
                  value={editingContact.phone}
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
                value={editingContact.department || ''}
                onChange={(e) => setEditingContact(prev => ({ ...prev, department: e.target.value }))}
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

  // Display Mode
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Contact Header with Photo */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {contact.photo ? (
              <img
                src={contact.photo}
                alt={contact.name || '聯繫人照片'}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                {(contact.name || 'C')[0].toUpperCase()}
              </div>
            )}
            <div>
              <h4 className="font-bold text-gray-900 text-xl mb-1">
                {contact.name || '未設置姓名'}
              </h4>
              <p className="text-gray-600 font-medium">
                {contact.title || '未設置職位'}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {contact.department || '未設置部門'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(contact)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="編輯"
            >
              <Edit3 className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(contact.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="刪除"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="p-6 space-y-4">
        {/* Email */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <Mail className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">郵箱地址</p>
            <p className="text-gray-900 font-medium">
              {contact.email || '未設置郵箱'}
            </p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <Phone className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">電話號碼</p>
            <p className="text-gray-900 font-medium">
              {contact.phone ? `+852 ${contact.phone}` : '未設置電話'}
            </p>
          </div>
        </div>

        {/* Department */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <Briefcase className="h-5 w-5 text-purple-600" />
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">所屬部門</p>
            <p className="text-gray-900 font-medium">
              {contact.department || '未設置部門'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}