import React, { useState } from 'react';
import { Mail, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EmailVerificationPromptProps {
  onClose?: () => void;
}

export default function EmailVerificationPrompt({ onClose }: EmailVerificationPromptProps) {
  const { user, resendEmailVerification } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setError('');
    
    try {
      await resendEmailVerification();
      setResendSuccess(true);
    } catch (error: any) {
      console.error('Resend verification error:', error);
      setError(error.message || '重發驗證郵件失敗');
    } finally {
      setIsResending(false);
    }
  };

  if (!user || user.emailVerified) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Mail className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            請驗證您的電子郵件
          </h2>
          <p className="text-gray-600">
            我們已向您的電子郵件發送驗證連結
          </p>
        </div>

        {/* User Email */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">驗證電子郵件</p>
          <p className="font-medium text-gray-900">{user.email}</p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">請按照以下步驟完成驗證：</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>檢查您的電子郵件收件箱</li>
                <li>點擊驗證連結</li>
                <li>返回此頁面刷新</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Resend Button */}
        <div className="space-y-4">
          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isResending ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                重發中...
              </>
            ) : (
              <>
                <Mail className="h-5 w-5 mr-2" />
                重新發送驗證郵件
              </>
            )}
          </button>

          {/* Status Messages */}
          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-green-700 text-sm">
                  驗證郵件已重新發送，請檢查您的收件箱。
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-full text-gray-600 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              稍後驗證
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            如果您沒有收到驗證郵件，請檢查垃圾郵件文件夾，或聯繫客服支援。
          </p>
        </div>
      </div>
    </div>
  );
}

