import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';

interface NotificationAppWrapperProps {
  children: React.ReactNode;
}

const NotificationAppWrapper: React.FC<NotificationAppWrapperProps> = ({ children }) => {
  // Use useContext directly instead of useAuth hook to avoid the error
  const authContext = useContext(AuthContext);
  
  // If AuthContext is not available, just render children without notification context
  if (!authContext) {
    console.log('⏭️ NotificationAppWrapper: AuthContext not available, rendering without notification context');
    return <>{children}</>;
  }

  const { user } = authContext;

  console.log('🔔 NotificationAppWrapper: User state:', user ? 'logged in' : 'not logged in');
  console.log('👤 NotificationAppWrapper: User ID:', user?.id);
  console.log('📧 NotificationAppWrapper: User email:', user?.email);

  // If user is not logged in, don't provide notification context
  if (!user) {
    console.log('⏭️ NotificationAppWrapper: No user, rendering without notification context');
    return <>{children}</>;
  }

  console.log('✅ NotificationAppWrapper: Providing notification context for user:', user.id);
  return (
    <NotificationProvider userId={user.id}>
      {children}
    </NotificationProvider>
  );
};

export default NotificationAppWrapper; 