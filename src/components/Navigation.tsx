import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Clock, Filter, BarChart3, Zap, Timer, Plus, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const location = useLocation();
  const { user } = useAuth();
  
  const tabs = [
    { id: `/hk/${user?.id}/marketplace`, label: '所有優惠', icon: Package },
    { id: `/hk/${user?.id}/watchlist`, label: '願望清單', icon: Heart },
    { id: `/hk/${user?.id}/upload`, label: '上傳優惠', icon: Plus }
  ];

  const isActive = (path: string) => {
    if (path.includes('/marketplace')) {
      return location.pathname.includes('/marketplace') || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.id);
            return (
              <Link
                key={tab.id}
                to={tab.id}
                className={`flex items-center space-x-2 py-4 px-6 border-b-3 font-semibold text-sm transition-all duration-200 rounded-t-lg ${
                  active
                    ? 'border-yellow-400 text-blue-600 bg-yellow-50'
                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}