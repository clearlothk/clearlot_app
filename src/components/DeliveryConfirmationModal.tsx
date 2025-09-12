import React, { useState, useEffect } from 'react';
import { MapPin, User, Phone, CheckCircle, ArrowRight, Star, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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

interface DeliveryConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deliveryDetails: {
    district: string;
    subdivision: string;
    address1: string;
    address2?: string;
    contactPersonName: string;
    contactPersonPhone: string;
    remarks?: string;
    isFromSavedAddress?: boolean;
    savedAddressId?: string;
  }) => void;
  purchaseId: string;
  isLoading?: boolean;
}

export default function DeliveryConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  purchaseId,
  isLoading = false
}: DeliveryConfirmationModalProps) {
  const { user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [customAddress, setCustomAddress] = useState({
    district: '',
    subdivision: '',
    address1: '',
    address2: '',
    contactPersonName: '',
    contactPersonPhone: ''
  });
  const [remarks, setRemarks] = useState('');

  // Load saved addresses from user data
  useEffect(() => {
    if (user?.deliveryAddresses) {
      setSavedAddresses(user.deliveryAddresses);
      // Set default address if available
      const defaultAddress = user.deliveryAddresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    }
  }, [user?.deliveryAddresses]);

  if (!isOpen) return null;

  const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);

  const handleConfirm = () => {
    if (useCustomAddress) {
      if (!customAddress.district.trim() || !customAddress.subdivision.trim() || !customAddress.address1.trim() || !customAddress.contactPersonName.trim() || !customAddress.contactPersonPhone.trim()) {
        alert('請填寫所有必填欄位');
        return;
      }
      
      onConfirm({
        district: customAddress.district,
        subdivision: customAddress.subdivision,
        address1: customAddress.address1,
        address2: customAddress.address2.trim() || undefined,
        contactPersonName: customAddress.contactPersonName,
        contactPersonPhone: customAddress.contactPersonPhone,
        remarks: remarks.trim() || undefined,
        isFromSavedAddress: false
      });
    } else {
      if (!selectedAddress) {
        alert('請選擇一個送貨地址');
        return;
      }
      
      onConfirm({
        district: selectedAddress.district,
        subdivision: selectedAddress.subdivision,
        address1: selectedAddress.address1,
        address2: selectedAddress.address2,
        contactPersonName: selectedAddress.contactPersonName,
        contactPersonPhone: selectedAddress.contactPersonPhone,
        remarks: remarks.trim() || undefined,
        isFromSavedAddress: true,
        savedAddressId: selectedAddress.id
      });
    }
  };

  const handleClose = () => {
    setSelectedAddressId('');
    setUseCustomAddress(false);
    setCustomAddress({ district: '', subdivision: '', address1: '', address2: '', contactPersonName: '', contactPersonPhone: '' });
    setRemarks('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">確認送貨地址</h3>
              <p className="text-sm text-gray-500">請確認您的送貨地址和聯絡人信息</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            disabled={isLoading}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Address Selection */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">選擇送貨地址</h4>
              
              {/* Saved Addresses */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="useSaved"
                      name="addressType"
                      checked={!useCustomAddress}
                      onChange={() => setUseCustomAddress(false)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={isLoading}
                    />
                    <label htmlFor="useSaved" className="text-sm font-medium text-gray-700">
                      使用已保存的地址
                    </label>
                  </div>
                  
                  {!useCustomAddress && (
                    <div className="ml-6 space-y-3">
                      {savedAddresses.map((address) => (
                        <div
                          key={address.id}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                            selectedAddressId === address.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedAddressId(address.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <input
                                  type="radio"
                                  name="savedAddress"
                                  checked={selectedAddressId === address.id}
                                  onChange={() => setSelectedAddressId(address.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                  disabled={isLoading}
                                />
                                <span className="font-medium text-gray-900">送貨地址</span>
                                {address.isDefault && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Star className="h-3 w-3 mr-1" />
                                    預設
                                  </span>
                                )}
                              </div>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-start space-x-2">
                                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p><span className="font-medium">分區：</span>{address.district}</p>
                                    <p><span className="font-medium">細分地區：</span>{address.subdivision}</p>
                                    <p><span className="font-medium">地址 1：</span>{address.address1}</p>
                                    {address.address2 && <p><span className="font-medium">地址 2：</span>{address.address2}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span>{address.contactPersonName}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span>{address.contactPersonPhone}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Custom Address Option */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="useCustom"
                    name="addressType"
                    checked={useCustomAddress}
                    onChange={() => setUseCustomAddress(true)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={isLoading}
                  />
                  <label htmlFor="useCustom" className="text-sm font-medium text-gray-700">
                    使用新的送貨地址
                  </label>
                </div>
                
                {useCustomAddress && (
                  <div className="ml-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        分區 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={customAddress.district}
                        onChange={(e) => setCustomAddress(prev => ({ ...prev, district: e.target.value, subdivision: '' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
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
                        value={customAddress.subdivision}
                        onChange={(e) => setCustomAddress(prev => ({ ...prev, subdivision: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!customAddress.district || isLoading}
                      >
                        <option value="">請選擇細分地區</option>
                        {customAddress.district && DISTRICT_SUBDIVISIONS[customAddress.district as keyof typeof DISTRICT_SUBDIVISIONS]?.map((subdivision) => (
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
                        value={customAddress.address1}
                        onChange={(e) => setCustomAddress(prev => ({ ...prev, address1: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="請輸入地址 1"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        地址 2
                      </label>
                      <input
                        type="text"
                        value={customAddress.address2}
                        onChange={(e) => setCustomAddress(prev => ({ ...prev, address2: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="請輸入地址 2 (可選)"
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          聯絡人姓名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customAddress.contactPersonName}
                          onChange={(e) => setCustomAddress(prev => ({ ...prev, contactPersonName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="請輸入聯絡人姓名"
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          聯絡人電話 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={customAddress.contactPersonPhone}
                          onChange={(e) => setCustomAddress(prev => ({ ...prev, contactPersonPhone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="請輸入聯絡人電話"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                備註 (給賣家的留言)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="請輸入任何特殊要求或備註..."
                disabled={isLoading}
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">重要提醒</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    確認送貨地址後，您可以在訂單詳情中編輯地址，直到賣家發貨為止。
                    賣家將根據您提供的聯絡人信息安排送貨。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              isLoading ||
              (!useCustomAddress && !selectedAddress) ||
              (useCustomAddress && (!customAddress.district.trim() || !customAddress.subdivision.trim() || !customAddress.address1.trim() || !customAddress.contactPersonName.trim() || !customAddress.contactPersonPhone.trim()))
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>處理中...</span>
              </>
            ) : (
              <>
                <span>確認送貨地址</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
