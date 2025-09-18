import React from 'react';
import { X } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          onClick={onClose}
        ></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">私隱政策</h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-gray-600 mb-4">
                <strong>最後更新日期：</strong> 2025年1月
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">1. 引言</h4>
              <p className="text-sm text-gray-600 mb-4">
                ClearLot（"我們"、"我們的"或"本公司"）致力於保護您的個人資料私隱。本私隱政策說明我們如何收集、使用、儲存和保護您在使用我們的B2B清倉交易平台時提供的個人資料。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">2. 我們收集的資料</h4>
              
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">2.1 個人資料</h5>
                <p className="text-sm text-gray-600 mb-2">我們可能收集以下類型的個人資料：</p>
                <ul className="text-sm text-gray-600 mb-3 list-disc list-inside space-y-1">
                  <li>姓名、電子郵件地址、電話號碼</li>
                  <li>公司名稱、職位、商業地址</li>
                  <li>身份證明文件（用於驗證目的）</li>
                  <li>銀行帳戶資料（用於交易處理）</li>
                  <li>交易歷史和偏好設定</li>
                </ul>
              </div>
              
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">2.2 技術資料</h5>
                <ul className="text-sm text-gray-600 mb-3 list-disc list-inside space-y-1">
                  <li>IP地址、瀏覽器類型、設備信息</li>
                  <li>網站使用數據、頁面訪問記錄</li>
                  <li>Cookie和類似技術收集的資料</li>
                </ul>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">3. 資料使用目的</h4>
              <p className="text-sm text-gray-600 mb-2">我們使用您的個人資料用於以下目的：</p>
              <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
                <li>提供和改善我們的B2B交易平台服務</li>
                <li>處理交易和付款</li>
                <li>驗證用戶身份和防止欺詐</li>
                <li>提供客戶支援和技術協助</li>
                <li>發送重要通知和服務更新</li>
                <li>進行市場研究和分析</li>
                <li>遵守法律義務和監管要求</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">4. 資料共享</h4>
              <p className="text-sm text-gray-600 mb-2">我們不會出售您的個人資料。我們可能在以下情況下共享您的資料：</p>
              <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
                <li>與可信賴的第三方服務提供商（如支付處理商、物流公司）</li>
                <li>在法律要求或監管機構要求時</li>
                <li>為保護我們的權利、財產或安全</li>
                <li>在您明確同意的情況下</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">5. 資料安全</h4>
              <p className="text-sm text-gray-600 mb-4">
                我們採用適當的技術和組織措施來保護您的個人資料，包括加密、安全傳輸、訪問控制和定期安全審計。然而，沒有任何互聯網傳輸或電子儲存方法是100%安全的。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">6. 資料保留</h4>
              <p className="text-sm text-gray-600 mb-4">
                我們只會在實現收集目的所需的期間內保留您的個人資料，或根據法律要求保留。當資料不再需要時，我們會安全地刪除或匿名化處理。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">7. 您的權利</h4>
              <p className="text-sm text-gray-600 mb-2">根據適用的資料保護法律，您有權：</p>
              <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
                <li>訪問和獲取您的個人資料副本</li>
                <li>更正不準確或不完整的資料</li>
                <li>要求刪除您的個人資料</li>
                <li>限制或反對某些資料處理活動</li>
                <li>資料可攜性（在技術可行的情況下）</li>
                <li>撤回同意（如果處理基於同意）</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">8. Cookie 和追蹤技術</h4>
              <p className="text-sm text-gray-600 mb-4">
                我們使用Cookie和類似技術來改善您的網站體驗。有關我們如何使用Cookie的詳細信息，請參閱我們的Cookie政策。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">9. 第三方連結</h4>
              <p className="text-sm text-gray-600 mb-4">
                我們的網站可能包含指向第三方網站的連結。我們不對這些網站的私隱做法負責，建議您查看其私隱政策。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">10. 國際資料傳輸</h4>
              <p className="text-sm text-gray-600 mb-4">
                您的個人資料可能會被傳輸到香港以外的國家或地區。我們會確保此類傳輸符合適用的資料保護法律，並採取適當的保護措施。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">11. 兒童私隱</h4>
              <p className="text-sm text-gray-600 mb-4">
                我們的服務不針對16歲以下的兒童。我們不會故意收集16歲以下兒童的個人資料。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">12. 政策更新</h4>
              <p className="text-sm text-gray-600 mb-4">
                我們可能會不時更新本私隱政策。重大變更將通過電子郵件或網站通知告知您。建議您定期查看本政策。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">13. 聯絡我們</h4>
              <p className="text-sm text-gray-600 mb-4">
                如果您對本私隱政策有任何疑問或需要行使您的權利，請聯絡我們：
              </p>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>資料保護主任：</strong> ClearLot 私隱團隊</p>
                <p><strong>電子郵件：</strong> privacy@clearlot.app</p>
                <p><strong>一般查詢：</strong> support@clearlot.app</p>
                <p><strong>地址：</strong> Flat E10, 13/F, Block E, Tsing Yi Industrial Centre, Phase 2, Tsing Yi, NT</p>
                <p><strong>電話：</strong> +852-XXXX-XXXX</p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  本私隱政策受香港法律管轄。如有任何爭議，應提交香港法院解決。
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
