import React from 'react';
import { ExternalLink, Copy, CheckCircle, TrendingUp, User, Package } from 'lucide-react';
import { generateProfileSlug, generateOffersSlug } from '../utils/slugUtils';

interface SlugInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  companyName: string;
}

export default function SlugInfoModal({ isOpen, onClose, userId, companyName }: SlugInfoModalProps) {
  const [copiedLink, setCopiedLink] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const profileSlug = generateProfileSlug(userId);
  const offersSlug = generateOffersSlug(userId);
  const baseUrl = window.location.origin;

  const handleCopyLink = async (link: string, type: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(type);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('複製失敗:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ExternalLink className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">恭喜！您的個人頁面已創建</h2>
                <p className="text-blue-100">現在您可以分享專屬鏈接給客戶了</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors duration-200"
            >
              <CheckCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {companyName} 的專屬頁面
            </h3>
            <p className="text-gray-600">
              這些是您的專屬個人鏈接，其他用戶可以通過這些鏈接查看您的公司資料和優惠商品
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Profile Link */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">個人資料頁面</h4>
                  <p className="text-sm text-gray-600">展示您的公司詳細資料</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 mb-4 border border-blue-200">
                <code className="text-sm text-gray-700 break-all font-mono">
                  {baseUrl}{profileSlug}
                </code>
              </div>
              
              <button
                onClick={() => handleCopyLink(`${baseUrl}${profileSlug}`, 'profile')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
              >
                {copiedLink === 'profile' ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>已複製！</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>複製鏈接</span>
                  </>
                )}
              </button>
            </div>

            {/* Offers Link */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">優惠商品頁面</h4>
                  <p className="text-sm text-gray-600">展示您的所有優惠商品</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 mb-4 border border-green-200">
                <code className="text-sm text-gray-700 break-all font-mono">
                  {baseUrl}{offersSlug}
                </code>
              </div>
              
              <button
                onClick={() => handleCopyLink(`${baseUrl}${offersSlug}`, 'offers')}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
              >
                {copiedLink === 'offers' ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>已複製！</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>複製鏈接</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">如何使用這些鏈接？</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 將鏈接分享給客戶，讓他們直接訪問您的頁面</li>
                  <li>• 在社交媒體、名片或宣傳材料中使用這些鏈接</li>
                  <li>• 客戶可以通過這些鏈接了解您的公司和商品</li>
                  <li>• 所有頁面都會自動更新，無需手動維護</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => window.open(`${baseUrl}${profileSlug}`, '_blank')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>查看個人資料頁面</span>
            </button>
            
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
            >
              完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 