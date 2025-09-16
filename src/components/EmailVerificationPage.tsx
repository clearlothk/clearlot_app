import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { debugEmailVerification, debugWelcomeNotification, debugNotificationService } from '../services/firebaseService';
import { auth } from '../config/firebase';

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, handleEmailVerification, resendEmailVerification, isEmailVerified, manualVerifyUser } = useAuth();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | 'expired'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isManualVerifying, setIsManualVerifying] = useState(false);

  const actionCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    // Debug email verification state
    debugEmailVerification();
    debugWelcomeNotification();
    debugNotificationService();
    
    // Check if user is already verified (either in Firestore or Firebase Auth)
    const checkVerificationStatus = async () => {
      if (user) {
        // Check Firebase Auth status as well
        const firebaseUser = auth.currentUser;
        if (firebaseUser && firebaseUser.emailVerified) {
          console.log('User email verified in Firebase Auth, redirecting to marketplace');
          navigate('/hk');
          return;
        }
        
        // Check Firestore status
        if (user.emailVerified) {
          console.log('User email verified in Firestore, redirecting to marketplace');
          navigate('/hk');
          return;
        }
      }
    };

    checkVerificationStatus();

    // Handle email verification if action code is present
    if (actionCode && mode === 'verifyEmail') {
      handleVerification(actionCode);
    }
  }, [actionCode, mode, user, navigate]);

  // Add timeout to show refresh button if verification takes too long
  useEffect(() => {
    if (verificationStatus === 'pending' && isVerifying) {
      const timeout = setTimeout(() => {
        console.log('Verification is taking too long, user can refresh');
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [verificationStatus, isVerifying]);

  // Add periodic check for verification status (in case user returns from Firebase verification page)
  useEffect(() => {
    const checkInterval = setInterval(async () => {
      if (user && !user.emailVerified) {
        // Check Firebase Auth status
        const firebaseUser = auth.currentUser;
        if (firebaseUser && firebaseUser.emailVerified) {
          console.log('Periodic check: User email verified in Firebase Auth, redirecting to marketplace');
          // Force a page reload to sync the user status
          window.location.href = '/hk';
        }
      }
    }, 1000); // Check every 1 second for faster response

    return () => clearInterval(checkInterval);
  }, [user, navigate]);

  // Add window focus listener to check verification status when user returns to the tab
  useEffect(() => {
    const handleFocus = () => {
      if (user && !user.emailVerified) {
        const firebaseUser = auth.currentUser;
        if (firebaseUser && firebaseUser.emailVerified) {
          console.log('Window focus: User email verified in Firebase Auth, redirecting to marketplace');
          // Force a page reload to sync the user status
          window.location.href = '/hk';
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, navigate]);

  const handleVerification = async (code: string) => {
    setIsVerifying(true);
    setVerificationStatus('pending');
    
    try {
      console.log('Starting email verification with code:', code);
      await handleEmailVerification(code);
      console.log('Email verification completed successfully');
      setVerificationStatus('success');
      
      // Redirect to marketplace immediately after successful verification
      console.log('Redirecting to marketplace after successful verification');
      navigate('/hk');
    } catch (error: any) {
      console.error('Email verification error:', error);
      setErrorMessage(error.message || '驗證失敗');
      
      if (error.message.includes('過期') || error.message.includes('expired')) {
        setVerificationStatus('expired');
      } else {
        setVerificationStatus('error');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setErrorMessage('');
    
    try {
      await resendEmailVerification();
      setResendSuccess(true);
    } catch (error: any) {
      console.error('Resend verification error:', error);
      if (error.message.includes('用戶未登入')) {
        setErrorMessage('請先登入以重新發送驗證郵件，或使用登入頁面的「忘記密碼」功能');
      } else {
        setErrorMessage(error.message || '重發驗證郵件失敗');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      // Force a page reload to check the latest user status
      window.location.reload();
    } catch (error: any) {
      console.error('Refresh error:', error);
      setErrorMessage('刷新失敗，請重試');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualVerification = async () => {
    if (!user) {
      setErrorMessage('無法獲取用戶信息');
      return;
    }
    
    setIsManualVerifying(true);
    setErrorMessage('');
    
    try {
      await manualVerifyUser(user.id);
      setVerificationStatus('success');
      setTimeout(() => {
        navigate('/hk');
      }, 2000);
    } catch (error: any) {
      console.error('Manual verification error:', error);
      setErrorMessage(error.message || '手動驗證失敗');
    } finally {
      setIsManualVerifying(false);
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircle className="h-10 w-10 text-white" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-10 w-10 text-white" />;
      default:
        return <Mail className="h-10 w-10 text-white" />;
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'success':
        return {
          title: '驗證成功！',
          message: '您的電子郵件已成功驗證，正在為您跳轉到首頁...',
          color: 'text-white'
        };
      case 'error':
        return {
          title: '驗證失敗',
          message: errorMessage || '驗證過程中發生錯誤，請重試。',
          color: 'text-red-600'
        };
      case 'expired':
        return {
          title: '驗證連結已過期',
          message: '您的驗證連結已過期，請重新發送驗證郵件。',
          color: 'text-red-600'
        };
      default:
        return {
          title: '正在驗證...',
          message: '正在驗證您的電子郵件，請稍候...',
          color: 'text-blue-600'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header with back button */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/hk/register')} 
            className="flex items-center text-slate-600 hover:text-slate-800 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">返回註冊頁面</span>
          </button>
        </div>

        {/* Main Verification Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12 text-center">
            <div className="flex justify-center mb-6">
              {isVerifying ? (
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                    <RefreshCw className="h-10 w-10 text-white animate-spin" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-pulse"></div>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                  {getStatusIcon()}
                </div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-3">
              {statusInfo.title}
            </h1>
            
            <p className="text-blue-100 text-sm leading-relaxed">
              {statusInfo.message}
            </p>
          </div>

          {/* Content Section */}
          <div className="px-8 py-8">
            {/* User Email Display */}
            {user && (
              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                <div className="flex items-center justify-center mb-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                  <p className="text-sm font-medium text-slate-600">驗證電子郵件</p>
                </div>
                <p className="text-lg font-semibold text-slate-900 text-center">{user.email}</p>
              </div>
            )}

            {/* Action Buttons */}
            {verificationStatus === 'error' || verificationStatus === 'expired' ? (
              <div className="space-y-6">
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                      重發中...
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-3" />
                      重新發送驗證郵件
                    </>
                  )}
                </button>
                
                {resendSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <div className="flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mr-3" />
                      <p className="text-emerald-700 text-sm font-medium">
                        驗證郵件已重新發送，請檢查您的收件箱
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : verificationStatus === 'success' ? (
              <div className="space-y-6">
                {/* Success Message */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-emerald-500 mr-3" />
                    <p className="text-emerald-700 font-medium">
                      驗證成功！正在為您跳轉到首頁...
                    </p>
                  </div>
                </div>
                
                {/* Continue Button */}
                <button
                  onClick={() => navigate('/hk')}
                  className="w-full bg-emerald-600 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-emerald-700 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <CheckCircle className="h-5 w-5 mr-3" />
                  繼續
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-blue-500 mr-3" />
                    <p className="text-blue-700 font-medium">
                      驗證郵件已發送至您的信箱，請前往查看並確認以完成註冊
                    </p>
                  </div>
                </div>
                
                {/* Resend email button */}
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                      重發中...
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-3" />
                      重新發送驗證郵件
                    </>
                  )}
                </button>
                
                {/* Show error message if resend fails */}
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <div className="flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-500 mr-3" />
                      <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
                    </div>
                  </div>
                )}
                
                {/* Show success message if resend succeeds */}
                {resendSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <div className="flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mr-3" />
                      <p className="text-emerald-700 text-sm font-medium">
                        驗證郵件已重新發送，請檢查您的收件箱
                      </p>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                如果您沒有收到驗證郵件，請檢查垃圾郵件文件夾，或聯繫客服支援
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
