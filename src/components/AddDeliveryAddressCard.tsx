import React, { useState } from 'react';
import { MapPin, User, Phone, Plus, Save, X } from 'lucide-react';
import { LOCATIONS, DISTRICT_SUBDIVISIONS } from '../constants/categories';

interface DeliveryAddress {
  id: string;
  district: string;
  subdivision: string;
  address1: string;
  address2?: string;
  contactPersonName: string;
  contactPersonPhone: string;
  isDefault?: boolean;
  createdAt: string;
}

interface AddDeliveryAddressCardProps {
  onAdd: (address: Omit<DeliveryAddress, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function AddDeliveryAddressCard({ onAdd, onCancel }: AddDeliveryAddressCardProps) {
  const [formData, setFormData] = useState({
    district: '',
    subdivision: '',
    address1: '',
    address2: '',
    contactPersonName: '',
    contactPersonPhone: '',
    isDefault: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.district.trim() || !formData.subdivision.trim() || !formData.address1.trim() || !formData.contactPersonName.trim() || !formData.contactPersonPhone.trim()) {
      alert('請填寫所有必填欄位');
      return;
    }

    onAdd(formData);
  };

  const handleCancel = () => {
    setFormData({
      district: '',
      subdivision: '',
      address1: '',
      address2: '',
      contactPersonName: '',
      contactPersonPhone: '',
      isDefault: false
    });
    onCancel();
  };

  return (
    <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 shadow-sm hover:border-blue-400 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Plus className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">新增送貨地址</h3>
        </div>
        <button
          onClick={handleCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title="取消"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            分區 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.district}
            onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value, subdivision: '' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">請選擇分區</option>
            {LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            細分地區 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.subdivision}
            onChange={(e) => setFormData(prev => ({ ...prev, subdivision: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!formData.district}
            required
          >
            <option value="">請選擇細分地區</option>
            {formData.district && DISTRICT_SUBDIVISIONS[formData.district as keyof typeof DISTRICT_SUBDIVISIONS]?.map((subdivision) => (
              <option key={subdivision} value={subdivision}>
                {subdivision}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            地址 1 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.address1}
            onChange={(e) => setFormData(prev => ({ ...prev, address1: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="請輸入地址 1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            地址 2
          </label>
          <input
            type="text"
            value={formData.address2}
            onChange={(e) => setFormData(prev => ({ ...prev, address2: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="請輸入地址 2 (可選)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              聯絡人姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.contactPersonName}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPersonName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="請輸入聯絡人姓名"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              聯絡人電話 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.contactPersonPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPersonPhone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="請輸入聯絡人電話"
              required
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDefault"
            checked={formData.isDefault}
            onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
            設為預設送貨地址
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>新增地址</span>
          </button>
        </div>
      </form>
    </div>
  );
}
