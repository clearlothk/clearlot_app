import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Mail, Send } from 'lucide-react';

export default function HelpCenterPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [emailForm, setEmailForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const scrollToEmailForm = () => {
    const emailFormElement = document.getElementById('email-form');
    if (emailFormElement) {
      emailFormElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleEmailFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate email sending - replace with actual email service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitStatus('success');
      setEmailForm({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
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


        {/* Email Contact Form */}
        <div id="email-form" className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">聯繫我們</h2>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-xl mr-4">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">發送訊息給我們</h3>
                  <p className="text-gray-600">我們會在24小時內回覆您</p>
                </div>
              </div>
              
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      姓名 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={emailForm.name}
                      onChange={handleEmailFormChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="請輸入您的姓名"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      電郵地址 *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={emailForm.email}
                      onChange={handleEmailFormChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="請輸入您的電郵地址"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    主題 *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={emailForm.subject}
                    onChange={handleEmailFormChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="請輸入訊息主題"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    訊息內容 *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={emailForm.message}
                    onChange={handleEmailFormChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="請詳細描述您的問題或需求"
                  />
                </div>
                
                {submitStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    訊息已成功發送！我們會盡快回覆您。
                  </div>
                )}
                
                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    發送失敗，請稍後再試或直接發送電郵至 support@clearlot.com
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      發送中...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      發送訊息
                    </>
                  )}
                </button>
              </form>
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
            <button 
              onClick={scrollToEmailForm}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors duration-200"
            >
              聯繫我們
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}