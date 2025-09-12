import React, { useState, useEffect } from 'react';
import { Mail, Phone, User, Briefcase, Camera, X } from 'lucide-react';
import { filterPhoneInput } from '../utils/phoneUtils';

interface ContactFormProps {
  contact?: {
    id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    department: string;
    photo?: string;
  };
  onSubmit: (contactData: any) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export default function ContactForm({ contact, onSubmit, onCancel, isEditing }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    title: contact?.title || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    department: contact?.department || '',
    photo: contact?.photo || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        title: contact.title || '',
        email: contact.email || '',
        phone: contact.phone || '',
        department: contact.department || '',
        photo: contact.photo || ''
      });
    }
  }, [contact]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = '姓名為必填項';
    }

    if (!formData.title.trim()) {
      newErrors.title = '職位為必填項';
    }

    if (!formData.email.trim()) {
      newErrors.email = '郵箱為必填項';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '請輸入有效的郵箱地址';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '電話為必填項';
    } else if (formData.phone.length !== 8) {
      newErrors.phone = '電話號碼必須為8位數字';
    }

    if (!formData.department.trim()) {
      newErrors.department = '部門為必填項';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filteredValue = filterPhoneInput(e.target.value);
    setFormData(prev => ({ ...prev, phone: filteredValue }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <User className="h-4 w-4 mr-2 text-blue-600" />
          姓名 *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="輸入姓名"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Briefcase className="h-4 w-4 mr-2 text-blue-600" />
          職位 *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="輸入職位"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Mail className="h-4 w-4 mr-2 text-blue-600" />
          郵箱 *
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="輸入郵箱地址"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Phone className="h-4 w-4 mr-2 text-blue-600" />
          電話 *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">+852</span>
          </div>
          <input
            type="text"
            value={formData.phone}
            onChange={handlePhoneChange}
            maxLength={8}
            className={`w-full pl-12 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="12345678"
          />
        </div>
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

             {/* Department */}
       <div>
         <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
           <Briefcase className="h-4 w-4 mr-2 text-blue-600" />
           部門 *
         </label>
         <select
           value={formData.department}
           onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
           className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
             errors.department ? 'border-red-300' : 'border-gray-300'
           }`}
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
         {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
       </div>

       {/* Photo Upload */}
       <div>
         <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
           <Camera className="h-4 w-4 mr-2 text-blue-600" />
           上傳照片
         </label>
         <div className="space-y-3">
           {formData.photo && (
             <div className="flex items-center space-x-3">
               <img
                 src={formData.photo}
                 alt="聯繫人照片"
                 className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
               />
               <button
                 type="button"
                 onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                 className="text-red-600 hover:text-red-700 text-sm"
               >
                 移除照片
               </button>
             </div>
           )}
           <div className="flex items-center space-x-3">
             <input
               type="url"
               value={formData.photo}
               onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.value }))}
               className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               placeholder="輸入照片URL鏈接"
             />
             <span className="text-gray-500 text-sm">或</span>
             <button
               type="button"
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
               onClick={() => {
                 const url = prompt('請輸入照片URL鏈接:');
                 if (url) {
                   setFormData(prev => ({ ...prev, photo: url }));
                 }
               }}
             >
               選擇照片
             </button>
           </div>
         </div>
         <p className="text-gray-500 text-xs mt-1">可選：輸入照片的URL鏈接或點擊選擇照片</p>
       </div>

      {/* Form Actions */}
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          {isEditing ? '更新' : '添加'}
        </button>
      </div>
    </form>
  );
} 