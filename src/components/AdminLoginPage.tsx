import React, { useState } from 'react';
import { Eye, EyeOff, Shield, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/adminService';
import { AdminLoginCredentials } from '../types';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AdminLoginCredentials>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use real admin authentication
      const adminUser = await adminLogin(formData);
      
      // Store admin session
      localStorage.setItem('adminAuthenticated', 'true');
      localStorage.setItem('adminUser', JSON.stringify({
        id: adminUser.id,
        email: adminUser.email,
        company: adminUser.company,
        isAdmin: adminUser.isAdmin,
        lastLogin: new Date().toISOString()
      }));
      
      navigate('/hk/admin/dashboard');
    } catch (error: any) {
      setError(error.message || '登入失敗。請重試。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            管理員登入
          </h2>
          <p className="mt-2 text-sm text-blue-100">
            ClearLot 管理系統
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                電子郵件
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="輸入管理員電子郵件"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密碼
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="輸入密碼"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  登入中...
                </div>
              ) : (
                '登入'
              )}
            </button>
          </form>

          {/* Admin Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-700 mb-2">管理員登入說明:</h4>
            <div className="text-xs text-blue-600 space-y-1">
              <p>• 只有擁有管理員權限的用戶才能登入</p>
              <p>• 請使用您的註冊電子郵件和密碼</p>
              <p>• 如需管理員權限，請聯繫系統管理員</p>
            </div>
          </div>

          {/* Admin Credentials */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">預設管理員帳號:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>電子郵件:</strong> admin@clearlot.com</p>
              <p><strong>密碼:</strong> 123456</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-blue-200">
            © 2025 ClearLot 管理系統。保留所有權利。
          </p>
        </div>
      </div>
    </div>
  );
} 