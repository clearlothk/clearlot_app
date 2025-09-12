import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, DollarSign, Users, Star, ArrowRight } from 'lucide-react';

export default function SuccessStoriesPage() {
  const featuredStories = [
    {
      id: 1,
      title: '連鎖餐廳在設備升級中節省港幣1800萬',
      company: '金叉餐廳',
      industry: '餐飲服務',
      savings: '港幣 18,000,000',
      timeframe: '6個月',
      description: '金叉餐廳需要在45個地點升級設備。通過ClearLot，他們找到了高質量的商業設備，價格比零售價低60%。',
      image: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=600',
      results: [
        '相比購買新設備節省港幣1800萬',
        '提前3個月完成升級',
        '為持續需求找到認證供應商',
        '廚房效率提升40%'
      ],
      quote: "ClearLot改變了我們處理設備採購的方式。節省的資金讓我們能夠提前開設3個額外的地點。",
      person: {
        name: 'Maria Rodriguez',
        role: '營運總監',
        avatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=150'
      }
    },
    {
      id: 2,
      title: '電子製造商清算港幣4000萬庫存',
      company: '科技流製造',
      industry: '電子產品',
      revenue: '港幣 40,000,000',
      timeframe: '4個月',
      description: '科技流在一個重大合同取消後有港幣6000萬的過剩智能手機配件。ClearLot幫助他們收回了65%的投資。',
      image: 'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=600',
      results: [
        '將港幣6000萬庫存清算為港幣4000萬收入',
        '避免每月港幣150萬的儲存成本',
        '與全球200+認證買家聯繫',
        '通過B2B銷售維護品牌聲譽'
      ],
      quote: "與其承受巨大損失，ClearLot幫助我們將潛在的災難轉變為可管理的情況。平台的影響力令人難以置信。",
      person: {
        name: 'David Chen',
        role: '銷售副總裁',
        avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150'
      }
    },
    {
      id: 3,
      title: '紡織合作夥伴關係創造雙贏解決方案',
      company: '優質面料與都市服裝公司',
      industry: '紡織品與時尚',
      value: '港幣 14,000,000',
      timeframe: '持續進行',
      description: '一家紡織製造商和服裝品牌在ClearLot上找到了彼此，創造了一個對兩家公司都有利的長期合作關係。',
      image: 'https://images.pexels.com/photos/6069094/pexels-photo-6069094.jpeg?auto=compress&cs=tinysrgb&w=600',
      results: [
        '建立港幣1400萬年度合作關係',
        '買家面料成本降低45%',
        '為賣家提供保證銷售渠道',
        '共同擴展到新產品線'
      ],
      quote: "從一次性清倉購買開始，發展成為我們最有價值的供應商關係。ClearLot做出了完美的匹配。",
      person: {
        name: 'Sarah Johnson',
        role: '採購經理，都市服裝公司',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150'
      }
    }
  ];

  const quickStats = [
    {
      icon: DollarSign,
      value: '港幣 220億+',
      label: '總節省金額',
      description: '所有類別買家的累積節省'
    },
    {
      icon: TrendingUp,
      value: '15,000+',
      label: '成功交易',
      description: '完成交易，滿意率99.8%'
    },
    {
      icon: Users,
      value: '45,000+',
      label: '服務企業',
      description: '來自50+個國家的買家和賣家'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">成功案例</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            了解各行各業的企業如何通過ClearLot的B2B市場節省數百萬並最大化回報。
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                  <div className="bg-blue-100 p-4 rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-lg font-semibold text-gray-700 mb-2">{stat.label}</div>
                  <div className="text-gray-600">{stat.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Featured Stories */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">精選成功案例</h2>
          <div className="space-y-12">
            {featuredStories.map((story) => (
              <div key={story.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="p-8">
                    <div className="flex items-center mb-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {story.industry}
                      </span>
                      <span className="ml-4 text-gray-500">{story.timeframe}</span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{story.title}</h3>
                    <p className="text-gray-600 mb-6">{story.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {story.results.slice(0, 4).map((result, index) => (
                        <div key={index} className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{result}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-l-4 border-blue-600 pl-4 mb-6">
                      <p className="text-gray-700 italic">"{story.quote}"</p>
                    </div>
                    
                    <div className="flex items-center">
                      <img
                        src={story.person.avatar}
                        alt={story.person.name}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">{story.person.name}</div>
                        <div className="text-sm text-gray-600">{story.person.role}</div>
                        <div className="text-sm text-gray-600">{story.company}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:order-first">
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl text-white p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">準備書寫您的成功故事了嗎？</h2>
          <p className="text-xl mb-8">加入數千家已經在ClearLot上取得成功的企業</p>
          <Link
            to="/hk/browse-offers"
            className="inline-flex items-center bg-yellow-400 text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors duration-200"
          >
            開始瀏覽
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}