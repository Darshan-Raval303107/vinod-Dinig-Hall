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
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'active', 'ready'

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
    <div className="theme-chef min-h-screen bg-white flex flex-col font-jakarta selection:bg-slate-900 selection:text-white pb-32">
      
      {/* MOBILE HEADER - Optimized for Kitchen Workflow */}
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-3xl border-b border-zinc-100 px-6 py-6"
              style={{ paddingTop: 'calc(var(--safe-top) + 1.5rem)' }}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                <ChefHat size={20} />
             </div>
             <div>
                <h1 className="font-syne text-xl font-black italic tracking-tighter text-slate-900 leading-none">ALPHA KITCHEN</h1>
                <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mt-1.5 flex items-center gap-1.5 leading-none italic">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {user?.name.toUpperCase()} / LIVE
                </p>
             </div>
          </div>

          <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 border border-red-100 active:scale-95 transition-all">
             <LogOut size={18} />
          </button>
        </div>

        {/* QUICK STATS - Horizontal Scroll */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-2 px-2">
           <TabButton 
             id="pending" 
             label="Pending" 
             count={pendingOrders.length} 
             active={activeTab === 'pending'} 
             onClick={setActiveTab} 
             icon={<Bell size={14} />}
           />
           <TabButton 
             id="active" 
             label="Cooking" 
             count={cookingOrders.length} 
             active={activeTab === 'active'} 
             onClick={setActiveTab}
             icon={<Timer size={14} />}
             isAlert={cookingOrders.length > 5}
           />
           <TabButton 
             id="ready" 
             label="Ready" 
             count={readyOrders.length} 
             active={activeTab === 'ready'} 
             onClick={setActiveTab}
             icon={<Coffee size={14} />}
           />
        </div>
      </header>

      {/* ORDERS LIST CONTAINER */}
      <main className="px-6 mt-8 animate-in fade-in duration-500">
         <div className="flex items-center justify-between mb-8">
            <h2 className="font-fraunces text-2xl font-black italic text-slate-900 capitalize">
               {activeTab} Queue
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-300 uppercase tracking-widest italic leading-none">
               <Clock size={12} strokeWidth={3} />
               {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
         </div>

         <div className="space-y-6">
            {activeTab === 'pending' && (
               pendingOrders.length > 0 ? (
                  pendingOrders.map(order => <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />)
               ) : <EmptyState icon={<Bell size={48} />} text="No Incoming Orders" />
            )}
            {activeTab === 'active' && (
               cookingOrders.length > 0 ? (
                  cookingOrders.map(order => <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />)
               ) : <EmptyState icon={<Timer size={48} />} text="Stations Are Clear" />
            )}
            {activeTab === 'ready' && (
               readyOrders.length > 0 ? (
                  readyOrders.map(order => <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />)
               ) : <EmptyState icon={<Coffee size={48} />} text="No Orders Ready" />
            )}
         </div>
      </main>

      {/* ERROR CONSOLE */}
      {error && (
        <div className="fixed bottom-[calc(var(--safe-bottom)+2rem)] left-6 right-6 p-4 rounded-2xl bg-red-600 text-white shadow-2xl z-[200] border border-white/20 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
             <AlertCircle size={18} />
             <span className="text-[10px] font-black uppercase tracking-widest italic">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ id, label, count, active, onClick, icon, isAlert }) => (
  <button 
    onClick={() => onClick(id)}
    className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all shrink-0 active:scale-95 ${
      active 
      ? 'bg-slate-900 border-slate-900 text-white shadow-xl -translate-y-1' 
      : 'bg-zinc-50 border-zinc-100 text-zinc-400'
    }`}
  >
    <div className={`${active ? 'text-white' : 'text-zinc-300'} ${isAlert && !active ? 'text-orange-500 animate-pulse' : ''}`}>
       {icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest italic">{label}</span>
    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
      active ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-400'
    }`}>
      {count}
    </span>
  </button>
);

const EmptyState = ({ icon, text }) => (
  <div className="py-24 flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-slate-900 rounded-[3rem]">
    {icon}
    <span className="text-[10px] uppercase tracking-[0.4em] font-black mt-6 italic">{text}</span>
  </div>
);

export default ChefDashboard;
