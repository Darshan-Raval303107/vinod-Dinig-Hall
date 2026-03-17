import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { socket } from '../../api/socket';
import { CheckCircle2, Clock, ChefHat, CheckSquare, CreditCard, ChevronRight, Activity, Bell, Info } from 'lucide-react';

const STATUS_STEPS = [
  { id: 'pending', label: 'Order Registered', icon: Clock, desc: 'Kitchen node processing arrival' },
  { id: 'accepted', label: 'Chef Confirmed', icon: CheckSquare, desc: 'Station assigned and ready' },
  { id: 'cooking', label: 'In Formulation', icon: ChefHat, desc: 'Cuisine being crafted now' },
  { id: 'ready', label: 'Ready for Service', icon: Bell, desc: 'Quality check completed' },
  { id: 'served', label: 'Delivered', icon: CheckCircle2, desc: 'Order at station T-Table' },
  { id: 'paid', label: 'Finalized', icon: CreditCard, desc: 'Transaction complete' },
];

const OrderStatus = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    api.get(`/orders/${orderId}/status`)
      .then(res => {
        setOrder(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();

    socket.connect();
    socket.emit('customer:join', { orderId });
    
    socket.on('order:status_update', (data) => {
      if (data.orderId === orderId) {
        setOrder(prev => ({ ...prev, status: data.status }));
      }
    });

    const interval = setInterval(fetchStatus, 30000);

    return () => {
      clearInterval(interval);
      socket.off('order:status_update');
      socket.disconnect();
    };
  }, [orderId]);

  if (loading || !order) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF7F0] p-8 text-center">
      <div className="w-16 h-16 border-4 border-customer-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-[10px] font-black text-customer-accent uppercase tracking-widest animate-pulse">Synchronizing Tracking Node</p>
    </div>
  );

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  
  return (
    <div className="theme-customer min-h-screen font-jakarta bg-[#FBF7F0] flex flex-col pt-20 pb-36 px-8 animate-in fade-in duration-1000">
      {/* Visual Activity Tracker */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="flex items-center gap-3 px-6 py-2.5 bg-white border border-customer-surface/30 rounded-full shadow-sm mb-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-customer-accent/5 to-transparent translate-x-[-150%] animate-[shine_3s_infinite]"></div>
          <Activity size={16} className="text-customer-accent animate-pulse" />
          <span className="text-[10px] font-black text-customer-text/40 uppercase tracking-[0.3em]">Live Matrix Tracking</span>
        </div>
        
        <h1 className="font-fraunces text-5xl font-black italic text-customer-text tracking-tighter leading-tight mb-2">Order Progress</h1>
        <div className="flex items-center gap-3 justify-center">
           <span className="text-[11px] font-black text-customer-text/30 uppercase tracking-[0.2em] italic underline underline-offset-4 decoration-customer-accent/20">Ref: #{order.order_id.substring(0,8).toUpperCase()}</span>
           <span className="text-xs font-bold text-customer-accent bg-customer-accent/5 px-3 py-1 rounded-lg">TABLE {order.table_number}</span>
        </div>
      </div>

      {/* Modern High-End Vertical Timeline */}
      <div className="bg-white rounded-[3rem] p-10 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.06)] border border-customer-surface/20 relative mb-12 flex flex-col gap-10 overflow-hidden">
        {/* Glowing track line */}
        <div className="absolute left-14 top-14 bottom-14 w-0.5 bg-customer-surface/20 -z-0">
          <div className="absolute top-0 left-0 w-full bg-customer-accent transition-all duration-[2000ms] shadow-[0_0_15px_rgba(200,92,26,0.3)]" style={{ height: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}></div>
        </div>

        {STATUS_STEPS.map((step, index) => {
          const isCompleted = currentStepIndex >= index;
          const isActive = currentStepIndex === index;
          const isFuture = currentStepIndex < index;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex gap-8 relative z-10 transition-all duration-700 items-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-1000 border
                ${isCompleted ? 'bg-customer-accent text-white shadow-xl shadow-customer-accent/30 border-customer-accent' : 
                  isActive ? 'bg-white text-customer-accent border-customer-accent animate-[pulse_2s_infinite] shadow-lg' : 
                  'bg-[#FBF7F0] text-customer-text/20 border-customer-surface/30'}
              `}>
                <Icon size={18} className={`${isCompleted ? 'animate-[bounce_1s_ease-out]' : ''}`} />
              </div>

              <div className={`flex flex-col gap-0.5 flex-1 transition-opacity duration-700 ${isFuture ? 'opacity-30' : 'opacity-100'}`}>
                <div className="flex items-baseline justify-between overflow-hidden">
                  <span className={`font-fraunces italic text-xl font-bold tracking-tight text-customer-text group-hover:text-customer-accent transition-colors`}>
                    {step.label}
                  </span>
                  {isActive && <div className="h-1 flex-1 bg-customer-accent/10 mx-4 border-b border-dashed border-customer-accent/30 hidden sm:block"></div>}
                  {isCompleted && !isActive && <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white scale-75 animate-in zoom-in-50"><CheckCircle2 size={12} /></div>}
                </div>
                <p className="text-[10px] font-bold text-customer-text/30 uppercase tracking-widest">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card Overlay */}
      <div className="p-8 bg-white border border-customer-surface/40 rounded-[2.5rem] shadow-sm flex items-start gap-4 mb-20">
         <div className="w-12 h-12 bg-customer-accent/5 rounded-2xl flex items-center justify-center flex-shrink-0 text-customer-accent">
            <Info size={24} />
         </div>
         <div className="flex-1">
            <h4 className="text-sm font-bold text-customer-text italic font-fraunces mb-1">Quality Guaranteed</h4>
            <p className="text-[10px] text-customer-text/40 font-medium uppercase tracking-widest leading-relaxed">
               Each dish undergoes final inspection before release. Expected prep latency: 15-20 min.
            </p>
         </div>
      </div>

      {/* Floating Dynamic Bottom Action Bar */}
      <div className="fixed bottom-10 left-0 right-0 px-8 z-50 animate-in slide-in-from-bottom-10 duration-1000 delay-500">
        <div className="max-w-md mx-auto">
          {order.status === 'served' ? (
            <button 
              onClick={() => navigate(`/payment/${orderId}`)}
              className="group relative w-full h-20 bg-customer-text text-white rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(31,31,31,0.6)] flex items-center justify-between px-3 overflow-hidden transition-all active:scale-[0.98] border border-white/5"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              
              <div className="h-14 bg-customer-accent rounded-[2rem] px-8 flex items-center gap-3 shadow-[0_8px_25px_rgba(200,92,26,0.3)]">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                  <CreditCard size={14} />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] italic">Final Settlement</span>
              </div>

              <div className="flex items-center gap-2 font-fraunces italic text-xl pr-6 transition-all group-hover:translate-x-1">
                ₹{order.total_price.toFixed(0)} <ChevronRight size={22} />
              </div>
            </button>
          ) : order.status === 'paid' ? (
            <div className="w-full h-20 bg-emerald-600/10 border-2 border-emerald-500/20 text-emerald-600 rounded-[2.5rem] flex items-center justify-center gap-4 px-8 shadow-2xl backdrop-blur-md">
               <CheckCircle2 size={24} className="animate-in spring-300" />
               <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest leading-none">Transaction Validated</span>
                  <span className="text-[9px] font-bold text-emerald-600/40 uppercase tracking-widest mt-1">Visit finalized. Thank you.</span>
               </div>
            </div>
          ) : (
             <div className="w-full h-20 bg-white border border-customer-surface/30 rounded-[2.5rem] flex items-center justify-between px-3 shadow-2xl shadow-indigo-500/5">
                <div className="h-14 bg-[#FBF7F0] border border-customer-surface/20 rounded-[2rem] px-8 flex items-center gap-4">
                   <div className="w-2 h-2 rounded-full bg-customer-accent animate-ping"></div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-customer-text/40 italic">Live Feed Connected</span>
                </div>
                <div className="pr-10 text-[10px] font-black uppercase tracking-widest text-customer-accent animate-pulse">
                   Tracking Live...
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
