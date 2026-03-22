import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { socket } from '../../api/socket';
import { useAuthStore } from '../../store';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  Hash, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  ChevronDown, 
  ChevronUp,
  CreditCard,
  History
} from 'lucide-react';
import gsap from 'gsap';

const OrderHistoryView = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  const fetchOrders = () => {
    api.get('/owner/orders')
      .then(res => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Synchronicity failure. Orders ledger offline.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    gsap.fromTo('.ledger-row', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.8, stagger: 0.05, ease: 'back.out(1.7)' });

    if (user?.restaurant_id) {
      socket.connect();
      socket.emit('chef:join', { restaurantId: user.restaurant_id });
      
      socket.on('order:new', () => {
        try {
          const audio = new Audio('/notification.mp3'); 
          audio.play().catch(e => console.log('Haptic sound blocked', e));
        } catch (e) {}
        fetchOrders();
      });
      
      socket.on('order:status_update', (data) => {
        setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
      });
      socket.on('order:status_update_chef', (data) => {
        setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
      });
    }

    return () => {
      socket.off('order:new');
      socket.off('order:status_update');
      socket.off('order:status_update_chef');
    };
  }, [user]);

  const toggleOrder = (id) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedOrders(newExpanded);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'served': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'cooking': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-zinc-50 text-zinc-400 border-zinc-100';
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (o.table_number && o.table_number.toString().includes(searchQuery)) ||
    (o.pickup_code && o.pickup_code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return (
     <div className="flex flex-col items-center justify-center p-24 text-zinc-300">
        <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] italic animate-pulse">Syncing Operational Ledger...</p>
     </div>
  );

  return (
    <div className="animate-in fade-in duration-1000">
      
      {/* HEADER NODES */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
         <div className="space-y-4">
            <h2 className="font-fraunces text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900 leading-none">Global <br /><span className="text-zinc-300">Ledger.</span></h2>
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
               <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Live Sequence Monitor</span>
            </div>
         </div>

         <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative group w-full md:w-80">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
               <input 
                  type="text" 
                  placeholder="Order Hash / Table Node" 
                  className="w-full h-14 pl-14 pr-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:border-slate-900 placeholder:text-zinc-200 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            <button className="h-14 w-full md:w-14 bg-slate-900 text-white flex items-center justify-center rounded-2xl shadow-xl shadow-slate-900/10 active:scale-90 transition-all">
                <Filter size={18} />
            </button>
         </div>
      </div>

      {/* LEDGER GRID */}
      <div className="space-y-4 mb-20">
         {filteredOrders.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed border-zinc-100 rounded-[3rem] opacity-30">
               <History size={48} className="mx-auto mb-6" strokeWidth={1} />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Historical Buffer Empty</p>
            </div>
         ) : (
            filteredOrders.map((order, idx) => (
               <div key={order.id} className="ledger-row overflow-hidden group">
                  {/* Ledger Header Row */}
                  <div 
                    onClick={() => toggleOrder(order.id)}
                    className={`flex flex-col md:flex-row items-center justify-between p-6 px-4 md:px-10 rounded-[2rem] border transition-all duration-500 cursor-pointer
                      ${expandedOrders.has(order.id) 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xl -translate-y-1' 
                        : 'bg-white border-zinc-100 hover:bg-zinc-50'}`}
                  >
                     {/* Metadata Group */}
                     <div className="flex items-center gap-3 md:gap-8 flex-1">
                        <div className={`w-12 h-12 flex items-center justify-center rounded-2xl border ${expandedOrders.has(order.id) ? 'bg-white/10 border-white/10 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-300'}`}>
                           <span className="font-fraunces font-black italic text-xl">0x{(idx + 1).toString().padStart(2, '0')}</span>
                        </div>
                        
                        <div className="flex flex-col">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${expandedOrders.has(order.id) ? 'text-white/40' : 'text-zinc-300'}`}>
                             {order.order_type === 'window' ? 'Pickup Code' : 'Table Node'}
                           </span>
                           <span className="font-bold text-sm uppercase">
                             {order.order_type === 'window' 
                               ? `OTP: ${order.pickup_code}` 
                               : `ST-TABLE-${(order.table_number || 0).toString().padStart(2, '0')}`}
                           </span>
                        </div>

                        <div className="hidden lg:flex flex-col px-8 border-l border-zinc-100/10">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${expandedOrders.has(order.id) ? 'text-white/40' : 'text-zinc-300'}`}>Sequence Hash</span>
                           <span className="font-mono text-[9px] font-bold tracking-widest">#{order.id.slice(-12).toUpperCase()}</span>
                        </div>
                     </div>

                     {/* Status & Value Group */}
                     <div className="flex items-center gap-3 md:gap-14 mt-6 md:mt-0 w-full md:w-auto">
                        <div className="flex flex-col text-right">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${expandedOrders.has(order.id) ? 'text-white/40' : 'text-zinc-300'}`}>Revenue Impact</span>
                           <span className="font-fraunces font-black text-xl italic tracking-tighter">₹{order.total_price.toFixed(0)}</span>
                        </div>
                        
                        <div className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${getStatusStyle(order.status)}`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${expandedOrders.has(order.id) ? 'bg-white shadow-[0_0_10px_white]' : 'bg-current shadow-md'}`}></div>
                           {order.status}
                        </div>

                        <div className={`transition-transform duration-500 ${expandedOrders.has(order.id) ? 'rotate-180' : ''}`}>
                           <ChevronDown size={18} className={expandedOrders.has(order.id) ? 'text-white/50' : 'text-zinc-300'} />
                        </div>
                     </div>
                  </div>

                  {/* Expandable Details Node */}
                  {expandedOrders.has(order.id) && (
                     <div className="m-2 bg-zinc-50 border border-zinc-100 rounded-[2.5rem] p-10 mt-[-1rem] pt-14 animate-in slide-in-from-top-10 duration-700">
                        <div className="flex flex-col md:flex-row justify-between mb-10 gap-8">
                           <div className="flex items-center gap-4">
                              <Calendar size={16} className="text-zinc-300" />
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Captured on</span>
                                 <span className="text-xs font-bold text-slate-900">{new Date(order.created_at).toLocaleDateString()} @ {new Date(order.created_at).toLocaleTimeString()}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 px-6 py-2.5 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                               <CreditCard size={14} className="text-zinc-300" />
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Validated Settlement via R-Pay</span>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="flex text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] pb-3 border-b border-zinc-200">
                              <div className="flex-1">Consumable Selection</div>
                              <div className="w-16 text-center">Unit</div>
                              <div className="w-24 text-right">Valuation</div>
                           </div>
                           {order.items.map((item, i) => (
                              <div key={i} className="flex items-center text-sm">
                                 <div className="flex items-center gap-3 flex-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                    <span className="font-bold text-slate-900 capitalize italic">{item.name}</span>
                                 </div>
                                 <div className="w-16 text-center font-fraunces font-bold text-zinc-400">x{item.quantity}</div>
                                 <div className="w-24 text-right font-fraunces font-black italic text-slate-900">₹{item.price * item.quantity}</div>
                              </div>
                           ))}
                        </div>
                        
                        <div className="mt-12 flex justify-end">
                           <button className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2 hover:translate-x-1 transition-transform">
                              Access Full Audit <ArrowRight size={14} />
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            ))
         )}
      </div>

    </div>
  );
};

export default OrderHistoryView;
