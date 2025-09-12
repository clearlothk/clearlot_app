import React from 'react';
import { Link } from 'react-router-dom';
import { Search, UserCheck, ShoppingCart, CheckCircle, TrendingUp, Shield, Clock, Star, ArrowRight } from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      number: 1,
      title: '瀏覽和發現',
      description: '搜索來自所有行業可信賴供應商的數千個認證B2B優惠。',
      icon: Search
    },
    {
      number: 2,
      title: '驗證和聯繫',
      description: '與認證供應商聯繫，查看他們的資質、評級和企業信息。',
      icon: UserCheck
    },
    {
      number: 3,
      title: '購買和支付',
      description: '通過我們的平台安全完成購買，我們會審核買賣過程的支付。',
      icon: ShoppingCart
    },
    {
      number: 4,
      title: '接收和評價',
      description: '與供應商協調交付，並留下評價以幫助其他買家。',
      icon: CheckCircle
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: '節省高達80%',
      description: '獲得批發價格和公眾無法獲得的清倉優惠。',
      color: 'blue'
    },
    {
      icon: Shield,
      title: '認證供應商',
      description: '所有供應商都經過徹底審查，確保真實性和企業合法性。',
      color: 'green'
    },
    {
      icon: Clock,
      title: '限時優惠',
      description: '獨家清倉優惠，數量有限。',
      color: 'orange'
    },
    {
      icon: Star,
      title: '質量保證',
      description: '詳細的產品描述、圖片和供應商評級確保質量。',
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">ClearLot如何運作</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            為買賣雙方提供簡單、安全、高效率的流程
          </p>
        </div>

        {/* Steps Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">簡單的4步流程</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="text-center">
                  <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6">
                    {step.number}
                  </div>
                  <div className="bg-blue-100 p-4 rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">為什麼選擇ClearLot？</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600',
                green: 'bg-green-100 text-green-600',
                orange: 'bg-orange-100 text-orange-600',
                purple: 'bg-purple-100 text-purple-600'
              };
              
              return (
                <div key={index} className="text-center">
                  <div className={`p-4 rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center ${colorClasses[benefit.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl text-white p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">準備開始節省了嗎？</h2>
          <p className="text-xl mb-8">加入數千家已經通過ClearLot節省數百萬的企業</p>
          <Link
            to="/hk/browse-offers"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors duration-200"
          >
            開始瀏覽
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}