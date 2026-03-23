import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { 
  LayoutDashboard, 
  LogOut, 
  UtensilsCrossed, 
  QrCode, 
  Users, 
  Search, 
  Globe, 
  ChevronRight, 
  Menu as MenuIcon, 
  X,
  FileText 
} from 'lucide-react';
import AnalyticsView from './AnalyticsView';
import MenuManagerView from './MenuManagerView';
import TablesManagerView from './TablesManagerView';
import OrderHistoryView from './OrderHistoryView';

const OwnerDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (user?.restaurant_id) {
      import('../../api/socket').then(({ socket }) => {
        socket.connect();
        socket.emit('owner:join', { restaurantId: user.restaurant_id });
      });
    }
  }, [user]);

  const navItems = [
    { path: '/owner/dashboard', label: 'Pulse', icon: LayoutDashboard },
    { path: '/owner/dashboard/orders', label: 'Orders', icon: FileText },
    { path: '/owner/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
    { path: '/owner/dashboard/tables', label: 'Network', icon: QrCode },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="theme-owner min-h-screen bg-white flex flex-col md:flex-row text-slate-900 font-jakarta selection:bg-indigo-500/10 overflow-hidden">
      
      {/* MOBILE HEADER - Adaptive for safe areas */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-zinc-100 px-6 py-4 flex justify-between items-center"
              style={{ paddingTop: 'calc(var(--safe-top) + 0.5rem)' }}>
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
               <Globe size={18} />
            </div>
            <h1 className="font-syne text-lg font-black italic tracking-tighter">VINNOD CORE</h1>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-zinc-100">
               {isSidebarOpen ? <X size={20} /> : <MenuIcon size={20} />}
            </button>
         </div>
      </header>

      {/* SIDEBAR / DRAWER (Mobile-friendly) */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-[110] h-screen w-80 bg-white border-r border-zinc-100 flex flex-col transition-transform duration-500 shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <header className="hidden md:flex px-10 py-12 items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
               <Globe size={24} />
            </div>
            <div>
              <h1 className="font-syne text-2xl font-black text-slate-900 italic tracking-tighter leading-none">Vinnod</h1>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-50">Owner Dashboard</p>
            </div>
        </header>

        {/* Mobile-only close button top right of aside */}
        <button onClick={toggleSidebar} className="md:hidden absolute top-8 right-8 text-zinc-300"><X size={24} /></button>

        <nav className="flex-1 px-6 space-y-2 mt-20 md:mt-4">
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6 px-4 italic leading-none">Intelligence Modules</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-5 h-14 rounded-[1.25rem] transition-all duration-300
                  ${isActive 
                    ? 'bg-slate-900 text-white shadow-xl' 
                    : 'text-zinc-400 hover:text-slate-900 hover:bg-zinc-50'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <Icon size={18} className={isActive ? 'text-indigo-400' : ''} />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                    {item.label}
                  </span>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-40" />}
              </Link>
            )
          })}
        </nav>

        <footer className="mt-auto p-8 border-t border-zinc-100">
          <div className="bg-zinc-50 rounded-[2rem] p-6 border border-zinc-100 relative group overflow-hidden">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                  {user?.name?.charAt(0) || 'O'}
               </div>
               <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest truncate">{user?.name}</h4>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest truncate mt-1">Admin</p>
               </div>
            </div>
            
            <button 
               onClick={handleLogout}
               className="mt-6 flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-white text-red-500 text-[8px] font-black uppercase tracking-widest border border-red-50 hover:bg-red-500 hover:text-white transition-all active:scale-95"
            >
               <LogOut size={12} /> Sync Termination
            </button>
          </div>
        </footer>
      </aside>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div onClick={toggleSidebar} className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[105] animate-in fade-in duration-300"></div>
      )}

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Deskop Top Bar & Search */}
        <header className="hidden md:flex h-24 px-12 border-b border-zinc-100 justify-between items-center bg-white z-50">
           <div className="relative group max-w-sm w-full">
              <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300" />
              <input 
                 type="text" 
                 placeholder="Search..." 
                 className="w-full h-12 pl-14 pr-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-900 focus:outline-none focus:border-slate-900 transition-all placeholder:text-zinc-200"
              />
           </div>

           <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                 <span className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.2em] mb-1 italic">Network Status</span>
                 <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-slate-900 italic tracking-widest leading-none">SECURE-LIVE</span>
                 </div>
              </div>
           </div>
        </header>

        {/* View Surface */}
        <main className="flex-1 overflow-auto bg-white relative p-6 md:p-12 pb-32 md:pb-12" 
              style={{ paddingTop: 'calc(var(--mobile-header-padding, 0px) + 6rem)' }}>
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<AnalyticsView />} />
              <Route path="/orders" element={<OrderHistoryView />} />
              <Route path="/menu" element={<MenuManagerView />} />
              <Route path="/tables" element={<TablesManagerView />} />
              <Route path="/staff" element={<div className="p-12 text-zinc-300 uppercase font-black tracking-[0.3em] text-center border-2 border-dashed border-zinc-100 rounded-[3rem] italic animate-pulse">Staff Management Coming Soon</div>} />
            </Routes>
          </div>
        </main>

        {/* MOBILE BOTTOM NAVIGATION - The "App" experience */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 pointer-events-none"
             style={{ paddingBottom: 'calc(var(--safe-bottom) + 1rem)' }}>
           <div className="glass-panel rounded-[2rem] h-20 w-full flex items-center justify-around px-2 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-zinc-100 bg-white/90 backdrop-blur-xl">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${ 
                      isActive ? 'text-indigo-600 scale-110' : 'text-zinc-300'
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 3 : 2} />
                    <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                  </Link>
                )
              })}
           </div>
        </nav>
      </div>
    </div>
  );
};

export default OwnerDashboard;
