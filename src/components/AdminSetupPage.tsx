import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { createOfficialAdmin } from '../services/adminService';

export default function AdminSetupPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [error, setError] = useState('');

  const handleCreateOfficialAdmin = async () => {
    setIsCreating(true);
    setError('');
    
    try {
      await createOfficialAdmin();
      setIsCreated(true);
    } catch (err: any) {
      setError(err.message || '创建官方管理员账户失败');
    } finally {
      setIsCreating(false);
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
            管理員設置
          </h2>
          <p className="mt-2 text-sm text-blue-100">
            ClearLot 管理系統設置
          </p>
        </div>

        {/* Setup Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                創建官方管理員賬戶
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                此功能將創建新的官方管理員賬戶，用於管理 ClearLot 平台。
              </p>
            </div>

            {/* Official Admin Credentials */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-2">官方管理員憑證:</h4>
              <div className="text-xs text-blue-600 space-y-1">
                <p><strong>電子郵件:</strong> support@clearlot.app</p>
                <p><strong>密碼:</strong> cl777888</p>
              </div>
            </div>

            {/* Status Messages */}
            {isCreated && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <p className="text-sm text-green-600">官方管理員賬戶創建成功！</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreateOfficialAdmin}
              disabled={isCreating || isCreated}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isCreating ? (
                <div className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  創建中...
                </div>
              ) : isCreated ? (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  已創建
                </div>
              ) : (
                '創建官方管理員賬戶'
              )}
            </button>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">使用說明:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• 點擊上方按鈕創建官方管理員賬戶</p>
                <p>• 創建完成後，可以使用憑證登入管理系統</p>
                <p>• 此賬戶具有完整的系統管理權限</p>
                <p>• 請妥善保管登入憑證</p>
              </div>
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
