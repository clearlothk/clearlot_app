import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateProfileSlug, generateOffersSlug } from '../utils/slugUtils';

export default function SlugTestPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Slug 功能測試頁面</h1>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">用戶認證狀態</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">用戶對象狀態</h3>
              <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">關鍵屬性檢查</h3>
              <div className="space-y-2 text-sm">
                <div>用戶ID: <span className="font-mono bg-blue-100 px-2 py-1 rounded">{user?.id || '未定義'}</span></div>
                <div>公司名稱: <span className="font-mono bg-green-100 px-2 py-1 rounded">{user?.company || '未定義'}</span></div>
                <div>電子郵件: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{user?.email || '未定義'}</span></div>
                <div>認證狀態: <span className="font-mono bg-purple-100 px-2 py-1 rounded">{user?.isVerified ? '已認證' : '未認證'}</span></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Slug 鏈接生成</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">個人資料頁面:</span>
                  <div className="font-mono bg-blue-100 px-3 py-2 rounded mt-1 break-all">
                    {user?.id ? generateProfileSlug(user.id) : '需要用戶ID'}
                  </div>
                </div>
                <div>
                  <span className="font-semibold">優惠商品頁面:</span>
                  <div className="font-mono bg-green-100 px-3 py-2 rounded mt-1 break-all">
                    {user?.id ? generateOffersSlug(user.id) : '需要用戶ID'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">完整 URL</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">個人資料頁面:</span>
                  <div className="font-mono bg-blue-100 px-3 py-2 rounded mt-1 break-all">
                    {user?.id ? `${window.location.origin}${generateProfileSlug(user.id)}` : '需要用戶ID'}
                  </div>
                </div>
                <div>
                  <span className="font-semibold">優惠商品頁面:</span>
                  <div className="font-mono bg-green-100 px-3 py-2 rounded mt-1 break-all">
                    {user?.id ? `${window.location.origin}${generateOffersSlug(user.id)}` : '需要用戶ID'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">測試鏈接</h2>
          
          {user?.id ? (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <a
                  href={generateProfileSlug(user.id)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  測試個人資料頁面
                </a>
                <a
                  href={generateOffersSlug(user.id)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                >
                  測試優惠商品頁面
                </a>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">
                  ✅ 用戶已登入，可以測試 Slug 功能
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                ⚠️ 用戶未登入或數據未加載，無法生成 Slug 鏈接
              </p>
              <p className="text-yellow-700 text-sm mt-2">
                請確保您已經登入，並且用戶數據已正確加載。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 