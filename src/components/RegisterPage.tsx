import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RegisterData } from '../types';
import { LOCATIONS } from '../constants/categories';
import { getPhoneErrorMessage, filterPhoneInput } from '../utils/phoneUtils';
import { TrendingUp, Mail, Lock, Eye, EyeOff, AlertCircle, Loader, Building, Phone, MapPin, Check, ArrowLeft } from 'lucide-react';
import TermsModal from './TermsModal';
import { FORM_STYLES, getInputClassName } from '../utils/formStyles';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: () => void;
}

export default function RegisterPage({ onNavigateToLogin, onRegisterSuccess }: RegisterPageProps) {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState<RegisterData>({
    // name field removed - not needed during registration
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: '',
    location: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = '請輸入電子郵件';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件地址';
    }

    if (!formData.password) {
      newErrors.password = '請輸入密碼';
    } else if (formData.password.length < 6) {
      newErrors.password = '密碼至少需要6個字符';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '請確認您的密碼';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '密碼不匹配';
    }

    if (!formData.company.trim()) {
      newErrors.company = '請輸入公司名稱';
    }

    const phoneError = getPhoneErrorMessage(formData.phone);
    if (phoneError) {
      newErrors.phone = phoneError;
    }

    if (!formData.location.trim()) {
      newErrors.location = '請選擇地點';
    }

    if (!agreeToTerms) {
      newErrors.terms = '請同意服務條款和隱私政策';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await register(formData);
      if (success) {
        onRegisterSuccess();
      }
    } catch (err: any) {
      setErrors({ general: err.message || '註冊失敗。請重試。' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Go Back Button */}
        <div className="mb-6">
          <button onClick={() => navigate('/')} className={FORM_STYLES.backButton}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">返回首頁</span>
          </button>
        </div>

        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <span className="ml-3 text-3xl font-bold text-gray-900">ClearLot</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">建立您的帳戶</h1>
          <p className="text-gray-600">加入領先的B2B清倉市場 - 輕鬆買賣</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className={FORM_STYLES.errorMessage}>
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{errors.general}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                商業電子郵件
              </label>
              <div className="relative">
                <Mail className={FORM_STYLES.iconInput} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={getInputClassName(!!errors.email)}
                  placeholder="輸入您的商業電子郵件"
                />
              </div>
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                公司名稱
              </label>
              <div className="relative">
                <Building className={FORM_STYLES.iconInput} />
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className={getInputClassName(!!errors.company)}
                  placeholder="輸入您的公司名稱"
                />
              </div>
              {errors.company && <p className="text-red-600 text-sm mt-1">{errors.company}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Phone className="h-4 w-4 mr-2 text-blue-600" />
                電話號碼
              </label>
              <div className="flex">
                <div className="flex items-center px-3 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-700 font-medium text-sm">
                  +852
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', filterPhoneInput(e.target.value))}
                  className={`flex-1 pl-4 pr-4 py-3 border border-l-0 rounded-r-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="1234 5678"
                  maxLength={8}
                />
              </div>
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                地點
              </label>
              <div className="relative">
                <MapPin className={FORM_STYLES.iconInput} />
                <select
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={getInputClassName(!!errors.location)}
                >
                  <option value="">選擇您的地點</option>
                  {LOCATIONS.map((location, index) => (
                    <option key={index} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
              {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                密碼
              </label>
              <div className="relative">
                <Lock className={FORM_STYLES.iconInput} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={getInputClassName(!!errors.password, true)}
                  placeholder="建立密碼"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={FORM_STYLES.iconButton}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                確認密碼
              </label>
              <div className="relative">
                <Lock className={FORM_STYLES.iconInput} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={getInputClassName(!!errors.confirmPassword, true)}
                  placeholder="確認您的密碼"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={FORM_STYLES.iconButton}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Terms and Conditions Checkbox */}
            <div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <button
                    type="button"
                    onClick={() => setAgreeToTerms(!agreeToTerms)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      agreeToTerms 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {agreeToTerms && <Check className="h-3 w-3 text-white" />}
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    我已閱讀並同意{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className={FORM_STYLES.linkButton}
                    >
                      服務條款
                    </button>
                    {' '}和{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className={FORM_STYLES.linkButton}
                    >
                      隱私政策
                    </button>
                  </p>
                  {errors.terms && <p className="text-red-600 text-sm mt-1">{errors.terms}</p>}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className={FORM_STYLES.primaryButton}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  建立帳戶中...
                </>
              ) : (
                '建立帳戶'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              已有帳戶？{' '}
              <button onClick={onNavigateToLogin} className={FORM_STYLES.linkButton}>
                登入
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 ClearLot. 版權所有。</p>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
}