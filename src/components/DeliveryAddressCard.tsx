import React, { useState } from 'react';
import { MapPin, User, Phone, Edit3, Save, X, Trash2, Star } from 'lucide-react';
import { LOCATIONS, DISTRICT_SUBDIVISIONS } from '../constants/categories';
import { filterPhoneInput, validateHongKongPhone } from '../utils/phoneUtils';

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

interface DeliveryAddressCardProps {
  address: DeliveryAddress;
  onUpdate: (id: string, updatedAddress: Omit<DeliveryAddress, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  isEditing?: boolean;
  onEdit?: () => void;
  onCancelEdit?: () => void;
}

export default function DeliveryAddressCard({
  address,
  onUpdate,
  onDelete,
  onSetDefault,
  isEditing = false,
  onEdit,
  onCancelEdit
}: DeliveryAddressCardProps) {
  const [formData, setFormData] = useState({
    district: address.district,
    subdivision: address.subdivision,
    address1: address.address1,
    address2: address.address2 || '',
    contactPersonName: address.contactPersonName,
    contactPersonPhone: address.contactPersonPhone
  });

  const handleSave = () => {
    if (!formData.district.trim() || !formData.subdivision.trim() || !formData.address1.trim() || !formData.contactPersonName.trim() || !formData.contactPersonPhone.trim()) {
      alert('請填寫所有必填欄位');
      return;
    }

    onUpdate(address.id, {
      ...formData,
      isDefault: address.isDefault
    });
  };

  const handleCancel = () => {
    setFormData({
      district: address.district,
      subdivision: address.subdivision,
      address1: address.address1,
      address2: address.address2 || '',
      contactPersonName: address.contactPersonName,
      contactPersonPhone: address.contactPersonPhone
    });
    onCancelEdit?.();
  };

  if (isEditing) {
    return (
      <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">編輯送貨地址</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              title="保存"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              title="取消"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分區 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.district}
              onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value, subdivision: '' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={!formData.district}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="請輸入地址 1"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="請輸入聯絡人姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                聯絡人電話 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">+852</span>
                </div>
                <input
                  type="text"
                  value={formData.contactPersonPhone}
                  onChange={(e) => {
                    const filteredValue = filterPhoneInput(e.target.value);
                    if (filteredValue.length <= 8) {
                      setFormData(prev => ({ ...prev, contactPersonPhone: filteredValue }));
                    }
                  }}
                  maxLength={8}
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="12345678"
                />
              </div>
              {formData.contactPersonPhone && !validateHongKongPhone(formData.contactPersonPhone) && (
                <p className="text-red-500 text-sm mt-1">電話號碼必須是8位數字</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-md ${
      address.isDefault ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            address.isDefault ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <MapPin className={`h-4 w-4 ${
              address.isDefault ? 'text-blue-600' : 'text-gray-600'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <span>送貨地址</span>
              {address.isDefault && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Star className="h-3 w-3 mr-1" />
                  預設
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500">
              建立於 {new Date(address.createdAt).toLocaleDateString('zh-TW')}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="編輯"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(address.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="刪除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Address Details */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700">地址</p>
            <div className="text-gray-600">
              <p><span className="font-medium">分區：</span>{address.district}</p>
              <p><span className="font-medium">細分地區：</span>{address.subdivision}</p>
              <p><span className="font-medium">地址 1：</span>{address.address1}</p>
              {address.address2 && <p><span className="font-medium">地址 2：</span>{address.address2}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700">聯絡人</p>
            <p className="text-gray-600">{address.contactPersonName}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700">電話</p>
            <p className="text-gray-600">{address.contactPersonPhone}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!address.isDefault && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => onSetDefault(address.id)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
          >
            設為預設地址
          </button>
        </div>
      )}
    </div>
  );
}
