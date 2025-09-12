import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../types';
import { TrendingUp, Mail, Lock, Eye, EyeOff, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import { FORM_STYLES, getInputClassName } from '../utils/formStyles';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onLoginSuccess: () => void;
}

export default function LoginPage({ onNavigateToRegister, onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(credentials);
      if (success) {
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message || '登入失敗。請重試。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">歡迎回來</h1>
          <p className="text-gray-600">登入以存取獨家B2B優惠</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                電子郵件地址
              </label>
              <div className="relative">
                <Mail className={FORM_STYLES.iconInput} />
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={getInputClassName(false)}
                  placeholder="輸入您的商業電子郵件"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                密碼
              </label>
              <div className="relative">
                <Lock className={FORM_STYLES.iconInput} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={getInputClassName(false, true)}
                  placeholder="輸入您的密碼"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={FORM_STYLES.iconButton}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className={FORM_STYLES.errorMessage}>
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className={FORM_STYLES.primaryButton}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  登入中...
                </>
              ) : (
                '登入'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              還沒有帳戶？{' '}
              <button onClick={onNavigateToRegister} className={FORM_STYLES.linkButton}>
                建立帳戶
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 ClearLot. 版權所有。</p>
        </div>
      </div>
    </div>
  );
}