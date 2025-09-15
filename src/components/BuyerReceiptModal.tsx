import React from 'react';
import { X, FileText, Eye, Download, CheckCircle, Clock, User, Building } from 'lucide-react';
import { formatDateForDisplay } from '../utils/dateUtils';

interface BuyerReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export default function BuyerReceiptModal({ 
  isOpen, 
  onClose, 
  transaction 
}: BuyerReceiptModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString, 'datetime');
  };

  const hasReceipt = transaction.paymentDetails?.receiptPreview;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-xl">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">買家支付收據</h2>
              <p className="text-gray-600">查看買家上傳的支付收據</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3">交易信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">訂單編號:</span>
                <span className="ml-2 font-medium">{transaction.id}</span>
              </div>
              <div>
                <span className="text-gray-600">產品:</span>
                <span className="ml-2 font-medium">{transaction.offerTitle}</span>
              </div>
              <div>
                <span className="text-gray-600">數量:</span>
                <span className="ml-2 font-medium">{transaction.quantity} {transaction.unit}</span>
              </div>
              <div>
                <span className="text-gray-600">總金額:</span>
                <span className="ml-2 font-medium text-green-600 font-bold">
                  HK${transaction.totalAmount?.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">買家:</span>
                <span className="ml-2 font-medium">{transaction.buyer}</span>
              </div>
              <div>
                <span className="text-gray-600">地點:</span>
                <span className="ml-2 font-medium">{transaction.location}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              付款狀態
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-yellow-800">當前狀態:</span>
                <span className="font-medium text-yellow-900">待付款確認</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-800">買家操作:</span>
                <span className="font-medium text-yellow-900">
                  {hasReceipt ? '已上傳收據' : '尚未上傳收據'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-800">賣家操作:</span>
                <span className="font-medium text-yellow-900">等待確認付款</span>
              </div>
            </div>
          </div>

          {/* Buyer Receipt Section */}
          {hasReceipt ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                買家已上傳的支付收據
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">買家已上傳支付收據</p>
                    <p className="text-sm text-green-700">
                      上傳時間: {transaction.paymentDetails?.timestamp ? formatDate(transaction.paymentDetails.timestamp) : '未知'}
                    </p>
                    <p className="text-sm text-green-700">
                      買家: {transaction.buyer}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <a
                    href={transaction.paymentDetails.receiptPreview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>查看收據</span>
                  </a>
                  <a
                    href={transaction.paymentDetails.receiptPreview}
                    download
                    className="bg-green-100 text-green-700 px-6 py-2 rounded-lg hover:bg-green-200 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>下載收據</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                等待買家上傳收據
              </h3>
              
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Building className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-orange-900">買家尚未上傳支付收據</p>
                  <p className="text-sm text-orange-700">
                    買家需要上傳支付收據後，您才能確認付款並進行下一步操作。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">下一步操作</h3>
            <div className="text-sm text-blue-800 space-y-2">
              {hasReceipt ? (
                <>
                  <p>• <strong>審核收據</strong>: 仔細檢查買家上傳的支付收據</p>
                  <p>• <strong>確認付款</strong>: 如果收據正確，可以確認付款並更新訂單狀態</p>
                  <p>• <strong>準備發貨</strong>: 付款確認後，準備發貨給買家</p>
                </>
              ) : (
                <>
                  <p>• <strong>等待收據</strong>: 買家需要上傳支付收據</p>
                  <p>• <strong>提醒買家</strong>: 可以通過消息功能提醒買家上傳收據</p>
                  <p>• <strong>暫停處理</strong>: 在收到收據前，無法進行下一步操作</p>
                </>
              )}
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">狀態說明</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• <strong>待付款</strong>: 買家已下單，等待上傳支付收據</p>
              <p>• <strong>已付款</strong>: 買家已上傳收據，等待賣家確認</p>
              <p>• <strong>已發貨</strong>: 付款確認後，賣家已發貨</p>
              <p>• <strong>已完成</strong>: 訂單流程完成</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
} 