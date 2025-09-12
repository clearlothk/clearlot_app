import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface VerificationReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, customReason?: string) => void;
  action: 'reject' | 'revoke';
  userEmail: string;
  isLoading?: boolean;
}

const REJECTION_REASONS = [
  {
    id: 'br_expired',
    title: 'BR Expired',
    description: 'Business Registration document has expired',
    icon: '📅'
  },
  {
    id: 'documents_unclear',
    title: 'Documents Not Clear',
    description: 'Uploaded documents are unclear or unreadable',
    icon: '📄'
  },
  {
    id: 'wrong_documents',
    title: 'Wrong Documents Uploaded',
    description: 'Incorrect or inappropriate documents were submitted',
    icon: '❌'
  },
  {
    id: 'company_details_mismatch',
    title: 'Company Details Not Matched',
    description: 'Company information does not match the documents',
    icon: '🏢'
  },
  {
    id: 'suspect_fake',
    title: 'Suspect Fake Documents',
    description: 'Documents appear to be fraudulent or fake',
    icon: '⚠️'
  }
];

export default function VerificationReasonModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  userEmail,
  isLoading = false
}: VerificationReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleReasonSelect = (reasonId: string) => {
    setSelectedReason(reasonId);
    setShowCustomInput(reasonId === 'other');
    if (reasonId !== 'other') {
      setCustomReason('');
    }
  };

  const handleConfirm = () => {
    if (!selectedReason) return;
    
    const reason = selectedReason === 'other' ? customReason : selectedReason;
    if (!reason.trim()) return;
    
    onConfirm(reason, selectedReason === 'other' ? customReason : undefined);
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    setShowCustomInput(false);
    onClose();
  };

  const getActionTitle = () => {
    return action === 'reject' ? 'Reject Verification' : 'Revoke Approval';
  };

  const getActionDescription = () => {
    return action === 'reject' 
      ? 'Please select a reason for rejecting this verification request.'
      : 'Please select a reason for revoking the approval of this user.';
  };

  const getActionColor = () => {
    return action === 'reject' ? 'red' : 'orange';
  };

  const getActionIcon = () => {
    return action === 'reject' ? XCircle : AlertTriangle;
  };

  const ActionIcon = getActionIcon();
  const actionColor = getActionColor();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-${actionColor}-100 rounded-full flex items-center justify-center`}>
              <ActionIcon className={`h-5 w-5 text-${actionColor}-600`} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{getActionTitle()}</h3>
              <p className="text-sm text-gray-500">User: {userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">{getActionDescription()}</p>
            
            {/* Reason Selection */}
            <div className="space-y-3">
              {REJECTION_REASONS.map((reason) => (
                <label
                  key={reason.id}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedReason === reason.id
                      ? `border-${actionColor}-500 bg-${actionColor}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason.id}
                    checked={selectedReason === reason.id}
                    onChange={() => handleReasonSelect(reason.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={isLoading}
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{reason.icon}</span>
                      <span className="font-medium text-gray-900">{reason.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{reason.description}</p>
                  </div>
                </label>
              ))}

              {/* Other Option */}
              <label
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedReason === 'other'
                    ? `border-${actionColor}-500 bg-${actionColor}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="rejectionReason"
                  value="other"
                  checked={selectedReason === 'other'}
                  onChange={() => handleReasonSelect('other')}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isLoading}
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">📝</span>
                    <span className="font-medium text-gray-900">Other Reason</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Specify a custom reason</p>
                </div>
              </label>
            </div>

            {/* Custom Reason Input */}
            {showCustomInput && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify the reason:
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter the specific reason for rejection/revocation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Warning Message */}
          <div className={`bg-${actionColor}-50 border border-${actionColor}-200 rounded-lg p-4 mb-6`}>
            <div className="flex items-start">
              <AlertTriangle className={`h-5 w-5 text-${actionColor}-600 mt-0.5 mr-3 flex-shrink-0`} />
              <div>
                <h4 className={`text-sm font-medium text-${actionColor}-800`}>
                  Important Notice
                </h4>
                <p className={`text-sm text-${actionColor}-700 mt-1`}>
                  {action === 'reject' 
                    ? 'The user will receive a notification about the rejection reason and will be able to re-upload documents or contact support.'
                    : 'The user will receive a notification about the revocation reason and their verification status will be updated accordingly.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim()) || isLoading}
            className={`px-6 py-2 bg-${actionColor}-600 text-white rounded-lg hover:bg-${actionColor}-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <ActionIcon className="h-4 w-4" />
                <span>Confirm {action === 'reject' ? 'Rejection' : 'Revocation'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
