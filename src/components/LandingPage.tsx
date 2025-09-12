import React from 'react';
import { Link } from 'react-router-dom';
import PublicLink from './PublicLink';
import { TrendingUp, ArrowRight, CheckCircle, Users, DollarSign, Shield, Clock, Star, Package, Zap, Timer } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <span className="ml-3 text-3xl font-bold">ClearLot</span>
              <span className="ml-2 text-lg bg-white/20 px-3 py-1 rounded-full font-medium backdrop-blur-sm">出貨通</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              香港領先的B2B
              <span className="block text-yellow-300">清倉交易平台</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              與認證供應商聯繫，發掘令人難以置信的節省機會。
              自信地買賣過剩庫存、超額庫存和清倉商品。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/hk/browse-offers"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center group relative"
                title="需要註冊才能瀏覽優惠"
              >
                瀏覽優惠
                <ArrowRight className="ml-2 h-5 w-5" />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  需要註冊才能瀏覽
                </span>
              </Link>
              <Link
                to="/hk/become-seller"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200 flex items-center justify-center"
              >
                開始銷售
                <Package className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">港幣 180億+</div>
              <div className="text-gray-600">總節省金額</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">15,000+</div>
              <div className="text-gray-600">認證供應商</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">45,000+</div>
              <div className="text-gray-600">活躍買家</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">67%</div>
              <div className="text-gray-600">平均折扣</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">為什麼選擇ClearLot？</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們的平台專為B2B交易而設計，確保買賣雙方都能獲得安全、
              高效且有利可圖的交易。
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="bg-blue-100 p-4 rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">認證供應商</h3>
              <p className="text-gray-600">
                所有供應商都經過徹底審查和認證，確保質量和可靠性。
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="bg-green-100 p-4 rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">最大節省</h3>
              <p className="text-gray-600">
                獲得獨家清倉優惠，折扣高達80%。
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="bg-purple-100 p-4 rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">專注B2B</h3>
              <p className="text-gray-600">
                專為企業對企業交易而設計，提供批量定價。
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="bg-orange-100 p-4 rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">快速交易</h3>
              <p className="text-gray-600">
                簡化流程，實現快速、安全的交易，提供託管保護。
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="bg-red-100 p-4 rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Zap className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">清倉優惠</h3>
              <p className="text-gray-600">
                獨家獲得倉庫清倉和超額庫存清算優惠。
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="bg-yellow-100 p-4 rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Timer className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">即時處理</h3>
              <p className="text-gray-600">
                簡化流程，實現快速、安全的交易，提供託管保護。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">ClearLot如何運作</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              為買賣雙方提供簡單、安全、高效的流程
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">瀏覽和搜索</h3>
              <p className="text-gray-600">
                探索所有類別的數千個清倉優惠。
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">聯繫和協商</h3>
              <p className="text-gray-600">
                直接與認證供應商聯繫，協商最佳條款。
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">完成交易</h3>
              <p className="text-gray-600">
                通過我們的保護交易系統進行安全支付和交付。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">準備開始節省了嗎？</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            加入數千家已經通過ClearLot的B2B市場節省數百萬的企業。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/hk/browse-offers"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
            >
              開始瀏覽
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/hk/how-it-works"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200 flex items-center justify-center"
            >
              了解更多
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 