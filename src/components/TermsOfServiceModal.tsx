import React from 'react';
import { X } from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsOfServiceModal({ isOpen, onClose }: TermsOfServiceModalProps) {
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
              <h3 className="text-lg font-medium text-white">服務條款</h3>
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
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">1. 接受條款</h4>
              <p className="text-sm text-gray-600 mb-4">
                歡迎使用 ClearLot B2B清倉交易平台（"服務"）。這些服務條款（"條款"）構成您與 ClearLot（"我們"、"我們的"或"本公司"）之間具有法律約束力的協議。通過訪問或使用我們的服務，您同意受這些條款的約束。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">2. 服務描述</h4>
              <p className="text-sm text-gray-600 mb-4">
                ClearLot 是一個專業的B2B清倉交易平台，連接供應商與企業買家，促進過剩庫存、超額庫存和清倉商品的交易。我們的服務包括但不限於：
              </p>
              <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
                <li>商品展示和搜索功能</li>
                <li>交易撮合和處理</li>
                <li>支付處理和資金管理</li>
                <li>物流協調和配送</li>
                <li>客戶支援和爭議解決</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">3. 用戶註冊和帳戶</h4>
              
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">3.1 註冊要求</h5>
                <ul className="text-sm text-gray-600 mb-3 list-disc list-inside space-y-1">
                  <li>您必須年滿18歲或具有完全民事行為能力</li>
                  <li>提供真實、準確、完整的註冊信息</li>
                  <li>維護帳戶信息的準確性和最新性</li>
                  <li>對帳戶活動承擔全部責任</li>
                </ul>
              </div>
              
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">3.2 帳戶安全</h5>
                <ul className="text-sm text-gray-600 mb-3 list-disc list-inside space-y-1">
                  <li>保護您的登入憑證和密碼</li>
                  <li>立即通知我們任何未經授權的使用</li>
                  <li>不得與他人共享您的帳戶</li>
                </ul>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">4. 用戶行為準則</h4>
              
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">4.1 允許的行為</h5>
                <ul className="text-sm text-gray-600 mb-3 list-disc list-inside space-y-1">
                  <li>合法、誠實地使用平台服務</li>
                  <li>遵守所有適用的法律法規</li>
                  <li>尊重其他用戶的權利</li>
                  <li>提供準確的商品信息和描述</li>
                </ul>
              </div>
              
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">4.2 禁止的行為</h5>
                <ul className="text-sm text-gray-600 mb-3 list-disc list-inside space-y-1">
                  <li>發布虛假、誤導性或欺詐性信息</li>
                  <li>侵犯他人的知識產權</li>
                  <li>進行非法或有害的活動</li>
                  <li>干擾平台的正常運作</li>
                  <li>濫用或操縱平台功能</li>
                  <li>發布不當、冒犯性或非法內容</li>
                </ul>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">5. 交易條款</h4>
              
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">5.1 商品和服務</h5>
                <ul className="text-sm text-gray-600 mb-3 list-disc list-inside space-y-1">
                  <li>賣家對商品的真實性和質量負責</li>
                  <li>商品描述應準確反映實際狀況</li>
                  <li>買家應在合理時間內檢查商品</li>
                  <li>退貨和退款政策按個別交易協議執行</li>
                </ul>
              </div>
              
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">5.2 付款和費用</h5>
                <ul className="text-sm text-gray-600 mb-3 list-disc list-inside space-y-1">
                  <li>平台可能收取交易手續費</li>
                  <li>付款方式包括銀行轉帳等</li>
                  <li>所有費用將在交易前明確告知</li>
                  <li>稅務責任由相關方自行承擔</li>
                </ul>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">6. 知識產權</h4>
              <p className="text-sm text-gray-600 mb-4">
                平台上的所有內容，包括但不限於文字、圖像、商標、標誌、軟件和設計，均受知識產權法律保護。未經明確書面許可，您不得複製、修改、分發或商業使用這些內容。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">7. 免責聲明</h4>
              <p className="text-sm text-gray-600 mb-4">
                我們的服務按"現狀"提供。我們不保證服務的連續性、無錯誤性或完全安全性。在法律允許的最大範圍內，我們對因使用服務而產生的任何直接、間接、偶然或後果性損害不承擔責任。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">8. 服務變更和終止</h4>
              
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">8.1 服務變更</h5>
                <p className="text-sm text-gray-600 mb-3">
                  我們保留隨時修改、暫停或終止服務的權利，無需事先通知。重大變更將通過適當方式通知用戶。
                </p>
              </div>
              
              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">8.2 帳戶終止</h5>
                <p className="text-sm text-gray-600 mb-3">
                  我們可能因違反這些條款或其他合理原因暫停或終止您的帳戶。您也可以隨時終止您的帳戶。
                </p>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">9. 爭議解決</h4>
              <p className="text-sm text-gray-600 mb-4">
                我們鼓勵用戶首先通過友好協商解決爭議。如果無法解決，爭議應提交香港法院管轄，並受香港法律管轄。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">10. 隱私和數據保護</h4>
              <p className="text-sm text-gray-600 mb-4">
                您的隱私對我們很重要。我們收集和使用您的個人資料的方式詳見我們的私隱政策，該政策構成本條款的一部分。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">11. 條款修改</h4>
              <p className="text-sm text-gray-600 mb-4">
                我們可能會不時修改這些條款。重大變更將通過電子郵件或網站通知告知您。繼續使用服務即表示您接受修改後的條款。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">12. 可分割性</h4>
              <p className="text-sm text-gray-600 mb-4">
                如果這些條款的任何部分被認定為無效或不可執行，其餘部分仍將保持完全有效。
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-3">13. 聯絡我們</h4>
              <p className="text-sm text-gray-600 mb-4">
                如果您對這些服務條款有任何疑問，請聯絡我們：
              </p>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>法律事務：</strong> legal@clearlot.app</p>
                <p><strong>一般查詢：</strong> support@clearlot.app</p>
                <p><strong>地址：</strong> Flat E10, 13/F, Block E, Tsing Yi Industrial Centre, Phase 2, Tsing Yi, NT</p>
                <p><strong>電話：</strong> +852-XXXX-XXXX</p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  本服務條款受香港法律管轄。如有任何爭議，應提交香港法院解決。
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
