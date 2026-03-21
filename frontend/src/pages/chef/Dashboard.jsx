import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import api from '../../api/axios';
import { socket } from '../../api/socket';
import OrderCard from '../../components/chef/OrderCard';
import { LogOut, Bell, Timer, ChefHat, Activity, Coffee, Clock, AlertCircle, ChevronDown } from 'lucide-react';

const ChefDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-6"></div>
      <p className="font-syne text-[10px] tracking-[0.5em] font-black uppercase opacity-40 italic animate-pulse">Syncing Kitchen Matrix</p>
    </div>
  );

  const activeOrders = orders.filter(o => o.status !== 'served' && o.status !== 'cancelled' && o.status !== 'paid');
  const pendingOrders = activeOrders.filter(o => o.status === 'pending');
  const cookingOrders = activeOrders.filter(o => o.status === 'accepted' || o.status === 'cooking');
  const readyOrders   = activeOrders.filter(o => o.status === 'ready');

  return (
    <div className="theme-chef min-h-screen bg-[#F8FAFC] flex flex-col font-jakarta selection:bg-slate-900 selection:text-white pb-10">
      
      {/* HEADER - Sticky & Minimal */}
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-3xl border-b border-zinc-100 px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <ChefHat size={24} />
           </div>
           <div>
              <h1 className="font-syne text-2xl font-black italic tracking-tighter text-slate-900 leading-none">ALPHA KITCHEN</h1>
              <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-2 flex items-center gap-2 leading-none italic">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {user?.name.toUpperCase()} / SESSION MASTER
              </p>
           </div>
        </div>

        <div className="flex items-center gap-8">
           <div className="hidden md:flex flex-col items-end">
              <div className="flex items-center gap-2 text-[11px] font-black text-slate-900 uppercase tracking-widest italic">
                 <Clock size={14} strokeWidth={3} />
                 {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
              <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-[0.2em] mt-1">Matrix Time</span>
           </div>
           <button onClick={handleLogout} className="flex items-center gap-3 px-6 py-3 rounded-xl bg-red-50 text-red-500 border border-red-100 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
              <LogOut size={16} /> LOGOUT
           </button>
        </div>
      </header>

      {/* HORIZONTAL KANBAN BOARD */}
      <main className="flex-1 px-8 py-10 overflow-x-auto">
        <div className="flex gap-8 h-full min-w-[1200px] animate-in fade-in duration-700">
           
           {/* PENDING COLUMN */}
           <div className="flex-1 flex flex-col min-w-[380px]">
              <div className="flex items-center justify-between mb-8 px-2">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                       <Bell size={18} />
                    </div>
                    <h2 className="font-fraunces text-2xl font-black italic text-slate-900">Pending</h2>
                 </div>
                 <span className="px-3 py-1 bg-white border border-zinc-100 rounded-full text-[10px] font-black text-zinc-400">{pendingOrders.length}</span>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                 {pendingOrders.length > 0 ? (
                    pendingOrders.map(order => <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />)
                 ) : <EmptyState icon={<Bell size={48} />} text="Queue Clear" />}
              </div>
           </div>

           {/* COOKING COLUMN */}
           <div className="flex-1 flex flex-col min-w-[380px]">
              <div className="flex items-center justify-between mb-8 px-2">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                       <Timer size={18} />
                    </div>
                    <h2 className="font-fraunces text-2xl font-black italic text-slate-900">Active Prep</h2>
                 </div>
                 <span className="px-3 py-1 bg-white border border-zinc-100 rounded-full text-[10px] font-black text-zinc-400">{cookingOrders.length}</span>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                 {cookingOrders.length > 0 ? (
                    cookingOrders.map(order => <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />)
                 ) : <EmptyState icon={<Timer size={48} />} text="Stations Cold" />}
              </div>
           </div>

           {/* READY COLUMN */}
           <div className="flex-1 flex flex-col min-w-[380px]">
              <div className="flex items-center justify-between mb-8 px-2">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                       <Coffee size={18} />
                    </div>
                    <h2 className="font-fraunces text-2xl font-black italic text-slate-900">Dispatched</h2>
                 </div>
                 <span className="px-3 py-1 bg-white border border-zinc-100 rounded-full text-[10px] font-black text-zinc-400">{readyOrders.length}</span>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                 {readyOrders.length > 0 ? (
                    readyOrders.map(order => <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />)
                 ) : <EmptyState icon={<Coffee size={48} />} text="Wait-Station Empty" />}
              </div>
           </div>

        </div>
      </main>

      {/* ERROR CONSOLE */}
      {error && (
        <div className="fixed bottom-10 left-10 right-10 p-4 rounded-2xl bg-red-600 text-white shadow-2xl z-[200] border border-white/20 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
             <AlertCircle size={18} />
             <span className="text-[10px] font-black uppercase tracking-widest italic">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};


const EmptyState = ({ icon, text }) => (
  <div className="py-24 flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-slate-900 rounded-[3rem]">
    {icon}
    <span className="text-[10px] uppercase tracking-[0.4em] font-black mt-6 italic">{text}</span>
  </div>
);

export default ChefDashboard;
