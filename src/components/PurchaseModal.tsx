import React, { useState, useRef, useEffect } from 'react';
import { Offer } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { updateOfferAfterPurchase } from '../services/firebaseService';
import { getCurrentHKTimestamp } from '../utils/dateUtils';
import { notificationService } from '../services/notificationService';
import { firestoreNotificationService } from '../services/firestoreNotificationService';
import { 
  X, 
  ShoppingCart, 
  CreditCard, 
  AlertCircle, 
  CheckCircle,
  Package,
  Calculator,
  Upload,
  FileText,
  Eye,
  Building,
  ArrowRight,
  ArrowLeft,
  Clock,
  Mail,
  Truck,
  Lock
} from 'lucide-react';
import { canMakePurchases, getRestrictionMessage } from '../utils/userUtils';
import DeliveryConfirmationModal from './DeliveryConfirmationModal';

interface PurchaseModalProps {
  offer: Offer | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete?: () => void;
}

type PaymentMethod = 'bank-transfer';
type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface PaymentDetails {
  method: PaymentMethod;
  receiptFile?: File;
  receiptPreview?: string;
  transactionId?: string;
  amount: number;
  status: PaymentStatus;
  timestamp: string;
  storagePath?: string;
}

interface FirestorePaymentDetails {
  method: PaymentMethod;
  receiptFile?: string;
  receiptPreview?: string;
  transactionId?: string;
  amount: number;
  status: PaymentStatus;
  timestamp: string;
  storagePath?: string;
}

interface UploadError {
  message: string;
  type: 'file-size' | 'file-type' | 'file-required' | 'upload-failed' | 'validation-failed';
}

