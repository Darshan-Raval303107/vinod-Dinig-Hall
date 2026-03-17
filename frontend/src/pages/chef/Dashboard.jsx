import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import api from '../../api/axios';
import { socket } from '../../api/socket';
import OrderCard from '../../components/chef/OrderCard';
import { LogOut, Bell, Timer, ChefHat, Activity, Coffee, Terminal, Cpu, Clock, AlertCircle } from 'lucide-react';

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
        audio.play().catch(e => console.log('Haptic audio feedback blocked', e));
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090B] text-white">
      <div className="w-12 h-12 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin mb-6"></div>
      <p className="font-syne text-[10px] tracking-[0.5em] font-black uppercase opacity-40 italic animate-pulse">Syncing Kitchen Matrix</p>
    </div>
  );

  const activeOrders = orders.filter(o => o.status !== 'served' && o.status !== 'cancelled' && o.status !== 'paid');
  const pendingCount = activeOrders.filter(o => o.status === 'pending').length;
  const cookingCount = activeOrders.filter(o => o.status === 'accepted' || o.status === 'cooking').length;
  const readyCount   = activeOrders.filter(o => o.status === 'ready').length;

  return (
    <div className="theme-chef min-h-screen bg-[#09090B] flex flex-col h-screen overflow-hidden selection:bg-orange-500/20 selection:text-orange-500">
      
      {/* KITCHEN COMMAND OVERLAY (HEADER) */}
      <header className="px-12 py-8 border-b border-white/5 flex justify-between items-center bg-black/60 backdrop-blur-3xl z-[100] relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="flex items-center gap-14 relative z-10">
          <div className="group cursor-default">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-[ping_2s_infinite] shadow-[0_0_15px_rgba(249,115,22,0.6)]"></div>
              <h1 className="text-2xl font-black text-white tracking-widest uppercase italic font-syne group-hover:text-orange-500 transition-colors">Node: Alpha-Kitchen</h1>
            </div>
            <div className="text-[9px] font-black text-zinc-500 tracking-[0.4em] uppercase flex items-center gap-5 italic">
              <span className="flex items-center gap-2 text-zinc-400 group-hover:text-white transition-colors"><Cpu size={12} /> {user?.name.toUpperCase()}</span>
              <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
              <span className="flex items-center gap-2 text-emerald-500/60"><Activity size={12} /> Live Telemetry Running</span>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-12 border-l border-white/10 pl-12 h-14">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-white font-black text-2xl font-mono italic">
                 <Clock size={18} className="text-zinc-600" />
                 {currentTime.toLocaleTimeString([], { hour12: false })}
              </div>
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-1 ml-6">Global Sync Frequency</span>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="group/stat px-6 py-2.5 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-zinc-700 transition-all flex flex-col items-center min-w-[100px] shadow-inner">
                 <span className="text-2xl font-black text-zinc-600 group-hover/stat:text-white transition-colors">{pendingCount}</span>
                 <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em] mt-1">Pending Buffer</span>
               </div>
               <div className="group/stat px-6 py-2.5 rounded-2xl bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 transition-all flex flex-col items-center min-w-[100px] shadow-2xl shadow-orange-500/5">
                 <span className="text-2xl font-black text-orange-500 animate-pulse">{cookingCount}</span>
                 <span className="text-[8px] font-black text-orange-500/40 uppercase tracking-[0.2em] mt-1">Active Thermal</span>
               </div>
               <div className="group/stat px-6 py-2.5 rounded-2xl bg-sky-500/5 border border-sky-500/10 hover:bg-sky-500/10 transition-all flex flex-col items-center min-w-[100px] shadow-2xl shadow-sky-500/5">
                 <span className="text-2xl font-black text-sky-400">{readyCount}</span>
                 <span className="text-[8px] font-black text-sky-400/40 uppercase tracking-[0.2em] mt-1">Handoff Ready</span>
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/10 transition-all active:scale-95">
            <Terminal size={20} />
          </button>
          <div className="h-10 w-[1px] bg-white/5 mx-2"></div>
          <button 
            onClick={handleLogout}
            className="group relative flex items-center gap-4 bg-zinc-900 h-14 px-8 rounded-2xl text-[10px] font-black tracking-[0.3em] text-zinc-500 hover:bg-rose-600 hover:text-white transition-all shadow-xl active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-rose-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> TERMINATE SESSION
          </button>
        </div>
      </header>

      {/* COMPONENT BOARD — Side-Scrolling Station Layout */}
      <main className="flex-1 overflow-x-auto p-12 flex gap-16 hide-scrollbar bg-gradient-to-br from-[#09090B] via-[#050505] to-black">
        {/* PENDING STATION */}
        <section className="w-[480px] flex-shrink-0 flex flex-col gap-10 animate-in slide-in-from-left-8 duration-700">
          <header className="flex justify-between items-end mb-4 px-6 border-l-4 border-zinc-800">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <ChefHat size={18} className="text-zinc-700" />
                <h2 className="text-lg font-extrabold text-white/40 tracking-tight font-syne italic">Pending Inflow</h2>
              </div>
              <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest leading-none">Awaiting Station Assignment</p>
            </div>
            {pendingCount > 0 && <span className="text-[9px] font-bold text-zinc-500 animate-pulse uppercase tracking-[0.2em]">Live Input...</span>}
          </header>
          
          <div className="flex-1 overflow-y-auto pr-6 space-y-8 custom-scrollbar pb-10">
            {activeOrders.filter(o => o.status === 'pending').map(order => (
              <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />
            ))}
            {activeOrders.filter(o => o.status === 'pending').length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-zinc-900 rounded-[4rem] group hover:border-zinc-800 transition-colors">
                <Activity size={48} className="text-zinc-600 group-hover:rotate-180 transition-transform duration-1000" />
                <span className="text-[10px] uppercase tracking-[0.5em] font-black mt-6 text-zinc-500 italic">Inflow Quiet</span>
              </div>
            )}
          </div>
        </section>

        {/* ACTIVE STATION */}
        <section className="w-[480px] flex-shrink-0 flex flex-col gap-10 animate-in slide-in-from-bottom-8 duration-1000 delay-100">
          <header className="flex justify-between items-end mb-4 px-6 border-l-4 border-orange-600">
            <div>
               <div className="flex items-center gap-3 mb-1 text-orange-500">
                <Timer size={18} />
                <h2 className="text-lg font-extrabold text-orange-500 tracking-tight font-syne italic">Active Thermal</h2>
              </div>
              <p className="text-[9px] font-black text-orange-500/40 uppercase tracking-widest leading-none">Formulation In Progress</p>
            </div>
            {cookingCount > 0 && <div className="bg-orange-600 px-4 py-1 rounded-[12px] text-[10px] font-black text-white shadow-xl shadow-orange-600/20 italic tracking-tighter">PEAK OPS</div>}
          </header>
          
          <div className="flex-1 overflow-y-auto pr-6 space-y-8 custom-scrollbar pb-10">
            {activeOrders.filter(o => o.status === 'accepted' || o.status === 'cooking').map(order => (
              <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />
            ))}
            {activeOrders.filter(o => o.status === 'accepted' || o.status === 'cooking').length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-orange-950/30 rounded-[4rem] text-orange-600">
                <Coffee size={48} className="animate-bounce" />
                <span className="text-[10px] uppercase tracking-[0.5em] font-black mt-6 italic">Cool State</span>
              </div>
            )}
          </div>
        </section>

        {/* COMPLETION STATION */}
        <section className="w-[480px] flex-shrink-0 flex flex-col gap-10 animate-in slide-in-from-right-8 duration-700 delay-200">
          <header className="flex justify-between items-end mb-4 px-6 border-l-4 border-sky-600">
            <div>
               <div className="flex items-center gap-3 mb-1 text-sky-400">
                <Bell size={18} />
                <h2 className="text-lg font-extrabold text-sky-400 tracking-tight font-syne italic">Dispatch Queue</h2>
              </div>
              <p className="text-[9px] font-black text-sky-400/30 uppercase tracking-widest leading-none">Validated & Awaiting Server</p>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto pr-6 space-y-8 custom-scrollbar pb-10">
            {activeOrders.filter(o => o.status === 'ready').map(order => (
              <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />
            ))}
            {activeOrders.filter(o => o.status === 'ready').length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-zinc-900 rounded-[4rem]">
                <Activity size={48} className="text-zinc-600" />
                <span className="text-[10px] uppercase tracking-[0.5em] font-black mt-6 italic">Vault Empty</span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ERROR / TELEMETRY OVERLAY */}
      {error && (
        <div className="fixed bottom-12 left-12 p-6 rounded-[2rem] bg-rose-600 text-white shadow-2xl animate-in slide-in-from-left-4 duration-500 z-[200] border border-white/20">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><AlertCircle size={24} /></div>
             <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest mb-1 italic">Matrix Alert</span>
                <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">{error}</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefDashboard;
