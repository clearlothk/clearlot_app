import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  Users, 
  Shield, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  Star,
  Building2,
  Handshake,
  Target,
  Award,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

export default function FranchisePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-white/20 p-4 rounded-full">
                <Globe className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6">
              歡迎加盟 ClearLot
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              將領先的B2B清倉交易平台帶到您的國家。我們提供完整的系統授權和技術支持，
              讓您能夠在當地市場建立成功的清倉交易業務。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="#contact"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center"
              >
                立即諮詢
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="#benefits"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors duration-200 flex items-center justify-center"
              >
                了解優勢
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose ClearLot Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              為什麼選擇 ClearLot？
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們在香港市場的成功經驗證明了我們的商業模式和技術平台的強大實力
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl text-center">
              <div className="bg-blue-600 p-3 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">成熟的商業模式</h3>
              <p className="text-gray-600 leading-relaxed">
                在香港市場已經驗證成功的B2B清倉交易模式，為您提供可靠的商業基礎
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl text-center">
              <div className="bg-green-600 p-3 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">完整技術支持</h3>
              <p className="text-gray-600 leading-relaxed">
                提供完整的平台系統、技術支持和培訓，讓您快速啟動業務
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl text-center">
              <div className="bg-purple-600 p-3 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">品牌授權</h3>
              <p className="text-gray-600 leading-relaxed">
                使用ClearLot品牌和商標，享受品牌知名度和市場信任度
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div id="benefits" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              加盟優勢
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              成為ClearLot合作夥伴，享受全方位的支持和優勢
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="bg-green-100 p-2 rounded-lg mr-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">完整系統授權</h3>
                    <p className="text-gray-600">
                      獲得完整的ClearLot平台系統使用權，包括前端界面、後端管理、支付系統等
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-lg mr-4">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">技術培訓支持</h3>
                    <p className="text-gray-600">
                      提供全面的技術培訓和運營指導，確保您的團隊能夠熟練使用平台
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-purple-100 p-2 rounded-lg mr-4">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">市場營銷支持</h3>
                    <p className="text-gray-600">
                      提供市場營銷策略、品牌推廣材料和客戶獲取指導
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-orange-100 p-2 rounded-lg mr-4">
                    <CheckCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">持續技術更新</h3>
                    <p className="text-gray-600">
                      享受持續的系統更新和功能改進，保持競爭優勢
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">成功案例</h3>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="bg-blue-600 p-2 rounded-lg mr-4">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">香港總部</h4>
                    <p className="text-gray-600 text-sm">月交易額超過1000萬港幣</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-green-600 p-2 rounded-lg mr-4">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">認證供應商</h4>
                    <p className="text-gray-600 text-sm">超過500家認證供應商</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-purple-600 p-2 rounded-lg mr-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">活躍買家</h4>
                    <p className="text-gray-600 text-sm">超過10,000名活躍買家</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              加盟要求
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們尋找有實力和願景的合作夥伴，共同開拓B2B清倉交易市場
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl">
              <div className="bg-blue-600 p-3 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">市場經驗</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                具備B2B或電商平台運營經驗，了解當地市場需求
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl">
              <div className="bg-green-600 p-3 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">團隊實力</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                擁有專業的技術和運營團隊，能夠有效管理平台運營
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl">
              <div className="bg-purple-600 p-3 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">資金實力</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                具備充足的資金支持，能夠承擔初期投資和運營成本
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              加盟流程
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              簡單的加盟流程，讓您快速成為ClearLot的合作夥伴
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">提交申請</h3>
              <p className="text-gray-600">
                填寫加盟申請表，提供公司基本信息和商業計劃
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">初步評估</h3>
              <p className="text-gray-600">
                我們會評估您的申請，並安排初步的電話或視頻會議
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">詳細洽談</h3>
              <p className="text-gray-600">
                深入討論合作細節，包括授權範圍、費用結構等
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">簽約啟動</h3>
              <p className="text-gray-600">
                簽署合作協議，開始系統部署和團隊培訓
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div id="contact" className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              立即開始您的加盟之旅
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              聯繫我們的加盟團隊，了解更多關於ClearLot加盟機會的詳細信息
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-8">聯繫方式</h3>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="bg-white/20 p-3 rounded-lg mr-4">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">加盟郵箱</h4>
                    <p className="text-blue-100">franchise@clearlot.com</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="bg-white/20 p-3 rounded-lg mr-4">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">加盟熱線</h4>
                    <p className="text-blue-100">+852 98765432</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-white/20 p-3 rounded-lg mr-4">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">總部地址</h4>
                    <p className="text-blue-100">
                      尖沙咀彌敦道123號<br />
                      100室<br />
                      九龍尖沙咀，香港
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-6">快速申請</h3>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">公司名稱</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="請輸入您的公司名稱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">聯繫人</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="請輸入您的姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">電子郵箱</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="請輸入您的電子郵箱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">目標市場</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="請輸入您希望開發的市場"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200"
                >
                  提交申請
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