export default function PurchaseModal({ offer, isOpen, onClose, onPurchaseComplete }: PurchaseModalProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(offer?.minOrderQuantity || 1);
  const [step, setStep] = useState<'details' | 'payment-method' | 'payment-details' | 'receipt-upload' | 'delivery-confirmation' | 'processing' | 'success'>('details');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [purchaseId, setPurchaseId] = useState<string>('');
  const [showDeliveryConfirmation, setShowDeliveryConfirmation] = useState(false);
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update quantity when offer changes
  useEffect(() => {
    if (offer) {
      // Only set to minimum order quantity if available quantity is sufficient
      if (offer.quantity >= offer.minOrderQuantity) {
        setQuantity(offer.minOrderQuantity);
      } else {
        // If available quantity is less than minimum order, set to available quantity
        // This will trigger the validation warning
        setQuantity(offer.quantity);
      }
    }
  }, [offer]);

  // Reset modal when it opens
  useEffect(() => {
    if (isOpen && offer) {
      setStep('details');
      // Only set to minimum order quantity if available quantity is sufficient
      if (offer.quantity >= offer.minOrderQuantity) {
        setQuantity(offer.minOrderQuantity);
      } else {
        // If available quantity is less than minimum order, set to available quantity
        setQuantity(offer.quantity);
      }
      setSelectedPaymentMethod(null);
      setPaymentDetails(null);
      setIsProcessing(false);
    }
  }, [isOpen, offer]);

  const handleDeliveryConfirmation = async (deliveryDetails: {
    district: string;
    subdivision: string;
    address1: string;
    address2?: string;
    contactPersonName: string;
    contactPersonPhone: string;
    remarks?: string;
    isFromSavedAddress?: boolean;
    savedAddressId?: string;
  }) => {
    if (!purchaseId) return;
    
    setIsUpdatingDelivery(true);
    try {
      // Update the purchase with delivery details
      const { doc, updateDoc } = await import('firebase/firestore');
      const purchaseRef = doc(db, 'purchases', purchaseId);
      
      // Filter out undefined values to avoid Firebase errors
      const cleanDeliveryDetails = Object.fromEntries(
        Object.entries({
          ...deliveryDetails,
          confirmedAt: getCurrentHKTimestamp(),
          confirmedBy: user?.id || 'unknown'
        }).filter(([_, value]) => value !== undefined)
      );

      await updateDoc(purchaseRef, {
        deliveryDetails: cleanDeliveryDetails
      });
      
      console.log('Delivery details updated successfully');
      
      // Close the delivery confirmation modal
      setShowDeliveryConfirmation(false);
      
      // Show final success message
      setStep('delivery-confirmation');
      
    } catch (error) {
      console.error('Error updating delivery details:', error);
      alert('更新送貨地址失敗，請重試');
    } finally {
      setIsUpdatingDelivery(false);
    }
  };

  if (!isOpen || !offer || !user) return null;

  // Check if user can make purchases
  if (!canMakePurchases(user)) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="text-red-500 mb-6">
            <Lock className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">購買受限</h2>
          <p className="text-gray-600 mb-6">
            {getRestrictionMessage(user)}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 font-semibold">帳戶狀態：{user?.status || '未知'}</span>
            </div>
            <p className="text-red-700 text-sm">
              只有活躍用戶才能進行購買。如需恢復帳戶訪問權限，請聯繫客服支援。
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-semibold"
          >
            關閉
          </button>
        </div>
      </div>
    );
  }

  // Prevent users from purchasing their own offers
  if (offer.supplierId === user.id) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">無法購買</h3>
          <p className="text-gray-600 mb-4">
            您無法購買自己的優惠。
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold"
          >
            關閉
          </button>
        </div>
      </div>
    );
  }

  const unitPrice = offer.currentPrice;
  const subtotal = unitPrice * quantity;
  const platformFee = subtotal * 0.03; // 3% platform fee
  const totalAmount = subtotal + platformFee;

  const paymentMethods = [
    {
      id: 'bank-transfer' as PaymentMethod,
      name: '銀行轉帳',
      description: '傳統銀行轉帳',
      icon: Building,
      color: 'bg-blue-500',
      instructions: [
        '轉帳 HKD ' + totalAmount.toFixed(2) + ' 至我們的銀行帳戶',
        '銀行: 滙豐銀行香港',
        '帳戶: 123-456789-001',
        '帳戶名稱: ClearLot Limited',
        '付款後上傳轉帳收據'
      ]
    }
  ];

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= offer.minOrderQuantity && newQuantity <= offer.quantity) {
      setQuantity(newQuantity);
    }
  };

  const handleProceedToPayment = () => {
    // Validate that the purchase can be made
    if (!offer) return;
    
    // Check if available quantity is sufficient for minimum order
    if (offer.quantity < offer.minOrderQuantity) {
      alert(`無法購買：可用數量 (${offer.quantity}${offer.unit}) 少於最小訂購量 (${offer.minOrderQuantity}${offer.unit})`);
      return;
    }
    
    // Check if selected quantity is valid
    if (quantity < offer.minOrderQuantity) {
      alert(`無法購買：選擇數量 (${quantity}${offer.unit}) 少於最小訂購量 (${offer.minOrderQuantity}${offer.unit})`);
      return;
    }
    
    if (quantity > offer.quantity) {
      alert(`無法購買：選擇數量 (${quantity}${offer.unit}) 超過可用數量 (${offer.quantity}${offer.unit})`);
      return;
    }
    
    setStep('payment-method');
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setStep('payment-details');
  };

  const validateFile = (file: File): UploadError | null => {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        message: '檔案大小必須小於5MB',
        type: 'file-size'
      };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return {
        message: '只允許JPG、PNG和PDF檔案',
        type: 'file-type'
      };
    }

    return null;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadError(null);

    if (!file) {
      setUploadError({
        message: '請選擇要上傳的檔案',
        type: 'file-required'
      });
      return;
    }

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Process file
    const reader = new FileReader();
    reader.onload = (e) => {
      setPaymentDetails({
        method: 'bank-transfer',
        receiptFile: file,
        receiptPreview: e.target?.result as string,
        amount: totalAmount,
        status: 'pending',
        timestamp: getCurrentHKTimestamp()
      });
      setUploadError(null);
    };
    reader.onerror = () => {
      setUploadError({
        message: '讀取檔案失敗。請重試。',
        type: 'upload-failed'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setPaymentDetails(prev => prev ? {
      ...prev,
      receiptFile: undefined,
      receiptPreview: undefined
    } : null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Process the dropped file directly
      setUploadError(null);

      if (!file) {
        setUploadError({
          message: '請選擇要上傳的檔案',
          type: 'file-required'
        });
        return;
      }

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      // Process file
      const reader = new FileReader();
      reader.onload = (e) => {
        setPaymentDetails({
          method: 'bank-transfer',
          receiptFile: file,
          receiptPreview: e.target?.result as string,
          amount: totalAmount,
          status: 'pending',
          timestamp: getCurrentHKTimestamp()
        });
        setUploadError(null);
      };
      reader.onerror = () => {
        setUploadError({
          message: '讀取檔案失敗。請重試。',
          type: 'upload-failed'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceedToReceipt = () => {
    setStep('receipt-upload');
  };

  const handleSubmitReceipt = async () => {
    console.log('Starting receipt submission...');
    console.log('Payment details:', paymentDetails);
    
    if (!paymentDetails?.receiptFile) {
      setUploadError({
        message: '提交前請上傳付款收據',
        type: 'file-required'
      });
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      console.log('Uploading file to Firebase Storage...');
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = paymentDetails.receiptFile.name.split('.').pop();
      const fileName = `receipt_${user.id}_${offer.id}_${timestamp}.${fileExtension}`;
      
      // Create storage reference
      const storageRef = ref(storage, `receipts/${user.id}/${fileName}`);
      
      // Upload file to Firebase Storage
      console.log('File being uploaded:', paymentDetails.receiptFile.name);
      const uploadResult = await uploadBytes(storageRef, paymentDetails.receiptFile);
      console.log('Upload successful, getting download URL...');
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('Download URL obtained:', downloadURL);
      
      // Create purchase record in Firestore
      const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const purchaseData = {
        id: purchaseId,
        offerId: offer.id,
        buyerId: user.id,
        sellerId: offer.supplierId,
        quantity,
        unitPrice,
        totalAmount: subtotal,
        platformFee,
        finalAmount: totalAmount,
        status: 'pending' as const,
        purchaseDate: getCurrentHKTimestamp(),
        paymentMethod: 'bank-transfer',
        paymentDetails: {
          method: 'bank-transfer' as const,
          receiptFile: paymentDetails.receiptFile.name,
          receiptPreview: downloadURL,
          transactionId: `tx_${Math.random().toString(36).substr(2, 9)}`,
          amount: totalAmount,
          status: 'pending' as const,
          timestamp: getCurrentHKTimestamp(),
          storagePath: uploadResult.ref.fullPath
        } as FirestorePaymentDetails
      };
      
      // Save to Firestore
      console.log('Saving purchase data to Firestore...');
      console.log('Purchase data:', purchaseData);
      await setDoc(doc(db, 'purchases', purchaseId), purchaseData);
      console.log('Purchase saved to Firestore successfully');
      
      // Send notification to seller about payment receipt upload
      try {
        const sellerNotificationData = {
          userId: offer.supplierId,
          type: 'payment' as const,
          title: '買家已付款',
          message: `買家已付款，我們正在檢查付款是否已收到。請等待我們的通知以處理配送。`,
          isRead: false,
          data: {
            purchaseId: purchaseId,
            offerId: offer.id,
            buyerId: user.id,
            amount: totalAmount,
            actionUrl: `/hk/admin/transactions`
          },
          priority: 'high' as const
        };
        
        console.log('📨 Creating seller notification for payment receipt:', sellerNotificationData);
        
        // Save to Firestore and trigger real-time notification
        console.log('💾 Attempting to save seller payment receipt notification to Firestore...');
        const notificationId = await firestoreNotificationService.addNotification(sellerNotificationData);
        console.log('✅ Seller payment receipt notification saved to Firestore with ID:', notificationId);
        
        // Create notification with ID to prevent duplicate saving
        const notificationWithId = {
          ...sellerNotificationData,
          id: notificationId,
          createdAt: getCurrentHKTimestamp()
        };
        
        // Trigger real-time notification
        console.log('📡 Triggering real-time notification for seller...');
        notificationService.trigger(notificationWithId);
        console.log('✅ Seller payment receipt notification sent successfully');
      } catch (notificationError) {
        console.error('❌ Error creating seller notification:', notificationError);
      }
      
      // Create admin notification for new payment receipt
      try {
        const adminNotificationData = {
          userId: 'admin', // Admin notification
          type: 'payment' as const,
          title: '📄 新付款收據上傳',
          message: `新付款收據已上傳 - 訂單: ${purchaseId}，金額: HK$${totalAmount}`,
          isRead: false,
          data: {
            purchaseId: purchaseId,
            offerId: offer.id,
            buyerId: user.id,
            amount: totalAmount,
            actionUrl: `/admin/purchases/${purchaseId}`
          },
          priority: 'high' as const
        };
        
        console.log('📨 Creating admin notification for payment receipt:', adminNotificationData);
        
        // Save to Firestore
        const adminNotificationId = await firestoreNotificationService.addNotification(adminNotificationData);
        console.log('✅ Admin payment receipt notification saved to Firestore with ID:', adminNotificationId);
        
        // Create notification with ID to prevent duplicate saving
        const adminNotificationWithId = {
          ...adminNotificationData,
          id: adminNotificationId,
          createdAt: getCurrentHKTimestamp()
        };
        
        // Trigger real-time notification
        console.log('📡 Triggering real-time notification for admin...');
        notificationService.trigger(adminNotificationWithId);
        console.log('✅ Admin payment receipt notification sent successfully');
      } catch (adminNotificationError) {
        console.error('❌ Error creating admin notification:', adminNotificationError);
      }
      
      // Save purchaseId for notification
      setPurchaseId(purchaseId);
      
      setIsUploading(false);
      setIsProcessing(true);
      setStep('processing');
      
      // Keep status as pending for admin approval
      // No automatic status update - admin will manually approve
      await new Promise(resolve => setTimeout(resolve, 1500)); // Slightly longer delay for better UX
      
      const updatedPaymentDetails: PaymentDetails = {
        ...paymentDetails,
        status: 'completed',
        timestamp: getCurrentHKTimestamp(),
        transactionId: purchaseData.paymentDetails.transactionId
      };
      
      setPaymentDetails(updatedPaymentDetails);
      
      // Purchase history is now handled separately
      
      // Call handlePurchaseComplete directly to ensure it executes
      await handlePurchaseComplete(updatedPaymentDetails, purchaseId);

    } catch (error) {
      setIsUploading(false);
      setUploadError({
        message: error instanceof Error ? error.message : '上傳失敗。請重試。',
        type: 'upload-failed'
      });
    }
  };

  const handlePurchaseComplete = async (_paymentDetails: PaymentDetails, purchaseIdParam?: string) => {
    console.log('🎉 handlePurchaseComplete called - setting success state');
    
    // IMMEDIATELY set the success state - this is the most important part
      setIsProcessing(false);
      setStep('success');
      
    // Trigger marketplace refresh immediately
      onPurchaseComplete?.();
      
    console.log('✅ Success state set, now handling background operations');
    
    // Handle background operations - CRITICAL: Update offer quantity FIRST
    if (offer) {
      try {
        console.log(`🔄 Updating offer quantity for offerId: ${offer.id}, purchasedQuantity: ${quantity}`);
        // Update the offer status and quantity after successful purchase
        // This will also remove the offer from all users' watchlists
        await updateOfferAfterPurchase(offer.id, quantity);
        console.log('✅ Offer updated after purchase successfully');
      } catch (offerError) {
        console.error('❌ Error updating offer after purchase:', offerError);
        // Show error to user but don't fail the success display
        alert('購買成功，但更新商品數量時出現錯誤。請聯繫客服。');
      }
      
      // Send purchase success notification
      const currentPurchaseId = purchaseIdParam || purchaseId;
      if (currentPurchaseId) {
        // Create notification data
        const notificationData = {
          userId: user.id,
          type: 'purchase' as const,
          title: '購買成功！',
          message: `您已成功購買 "${offer.title}"。`,
          isRead: false,
          data: {
            offerId: offer.id,
            purchaseId: currentPurchaseId,
            amount: totalAmount,
            actionUrl: `/hk/${user.id}/my-orders`
          },
          priority: 'high' as const
        };
        
        console.log('📨 Creating buyer notification:', notificationData);
        
        // Save to Firestore and trigger real-time notification
        console.log('💾 Attempting to save buyer purchase success notification to Firestore...');
        const notificationId = await firestoreNotificationService.addNotification(notificationData);
        console.log('✅ Buyer purchase success notification saved to Firestore with ID:', notificationId);
        
        // Create notification with ID to prevent duplicate saving
        const notificationWithId = {
          ...notificationData,
          id: notificationId,
          createdAt: getCurrentHKTimestamp()
        };
        
        // Trigger real-time notification (without saving to Firestore again)
        console.log('📡 Triggering real-time notification for buyer...');
        notificationService.trigger(notificationWithId);
        console.log('✅ Buyer purchase success notification sent successfully');
      }
    }
    
    console.log('🎉 handlePurchaseComplete completed - success state should be visible');
  };

  const resetModal = () => {
    setStep('details');
    if (offer) {
      // Only set to minimum order quantity if available quantity is sufficient
      if (offer.quantity >= offer.minOrderQuantity) {
        setQuantity(offer.minOrderQuantity);
      } else {
        // If available quantity is less than minimum order, set to available quantity
        setQuantity(offer.quantity);
      }
    } else {
      setQuantity(1);
    }
    setSelectedPaymentMethod(null);
    setPaymentDetails(null);
    setIsProcessing(false);
    setUploadError(null);
    setIsUploading(false);
    setIsDragOver(false);
    setPurchaseId('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 ml-3">
              {step === 'details' && '購買詳情'}
              {step === 'payment-method' && '選擇付款方式'}
              {step === 'payment-details' && '付款指示'}
              {step === 'receipt-upload' && '上傳付款收據'}
              {step === 'processing' && '提交收據中'}
              {step === 'success' && '收據已提交！'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Purchase Details */}
          {step === 'details' && (
            <div className="space-y-6">
              {/* Offer Summary */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={offer.images[0]}
                    alt={offer.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{offer.title}</h3>
                    <p className="text-gray-600 mb-2">{offer.supplier.company}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Package className="h-4 w-4 mr-1" />
                      <span>可售: {offer.quantity.toLocaleString()} {offer.unit}</span>
                    </div>
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>最小訂購:</strong> {offer.minOrderQuantity} {offer.unit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  數量 (最小: {offer.minOrderQuantity} {offer.unit})
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= offer.minOrderQuantity}
                    className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || offer.minOrderQuantity)}
                    min={offer.minOrderQuantity}
                    max={offer.quantity}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg text-center font-semibold"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= offer.quantity}
                    className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                  <span className="text-gray-600">{offer.unit}</span>
                </div>
                {quantity === offer.minOrderQuantity && offer.quantity >= offer.minOrderQuantity && (
                  <p className="text-sm text-blue-600 mt-2 font-medium">
                    ✓ 設為最小訂購數量
                  </p>
                )}
                {offer.quantity < offer.minOrderQuantity && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          ⚠️ 無法購買此優惠
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          可用數量 ({offer.quantity}{offer.unit}) 少於最小訂購量 ({offer.minOrderQuantity}{offer.unit})
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bg-blue-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-bold text-blue-900">價格明細</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">單價:</span>
                    <span className="font-semibold">HKD {unitPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">數量:</span>
                    <span className="font-semibold">{quantity} {offer.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">小計:</span>
                    <span className="font-semibold">HKD {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">平台費 (3%):</span>
                    <span className="text-gray-600">HKD {platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center">
                      <Truck className="h-4 w-4 mr-1" />
                      物流費用:
                    </span>
                    <span className="font-medium">已包含</span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                    <div className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">物流費用已包含在價格中</p>
                        <p className="text-green-700 mt-1">賣家負責所有物流安排和費用，買家無需額外支付</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-blue-200 pt-3">
                    <div className="flex justify-between text-lg font-bold text-blue-900">
                      <span>總金額:</span>
                      <span>HKD {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={offer.quantity < offer.minOrderQuantity}
                className={`w-full py-4 px-6 rounded-xl transition-colors duration-200 font-bold text-lg flex items-center justify-center ${
                  offer.quantity < offer.minOrderQuantity
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {offer.quantity < offer.minOrderQuantity
                  ? '無法購買 - 數量不足'
                  : `選擇付款方式 - HKD ${totalAmount.toFixed(2)}`
                }
              </button>
            </div>
          )}

          {/* Step 2: Payment Method Selection */}
          {step === 'payment-method' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">選擇您的付款方式</h3>
                <p className="text-gray-600">選擇最方便的付款方式</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handlePaymentMethodSelect(method.id)}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center mb-3">
                      <div className={`${method.color} p-3 rounded-lg mr-4`}>
                        <method.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-900">{method.name}</h4>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-blue-600 font-medium">
                      <span>選擇</span>
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">付款安全</p>
                    <p className="text-yellow-700">所有付款方式都是安全且經過驗證的。對於手動轉帳，請上傳您的付款收據以供驗證。</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('details')}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回
                </button>
                <div className="flex-1"></div>
              </div>
            </div>
          )}

          {/* Step 3: Payment Details */}
          {step === 'payment-details' && selectedMethod && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className={`${selectedMethod.color} p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
                  <selectedMethod.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedMethod.name}</h3>
                <p className="text-gray-600">按照以下指示完成您的付款</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  付款指示
                </h4>
                <div className="space-y-3">
                  {selectedMethod.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start">
                      <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="font-bold text-blue-900 mb-3">付款摘要</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>小計:</span>
                    <span>HKD {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>平台費:</span>
                    <span>HKD {platformFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 font-bold">
                    <div className="flex justify-between">
                      <span>總金額:</span>
                      <span>HKD {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('payment-method')}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回
                </button>
                <button
                  onClick={handleProceedToReceipt}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-bold"
                >
                  我已付款
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Receipt Upload */}
          {step === 'receipt-upload' && selectedMethod && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">上傳付款收據</h3>
                <p className="text-gray-600">請上傳您的付款確認截圖或照片</p>
              </div>

              {/* Error Display */}
              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-red-800 mb-1">上傳錯誤</p>
                      <p className="text-red-700">{uploadError.message}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-center">
                  {!paymentDetails?.receiptPreview ? (
                    <div 
                      className={`border-2 border-dashed rounded-xl p-8 transition-colors duration-200 ${
                        isDragOver 
                          ? 'border-blue-400 bg-blue-50' 
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className={`h-12 w-12 mx-auto mb-4 ${
                        isDragOver ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                      <p className={`mb-4 ${
                        isDragOver ? 'text-blue-600 font-medium' : 'text-gray-600'
                      }`}>
                        {isDragOver ? '將您的收據拖放到這裡' : '拖放您的收據到這裡，或點擊瀏覽'}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {isUploading ? '上傳中...' : '選擇檔案'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        {paymentDetails.receiptFile && paymentDetails.receiptFile.name.match(/\.(pdf)$/i) ? (
                          // PDF Document Preview
                          <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <div className="h-full flex flex-col">
                              {/* PDF Header */}
                              <div className="bg-red-50 px-3 py-2 border-b border-red-200 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-red-500" />
                                  <span className="text-sm font-medium text-red-700">PDF 收據</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      if (paymentDetails.receiptPreview) {
                                        console.log('Opening PDF in new window:', paymentDetails.receiptPreview);
                                        const newWindow = window.open(paymentDetails.receiptPreview, '_blank', 'noopener,noreferrer');
                                        if (!newWindow) {
                                          console.error('Failed to open new window. Popup may be blocked.');
                                          alert('無法打開新視窗，請檢查瀏覽器彈出視窗設定');
                                        }
                                      } else {
                                        console.error('No PDF URL available');
                                        alert('PDF文件不可用');
                                      }
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 flex items-center px-2 py-1 rounded border border-red-200 hover:bg-red-100 transition-colors duration-200"
                                    title="在新視窗中打開PDF"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    新視窗預覽
                                  </button>
                                </div>
                              </div>
                              
                              {/* PDF Content */}
                              <div className="flex-1 relative bg-gray-100">
                                <iframe
                                  src={`${paymentDetails.receiptPreview}#toolbar=0&navpanes=0&scrollbar=1&zoom=fit&view=FitH`}
                                  className="w-full h-full border-0"
                                  title="付款收據 PDF"
                                  onError={(e) => {
                                    console.log('PDF iframe failed to load:', paymentDetails.receiptPreview);
                                    const target = e.target as HTMLIFrameElement;
                                    target.style.display = 'none';
                                    
                                    // Show fallback message
                                    const fallbackDiv = target.nextElementSibling as HTMLElement;
                                    if (fallbackDiv) {
                                      fallbackDiv.style.display = 'flex';
                                    }
                                  }}
                                />
                                
                                {/* Fallback for iframe failure */}
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50" style={{display: 'none'}}>
                                  <div className="text-center">
                                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">PDF 無法預覽</h4>
                                    <p className="text-xs text-gray-500 mb-3">請點擊預覽按鈕查看</p>
                                    <a
                                      href={paymentDetails.receiptPreview}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors duration-200"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      在新標籤頁打開
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Image Document Preview
                          <img
                            src={paymentDetails.receiptPreview}
                            alt="付款收據"
                            className="max-w-full h-64 object-contain rounded-lg border border-gray-200"
                            onError={(e) => {
                              console.log('Image failed to load:', paymentDetails.receiptPreview);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              
                              // Show fallback content
                              const fallbackDiv = target.nextElementSibling as HTMLElement;
                              if (fallbackDiv) {
                                fallbackDiv.style.display = 'flex';
                              }
                            }}
                          />
                        )}
                        
                        {/* Fallback for image failure */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200" style={{display: 'none'}}>
                          <div className="text-center">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <h4 className="text-sm font-medium text-gray-900 mb-2">圖片無法顯示</h4>
                            <p className="text-xs text-gray-500 mb-3">請重新上傳文件</p>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              重新上傳
                            </button>
                          </div>
                        </div>
                        
                        <button
                          onClick={handleRemoveReceipt}
                          disabled={isUploading}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-sm text-green-600 font-medium">收據上傳成功</p>
                      </div>
                      {paymentDetails.receiptFile && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <strong>檔案:</strong> {paymentDetails.receiptFile.name}
                          </p>
                          <p className="text-sm text-blue-700">
                            <strong>大小:</strong> {(paymentDetails.receiptFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">收據要求</p>
                    <ul className="text-yellow-700 space-y-1">
                      <li>• 付款確認的截圖或照片</li>
                      <li>• 必須顯示付款金額和收款人詳情</li>
                      <li>• 檔案大小應小於5MB</li>
                      <li>• 接受的格式: JPG、PNG、PDF</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('payment-details')}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回
                </button>
              <button
                  onClick={handleSubmitReceipt}
                  disabled={!paymentDetails?.receiptFile || isUploading}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-bold flex items-center justify-center"
              >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      上傳中...
                    </>
                  ) : (
                    '提交收據'
                  )}
              </button>
              </div>
            </div>
          )}

          {/* Step 5: Processing */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                提交付款收據中...
              </h3>
              <p className="text-gray-600 mb-8">
                請稍候，我們正在提交您的付款收據。
              </p>
              
              <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto">
                    <h4 className="font-semibold text-gray-900 mb-3">付款摘要</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                    <span>方式:</span>
                    <span>{selectedMethod?.name}</span>
                      </div>
                      <div className="flex justify-between">
                    <span>金額:</span>
                    <span>HKD {totalAmount.toFixed(2)}</span>
                      </div>
                        <div className="flex justify-between">
                    <span>狀態:</span>
                    <span className="text-yellow-600">待審核</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Payment Receipt Submitted */}
          {step === 'success' && (
            <div className="text-center py-12">
              <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">付款收據已提交！</h3>
              <p className="text-gray-600 mb-8">
                您的付款收據已成功提交，正在等待管理員審核。
                現在請確認您的送貨地址和聯絡人信息。
              </p>
              
              <div className="bg-green-50 rounded-xl p-6 max-w-md mx-auto mb-6">
                <h4 className="font-semibold text-green-900 mb-3">付款詳情</h4>
                <div className="space-y-2 text-sm text-green-800">
                  <div className="flex justify-between">
                    <span>方式:</span>
                    <span>{selectedMethod?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>金額:</span>
                    <span>HKD {totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>交易編號:</span>
                    <span>{paymentDetails?.transactionId}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 max-w-md mx-auto mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">下一步:</h4>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    等待管理員審核您的付款收據
                  </li>
                  <li className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    審核通過後您將收到確認通知
                  </li>
                  <li className="flex items-center">
                    <Truck className="h-4 w-4 mr-2" />
                    賣家將聯繫您安排運輸詳情
                  </li>
                  <li className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    在購買歷史中追蹤您的訂單狀態
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setShowDeliveryConfirmation(true)}
                className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg flex items-center mx-auto"
              >
                <Truck className="h-5 w-5 mr-2" />
                確認送貨地址
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </div>
          )}

          {/* Step 7: Final Success (After Delivery Confirmation) */}
          {step === 'delivery-confirmation' && (
            <div className="text-center py-12">
              <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">訂單完成！</h3>
              <p className="text-gray-600 mb-8">
                您的訂單已成功提交，包括付款收據和送貨地址。
                我們將盡快處理您的訂單。
              </p>
              
              <div className="bg-green-50 rounded-xl p-6 max-w-md mx-auto mb-6">
                <h4 className="font-semibold text-green-900 mb-3">訂單詳情</h4>
                <div className="space-y-2 text-sm text-green-800">
                  <div className="flex justify-between">
                    <span>付款方式:</span>
                    <span>{selectedMethod?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>金額:</span>
                    <span>HKD {totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>交易編號:</span>
                    <span>{paymentDetails?.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>送貨地址:</span>
                    <span className="text-right">已確認</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 max-w-md mx-auto mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">下一步:</h4>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    等待管理員審核您的付款收據
                  </li>
                  <li className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    審核通過後您將收到確認通知
                  </li>
                  <li className="flex items-center">
                    <Truck className="h-4 w-4 mr-2" />
                    賣家將聯繫您安排運輸詳情
                  </li>
                  <li className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    在購買歷史中追蹤您的訂單狀態
                  </li>
                </ul>
              </div>

              <button
                onClick={onClose}
                className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
              >
                完成
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Confirmation Modal */}
      <DeliveryConfirmationModal
        isOpen={showDeliveryConfirmation}
        onClose={() => setShowDeliveryConfirmation(false)}
        onConfirm={handleDeliveryConfirmation}
        purchaseId={purchaseId}
        isLoading={isUpdatingDelivery}
      />
    </div>
  );
}