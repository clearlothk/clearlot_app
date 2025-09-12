import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, DollarSign, Users, CheckCircle, Star, Shield, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function BecomeSellerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const benefits = [
    {
      icon: DollarSign,
      title: '最大化收益',
      description: '通過我們的香港本地B2B買家市場，將過剩庫存轉化為利潤。',
      stats: '比傳統清算更高的回報'
    },
    {
      icon: Users,
      title: '接觸更多買家',
      description: '接觸積極尋找您產品的香港本地合格企業買家。',
      stats: '連接香港本地認證買家'
    },
    {
      icon: Zap,
      title: '快速清算',
      description: '通過我們的清倉格式快速處理庫存。',
      stats: '快速銷售流程'
    },
    {
      icon: Shield,
      title: '安全交易',
      description: '所有付款都通過我們的平台安全處理，並進行買家驗證。',
      stats: '安全可靠的交易'
    }
  ];

  const steps = [
    {
      number: 1,
      title: '創建您的帳戶',
      description: '註冊少於1分鐘即可立即使用，完成企業驗證流程可提升您的信譽和信任度。'
    },
    {
      number: 2,
      title: '列出您的產品',
      description: '上傳您的庫存，提供詳細描述和競爭性定價。'
    },
    {
      number: 3,
      title: '開始銷售',
      description: '接收訂單，安排運輸，並安全收款和評價。'
    }
  ];

  const handleStartSelling = () => {
    if (user) {
      // User is logged in, navigate to upload page
      navigate(`/hk/${user.id}/upload`);
    } else {
      // User is not logged in, navigate to register page
      navigate('/hk/register');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">將過剩庫存轉化為利潤</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            加入使用ClearLot接觸香港本地B2B買家的供應商，
            將過剩庫存、超額庫存和清倉商品轉化為收益。
          </p>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">為什麼在ClearLot銷售？</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                      <p className="text-gray-600 mb-4">{benefit.description}</p>
                      <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-semibold">
                        {benefit.stats}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">開始使用很簡單</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>


        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl text-white p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">準備開始銷售了嗎？</h2>
          <p className="text-xl mb-8">今天就加入ClearLot開始您的銷售之旅</p>
          <button
            onClick={handleStartSelling}
            className="inline-flex items-center bg-yellow-400 text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors duration-200"
          >
            今天就開始銷售
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}