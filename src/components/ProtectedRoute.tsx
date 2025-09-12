import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/hk/register' 
}) => {
  console.log('🔒 ProtectedRoute: Rendering protected route...');
  const { user, isLoading, isInitialized } = useAuth();
  console.log('🔒 ProtectedRoute: User state:', user ? 'logged in' : 'not logged in', 'isLoading:', isLoading, 'isInitialized:', isInitialized);

  // 如果用戶未登錄，重定向到註冊頁面並顯示提示
  useEffect(() => {
    if (!user && !isLoading && isInitialized) {
      // 可以添加一個 toast 或 alert 來提示用戶需要註冊
      console.log('需要註冊才能訪問此頁面');
    }
  }, [user, isLoading, isInitialized]);

  // Show loading state while authentication is being checked
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 