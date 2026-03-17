import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { LayoutDashboard, LogOut, UtensilsCrossed, QrCode, Users, Settings, Bell, Search, Globe, ChevronRight } from 'lucide-react';
import AnalyticsView from './AnalyticsView';
import MenuManagerView from './MenuManagerView';
import TablesManagerView from './TablesManagerView';
import SettingsView from './SettingsView';

const OwnerDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/owner/dashboard', label: 'Business Pulse', icon: LayoutDashboard },
    { path: '/owner/dashboard/menu', label: 'Cuisine Matrix', icon: UtensilsCrossed },
    { path: '/owner/dashboard/tables', label: 'Network Nodes', icon: QrCode },
    { path: '/owner/dashboard/staff', label: 'Personnel', icon: Users },
    { path: '/owner/dashboard/settings', label: 'Core Config', icon: Settings },
  ];

  return (
    <div className="theme-owner min-h-screen bg-[#0F172A] flex text-slate-200 selection:bg-indigo-500/30 selection:text-white">
      {/* SIDEBAR — Ultra Modern Dark Navigation */}
      <aside className="w-80 bg-[#0F172A] border-r border-slate-800/50 flex flex-col h-screen sticky top-0 z-[60] shadow-[10px_0_40px_rgba(0,0,0,0.3)]">
        <header className="px-10 py-12">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
               <Globe size={24} />
            </div>
            <div>
              <h1 className="font-syne text-3xl font-black text-white italic tracking-tighter leading-none">Vinnod</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">DineFlow Core</p>
            </div>
          </div>
        </header>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6 px-4 italic opacity-50">Operations Matrix</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path}
                className={`group flex items-center justify-between px-5 h-14 rounded-2xl transition-all duration-300 relative overflow-hidden
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <Icon size={18} className={isActive ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'} />
                  <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>
                {isActive && <ChevronRight size={14} className="relative z-10" />}
              </Link>
            )
          })}
        </nav>

        {/* User Card — Enhanced Bottom Section */}
        <footer className="mt-auto p-8 border-t border-slate-800/30">
          <div className="bg-slate-900/40 rounded-[2rem] p-6 border border-slate-800/50 relative group overflow-hidden hover:bg-slate-900/60 transition-all duration-500">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-400 font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                  {user?.name?.charAt(0) || 'O'}
               </div>
               <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest truncate">{user?.name}</h4>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest truncate mt-1">Matrix Owner</p>
               </div>
            </div>
            
            <button 
               onClick={handleLogout}
               className="mt-6 flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-rose-500/5 text-rose-500/40 text-[9px] font-black uppercase tracking-widest border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all active:scale-95 group-hover:opacity-100"
            >
               <LogOut size={12} /> Sync Termination
            </button>
          </div>
        </footer >
      </aside>

      {/* MAIN WORKSPACE — Seamless View Change */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Control Bar */}
        <header className="h-24 px-12 border-b border-slate-800/30 flex justify-between items-center bg-[#0F172A] z-50">
           <div className="relative group max-w-sm w-full">
              <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                 type="text" 
                 placeholder="Search Core Intelligence..." 
                 className="w-full h-12 pl-14 pr-6 bg-slate-950 border border-slate-800/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 focus:outline-none focus:border-indigo-600 transition-all placeholder:text-slate-800"
              />
           </div>

           <div className="flex items-center gap-6">
              <div className="flex flex-col items-end mr-6 border-r border-slate-800/50 pr-10">
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Network Status</span>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-[10px] font-black text-white italic tracking-widest">ENCRYPTED-LIVE</span>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <button className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800/50 flex items-center justify-center text-slate-500 hover:text-white hover:bg-indigo-600 transition-all">
                    <Bell size={18} />
                 </button>
                 <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 cursor-pointer">
                    <Settings size={18} />
                 </div>
              </div>
           </div>
        </header>

        {/* View Surface — Animated Background */}
        <main className="flex-1 overflow-auto bg-[#0F172A] relative">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[120px] -mr-80 -mt-80 -z-0"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] -ml-40 -mb-40 -z-0"></div>
          
          <div className="relative z-10">
            <Routes>
              <Route path="/" element={<AnalyticsView />} />
              <Route path="/menu" element={<MenuManagerView />} />
              <Route path="/tables" element={<TablesManagerView />} />
              <Route path="/staff" element={<div className="p-12 text-slate-600 uppercase font-black tracking-widest text-center h-[50vh] flex items-center justify-center border-2 border-dashed border-slate-800/30 rounded-[3rem] mx-12 mt-12 italic animate-pulse">Personnel Database Restricted — Committing Phase 5</div>} />
              <Route path="/settings" element={<SettingsView />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;
