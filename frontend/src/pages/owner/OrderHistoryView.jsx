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
        setError('Error. Order history offline.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    gsap.fromTo('.order-row', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.8, stagger: 0.05, ease: 'back.out(1.7)' });

    if (user?.restaurant_id) {
      socket.connect();
      
      const joinRoom = () => {
        socket.emit('owner:join', { restaurantId: user.restaurant_id });
      };

      socket.on('connect', joinRoom);
      joinRoom();
      
      socket.on('order:new', (data) => {
        try {
          const audio = new Audio('/notification.mp3'); 
          audio.play().catch(e => console.log('Haptic sound blocked', e));
        } catch (e) {}
        if (data) {
          setOrders(prev => [data, ...prev]);
        } else {
          fetchOrders();
        }
      });
      
      socket.on('order:status_update', (data) => {
        setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status, is_updated: data.is_updated ?? o.is_updated } : o));
      });
      socket.on('order:status_update_chef', (data) => {
        setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status, is_updated: data.is_updated ?? o.is_updated } : o));
      });
      
      // Live payment status update
      socket.on('payment:success', (data) => {
        setOrders(prev => prev.map(o => 
          o.id === data.order_id 
            ? { ...o, payment_status: 'success', status: data.status || o.status, pickup_code: data.pickup_code || o.pickup_code } 
            : o
        ));
      });

      // Live order content update (items/price)
      socket.on('order:updated', (data) => {
        setOrders(prev => prev.map(o => 
          o.id === data.order_id 
            ? { 
                ...o, 
                items: data.items, 
                total_price: data.total_price, 
                is_updated: data.is_updated,
                status: data.status 
              } 
            : o
        ));
      });

      return () => {
        socket.off('connect', joinRoom);
        socket.off('order:new');
        socket.off('order:status_update');
        socket.off('order:status_update_chef');
        socket.off('payment:success');
        socket.off('order:updated');
      };
    }
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

  const getPaymentStyle = (status) => {
    switch (status) {
      case 'success': case 'captured': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'failed': return 'bg-red-50 text-red-500 border-red-100';
      case 'authorized': return 'bg-amber-50 text-amber-600 border-amber-100';
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
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] italic animate-pulse">Loading Order History...</p>
     </div>
  );

  return (
    <div className="animate-in fade-in duration-1000">
      
      {/* HEADER NODES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
         <div className="space-y-4">
            <h2 className="font-fraunces text-4xl md:text-7xl font-black italic tracking-tighter text-slate-900 leading-none">Order <br /><span className="text-zinc-300">History.</span></h2>
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

      {/* ORDER GRID / CARD STACK */}
      <div className="grid grid-cols-1 md:block gap-6 mb-24">
         {filteredOrders.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed border-zinc-100 rounded-[3rem] opacity-30 col-span-full">
               <History size={48} className="mx-auto mb-6" strokeWidth={1} />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Historical Buffer Empty</p>
            </div>
         ) : (
            filteredOrders.map((order, idx) => (
               <div key={order.id} className="order-row overflow-hidden group">
                  {/* Digital Card Surface */}
                  <div 
                    onClick={() => toggleOrder(order.id)}
                    className={`relative flex flex-col md:flex-row items-stretch md:items-center justify-between p-6 md:p-8 px-6 md:px-10 rounded-[2.5rem] md:rounded-[2rem] border transition-all duration-500 cursor-pointer mb-4
                      ${expandedOrders.has(order.id) 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-[1.02] md:scale-100 -translate-y-2 md:translate-y-0 z-10' 
                        : 'bg-white border-zinc-100 hover:border-zinc-300 shadow-sm hover:shadow-xl hover:-translate-y-1'}`}
                  >
                     {/* Identification Cluster */}
                     <div className="flex items-center gap-5 md:gap-8 flex-1">
                        <div className={`w-14 h-14 md:w-12 md:h-12 flex flex-shrink-0 items-center justify-center rounded-[1.25rem] border transition-colors duration-500 ${expandedOrders.has(order.id) ? 'bg-white/10 border-white/20 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-300'}`}>
                           <span className="font-fraunces font-black italic text-xl md:text-lg">{(idx + 1).toString().padStart(2, '0')}</span>
                        </div>
                        
                        <div className="flex flex-col">
                           <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${expandedOrders.has(order.id) ? 'text-indigo-400' : 'text-indigo-500'}`}>
                                {order.order_type === 'window' ? 'Digital Pickup' : 'Table Service'}
                              </span>
                              <div className={`w-1 h-1 rounded-full ${expandedOrders.has(order.id) ? 'bg-white/20' : 'bg-zinc-200'}`}></div>
                              <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${expandedOrders.has(order.id) ? 'text-white/40' : 'text-zinc-300'}`}>
                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                           <span className="font-syne font-bold text-base md:text-sm uppercase tracking-tight">
                             {order.order_type === 'window' 
                               ? (order.pickup_code ? `TOKEN: ${order.pickup_code}` : 'TOKEN: AWAITING PAYMENT')
                               : `STATION-${(order.table_number || 0).toString().padStart(2, '0')}`}
                           </span>
                        </div>

                        <div className="hidden lg:flex flex-col px-8 border-l border-zinc-100/10">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${expandedOrders.has(order.id) ? 'text-white/40' : 'text-zinc-300'}`}>Transaction Hash</span>
                           <span className="font-mono text-[9px] font-bold tracking-widest opacity-60">#{order.id.slice(-12).toUpperCase()}</span>
                        </div>
                     </div>

                     {/* Financial & State Cluster */}
                     <div className="flex items-center justify-between md:justify-end gap-6 md:gap-14 mt-8 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-white/10">
                        <div className="flex flex-col text-left md:text-right">
                           <span className={`text-[9px] font-black uppercase tracking-widest ${expandedOrders.has(order.id) ? 'text-white/40' : 'text-zinc-300'}`}>Total Billing</span>
                           <span className="font-fraunces font-black text-2xl md:text-xl italic tracking-tighter">₹{order.total_price.toFixed(0)}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                           <div className={`px-5 py-2.5 rounded-2xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all duration-500 ${expandedOrders.has(order.id) ? 'bg-white/10 border-white/20 text-white' : getStatusStyle(order.status)}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${expandedOrders.has(order.id) ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]' : 'bg-current shadow-md'} animate-pulse`}></div>
                              {order.status}
                           </div>
                           
                           {/* Payment Status Badge */}
                           <div className={`px-4 py-2 rounded-xl border text-[8px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-500 ${expandedOrders.has(order.id) ? 'bg-white/10 border-white/20 text-white' : getPaymentStyle(order.payment_status)}`}>
                              <CreditCard size={10} />
                              {order.payment_status === 'success' ? '₹ PAID' : order.payment_status?.toUpperCase() || 'UNPAID'}
                           </div>

                           <div className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-500 ${expandedOrders.has(order.id) ? 'bg-white/10 rotate-180' : 'bg-zinc-50 text-zinc-300'}`}>
                              <ChevronDown size={16} />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* DIGITAL RECEIPT EXPANSION */}
                  {expandedOrders.has(order.id) && (
                     <div className="mx-4 md:mx-6 bg-white border border-zinc-100 rounded-[3rem] p-8 md:p-12 -mt-10 pt-16 mb-8 shadow-xl animate-in slide-in-from-top-12 duration-700 relative overflow-hidden">
                        {/* Receipt Aesthetic Elements */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_70%,#f4f4f5_70%)] bg-[length:16px_16px] bg-repeat-x opacity-50"></div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300 border border-zinc-100">
                                 <Calendar size={20} />
                              </div>
                              <div className="flex flex-col text-slate-900">
                                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Transaction Date</span>
                                 <span className="text-sm font-bold">{new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                 <span className="text-[10px] font-bold text-zinc-400 opacity-60">Verified Order Flow</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4 px-6 py-3 bg-zinc-50/50 rounded-2xl border border-zinc-100">
                               <CreditCard size={14} className="text-indigo-500" />
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 underline decoration-indigo-200 decoration-2 underline-offset-4">Secured via R-Pay Gateway</span>
                           </div>
                        </div>

                        {/* Bill Items */}
                        <div className="space-y-8 bg-zinc-50 border border-zinc-100 rounded-[2rem] p-8 md:p-10">
                           <div className="flex text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] pb-5 border-b border-zinc-200/50">
                              <div className="flex-1">Consumables</div>
                              <div className="w-16 text-center">Qty</div>
                              <div className="w-24 text-right">Ext. Price</div>
                           </div>
                           
                           {order.items.map((item, i) => (
                              <div key={i} className="flex items-center group/item transition-all py-1">
                                 <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-2 h-2 rounded-full ring-4 ${item.is_veg ? 'bg-emerald-500 ring-emerald-500/10' : 'bg-red-500 ring-red-500/10'}`}></div>
                                    <div className="flex flex-col">
                                       <span className="font-syne font-bold text-slate-900 capitalize tracking-tight">{item.name}</span>
                                       <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Unit @ ₹{item.price}</span>
                                    </div>
                                 </div>
                                 <div className="w-16 text-center font-fraunces font-black text-slate-400">x{item.quantity}</div>
                                 <div className="w-24 text-right font-fraunces font-black italic text-slate-900 text-lg">₹{item.price * item.quantity}</div>
                              </div>
                           ))}

                           <div className="pt-8 mt-8 border-t border-dashed border-zinc-200 flex flex-col items-end gap-2">
                              <div className="flex items-center justify-between w-full md:w-64 opacity-40">
                                 <span className="text-[10px] font-black uppercase">Subtotal</span>
                                 <span className="font-fraunces font-black">₹{(order.total_price * 0.95).toFixed(0)}</span>
                              </div>
                              <div className="flex items-center justify-between w-full md:w-64 opacity-40">
                                 <span className="text-[10px] font-black uppercase">Tax (GST)</span>
                                 <span className="font-fraunces font-black">₹{(order.total_price * 0.05).toFixed(0)}</span>
                              </div>
                              <div className="flex items-center justify-between w-full md:w-64 mt-4 pt-4 border-t border-zinc-200">
                                 <span className="text-xs font-black uppercase text-slate-400">Total Settlement</span>
                                 <span className="font-fraunces font-black text-3xl italic text-indigo-600">₹{order.total_price.toFixed(0)}</span>
                              </div>
                           </div>
                        </div>
                        
                        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                                 <CheckCircle2 size={16} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Audit Trail Active</span>
                           </div>
                           <button 
                              onClick={() => window.open(`/bill/${order.id}`, '_blank')}
                              className="h-14 px-10 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-4 group">
                              Download Audit Report
                              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
