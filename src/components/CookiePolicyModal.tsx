import React from 'react';
import { X } from 'lucide-react';

interface CookiePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CookiePolicyModal({ isOpen, onClose }: CookiePolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          onClick={onClose}
        ></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Cookie 政策</h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-gray-600 mb-4">
                <strong>最後更新日期：</strong> 2025年1月
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">什麼是 Cookie？</h4>
              <p className="text-sm text-gray-600 mb-4">
                Cookie 是當您訪問網站時存儲在您設備上的小型文本文件。它們幫助網站記住您的偏好和設置，以提供更好的用戶體驗。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">我們如何使用 Cookie</h4>
              <p className="text-sm text-gray-600 mb-3">
                ClearLot 使用 Cookie 來：
              </p>
              <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
                <li>記住您的登入狀態和用戶偏好</li>
                <li>改善網站性能和用戶體驗</li>
                <li>分析網站使用情況以優化服務</li>
                <li>提供個性化的內容和推薦</li>
                <li>確保網站安全和防止欺詐</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Cookie 類型</h4>
              
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">必要 Cookie</h5>
                <p className="text-sm text-gray-600 mb-2">
                  這些 Cookie 對於網站的基本功能是必需的，無法關閉。它們包括：
                </p>
                <ul className="text-sm text-gray-600 mb-3 list-disc list-inside space-y-1">
                  <li>用戶認證和會話管理</li>
                  <li>購物車和交易處理</li>
                  <li>安全性和欺詐防護</li>
                </ul>
              </div>
              
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">功能 Cookie</h5>
                <p className="text-sm text-gray-600 mb-2">
                  這些 Cookie 增強網站功能，但可以選擇關閉：
                </p>
                <ul className="text-sm text-gray-600 mb-3 list-disc list-inside space-y-1">
                  <li>語言和地區偏好</li>
                  <li>用戶界面設置</li>
                  <li>記住搜索歷史</li>
                </ul>
              </div>
              
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">分析 Cookie</h5>
                <p className="text-sm text-gray-600 mb-2">
                  這些 Cookie 幫助我們了解網站使用情況：
                </p>
                <ul className="text-sm text-gray-600 mb-3 list-disc list-inside space-y-1">
                  <li>頁面訪問統計</li>
                  <li>用戶行為分析</li>
                  <li>網站性能監控</li>
                </ul>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Cookie 管理</h4>
              <p className="text-sm text-gray-600 mb-3">
                您可以通過以下方式管理 Cookie：
              </p>
              <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
                <li>使用瀏覽器設置來阻止或刪除 Cookie</li>
                <li>在我們的網站設置中調整 Cookie 偏好</li>
                <li>聯繫我們以獲取更多幫助</li>
              </ul>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>注意：</strong> 如果您選擇禁用某些 Cookie，可能會影響網站的某些功能，包括登入、購物車和個性化體驗。
                </p>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">第三方 Cookie</h4>
              <p className="text-sm text-gray-600 mb-4">
                我們可能會使用第三方服務（如 Google Analytics、支付處理商等），這些服務可能會設置自己的 Cookie。請查看這些第三方的隱私政策以了解他們如何使用 Cookie。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">聯繫我們</h4>
              <p className="text-sm text-gray-600 mb-4">
                如果您對我們的 Cookie 政策有任何疑問，請通過以下方式聯繫我們：
              </p>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>電子郵件：</strong> support@clearlot.app</p>
                <p><strong>地址：</strong> Flat E10, 13/F, Block E, Tsing Yi Industrial Centre, Phase 2, Tsing Yi, NT</p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  本 Cookie 政策可能會不時更新。我們建議您定期查看此頁面以了解任何變更。
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
