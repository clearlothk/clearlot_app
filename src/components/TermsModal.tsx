import React from 'react';
import { X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">服務條款和隱私政策</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-8">
            {/* Service Terms */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">服務條款</h3>
              <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
                <p>
                  歡迎使用ClearLot平台。這些服務條款（"條款"）構成您與ClearLot之間具有法律約束力的協議。
                </p>
                
                <h4 className="font-semibold text-gray-900">1. 服務描述</h4>
                <p>
                  ClearLot是一個B2B清倉市場平台，為買家和賣家提供交易服務。我們提供平台服務，但不直接參與買賣雙方的交易。
                </p>

                <h4 className="font-semibold text-gray-900">2. 用戶責任</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>提供真實、準確的個人和公司信息</li>
                  <li>遵守所有適用的法律法規</li>
                  <li>不得發布虛假、誤導性或違法內容</li>
                  <li>保護您的帳戶安全，不得與他人共享登入信息</li>
                  <li>及時履行交易義務</li>
                </ul>

                <h4 className="font-semibold text-gray-900">3. 平台費用</h4>
                <p>
                  平台對每筆成功交易收取3%的服務費。費用將在交易完成時自動扣除。
                </p>

                <h4 className="font-semibold text-gray-900">4. 禁止行為</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>發布虛假或誤導性信息</li>
                  <li>進行欺詐或非法活動</li>
                  <li>侵犯他人知識產權</li>
                  <li>騷擾其他用戶</li>
                  <li>操縱平台功能或系統</li>
                </ul>

                <h4 className="font-semibold text-gray-900">5. 免責聲明</h4>
                <p>
                  ClearLot僅提供平台服務，不對用戶之間的交易承擔責任。用戶應自行評估交易風險。
                </p>
              </div>
            </section>

            {/* Privacy Policy */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">隱私政策</h3>
              <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
                <p>
                  我們重視您的隱私權。本隱私政策說明我們如何收集、使用和保護您的個人信息。
                </p>

                <h4 className="font-semibold text-gray-900">1. 信息收集</h4>
                <p>我們收集以下類型的信息：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>註冊信息：姓名、電子郵件、公司名稱、電話號碼</li>
                  <li>交易信息：購買記錄、支付信息</li>
                  <li>使用信息：平台使用情況、瀏覽記錄</li>
                  <li>技術信息：IP地址、設備信息、瀏覽器類型</li>
                </ul>

                <h4 className="font-semibold text-gray-900">2. 信息使用</h4>
                <p>我們使用您的信息用於：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>提供和改進平台服務</li>
                  <li>處理交易和支付</li>
                  <li>發送重要通知和更新</li>
                  <li>提供客戶支持</li>
                  <li>防止欺詐和確保平台安全</li>
                </ul>

                <h4 className="font-semibold text-gray-900">3. 信息共享</h4>
                <p>
                  我們不會出售您的個人信息。我們可能與以下第三方共享信息：
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>服務提供商（如支付處理商）</li>
                  <li>法律要求或保護權利時</li>
                  <li>經您同意的其他情況</li>
                </ul>

                <h4 className="font-semibold text-gray-900">4. 數據安全</h4>
                <p>
                  我們採用行業標準的安全措施保護您的信息，包括加密、安全服務器和訪問控制。
                </p>

                <h4 className="font-semibold text-gray-900">5. 您的權利</h4>
                <p>您有權：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>訪問和更新您的個人信息</li>
                  <li>要求刪除您的帳戶和數據</li>
                  <li>選擇不接收營銷郵件</li>
                  <li>提出投訴或問題</li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">聯繫我們</h3>
              <p className="text-gray-700">
                如果您對這些條款或隱私政策有任何疑問，請通過以下方式聯繫我們：
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
                <li>電子郵件：support@clearlot.app</li>
                <li>電話：+852 98765432</li>
                <li>地址：香港中環金融街88號</li>
              </ul>
            </section>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            我已閱讀並同意
          </button>
        </div>
      </div>
    </div>
  );
}
