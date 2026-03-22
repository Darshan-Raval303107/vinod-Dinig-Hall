import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import api from '../../api/axios';
import { socket } from '../../api/socket';
import OrderCard from '../../components/chef/OrderCard';
import { LogOut, Bell, Timer, ChefHat, Activity, Coffee, Clock, AlertCircle, ChevronDown, Flame } from 'lucide-react';

const ChefDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'cooking', 'ready'

  const fetchOrders = () => {
    api.get('/chef/orders')
      .then(res => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Synchronicity failure. Retrying node connection...');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    const clockInt = setInterval(() => setCurrentTime(new Date()), 1000);

    socket.connect();
    
    socket.on('order:new', (data) => {
      try {
        const audio = new Audio('/notification.mp3'); 
        audio.play().catch(e => console.log('Haptic sound blocked', e));
      } catch (e) {}
      fetchOrders(); 
    });
    
    socket.on('order:status_update_chef', (data) => {
      setOrders(prev => prev.map(o => o.order_id === data.orderId ? { ...o, status: data.status } : o));
    });

    return () => {
      clearInterval(clockInt);
      socket.off('order:new');
      socket.off('order:status_update_chef');
      socket.disconnect();
    };
  }, []);

  const handleUpdateStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
    
    api.put(`/chef/orders/${orderId}/status`, { status: newStatus })
      .catch(err => {
        console.error("Status commit failed", err);
        fetchOrders();
      });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-6 shadow-xl"></div>
      <p className="font-syne text-[10px] tracking-[0.5em] font-black uppercase opacity-40 italic animate-pulse">Syncing Kitchen Matrix</p>
    </div>
  );

  const activeOrders = orders.filter(o => o.status !== 'served' && o.status !== 'cancelled' && o.status !== 'paid');
  const pendingOrders = activeOrders.filter(o => o.status === 'pending');
  const cookingOrders = activeOrders.filter(o => o.status === 'accepted' || o.status === 'cooking');
  const readyOrders   = activeOrders.filter(o => o.status === 'ready');

  return (
    <div className="theme-chef min-h-screen bg-[#F8FAFC] flex flex-col font-jakarta selection:bg-slate-900 selection:text-white pb-10 md:pb-0">
      
      {/* HEADER - Sticky & Minimal & Responsive */}
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-3xl border-b border-zinc-100 px-4 md:px-8 py-4 md:py-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
           <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
              <ChefHat size={20} className="md:w-6 md:h-6" />
           </div>
           <div>
              <h1 className="font-syne text-xl md:text-2xl font-black italic tracking-tighter text-slate-900 leading-none">ALPHA KITCHEN</h1>
              <p className="hidden md:flex text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-2 items-center gap-2 leading-none italic">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {user?.name?.toUpperCase() || 'CHEF'} / SESSION MASTER
              </p>
              <p className="md:hidden text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1 leading-none italic">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE
              </p>
           </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
           <div className="hidden md:flex flex-col items-end">
              <div className="flex items-center gap-2 text-[11px] font-black text-slate-900 uppercase tracking-widest italic">
                 <Clock size={14} strokeWidth={3} />
                 {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
              <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-[0.2em] mt-1">Matrix Time</span>
           </div>
           <button onClick={handleLogout} className="flex items-center justify-center gap-2 p-3 md:px-6 md:py-3 rounded-[1rem] md:rounded-xl bg-red-50 text-red-500 border border-red-100 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-sm hover:bg-red-100">
              <LogOut size={16} /> <span className="hidden md:inline">LOGOUT</span>
           </button>
        </div>
      </header>

      {/* MOBILE TABS */}
      <div className="md:hidden sticky top-[73px] z-[90] bg-[#F8FAFC]/95 backdrop-blur-2xl border-b border-zinc-100 px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar shadow-sm">
         <button 
            onClick={() => setActiveTab('pending')} 
            className={`flex-1 flex-shrink-0 py-3 px-4 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${activeTab === 'pending' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white text-slate-400 border border-zinc-200'}`}
         >
            <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-widest">
               <Bell size={14} className={activeTab === 'pending' ? 'text-orange-400' : ''} /> PENDING
            </div>
            <span className={`text-[10px] font-bold ${activeTab === 'pending' ? 'text-slate-300' : 'text-slate-400'}`}>
               {pendingOrders.length} ORDERS
            </span>
         </button>
         <button 
            onClick={() => setActiveTab('cooking')} 
            className={`flex-1 flex-shrink-0 py-3 px-4 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${activeTab === 'cooking' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white text-slate-400 border border-zinc-200'}`}
         >
            <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-widest">
               <Flame size={14} className={activeTab === 'cooking' ? 'text-white' : ''} /> PREP
            </div>
            <span className={`text-[10px] font-bold ${activeTab === 'cooking' ? 'text-emerald-100' : 'text-slate-400'}`}>
               {cookingOrders.length} ORDERS
            </span>
         </button>
         <button 
            onClick={() => setActiveTab('ready')} 
            className={`flex-1 flex-shrink-0 py-3 px-4 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${activeTab === 'ready' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'bg-white text-slate-400 border border-zinc-200'}`}
         >
            <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-widest">
               <Coffee size={14} className={activeTab === 'ready' ? 'text-white' : ''} /> READY
            </div>
            <span className={`text-[10px] font-bold ${activeTab === 'ready' ? 'text-sky-100' : 'text-slate-400'}`}>
               {readyOrders.length} ORDERS
            </span>
         </button>
      </div>

      {/* HORIZONTAL KANBAN BOARD */}
      <main className="flex-1 px-4 md:px-8 py-6 md:py-10 md:overflow-x-auto">
        <div className="flex flex-col md:flex-row md:gap-8 h-full md:min-w-[1000px] lg:min-w-[1200px] animate-in fade-in duration-700">
           
           {/* PENDING COLUMN */}
           <div className={`${activeTab === 'pending' ? 'flex' : 'hidden'} md:flex flex-1 flex-col md:min-w-[320px] lg:min-w-[380px]`}>
              <div className="hidden md:flex items-center justify-between mb-8 px-2">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                       <Bell size={18} />
                    </div>
                    <h2 className="font-fraunces text-2xl font-black italic text-slate-900">Pending</h2>
                 </div>
                 <span className="px-3 py-1 bg-white border border-zinc-100 rounded-full text-[10px] font-black text-zinc-400 shadow-sm">{pendingOrders.length}</span>
              </div>
              <div className="flex-1 space-y-4 md:space-y-6 md:overflow-y-auto md:pr-2 custom-scrollbar pb-24 md:pb-0">
                 {pendingOrders.length > 0 ? (
                    pendingOrders.map(order => <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />)
                 ) : <EmptyState icon={<Bell size={48} />} text="Queue Clear" />}
              </div>
           </div>

           {/* COOKING COLUMN */}
           <div className={`${activeTab === 'cooking' ? 'flex' : 'hidden'} md:flex flex-1 flex-col md:min-w-[320px] lg:min-w-[380px]`}>
              <div className="hidden md:flex items-center justify-between mb-8 px-2">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                       <Timer size={18} />
                    </div>
                    <h2 className="font-fraunces text-2xl font-black italic text-slate-900">Active Prep</h2>
                 </div>
                 <span className="px-3 py-1 bg-white border border-zinc-100 rounded-full text-[10px] font-black text-zinc-400 shadow-sm">{cookingOrders.length}</span>
              </div>
              <div className="flex-1 space-y-4 md:space-y-6 md:overflow-y-auto md:pr-2 custom-scrollbar pb-24 md:pb-0">
                 {cookingOrders.length > 0 ? (
                    cookingOrders.map(order => <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />)
                 ) : <EmptyState icon={<Timer size={48} />} text="Stations Cold" />}
              </div>
           </div>

           {/* READY COLUMN */}
           <div className={`${activeTab === 'ready' ? 'flex' : 'hidden'} md:flex flex-1 flex-col md:min-w-[320px] lg:min-w-[380px]`}>
              <div className="hidden md:flex items-center justify-between mb-8 px-2">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                       <Coffee size={18} />
                    </div>
                    <h2 className="font-fraunces text-2xl font-black italic text-slate-900">Dispatched</h2>
                 </div>
                 <span className="px-3 py-1 bg-white border border-zinc-100 rounded-full text-[10px] font-black text-zinc-400 shadow-sm">{readyOrders.length}</span>
              </div>
              <div className="flex-1 space-y-4 md:space-y-6 md:overflow-y-auto md:pr-2 custom-scrollbar pb-24 md:pb-0">
                 {readyOrders.length > 0 ? (
                    readyOrders.map(order => <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />)
                 ) : <EmptyState icon={<Coffee size={48} />} text="Wait-Station Empty" />}
              </div>
           </div>

        </div>
      </main>

      {/* ERROR CONSOLE */}
      {error && (
        <div className="fixed bottom-10 left-4 right-4 md:left-10 md:right-10 p-4 rounded-2xl bg-red-600 text-white shadow-2xl z-[200] border border-white/20 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
             <AlertCircle size={18} />
             <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest italic">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};


const EmptyState = ({ icon, text }) => (
  <div className="py-20 flex flex-col items-center justify-center opacity-30 border-[1.5px] border-dashed border-slate-400 rounded-[2.5rem] bg-slate-50 mx-2">
    {icon}
    <span className="text-[10px] md:text-[11px] uppercase tracking-[0.4em] font-black mt-6 italic text-slate-600">{text}</span>
  </div>
);

export default ChefDashboard;
