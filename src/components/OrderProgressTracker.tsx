import React from 'react';
import { Clock, CheckCircle, Package, Truck, XCircle } from 'lucide-react';

interface OrderProgressTrackerProps {
  status: string;
  shippingDetails?: {
    shippedAt?: string;
    shippingPhoto?: string;
    trackingNumber?: string;
    shippingNotes?: string;
    deliveredAt?: string;
    deliveryConfirmedBy?: string;
    deliveryConfirmedAt?: string;
  };
}

export default function OrderProgressTracker({ status, shippingDetails }: OrderProgressTrackerProps) {
  const getCurrentStep = () => {
    switch (status) {
      case 'pending':
        return 1;
      case 'approved':
        return 2;
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      case 'completed':
        return 5;
      case 'rejected':
        return 0;
      default:
        return 1;
    }
  };

  const currentStep = getCurrentStep();

  const steps = [
    {
      step: 1,
      title: 'Payment Pending',
      description: 'Waiting for payment confirmation',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300'
    },
    {
      step: 2,
      title: 'Payment Approved',
      description: 'Payment confirmed, ready for shipping',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300'
    },
    {
      step: 3,
      title: 'Shipped',
      description: 'Package has been shipped',
      icon: <Truck className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300'
    },
    {
      step: 4,
      title: 'Delivered',
      description: 'Package delivered to buyer',
      icon: <Package className="h-4 w-4" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-300'
    },
    {
      step: 5,
      title: 'Completed',
      description: 'Order completed successfully',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300'
    }
  ];

  if (status === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800 font-medium">Order Rejected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-4">Order Progress</h4>
      
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = currentStep >= step.step;
          const isCurrent = currentStep === step.step;
          const isPending = currentStep < step.step;
          
          return (
            <div key={step.step} className="flex items-start">
              {/* Step Circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isCompleted 
                  ? `${step.bgColor} ${step.borderColor} shadow-sm` 
                  : isCurrent 
                    ? `${step.bgColor} ${step.borderColor} shadow-md ring-2 ring-blue-200` 
                    : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={isCompleted ? step.color : isCurrent ? step.color : 'text-gray-400'}>
                  {isCompleted || isCurrent ? step.icon : <div className="w-4 h-4" />}
                </div>
              </div>
              
              {/* Step Content */}
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <h5 className={`text-sm font-medium transition-all duration-300 ${
                    isCompleted 
                      ? step.color 
                      : isCurrent 
                        ? step.color 
                        : 'text-gray-500'
                  }`}>
                    {step.title}
                  </h5>
                  {isCompleted && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className={`text-xs transition-all duration-300 ${
                  isCompleted 
                    ? 'text-gray-600' 
                    : isCurrent 
                      ? 'text-gray-700' 
                      : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
                
                {/* Additional Details for Current Step */}
                {isCurrent && step.step === 3 && shippingDetails?.shippingPhoto && (
                  <div className="mt-2 text-xs text-green-600">
                    ✓ Shipping photo uploaded
                  </div>
                )}
                {isCurrent && step.step === 3 && shippingDetails?.trackingNumber && (
                  <div className="mt-1 text-xs text-blue-600">
                    ✓ Tracking: {shippingDetails.trackingNumber}
                  </div>
                )}
                {isCurrent && step.step === 4 && shippingDetails?.deliveredAt && (
                  <div className="mt-2 text-xs text-purple-600">
                    ✓ Delivered on {new Date(shippingDetails.deliveredAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Step {currentStep} of 5</span>
          <span>{Math.round((currentStep / 5) * 100)}% Complete</span>
        </div>
      </div>
    </div>
  );
} 