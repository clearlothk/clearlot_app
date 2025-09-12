import React from 'react';
import { useParams } from 'react-router-dom';
import { NotificationProvider } from '../contexts/NotificationContext';
import NotificationsPage from './NotificationsPage';

const NotificationWrapper: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">用戶 ID 無效</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider userId={userId}>
      <NotificationsPage />
    </NotificationProvider>
  );
};

export default NotificationWrapper; 