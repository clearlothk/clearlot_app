import React from 'react';
import { Package, TrendingUp, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function BrowseOffersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleMarketplaceNavigation = () => {
    if (user) {
      // 如果用戶已登錄，導向到用戶的專屬市場頁面
      navigate(`/hk/${user.id}/marketplace`);
    } else {
      // 如果用戶未登錄，導向到註冊頁面
      navigate('/hk/register');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">瀏覽獨家B2B優惠</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            搜尋來自所有行業認證供應商的令人難以置信的優惠。
            在我們精心策劃的市場中，批發價格節省高達90%。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleMarketplaceNavigation}
              className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors duration-200 flex items-center justify-center shadow-lg"
            >
              <Package className="h-5 w-5 mr-2" />
              前往市場
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
            <button 
              onClick={() => navigate('/hk/how-it-works')}
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              了解更多
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Platform Introduction Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 mb-12 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">ClearLot 清倉交易平台</h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              ClearLot 是香港領先的B2B清倉交易平台，專注於為企業提供高品質的庫存清倉解決方案。
              我們連接認證供應商與企業買家，創造雙贏的商業機會。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">認證供應商</h3>
                <p className="text-gray-600">所有供應商都經過嚴格審查和認證，確保產品質量和商業信譽</p>
              </div>
              
              <div className="text-center">
                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">清倉優惠</h3>
                <p className="text-gray-600">提供高達80%的批發價格折扣，幫助企業節省成本</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">限時優惠</h3>
                <p className="text-gray-600">獨家時效性優惠，錯過就沒有了</p>
                <p className="text-sm text-gray-500 mt-2">數量有限，先到先得</p>
              </div>
            </div>
            
            <button 
              onClick={handleMarketplaceNavigation}
              className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors duration-200 flex items-center justify-center shadow-lg mx-auto"
            >
              <Package className="h-5 w-5 mr-2" />
              立即探索市場
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-12 mb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">如何使用 ClearLot？</h2>
            <p className="text-lg text-gray-600">簡單三步，開始您的清倉採購之旅</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">註冊帳戶</h3>
              <p className="text-gray-600">快速創建您的企業帳戶，開始探索清倉優惠</p>
            </div>
            
            <div className="text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">瀏覽優惠</h3>
              <p className="text-gray-600">在我們的市場中發現來自認證供應商的獨家清倉優惠</p>
            </div>
            
            <div className="text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">完成交易</h3>
              <p className="text-gray-600">安全便捷的支付系統，快速完成您的採購需求</p>
            </div>
          </div>
        </div>


        {/* Benefits Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">為什麼在ClearLot瀏覽？</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">認證供應商</h3>
              <p className="text-gray-600">所有供應商都經過徹底審查和認證，確保真實性和可靠性。</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">最佳價格</h3>
              <p className="text-gray-600">通過獨家清倉優惠，批發價格節省高達90%。</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">限時優惠</h3>
              <p className="text-gray-600">獲得其他地方無法獲得的獨家時效性優惠。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}