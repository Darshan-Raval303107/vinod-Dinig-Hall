import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { BarChart, LogOut, UtensilsCrossed, QrCode, Users } from 'lucide-react';
import AnalyticsView from './AnalyticsView';
import MenuManagerView from './MenuManagerView';
import TablesManagerView from './TablesManagerView';

const OwnerDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/owner/dashboard', label: 'Analytics', icon: BarChart },
    { path: '/owner/dashboard/menu', label: 'Menu Manager', icon: UtensilsCrossed },
    { path: '/owner/dashboard/tables', label: 'Tables & QR', icon: QrCode },
    { path: '/owner/dashboard/staff', label: 'Staff', icon: Users },
  ];

  return (
    <div className="theme-owner min-h-screen font-source flex bg-owner-bg text-owner-text">
      {/* Sidebar */}
      <aside className="w-64 bg-owner-surface/50 border-r border-[#1E293B] flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-[#1E293B]">
          <h1 className="font-syne text-2xl font-bold tracking-tight text-white mb-1">DineFlow</h1>
          <p className="text-xs text-owner-accent font-medium uppercase tracking-wider">Owner Portal</p>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                  ${isActive 
                    ? 'bg-owner-accent text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-owner-surface'
                  }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-[#1E293B]">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded bg-owner-accent/20 text-owner-accent flex items-center justify-center font-bold relative">
              <span className="absolute bottom-[-2px] right-[-2px] w-2.5 h-2.5 bg-green-500 border-2 border-owner-bg rounded-full"></span>
              {user?.name?.charAt(0) || 'O'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-owner-surface rounded-lg transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto h-screen bg-owner-bg">
        <Routes>
          <Route path="/" element={<AnalyticsView />} />
          <Route path="/menu" element={<MenuManagerView />} />
          <Route path="/tables" element={<TablesManagerView />} />
          <Route path="/staff" element={<div className="p-8">Staff Manager Coming Soon</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default OwnerDashboard;
