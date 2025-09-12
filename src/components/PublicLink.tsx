import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}

export default function PublicLink({ to, children, className, title, onClick }: PublicLinkProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }

    // 如果用戶已登入，導航到正確的 Slug 路由
    if (user && user.id) {
      e.preventDefault();
      const pageName = to.split('/').pop(); // 獲取頁面名稱
      navigate(`/hk/${user.id}/${pageName}`);
    }
    // 如果用戶未登入，保持原有行為（導航到登入頁面）
  };

  return (
    <Link
      to={to}
      className={className}
      title={title}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
} 