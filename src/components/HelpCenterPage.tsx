import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Mail } from 'lucide-react';

export default function HelpCenterPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const scrollToEmailForm = () => {
    const emailFormElement = document.getElementById('email-form');
    if (emailFormElement) {
      emailFormElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      id: 1,
      question: '如何在ClearLot創建帳戶？',
      answer: '創建帳戶很簡單！點擊「註冊」按鈕，填寫您的企業信息，註冊少於1分鐘即可立即使用。您可以立即開始瀏覽優惠和上傳產品，完成企業驗證流程可提升您的信譽和信任度。'
    },
    {
      id: 2,
      question: '驗證流程是什麼？',
      answer: '我們的驗證流程確保所有用戶都是合法企業。您需要提供企業註冊文件進行驗證。流程通常需要24-48小時，有助於維護我們平台的信任和安全。'
    },
    {
      id: 3,
      question: '如何下訂單？',
      answer: '瀏覽優惠，點擊您感興趣的商品，查看詳細信息，然後點擊「立即購買」。您將被引導完成數量選擇、填寫送貨信息、上傳支付收據，平台會審核買賣過程的支付。'
    },
    {
      id: 4,
      question: '您接受哪些支付方式？',
      answer: '我們目前接受銀行轉帳支付方式。買家需要上傳支付收據，平台會審核支付過程確保交易安全。'
    },
    {
      id: 5,
      question: '運輸如何運作？',
      answer: '購買後，賣家負責安排運輸和承擔物流費用。買家可以編輯送貨信息，賣家會收到通知。建議賣家在定價時將物流成本考慮在內。'
    },
    {
      id: 6,
      question: '如何列出我的產品？',
      answer: '一旦您的賣家帳戶得到驗證，點擊「上傳優惠」，填寫產品詳細信息，上傳高質量圖片，設定您的定價，然後發布。您的優惠將立即對數千名認證買家可見。'
    },
    {
      id: 7,
      question: '您收取什麼費用？',
      answer: '我們只在完成的交易中收取3%的平台費用。沒有上架費用或月費，只有在成功交易時才收取費用。'
    },
    {
      id: 8,
      question: '我如何收款？',
      answer: '付款通過我們的平台安全處理，並在買家確認收到貨物後2-3個工作日內轉入您的銀行帳戶。您可以在賣家儀表板中追蹤所有付款。'
    }
  ];


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">幫助中心</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            找到您問題的答案，獲得支援，並學習如何充分利用ClearLot。
          </p>
        </div>


        {/* Contact Us Section */}
        <div id="email-form" className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">聯繫我們</h2>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">需要幫助？</h3>
              <p className="text-gray-600 mb-6 text-lg">
                請直接發送電郵給我們，我們會盡快回覆您
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center mb-3">
                  <Mail className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">聯絡電郵</span>
                </div>
                <a 
                  href="mailto:support@clearlot.app"
                  className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  support@clearlot.app
                </a>
              </div>
              
              <div className="text-sm text-gray-500 space-y-2">
                <p>• 我們會在24小時內回覆您的查詢</p>
                <p>• 請在電郵中詳細描述您的問題或需求</p>
                <p>• 如需緊急協助，請在主題中標明「緊急」</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">常見問題</h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                    {expandedFaq === faq.id ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl text-white p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">還需要幫助嗎？</h2>
          <p className="text-xl mb-8">我們的支援團隊隨時準備幫助您成功</p>
          <div className="flex justify-center">
            <a 
              href="mailto:support@clearlot.app"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors duration-200 inline-block"
            >
              發送電郵給我們
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}